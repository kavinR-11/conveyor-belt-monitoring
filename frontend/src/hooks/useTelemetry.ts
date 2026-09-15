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

  const tick = useCallback(() => {
    // TODO: Replace this entire callback with WebSocket message handling
    // when the backend is ready. The state shape remains the same.
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

  useEffect(() => {
    // Tick every 1000 ms — matches real sensor update rate
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tick]);

  return { frame, trendVibration, trendLoad, trendSpeed, trendCurrent, isMock: true };
}
