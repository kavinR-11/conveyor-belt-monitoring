import React, { useState, useEffect } from 'react';
import type { ActiveAlert } from '../../types/telemetry';
import './EmergencyBanner.css';

interface EmergencyBannerProps {
  alert: ActiveAlert | null | undefined;
}

export const EmergencyBanner: React.FC<EmergencyBannerProps> = ({ alert }) => {
  const [dismissedUntil, setDismissedUntil] = useState<number>(0);
  const isDismissed = Date.now() < dismissedUntil;

  // Beep synthesizer on new Emergency (Web Audio API)
  useEffect(() => {
    if (!alert || isDismissed) return;
    if (alert.severity === 'EMERGENCY') {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
          osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        }
      } catch {
        // Audio policy ignore
      }
    }
  }, [alert?.timestamp, alert?.severity, isDismissed]);

  if (!alert || alert.severity === 'NORMAL' || isDismissed) {
    return null;
  }

  const isEmergency = alert.severity === 'EMERGENCY';

  return (
    <div className={`emergency-annunciator-banner ${isEmergency ? 'banner--emergency' : 'banner--critical'}`}>
      <div className="banner-left-indicator">
        <div className="banner-pulsing-icon">
          {isEmergency ? '🚨' : '⚠️'}
        </div>
        <div className="banner-text-block">
          <div className="banner-headline">
            <span className="banner-severity-badge">
              {isEmergency ? 'EMERGENCY: PART FAILURE DETECTED' : 'CRITICAL DEFECT DETECTED'}
            </span>
            <span className="banner-defect-name">{alert.classification}</span>
            <span className="banner-confidence">({(alert.confidence * 100).toFixed(1)}% ML Conf)</span>
          </div>
          <div className="banner-subline">
            <strong className="banner-component-tag">FAILED PART:</strong> {alert.failed_component || 'Drive / Belt Subsystem'}
            {alert.failure_cause && <span className="banner-cause-text"> — {alert.failure_cause}</span>}
          </div>
        </div>
      </div>

      <div className="banner-right-actions">
        <div className="banner-sms-badge">
          <span className="sms-dot"></span>
          <span>SMS Dispatched (+917305198655)</span>
        </div>
        <button
          className="banner-ack-button"
          onClick={() => setDismissedUntil(Date.now() + 30000)} // Mute for 30 seconds
          title="Acknowledge alarm and silence for 30s"
        >
          ACKNOWLEDGE
        </button>
      </div>
    </div>
  );
};
