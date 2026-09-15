// =============================================================================
// Load Page — Stitch SCADA Load Cell Monitoring
// =============================================================================

import React from 'react';
import { useTelemetry } from '../hooks/useTelemetry';
import { IndustrialGauge } from '../components/gauges/IndustrialGauge';

export const Load: React.FC = () => {
  const { frame } = useTelemetry();
  const l = frame.load;

  return (
    <>
      {/* Header */}
      <header className="w-full bg-surface-container-lowest shadow-sm rounded-lg p-space-md flex flex-col xl:flex-row xl:items-center justify-between gap-space-md">
        <div className="flex flex-wrap items-center gap-space-lg">
          <div className="bg-primary px-3 py-1.5 rounded text-on-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">weight</span>
            <span className="font-headline-sm text-headline-sm tracking-wider">CV-IRON-01 // WEIGHING RACK</span>
          </div>
          <span className="font-label-sm text-label-sm text-secondary">DUAL STRAIN-GAUGE TAL220-M6 • HX711 24-BIT ADC [SPI_ESP32]</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#10b981]/15 text-[#047857] rounded font-label-sm text-label-sm font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />BALANCED &amp; OPERATIONAL
          </div>
          <div className="bg-surface-container-low px-3 py-1.5 rounded">
            <div className="font-label-sm text-label-sm text-secondary uppercase">AGGREGATE BELT MASS</div>
            <div className="font-metric-display text-metric-display text-primary font-bold">{l.totalKg.toFixed(2)}<span className="font-label-md text-label-md text-secondary ml-1">kg</span></div>
          </div>
          <button className="font-label-sm text-label-sm text-secondary border border-outline-variant px-2 py-1 rounded hover:bg-surface-container-low">
            <span className="material-symbols-outlined text-[14px] mr-1">restart_alt</span>QUICK TARE
          </button>
          <button className="font-label-sm text-label-sm text-on-primary bg-primary px-2 py-1 rounded hover:bg-primary/90">
            <span className="material-symbols-outlined text-[14px] mr-1">settings</span>RE-CALIBRATE
          </button>
        </div>
      </header>

      {/* Gauge + Load Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
        <div className="lg:col-span-4 bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col items-center">
          <div className="flex items-center justify-between w-full pb-space-sm bg-surface-container-low px-3 py-1.5 rounded mb-2">
            <div><span className="font-label-sm text-label-sm text-secondary block">INSTRUMENT GAUGE // LG-01</span><span className="font-headline-sm text-headline-sm text-on-surface">TOTAL BULK MASS INDICATOR</span></div>
            <span className="font-label-sm text-label-sm font-bold text-secondary">RANGE 0-100 kg</span>
          </div>
          <IndustrialGauge label="LOAD" value={l.totalKg} unit="kg" scaleMin={0} scaleMax={100} scaleLabels={['0','20','40','60','80','100']} dialLabel="ACTUAL MASS (KG)" dialSublabel="HX711 DUAL" status={l.state as any} />
          <div className="flex items-center gap-3 mt-2 font-label-sm text-label-sm text-secondary">
            <span className="material-symbols-outlined text-[14px]">verified</span>
            <span>CEMA CLASS C WEIGH-BED</span>
            <span className="font-bold text-on-surface">ACCURACY: ±0.05 kg</span>
          </div>
        </div>
        <div className="lg:col-span-8 bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
          <div className="flex items-center justify-between pb-space-sm bg-surface-container-low px-3 py-1.5 rounded mb-3">
            <div><span className="font-label-sm text-label-sm text-secondary block">STRAIN-GAUGE BRIDGE ARRAY</span><span className="font-headline-sm text-headline-sm text-on-surface">LOAD DISTRIBUTION SPLIT ANALYSIS</span></div>
            <div className="text-right"><span className="font-label-sm text-label-sm text-secondary block">DELTA (Δ DIFF)</span><span className="font-metric-display text-metric-display text-on-surface font-bold">{Math.abs(l.cell1Kg - l.cell2Kg).toFixed(2)}<span className="font-label-sm text-label-sm text-secondary ml-1">kg</span></span></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'LOAD CELL 1 // LC-01', name: 'Hopper Feed Zone', loc: 'X = 280 mm', val: l.cell1Kg, share: (l.cell1Kg / l.totalKg * 100) || 50 },
              { label: 'LOAD CELL 2 // LC-02', name: 'Discharge / Mid Bed', loc: 'X = 740 mm', val: l.cell2Kg, share: (l.cell2Kg / l.totalKg * 100) || 50 },
            ].map((cell) => (
              <div key={cell.label} className="bg-surface-container-low p-3 rounded-lg">
                <div className="font-label-sm text-label-sm text-primary font-bold">{cell.label}</div>
                <div className="font-headline-sm text-headline-sm text-on-surface mt-0.5">{cell.name}</div>
                <div className="font-label-sm text-label-sm text-secondary">{cell.loc}</div>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="font-metric-display text-metric-display text-primary font-bold" style={{ fontSize: '32px' }}>{cell.val.toFixed(2)}</span>
                  <span className="font-label-md text-label-md text-secondary">kg</span>
                  <span className="font-label-sm text-label-sm text-secondary ml-2">{cell.share.toFixed(1)}% SHARE</span>
                </div>
                <div className="w-full h-2 bg-surface-container-highest rounded mt-2">
                  <div className="h-full bg-primary rounded" style={{ width: `${cell.share}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-1 mt-2 font-label-sm text-label-sm text-secondary">
                  <span>ZERO TARE:</span><span className="font-bold text-on-surface">{cell === l.cell1Kg ? '+0.12' : '-0.05'} kg</span>
                  <span>CALIBRATION FACTOR:</span><span className="font-bold text-on-surface">{cell.val > l.cell2Kg ? '419.2' : '421.0'} cnt/g</span>
                  <span>EXCITATION:</span><span className="font-bold text-on-surface">4.99 VDC</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Schematic + Charts */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-space-md">
        <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
          <div className="font-label-sm text-label-sm text-secondary uppercase">TRANSIENT DYNAMICS // 60S BUFFER</div>
          <div className="font-headline-sm text-headline-sm text-on-surface">LC-01 vs LC-02 SYNCHRONOUS WAVEFORM</div>
          <div className="w-full h-48 bg-surface-container-low rounded mt-2 flex items-center justify-center">
            <svg className="w-full h-full select-none" viewBox="0 0 600 200">
              <rect width="600" height="200" fill="#f8fafc" rx="4" />
              <g transform="translate(40, 10)">
                <rect width="540" height="160" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
                <path d="M 0 80 Q 30 60 60 85 T 120 70 T 180 90 T 240 65 T 300 85 T 360 75 T 420 80 T 480 70 T 540 80" fill="none" stroke="#0284c7" strokeWidth="1.5" />
                <path d="M 0 90 Q 30 70 60 95 T 120 80 T 180 100 T 240 75 T 300 95 T 360 85 T 420 90 T 480 80 T 540 85" fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4 2" />
                <g fontFamily="IBM Plex Mono" fontSize="8" fill="#94a3b8" textAnchor="middle">
                  <text x="0" y="180">T = -60s</text>
                  <text x="270" y="180">NYQUIST FILTER: 2-POLE BESSEL (fc=5Hz)</text>
                  <text x="540" y="180">LIVE NOW (T=0)</text>
                </g>
              </g>
            </svg>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div><span className="font-label-sm text-label-sm text-secondary uppercase block">MASS FLOW RATE // INTEGRATION</span><span className="font-headline-sm text-headline-sm text-on-surface">THROUGHPUT RATE (t/h) &amp; ACCUMULATION</span></div>
            <div className="text-right"><span className="font-label-sm text-label-sm text-secondary block">MASS FLOW</span><span className="font-metric-display text-metric-display text-primary font-bold">12.18<span className="font-label-sm text-label-sm text-secondary ml-1">t/h</span></span></div>
          </div>
          <div className="w-full h-48 bg-surface-container-low rounded mt-2 flex items-center justify-center">
            <svg className="w-full h-full select-none" viewBox="0 0 600 200">
              <rect width="600" height="200" fill="#f8fafc" rx="4" />
              <g transform="translate(40, 10)">
                <rect width="540" height="160" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
                <line x1="0" y1="50" x2="540" y2="50" stroke="#10b981" strokeWidth="1" strokeDasharray="4 3" />
                <text x="480" y="47" fill="#10b981" fontFamily="IBM Plex Mono" fontSize="7" fontWeight="bold">TARGET 12.5 t/h</text>
                <path d="M 0 80 Q 40 75 80 70 T 160 65 T 240 60 T 320 55 T 400 58 T 480 52 T 540 55" fill="none" stroke="#0284c7" strokeWidth="2" />
              </g>
            </svg>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2 font-label-sm text-label-sm">
            <div><span className="text-secondary block">SESSION TONNAGE:</span><span className="font-bold text-on-surface">148.42 Metric Tons</span></div>
            <div><span className="text-secondary block">PEAK SURGE SURCHARGE:</span><span className="font-bold text-on-surface">13.90 t/h (+11%)</span></div>
            <div><span className="text-secondary block">VFD BELT SPEED:</span><span className="font-bold text-on-surface">1.42 m/s LOCKED</span></div>
          </div>
        </div>
      </section>

      {/* Alarm Thresholds + Calibration */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-space-md">
        <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div><span className="font-label-sm text-label-sm text-secondary uppercase block">SAFETY INTERLOCK &amp; ENVELOPE</span><span className="font-headline-sm text-headline-sm text-on-surface">ALARM THRESHOLDS &amp; TARE INTEGRITY</span></div>
            <span className="font-label-sm text-label-sm font-bold text-[#047857] px-2 py-0.5 bg-[#10b981]/20 rounded">ALL INTERLOCKS HEALTHY</span>
          </div>
          {[
            { label: 'MAX OVERLOAD TRIP LIMIT', desc: 'Trip relay de-energizes VFD drive immediately', val: '80.00', margin: `MARGIN: +${(80 - l.totalKg).toFixed(2)} kg` },
            { label: 'HIGH MASS SLOWDOWN ADVISORY', desc: 'Feeder gate throttles to 70% capacity', val: '60.00', margin: `CURRENT: ${l.totalKg.toFixed(2)} kg` },
            { label: 'EMPTY BELT / MATERIAL RUNOUT CUTOUT', desc: 'Triggers auto-idle if conveyor runs unloaded for >45s', val: '5.00', margin: 'STATUS: LOAD PRESENT' },
          ].map((alarm) => (
            <div key={alarm.label} className="flex items-center justify-between py-2 border-b border-outline-variant last:border-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                <div>
                  <span className="font-label-md text-label-md font-bold text-on-surface">{alarm.label}</span>
                  <span className="font-label-sm text-label-sm text-secondary block">{alarm.desc}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-metric-display text-metric-display text-on-surface font-bold">{alarm.val}<span className="font-label-sm text-label-sm text-secondary ml-1">kg</span></span>
                <span className="font-label-sm text-label-sm text-[#047857] block">{alarm.margin}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-[20px] text-primary">build</span>
            <span className="font-headline-sm text-headline-sm text-on-surface">CALIBRATION &amp; TARE CONTROL</span>
          </div>
          <p className="font-body-sm text-body-sm text-secondary mb-3">Execute digital re-zeroing, calibrate against certified reference weights, or generate strain audit telemetry logs for quality compliance.</p>
          {[
            { icon: 'restart_alt', label: 'Execute Auto-Zero Tare', desc: 'Re-zeros both LC-01 & LC-02 with empty belt running', action: 'PUSH' },
            { icon: 'scale', label: 'Two-Point Calibration Routine', desc: 'Span routine using 10.00 kg certified test weight', action: '10.0 kg' },
            { icon: 'download', label: 'Export Tare & Span Audit Log', desc: 'CSV output with raw HX711 bits & temperature log', action: 'CSV' },
          ].map((btn) => (
            <div key={btn.label} className="flex items-center justify-between py-2 border-b border-outline-variant last:border-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">{btn.icon}</span>
                <div>
                  <span className="font-label-md text-label-md font-bold text-on-surface">{btn.label}</span>
                  <span className="font-label-sm text-label-sm text-secondary block">{btn.desc}</span>
                </div>
              </div>
              <button className="font-label-sm text-label-sm font-bold text-primary border border-primary px-2 py-1 rounded hover:bg-primary/10">{btn.action}</button>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 font-label-sm text-label-sm text-secondary mt-2">
            <span>● LAST CALIBRATION: 2025-02-14 08:30 UTC</span>
            <span className="text-[#10b981] font-bold">CERT VALID</span>
          </div>
        </div>
      </section>
    </>
  );
};
