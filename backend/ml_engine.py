# =============================================================================
# ML Inference Engine — Real-time anomaly detection for conveyor telemetry
# =============================================================================

import json
import logging
import warnings
from pathlib import Path
from typing import Optional
import numpy as np

warnings.filterwarnings("ignore", category=UserWarning)

logger = logging.getLogger("ml_engine")

MODEL_DIR = Path(__file__).resolve().parent.parent / "ai" / "models"


class MLEngine:
    """Loads trained ML models and performs real-time prediction on sensor frames."""

    def __init__(self):
        self.rf_model = None
        self.iforest_model = None
        self.scaler = None
        self.label_encoder = None
        self.features: list[str] = []
        self.classes: list[str] = []
        self.loaded = False

    def load_models(self) -> bool:
        """Load all trained models from disk. Returns True if successful."""
        try:
            import joblib

            rf_path = MODEL_DIR / "conveyor_rf.joblib"
            if_path = MODEL_DIR / "conveyor_iforest.joblib"
            sc_path = MODEL_DIR / "scaler.joblib"
            le_path = MODEL_DIR / "label_encoder.joblib"
            fc_path = MODEL_DIR / "feature_config.json"

            if not all(p.exists() for p in [rf_path, if_path, sc_path, le_path, fc_path]):
                logger.warning("ML models not found in %s — inference disabled", MODEL_DIR)
                return False

            self.rf_model = joblib.load(rf_path)
            self.iforest_model = joblib.load(if_path)
            self.scaler = joblib.load(sc_path)
            self.label_encoder = joblib.load(le_path)

            with open(fc_path) as f:
                config = json.load(f)
            self.features = config["features"]
            self.classes = config["classes"]

            self.loaded = True
            logger.info("ML models loaded — %d features, %d classes", len(self.features), len(self.classes))
            return True

        except Exception as e:
            logger.error("Failed to load ML models: %s", e)
            return False

    def predict(self, frame: dict) -> dict:
        """
        Run inference on a single sensor frame.

        Returns:
            {
                "classification": "NORMAL" | "BELT MISALIGNMENT" | "OBJECT/JAM DETECTED",
                "confidence": 0.0-1.0,
                "anomaly_score": float (negative = more anomalous),
                "is_anomaly": bool,
                "severity": "NORMAL" | "WARNING" | "CRITICAL" | "EMERGENCY"
            }
        """
        if not self.loaded:
            return {
                "classification": "UNKNOWN",
                "confidence": 0.0,
                "anomaly_score": 0.0,
                "is_anomaly": False,
                "severity": "NORMAL",
            }

        try:
            # Build feature vector from frame
            feature_vector = self._extract_features(frame)
            X = np.array([feature_vector])
            X_scaled = self.scaler.transform(X)

            # Random Forest classification
            rf_pred = self.rf_model.predict(X_scaled)[0]
            rf_proba = self.rf_model.predict_proba(X_scaled)[0]
            classification = self.label_encoder.inverse_transform([rf_pred])[0]
            confidence = float(np.max(rf_proba))

            # Isolation Forest anomaly score
            anomaly_score = float(self.iforest_model.decision_function(X_scaled)[0])
            is_anomaly = self.iforest_model.predict(X_scaled)[0] == -1

            # Determine severity
            severity = self._determine_severity(classification, confidence, anomaly_score, is_anomaly, frame)

            return {
                "classification": str(classification),
                "confidence": round(float(confidence), 4),
                "anomaly_score": round(float(anomaly_score), 4),
                "is_anomaly": bool(is_anomaly),
                "severity": str(severity),
            }

        except Exception as e:
            logger.error("Prediction failed: %s", e)
            return {
                "classification": "ERROR",
                "confidence": 0.0,
                "anomaly_score": 0.0,
                "is_anomaly": False,
                "severity": "NORMAL",
            }

    def _extract_features(self, frame: dict) -> list[float]:
        """Extract the feature vector from a raw sensor frame dict."""
        # Direct sensor readings
        vib_left_g = frame.get("vibration_left_g", 0.0)
        vib_right_g = frame.get("vibration_right_g", 0.0)
        vib_left_mps2 = frame.get("vibration_left_mps2", 0.0)
        vib_right_mps2 = frame.get("vibration_right_mps2", 0.0)
        load_left = frame.get("load_left_kg", 0.0)
        load_right = frame.get("load_right_kg", 0.0)
        load_imbalance = frame.get("load_imbalance_kg", abs(load_left - load_right))
        total_load = frame.get("total_load_kg", load_left + load_right)
        current = frame.get("current_A", 0.0)

        # Boolean sensors
        ir_left = int(frame.get("ir_left_blocked", False))
        ir_right = int(frame.get("ir_right_blocked", False))
        estop = int(frame.get("estop_active", False))
        fault = int(frame.get("fault_active", False))

        # Engineered features (must match training)
        vib_ratio = vib_left_g / (vib_right_g + 1e-6)
        vib_total = vib_left_mps2 + vib_right_mps2
        vib_diff = abs(vib_left_mps2 - vib_right_mps2)
        load_ratio = load_left / (load_right + 1e-6)
        power_proxy = current * 12.0

        return [
            vib_left_g, vib_right_g, vib_left_mps2, vib_right_mps2,
            load_left, load_right, load_imbalance, total_load, current,
            ir_left, ir_right, estop, fault,
            vib_ratio, vib_total, vib_diff, load_ratio, power_proxy,
        ]

    def _determine_severity(
        self, classification: str, confidence: float,
        anomaly_score: float, is_anomaly: bool, frame: dict
    ) -> str:
        """
        Determine alert severity based on ML output + sensor thresholds.

        EMERGENCY: E-stop active, or high-confidence critical defect
        CRITICAL:  Defect detected with confidence > 0.85
        WARNING:   Defect detected with lower confidence, or anomaly flagged
        NORMAL:    No issues
        """
        # E-stop is always EMERGENCY
        if frame.get("estop_active", False):
            return "EMERGENCY"

        # Fault flag active
        if frame.get("fault_active", False):
            return "CRITICAL"

        # High-confidence defect classification
        if classification != "NORMAL":
            if confidence >= 0.85:
                return "CRITICAL"
            elif confidence >= 0.65:
                return "WARNING"

        # Anomaly detection fallback
        if is_anomaly and anomaly_score < -0.15:
            return "WARNING"

        return "NORMAL"


# Singleton instance
engine = MLEngine()
