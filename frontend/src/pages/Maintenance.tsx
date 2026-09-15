// =============================================================================
// Maintenance Page — Stitch SCADA Work Order & Maintenance Tracking
// =============================================================================

import React from 'react';

export const Maintenance: React.FC = () => {
  return (
    <>
      <header className="w-full bg-surface-container-lowest shadow-sm rounded-lg p-space-md flex flex-col xl:flex-row xl:items-center justify-between gap-space-md">
        <div className="flex flex-wrap items-center gap-space-lg">
          <div className="bg-primary px-3 py-1.5 rounded text-on-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">build</span>
            <span className="font-headline-sm text-headline-sm tracking-wider">CV-IRON-01 // MAINTENANCE</span>
          </div>
          <span className="font-label-md text-label-md text-secondary">WORK ORDER MANAGEMENT • SPARE PARTS INVENTORY • SERVICE HISTORY</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-label-md text-label-md px-2 py-0.5 bg-secondary-container text-on-secondary-container font-bold rounded">1 OPEN WO</span>
          <button className="font-label-md text-label-md text-on-primary bg-primary px-2 py-1 rounded hover:bg-primary/90 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">add</span>NEW WORK ORDER
          </button>
        </div>
      </header>

      {/* Maintenance KPIs */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-space-md">
        {[
          { label: 'TOTAL RUNTIME', value: '1,842.6', unit: 'hrs', icon: 'timer' },
          { label: 'MTBF', value: '612.4', unit: 'hrs', icon: 'trending_up' },
          { label: 'MTTR', value: '2.3', unit: 'hrs', icon: 'build' },
          { label: 'LAST SERVICE', value: '14 Feb', unit: '2025', icon: 'event' },
        ].map((m) => (
          <div key={m.label} className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[18px] text-primary">{m.icon}</span>
              <span className="font-label-md text-label-md text-secondary uppercase">{m.label}</span>
            </div>
            <span className="font-metric-display text-metric-display text-on-surface font-bold">{m.value}<span className="font-label-md text-label-md text-secondary ml-1">{m.unit}</span></span>
          </div>
        ))}
      </section>

      {/* Active Work Orders */}
      <section className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
        <div className="flex items-center justify-between pb-space-sm mb-space-sm bg-surface-container-low px-space-sm py-1.5 rounded">
          <span className="font-headline-sm text-headline-sm text-on-surface">ACTIVE WORK ORDERS</span>
          <div className="flex items-center gap-2 font-label-md text-label-md">
            <span className="px-1.5 py-0.5 bg-[#f59e0b]/15 text-[#f59e0b] font-bold rounded">1 OPEN</span>
            <span className="px-1.5 py-0.5 bg-[#10b981]/15 text-[#047857] font-bold rounded">12 COMPLETED</span>
          </div>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low text-secondary font-label-md text-label-md uppercase">
              <th className="py-1.5 px-2 font-bold">WO #</th>
              <th className="py-1.5 px-2 font-bold">TYPE</th>
              <th className="py-1.5 px-2 font-bold">COMPONENT</th>
              <th className="py-1.5 px-2 font-bold">DESCRIPTION</th>
              <th className="py-1.5 px-2 font-bold">PRIORITY</th>
              <th className="py-1.5 px-2 font-bold">STATUS</th>
              <th className="py-1.5 px-2 font-bold">DUE DATE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant font-label-md text-label-md">
            {[
              { wo: 'WO-2025-013', type: 'PREVENTIVE', comp: 'NDE BEARING', desc: 'Scheduled lubrication (NLGI Grade 2 grease) — 500hr interval', pri: 'MEDIUM', priColor: '#f59e0b', status: 'OPEN', sColor: '#f59e0b', due: '2025-03-01' },
              { wo: 'WO-2025-012', type: 'CORRECTIVE', comp: 'GEARBOX', desc: 'Coupling alignment verification after GMF harmonic detection', pri: 'HIGH', priColor: '#ef4444', status: 'COMPLETED', sColor: '#10b981', due: '2025-02-10' },
              { wo: 'WO-2025-011', type: 'INSPECTION', comp: 'BELT SURFACE', desc: 'Quarterly visual and dimensional belt inspection', pri: 'LOW', priColor: '#0284c7', status: 'COMPLETED', sColor: '#10b981', due: '2025-02-01' },
              { wo: 'WO-2025-010', type: 'CALIBRATION', comp: 'LOAD CELLS', desc: 'Two-point calibration routine with 10.00 kg certified weight', pri: 'LOW', priColor: '#0284c7', status: 'COMPLETED', sColor: '#10b981', due: '2025-02-14' },
            ].map((wo) => (
              <tr key={wo.wo} className="hover:bg-surface-container-low/80">
                <td className="py-1.5 px-2 font-mono font-bold text-primary">{wo.wo}</td>
                <td className="py-1.5 px-2">{wo.type}</td>
                <td className="py-1.5 px-2 font-bold">{wo.comp}</td>
                <td className="py-1.5 px-2">{wo.desc}</td>
                <td className="py-1.5 px-2"><span className="px-1.5 py-0.5 rounded font-bold" style={{ color: wo.priColor, backgroundColor: `${wo.priColor}15` }}>{wo.pri}</span></td>
                <td className="py-1.5 px-2"><span className="px-1.5 py-0.5 rounded font-bold" style={{ color: wo.sColor, backgroundColor: `${wo.sColor}15` }}>{wo.status}</span></td>
                <td className="py-1.5 px-2 font-mono text-secondary">{wo.due}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Maintenance Schedule */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-space-md">
        <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
          <div className="font-headline-sm text-headline-sm text-on-surface mb-3">PREVENTIVE MAINTENANCE SCHEDULE</div>
          {[
            { task: 'BEARING LUBRICATION', interval: 'Every 500 hrs', next: '2025-03-01', remaining: '157.4 hrs' },
            { task: 'BELT TENSION CHECK', interval: 'Every 250 hrs', next: '2025-02-20', remaining: '42.6 hrs' },
            { task: 'ENCODER CALIBRATION', interval: 'Every 1000 hrs', next: '2025-04-15', remaining: '857.4 hrs' },
            { task: 'MOTOR BRUSH INSPECTION', interval: 'Every 2000 hrs', next: '2025-06-01', remaining: '1,657.4 hrs' },
            { task: 'FULL SYSTEM AUDIT', interval: 'Every 5000 hrs', next: '2026-01-01', remaining: '3,157.4 hrs' },
          ].map((task) => (
            <div key={task.task} className="flex items-center justify-between py-2 border-b border-outline-variant last:border-0">
              <div>
                <span className="font-label-md text-label-md font-bold text-on-surface">{task.task}</span>
                <span className="font-label-md text-label-md text-secondary block">{task.interval} • Next: {task.next}</span>
              </div>
              <span className="font-label-md text-label-md font-bold text-primary">{task.remaining}</span>
            </div>
          ))}
        </div>
        <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
          <div className="font-headline-sm text-headline-sm text-on-surface mb-3">SPARE PARTS INVENTORY</div>
          <table className="w-full text-left border-collapse font-label-md text-label-md">
            <thead>
              <tr className="bg-surface-container-low text-secondary uppercase">
                <th className="py-1 px-2 font-bold">PART</th>
                <th className="py-1 px-2 font-bold text-center">QTY</th>
                <th className="py-1 px-2 font-bold text-center">MIN</th>
                <th className="py-1 px-2 font-bold">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {[
                { part: '6204-2RS Bearing', qty: 4, min: 2, ok: true },
                { part: 'PVC Belt 1000mm', qty: 1, min: 1, ok: true },
                { part: 'NLGI Grade 2 Grease', qty: 3, min: 2, ok: true },
                { part: 'Motor Brushes (pair)', qty: 2, min: 1, ok: true },
                { part: 'HX711 ADC Module', qty: 1, min: 1, ok: true },
                { part: 'ESP32 DevKit V4', qty: 0, min: 1, ok: false },
              ].map((part) => (
                <tr key={part.part} className="hover:bg-surface-container-low/80">
                  <td className="py-1.5 px-2">{part.part}</td>
                  <td className="py-1.5 px-2 text-center font-bold">{part.qty}</td>
                  <td className="py-1.5 px-2 text-center">{part.min}</td>
                  <td className="py-1.5 px-2">
                    <span className={`px-1.5 py-0.5 rounded font-bold ${part.ok ? 'text-[#047857] bg-[#10b981]/15' : 'text-[#ef4444] bg-[#ef4444]/15'}`}>{part.ok ? 'IN STOCK' : 'ORDER NEEDED'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};
