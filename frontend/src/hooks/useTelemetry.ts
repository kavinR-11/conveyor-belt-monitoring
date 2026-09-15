// =============================================================================
// useTelemetry — sensor data hook
// Conveyor Belt Monitoring System
// =============================================================================
// Currently returns demo/mock data and simulates gentle drift using setInterval.
// When the FastAPI WebSocket endpoint is available, replace the mock section
// with a real WebSocket connection — the returned shape stays identical.
//
// ⚠ All data returned while isMock === true is DEMO DATA, not real sensor data.
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import type { TelemetryFrame, TrendPoint } from '../types/telemetry';
import {
  DEMO_FRAME,
  DEMO_TREND_VIBRATION,
  DEMO_TREND_LOAD,
  DEMO_TREND_SPEED,
  DEMO_TREND_CURRENT,
} from '../data/mockTelemetry';

export interface TelemetryState {
  frame: TelemetryFrame;
  trendVibration: TrendPoint[];
  trendLoad: TrendPoint[];
  trendSpeed: TrendPoint[];
  trendCurrent: TrendPoint[];
  isMock: boolean;
}

const MAX_TREND_POINTS = 60;

function nudge(value: number, noise: number, min: number, max: number): number {
  const next = value + (Math.random() - 0.5) * noise * 2;
  return Math.min(max, Math.max(min, parseFloat(next.toFixed(3))));
}

function appendTrendPoint(
  history: TrendPoint[],
  value: number,
): TrendPoint[] {
  const now = Date.now();
  const point: TrendPoint = {
    t: new Date(now).toLocaleTimeString('en-GB', { hour12: false }),
    ts: now,
    value,
  };
  const updated = [...history, point];
  return updated.length > MAX_TREND_POINTS
    ? updated.slice(updated.length - MAX_TREND_POINTS)
    : updated;
}

export function useTelemetry(): TelemetryState {
  const [frame, setFrame] = useState<TelemetryFrame>(DEMO_FRAME);
  const [trendVibration, setTrendVibration] = useState<TrendPoint[]>(DEMO_TREND_VIBRATION);
  const [trendLoad, setTrendLoad] = useState<TrendPoint[]>(DEMO_TREND_LOAD);
  const [trendSpeed, setTrendSpeed] = useState<TrendPoint[]>(DEMO_TREND_SPEED);
  const [trendCurrent, setTrendCurrent] = useState<TrendPoint[]>(DEMO_TREND_CURRENT);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // Fallback simulator tick when WebSocket is offline
  const tick = useCallback(() => {
    setFrame(prev => {
      const vib = nudge(prev.vibration.rms, 0.03, 1.8, 3.2);
      const load = nudge(prev.load.totalKg, 0.02, 1.4, 2.2);
      const speed = nudge(prev.beltSpeed.speedMs, 0.01, 0.38, 0.48);
      const current = nudge(prev.electrical.currentA, 0.15, 17.5, 20.0);
      const voltage = nudge(prev.electrical.voltageV, 0.5, 412.0, 418.0);

      const next: TelemetryFrame = {
        ...prev,
        vibration: { ...prev.vibration, rms: vib, timestamp: new Date().toISOString() },
        load: {
          ...prev.load,
          totalKg: load,
          cell1Kg: parseFloat((load / 2).toFixed(2)),
          cell2Kg: parseFloat((load / 2).toFixed(2)),
          timestamp: new Date().toISOString(),
        },
        beltSpeed: { ...prev.beltSpeed, speedMs: speed, timestamp: new Date().toISOString() },
        electrical: {
          ...prev.electrical,
          voltageV: voltage,
          currentA: current,
          powerW: parseFloat((voltage * current).toFixed(0)),
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
        isMock: true,
      };

      setTrendVibration(h => appendTrendPoint(h, vib));
      setTrendLoad(h => appendTrendPoint(h, load));
      setTrendSpeed(h => appendTrendPoint(h, speed));
      setTrendCurrent(h => appendTrendPoint(h, current));

      return next;
    });
  }, []);

  // WebSocket Live Connection
  useEffect(() => {
    const host = window.location.hostname || 'localhost';
    const wsUrl = `ws://${host}:8000/ws`;
    let ws: WebSocket | null = null;
    let fallbackInterval: ReturnType<typeof setInterval> | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let unmounted = false;

    function connect() {
      if (unmounted) return;
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (unmounted) return;
          setIsLiveConnected(true);
          if (fallbackInterval) clearInterval(fallbackInterval);
        };

        ws.onmessage = (event) => {
          if (unmounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'telemetry' && data.sensors) {
              const s = data.sensors;
              const ml = data.ml;
              const alert = data.alert;

              const vibRms = Math.max(s.vibration_left_g || 1.85, s.vibration_right_g || 1.88);
              const totalLoad = s.total_load_kg || ((s.load_left_kg || 0) + (s.load_right_kg || 0));
              const currentA = s.current_A || 2.25;
              const speedMs = s.motor_state === 'STOPPED' || s.estop_active ? 0.0 : 0.42;

              let machineState: 'RUNNING' | 'STOPPED' | 'WARNING' | 'CRITICAL' | 'FAULT' = 'RUNNING';
              if (s.estop_active) machineState = 'STOPPED';
              else if (ml?.severity === 'EMERGENCY') machineState = 'FAULT';
              else if (ml?.severity === 'CRITICAL') machineState = 'CRITICAL';
              else if (ml?.severity === 'WARNING') machineState = 'WARNING';

              const activeAlert = alert || (ml && ml.severity !== 'NORMAL' ? {
                severity: ml.severity,
                classification: ml.classification,
                failed_component: ml.failed_component,
                failure_cause: ml.failure_cause,
                confidence: ml.confidence,
                sms_sent: alert?.sms_sent || false,
                timestamp: data.timestamp,
              } : null);

              setFrame({
                vibration: {
                  rms: parseFloat(vibRms.toFixed(3)),
                  peak: parseFloat((vibRms * 1.414).toFixed(3)),
                  dominantFreq: 48.5,
                  state: ml?.severity === 'EMERGENCY' || ml?.severity === 'CRITICAL' ? 'CRITICAL' : (ml?.severity === 'WARNING' ? 'WARNING' : 'NORMAL'),
                  timestamp: data.timestamp,
                },
                load: {
                  totalKg: parseFloat(totalLoad.toFixed(2)),
                  cell1Kg: parseFloat((s.load_left_kg || totalLoad / 2).toFixed(2)),
                  cell2Kg: parseFloat((s.load_right_kg || totalLoad / 2).toFixed(2)),
                  state: Math.abs((s.load_left_kg || 0) - (s.load_right_kg || 0)) > 1.2 ? 'CRITICAL' : 'NORMAL',
                  timestamp: data.timestamp,
                },
                beltSpeed: {
                  speedMs: speedMs,
                  motorRpm: speedMs > 0 ? 1420 : 0,
                  state: speedMs === 0 ? 'WARNING' : 'NORMAL',
                  timestamp: data.timestamp,
                },
                electrical: {
                  voltageV: 415.0,
                  currentA: parseFloat(currentA.toFixed(2)),
                  powerW: parseFloat((415.0 * currentA).toFixed(0)),
                  state: currentA > 2.8 ? 'CRITICAL' : (currentA > 2.5 ? 'WARNING' : 'NORMAL'),
                  timestamp: data.timestamp,
                },
                machineState,
                timestamp: data.timestamp,
                isMock: false,
                ml,
                alert: activeAlert,
              });

              setTrendVibration(h => appendTrendPoint(h, vibRms));
              setTrendLoad(h => appendTrendPoint(h, totalLoad));
              setTrendSpeed(h => appendTrendPoint(h, speedMs));
              setTrendCurrent(h => appendTrendPoint(h, currentA));
            }
          } catch (err) {
            console.error('Error parsing WS frame:', err);
          }
        };

        ws.onclose = () => {
          if (unmounted) return;
          setIsLiveConnected(false);
          // Fallback to local simulation when backend WS drops
          if (!fallbackInterval) fallbackInterval = setInterval(tick, 1000);
          reconnectTimeout = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          ws?.close();
        };

      } catch (e) {
        setIsLiveConnected(false);
        if (!fallbackInterval) fallbackInterval = setInterval(tick, 1000);
        reconnectTimeout = setTimeout(connect, 3000);
      }
    }

    connect();

    return () => {
      unmounted = true;
      if (ws) ws.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [tick]);

  return {
    frame,
    trendVibration,
    trendLoad,
    trendSpeed,
    trendCurrent,
    isMock: !isLiveConnected,
  };
}
