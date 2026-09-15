# =============================================================================
# Alert Manager — Escalation rules, rate limiting, SMS dispatch
# =============================================================================

import logging
import os
import time
from datetime import datetime, timezone
from typing import Optional

from .sms_service import sms_service

logger = logging.getLogger("alert_manager")


class AlertManager:
    """
    Manages alert escalation, deduplication, and SMS dispatch.

    Rules:
    - EMERGENCY: Immediate SMS to ALL contacts (admin + maintenance)
    - CRITICAL:  SMS to admin + maintenance after 2 consecutive detections
    - WARNING:   SMS to admin only after 5 consecutive detections
    - NORMAL:    No SMS

    Rate limiting: max 1 SMS per defect type per 5 minutes to prevent spam.
    """

    def __init__(self):
        self.alert_contacts: list[dict] = []
        self.last_sms_sent: dict[str, float] = {}  # key: "severity:classification" → timestamp
        self.consecutive_counts: dict[str, int] = {}  # key: classification → count
        self.sms_cooldown_seconds = 300  # 5 minutes
        self.alert_history: list[dict] = []

    def configure(self):
        """Load alert contacts from environment variables."""
        # Admin contacts
        admin_numbers = os.getenv("ALERT_ADMIN_PHONES", "").split(",")
        for num in admin_numbers:
            num = num.strip()
            if num:
                self.alert_contacts.append({"number": num, "role": "admin", "name": "Admin"})

        # Maintenance crew contacts
        maint_numbers = os.getenv("ALERT_MAINTENANCE_PHONES", "").split(",")
        for num in maint_numbers:
            num = num.strip()
            if num:
                self.alert_contacts.append({"number": num, "role": "maintenance", "name": "Maintenance Crew"})

        if self.alert_contacts:
            logger.info("Alert contacts configured: %d contacts", len(self.alert_contacts))
            for c in self.alert_contacts:
                logger.info("  %s: %s (%s)", c["role"], c["number"], c["name"])
        else:
            logger.warning(
                "No alert contacts configured. Set ALERT_ADMIN_PHONES and "
                "ALERT_MAINTENANCE_PHONES in .env"
            )

    def process_prediction(self, prediction: dict, raw_frame: dict) -> Optional[dict]:
        """
        Process an ML prediction and trigger alerts if needed.

        Args:
            prediction: Output from MLEngine.predict()
            raw_frame: Raw sensor data frame

        Returns:
            Alert dict if an alert was generated, None otherwise.
        """
        severity = prediction.get("severity", "NORMAL")
        classification = prediction.get("classification", "UNKNOWN")
        confidence = prediction.get("confidence", 0.0)

        # Track consecutive detections
        if classification != "NORMAL":
            self.consecutive_counts[classification] = (
                self.consecutive_counts.get(classification, 0) + 1
            )
        else:
            # Reset all counters when normal
            self.consecutive_counts.clear()

        if severity == "NORMAL":
            return None

        # Build alert record
        failed_component = prediction.get("failed_component", "CONVEYOR SUBSYSTEM")
        failure_cause = prediction.get("failure_cause", "")

        alert = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "severity": severity,
            "classification": classification,
            "failed_component": failed_component,
            "failure_cause": failure_cause,
            "confidence": confidence,
            "anomaly_score": prediction.get("anomaly_score", 0.0),
            "is_anomaly": prediction.get("is_anomaly", False),
            "consecutive_count": self.consecutive_counts.get(classification, 1),
            "sms_sent": False,
            "sensor_snapshot": {
                "vibration_left_g": raw_frame.get("vibration_left_g"),
                "vibration_right_g": raw_frame.get("vibration_right_g"),
                "load_left_kg": raw_frame.get("load_left_kg"),
                "load_right_kg": raw_frame.get("load_right_kg"),
                "current_A": raw_frame.get("current_A"),
                "motor_state": raw_frame.get("motor_state"),
                "estop_active": raw_frame.get("estop_active"),
            },
        }

        # Determine if we should send SMS
        should_sms = self._should_send_sms(severity, classification)

        if should_sms:
            message = self._format_sms(alert)
            recipients = self._get_recipients(severity)
            sent_count = 0

            for contact in recipients:
                success = sms_service.send_sms(contact["number"], message)
                if success:
                    sent_count += 1

            alert["sms_sent"] = sent_count > 0 or not sms_service.configured
            alert["sms_recipients"] = len(recipients)

            # Update cooldown (shorter for emergencies)
            cooldown_key = f"{severity}:{classification}"
            self.last_sms_sent[cooldown_key] = time.time()

            logger.warning(
                "ALERT [%s] Part: %s | %s (conf: %.1f%%) — SMS sent to %d/%d contacts",
                severity, failed_component, classification, confidence * 100,
                sent_count, len(recipients),
            )

        # Store in history (keep last 500)
        self.alert_history.append(alert)
        if len(self.alert_history) > 500:
            self.alert_history = self.alert_history[-500:]

        return alert

    def _should_send_sms(self, severity: str, classification: str) -> bool:
        """Check if SMS should be sent based on escalation rules and cooldown."""
        consecutive = self.consecutive_counts.get(classification, 1)

        # Rate limit check: emergencies 60s cooldown, warnings/critical 180s cooldown
        cooldown_key = f"{severity}:{classification}"
        last_sent = self.last_sms_sent.get(cooldown_key, 0)
        cooldown_limit = 60 if severity == "EMERGENCY" else 180

        if time.time() - last_sent < cooldown_limit:
            return False

        # EMERGENCY: immediate dispatch
        if severity == "EMERGENCY":
            return True
        # CRITICAL: require 2+ consecutive detections
        elif severity == "CRITICAL":
            return consecutive >= 2
        # WARNING: require 4+ consecutive detections
        elif severity == "WARNING":
            return consecutive >= 4

        return False

    def _get_recipients(self, severity: str) -> list[dict]:
        """Get SMS recipients based on severity level."""
        if severity in ("EMERGENCY", "CRITICAL"):
            return self.alert_contacts  # Admin + Maintenance crew
        elif severity == "WARNING":
            return [c for c in self.alert_contacts if c["role"] == "admin"]
        return []

    def _format_sms(self, alert: dict) -> str:
        """Format SMS message for an alert."""
        severity = alert["severity"]
        classification = alert["classification"]
        failed_component = alert.get("failed_component", "CONVEYOR")
        failure_cause = alert.get("failure_cause", "")
        confidence = alert["confidence"]
        ts = alert["timestamp"][:19].replace("T", " ")
        snap = alert["sensor_snapshot"]

        if severity == "EMERGENCY":
            prefix = "🚨 EMERGENCY PART FAILURE"
        elif severity == "CRITICAL":
            prefix = "⚠️ CRITICAL DEFECT"
        else:
            prefix = "📢 WARNING"

        msg = (
            f"{prefix} — CV-IRON-01\n"
            f"Failing Part: {failed_component}\n"
            f"Defect: {classification} ({confidence*100:.1f}%)\n"
            f"Cause: {failure_cause}\n"
            f"Time: {ts} UTC\n"
            f"---\n"
            f"Vib L/R: {snap.get('vibration_left_g', 'N/A')}/{snap.get('vibration_right_g', 'N/A')} g\n"
            f"Load L/R: {snap.get('load_left_kg', 'N/A')}/{snap.get('load_right_kg', 'N/A')} kg\n"
            f"Current: {snap.get('current_A', 'N/A')} A\n"
            f"Motor: {snap.get('motor_state', 'N/A')}\n"
            f"---\n"
            f"Immediate inspection required on {failed_component}."
        )
        return msg

    def get_recent_alerts(self, limit: int = 50) -> list[dict]:
        """Return the most recent alerts."""
        return self.alert_history[-limit:]


# Singleton
alert_manager = AlertManager()
