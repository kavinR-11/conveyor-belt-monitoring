// =============================================================================
// Predictive Health Page — Stitch SCADA ML-Based Predictive Maintenance
// =============================================================================

import React from 'react';

export const PredictiveHealth: React.FC = () => {
  return (
    <>
      <header className="w-full bg-surface-container-lowest shadow-sm rounded-lg p-space-md flex flex-col xl:flex-row xl:items-center justify-between gap-space-md">
        <div className="flex flex-wrap items-center gap-space-lg">
          <div className="bg-primary px-3 py-1.5 rounded text-on-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">neurology</span>
            <span className="font-headline-sm text-headline-sm tracking-wider">CV-IRON-01 // PREDICTIVE HEALTH</span>
          </div>
          <span className="font-label-sm text-label-sm px-1.5 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed font-bold rounded">ML ENGINE</span>
          <span className="font-label-sm text-label-sm text-secondary">ANOMALY DETECTION • BEARING LIFE ESTIMATION • RUL FORECASTING</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[#10b981]/15 text-[#047857] px-3 py-1.5 rounded font-label-md text-label-md font-bold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            HEALTH SCORE: 94.2 / 100
          </div>
        </div>
      </header>

      {/* Health Score Overview */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-space-md">
        {[
          { label: 'OVERALL HEALTH SCORE', value: '94.2', unit: '/ 100', color: '#10b981', icon: 'favorite' },
          { label: 'REMAINING USEFUL LIFE', value: '2,140', unit: 'hrs', color: '#0284c7', icon: 'schedule' },
          { label: 'ANOMALY PROBABILITY', value: '3.8', unit: '%', color: '#f59e0b', icon: 'warning' },
          { label: 'NEXT MAINTENANCE DUE', value: '18', unit: 'days', color: '#0284c7', icon: 'event' },
        ].map((m) => (
          <div key={m.label} className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[18px]" style={{ color: m.color }}>{m.icon}</span>
              <span className="font-label-sm text-label-sm text-secondary uppercase">{m.label}</span>
            </div>
            <div className="font-metric-display text-metric-display font-bold" style={{ color: m.color }}>{m.value}<span className="font-label-md text-label-md text-secondary ml-1">{m.unit}</span></div>
          </div>
        ))}
      </section>

      {/* Component Health Matrix */}
      <section className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
        <div className="flex items-center justify-between pb-space-sm mb-space-sm bg-surface-container-low px-space-sm py-1.5 rounded">
          <span className="font-headline-sm text-headline-sm text-on-surface">COMPONENT HEALTH MATRIX</span>
          <span className="font-label-sm text-label-sm text-secondary">ML MODEL: ISOLATION FOREST + LSTM AUTOENCODER</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { comp: 'DRIVE-END BEARING', health: 96, rul: '2,800 hrs', trend: 'STABLE', color: '#10b981' },
            { comp: 'NON-DRIVE BEARING', health: 92, rul: '2,140 hrs', trend: 'SLIGHT DEGRADATION', color: '#f59e0b' },
            { comp: 'BELT SURFACE (VISUAL)', health: 98, rul: '4,200 hrs', trend: 'EXCELLENT', color: '#10b981' },
            { comp: 'DC MOTOR WINDINGS', health: 94, rul: '3,100 hrs', trend: 'NOMINAL', color: '#10b981' },
            { comp: 'LOAD CELL ARRAY', health: 99, rul: '8,500 hrs', trend: 'CERTIFIED', color: '#10b981' },
            { comp: 'GEARBOX COUPLING', health: 88, rul: '1,650 hrs', trend: 'MONITOR CLOSELY', color: '#f59e0b' },
          ].map((c) => (
            <div key={c.comp} className="bg-surface-container-low p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-md text-label-md font-bold text-on-surface">{c.comp}</span>
                <span className="font-metric-display text-metric-display font-bold" style={{ color: c.color }}>{c.health}%</span>
              </div>
              <div className="w-full h-2 bg-surface-container-highest rounded mb-2">
                <div className="h-full rounded transition-all" style={{ width: `${c.health}%`, backgroundColor: c.color }} />
              </div>
              <div className="flex items-center justify-between font-label-sm text-label-sm">
                <span className="text-secondary">RUL: <span className="font-bold text-on-surface">{c.rul}</span></span>
                <span className="font-bold" style={{ color: c.color }}>{c.trend}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Anomaly Detection History */}
      <section className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
        <div className="flex items-center justify-between pb-space-sm mb-space-sm bg-surface-container-low px-space-sm py-1.5 rounded">
          <span className="font-headline-sm text-headline-sm text-on-surface">ANOMALY DETECTION HISTORY (30 DAYS)</span>
          <button className="font-label-sm text-label-sm text-on-primary bg-primary px-2 py-1 rounded hover:bg-primary/90">EXPORT REPORT</button>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low text-secondary font-label-sm text-label-sm uppercase">
              <th className="py-1 px-2 font-bold">DATE</th>
              <th className="py-1 px-2 font-bold">COMPONENT</th>
              <th className="py-1 px-2 font-bold">ANOMALY TYPE</th>
              <th className="py-1 px-2 font-bold">SEVERITY</th>
              <th className="py-1 px-2 font-bold">ML CONFIDENCE</th>
              <th className="py-1 px-2 font-bold">ACTION TAKEN</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant font-label-sm text-label-sm">
            {[
              { date: '2025-02-12', comp: 'NDE BEARING', type: 'Elevated Kurtosis', sev: 'LOW', conf: '72%', action: 'Lubrication scheduled' },
              { date: '2025-02-05', comp: 'GEARBOX', type: 'GMF Harmonic Shift', sev: 'MEDIUM', conf: '84%', action: 'Inspection completed' },
              { date: '2025-01-28', comp: 'BELT SURFACE', type: 'Edge Wear Pattern', sev: 'LOW', conf: '68%', action: 'Visual confirmed - OK' },
            ].map((ev, i) => (
              <tr key={i} className="hover:bg-surface-container-low/80">
                <td className="py-1.5 px-2 font-mono text-secondary">{ev.date}</td>
                <td className="py-1.5 px-2 font-bold">{ev.comp}</td>
                <td className="py-1.5 px-2">{ev.type}</td>
                <td className="py-1.5 px-2">
                  <span className={`px-1.5 py-0.5 rounded font-bold ${ev.sev === 'LOW' ? 'text-[#0284c7] bg-[#0284c7]/15' : 'text-[#f59e0b] bg-[#f59e0b]/15'}`}>{ev.sev}</span>
                </td>
                <td className="py-1.5 px-2 font-mono">{ev.conf}</td>
                <td className="py-1.5 px-2 text-secondary">{ev.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
};
