// =============================================================================
// Settings Page — Stitch SCADA System Configuration
// =============================================================================

import React from 'react';

export const Settings: React.FC = () => {
  return (
    <>
      <header className="w-full bg-surface-container-lowest shadow-sm rounded-lg p-space-md flex flex-col xl:flex-row xl:items-center justify-between gap-space-md">
        <div className="flex flex-wrap items-center gap-space-lg">
          <div className="bg-primary px-3 py-1.5 rounded text-on-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">tune</span>
            <span className="font-headline-sm text-headline-sm tracking-wider">SYSTEM SETTINGS</span>
          </div>
          <span className="font-label-sm text-label-sm text-secondary">CONFIGURATION • THRESHOLDS • CONNECTIVITY • USER MANAGEMENT</span>
        </div>
        <button className="font-label-sm text-label-sm text-on-primary bg-primary px-3 py-1.5 rounded hover:bg-primary/90 flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">save</span>SAVE ALL CHANGES
        </button>
      </header>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-space-md">
        {/* Sensor Thresholds */}
        <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
          <div className="font-headline-sm text-headline-sm text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">sensors</span>
            SENSOR ALARM THRESHOLDS
          </div>
          {[
            { group: 'VIBRATION (ISO 10816)', params: [
              { label: 'Warning Limit (Zone C)', value: '4.50', unit: 'mm/s' },
              { label: 'Trip Limit (Zone D)', value: '7.10', unit: 'mm/s' },
              { label: 'Debounce Cycles', value: '5', unit: 'cycles' },
            ]},
            { group: 'LOAD CELLS', params: [
              { label: 'Max Overload Trip', value: '80.00', unit: 'kg' },
              { label: 'High Mass Advisory', value: '60.00', unit: 'kg' },
              { label: 'Empty Belt Cutout', value: '5.00', unit: 'kg' },
            ]},
            { group: 'BELT SPEED', params: [
              { label: 'Setpoint Speed', value: '1.80', unit: 'm/s' },
              { label: 'Max Deviation', value: '5.0', unit: '%' },
              { label: 'Stall Timeout', value: '10', unit: 'sec' },
            ]},
          ].map((group) => (
            <div key={group.group} className="mb-4 last:mb-0">
              <div className="font-label-md text-label-md font-bold text-primary uppercase mb-2">{group.group}</div>
              {group.params.map((p) => (
                <div key={p.label} className="flex items-center justify-between py-1.5 border-b border-outline-variant last:border-0">
                  <span className="font-label-sm text-label-sm text-on-surface">{p.label}</span>
                  <div className="flex items-center gap-1">
                    <input type="text" defaultValue={p.value} className="w-20 px-2 py-0.5 bg-surface-container-low border border-outline-variant rounded font-label-md text-label-md font-bold text-on-surface text-right focus:outline-none focus:border-primary" />
                    <span className="font-label-sm text-label-sm text-secondary w-12">{p.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Connectivity Settings */}
        <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
          <div className="font-headline-sm text-headline-sm text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">wifi</span>
            CONNECTIVITY &amp; BACKEND
          </div>
          {[
            { label: 'MQTT Broker Host', value: 'localhost', type: 'text' },
            { label: 'MQTT Port', value: '1883', type: 'text' },
            { label: 'MQTT Topic Prefix', value: 'conveyor/cv-iron-01', type: 'text' },
            { label: 'FastAPI Backend URL', value: 'http://localhost:8000', type: 'text' },
            { label: 'WebSocket Endpoint', value: 'ws://localhost:8000/ws', type: 'text' },
            { label: 'Data Polling Rate', value: '100', type: 'text' },
            { label: 'ESP32 I2C Clock', value: '400', type: 'text' },
          ].map((field) => (
            <div key={field.label} className="flex items-center justify-between py-1.5 border-b border-outline-variant last:border-0">
              <span className="font-label-sm text-label-sm text-on-surface">{field.label}</span>
              <input type={field.type} defaultValue={field.value} className="w-56 px-2 py-0.5 bg-surface-container-low border border-outline-variant rounded font-label-md text-label-md font-mono text-on-surface text-right focus:outline-none focus:border-primary" />
            </div>
          ))}

          <div className="font-headline-sm text-headline-sm text-on-surface mt-6 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">person</span>
            USER &amp; ACCESS
          </div>
          <div className="grid grid-cols-2 gap-2 font-label-sm text-label-sm">
            <span className="text-secondary">Current User:</span><span className="font-bold text-on-surface">ENG. K. VANCE</span>
            <span className="text-secondary">Role:</span><span className="font-bold text-on-surface">ADMIN (Level 2)</span>
            <span className="text-secondary">Session:</span><span className="font-bold text-[#10b981]">ACTIVE</span>
            <span className="text-secondary">Last Login:</span><span className="font-bold text-on-surface">2025-02-15 08:00 UTC</span>
          </div>
        </div>
      </section>

      {/* System Info */}
      <section className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
        <div className="font-headline-sm text-headline-sm text-on-surface mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-primary">info</span>
          SYSTEM INFORMATION
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'FIRMWARE VERSION', value: 'v2.4.1-rc3' },
            { label: 'PLC LINK', value: 'ISO/CEMA STD' },
            { label: 'FRONTEND', value: 'React 19 + Vite 6' },
            { label: 'BACKEND', value: 'FastAPI 0.100+' },
            { label: 'EDGE COMPUTE', value: 'RPi 4B (8GB)' },
            { label: 'MCU', value: 'ESP32-WROOM-32D' },
            { label: 'ML RUNTIME', value: 'ONNXRuntime 1.17' },
            { label: 'SAFETY', value: 'E-STOP READY' },
          ].map((info) => (
            <div key={info.label} className="bg-surface-container-low p-2 rounded">
              <span className="font-label-sm text-label-sm text-secondary block">{info.label}</span>
              <span className="font-label-md text-label-md font-bold text-on-surface">{info.value}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};
