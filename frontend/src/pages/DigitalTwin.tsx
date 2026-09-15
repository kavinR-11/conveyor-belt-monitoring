// =============================================================================
// Digital Twin Page — LIVE Animated Conveyor Belt 2D Digital Twin
// =============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { useTelemetry } from '../hooks/useTelemetry';

export const DigitalTwin: React.FC = () => {
  const { frame } = useTelemetry();

  return (
    <>
      <header className="w-full bg-surface-container-lowest shadow-sm rounded-lg p-space-md flex flex-col xl:flex-row xl:items-center justify-between gap-space-md">
        <div className="flex flex-wrap items-center gap-space-lg">
          <div className="bg-primary px-3 py-1.5 rounded text-on-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">deployed_code</span>
            <span className="font-headline-sm text-headline-sm tracking-wider">CV-IRON-01 // DIGITAL TWIN</span>
          </div>
          <span className="font-label-sm text-label-sm px-1.5 py-0.5 bg-[#ef4444] text-white font-bold rounded animate-pulse">● LIVE</span>
          <span className="font-label-sm text-label-sm text-secondary">REAL-TIME 2D ANIMATED ASSEMBLY • SENSOR OVERLAY • PARAMETRIC MODEL</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-surface-container-low px-3 py-1.5 rounded flex items-center gap-2">
            <span className="font-label-sm text-label-sm text-secondary">STATE:</span>
            <span className="font-label-md text-label-md font-bold text-[#10b981]">{frame.machineState}</span>
          </div>
          <div className="bg-surface-container-low px-3 py-1.5 rounded flex items-center gap-2">
            <span className="font-label-sm text-label-sm text-secondary">SPEED:</span>
            <span className="font-label-md text-label-md font-bold text-primary">{frame.beltSpeed.speedMs.toFixed(2)} m/s</span>
          </div>
        </div>
      </header>

      {/* Main Twin Viewport */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-space-md">
        <div className="xl:col-span-9 bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
          <div className="flex items-center justify-between pb-space-sm mb-space-sm bg-surface-container-low px-space-sm py-1.5 rounded">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary">precision_manufacturing</span>
              <span className="font-headline-sm text-headline-sm text-primary">LIVE CONVEYOR ASSEMBLY — ANIMATED DIGITAL TWIN</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
              <span className="font-label-sm text-label-sm text-[#047857] font-bold">SYNCED TO TELEMETRY</span>
            </div>
          </div>
          <LiveConveyorTwin
            speed={frame.beltSpeed.speedMs}
            loadLeft={frame.load.cell1Kg}
            loadRight={frame.load.cell2Kg}
            vibration={frame.vibration.rms}
            current={frame.electrical.currentA}
            motorState={frame.machineState}
          />
        </div>

        {/* Right Panel — Live Sensor Readouts */}
        <div className="xl:col-span-3 flex flex-col gap-space-md">
          <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
            <div className="font-headline-sm text-headline-sm text-on-surface mb-3">LIVE SENSOR READOUTS</div>
            <div className="flex flex-col gap-2">
              {[
                { label: 'LOAD CELL 1 (LC-01)', value: frame.load.cell1Kg.toFixed(2), unit: 'kg', color: '#0284c7', icon: 'scale' },
                { label: 'LOAD CELL 2 (LC-02)', value: frame.load.cell2Kg.toFixed(2), unit: 'kg', color: '#0284c7', icon: 'scale' },
                { label: 'MOTOR CURRENT', value: frame.electrical.currentA.toFixed(2), unit: 'A', color: '#f59e0b', icon: 'bolt' },
                { label: 'BELT SPEED', value: frame.beltSpeed.speedMs.toFixed(3), unit: 'm/s', color: '#10b981', icon: 'speed' },
                { label: 'VIBRATION RMS', value: frame.vibration.rms.toFixed(2), unit: 'mm/s', color: '#ef4444', icon: 'vibration' },
                { label: 'MOTOR RPM', value: frame.beltSpeed.motorRpm.toFixed(0), unit: 'RPM', color: '#1e40af', icon: 'settings' },
                { label: 'BUS VOLTAGE', value: frame.electrical.voltageV.toFixed(1), unit: 'V', color: '#f59e0b', icon: 'electric_bolt' },
                { label: 'ACTIVE POWER', value: frame.electrical.powerW.toFixed(0), unit: 'W', color: '#1e40af', icon: 'power' },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between px-2.5 py-2 bg-surface-container-low rounded">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]" style={{ color: s.color }}>{s.icon}</span>
                    <span className="font-label-sm text-label-sm text-secondary">{s.label}</span>
                  </div>
                  <span className="font-label-md text-label-md font-bold text-on-surface">{s.value} <span className="text-secondary font-normal">{s.unit}</span></span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
            <div className="font-headline-sm text-headline-sm text-on-surface mb-2">COMPONENT LEGEND</div>
            <div className="flex flex-col gap-1.5">
              {[
                { color: '#0284c7', label: 'Belt Loop (PVC)' },
                { color: '#1e40af', label: 'Drive Motor (12V DC)' },
                { color: '#64748b', label: 'Rollers (Drive + Idler)' },
                { color: '#10b981', label: 'Load Cells (LC-01, LC-02)' },
                { color: '#ef4444', label: 'IMU Sensor (MPU-6050)' },
                { color: '#f59e0b', label: 'Optical Encoder (100PPR)' },
                { color: '#8b5cf6', label: 'Material on Belt' },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: l.color }} />
                  <span className="font-label-sm text-label-sm text-on-surface">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

// =============================================================================
// LiveConveyorTwin — the animated SVG conveyor assembly
// =============================================================================

interface TwinProps {
  speed: number;
  loadLeft: number;
  loadRight: number;
  vibration: number;
  current: number;
  motorState: string;
}

const LiveConveyorTwin: React.FC<TwinProps> = ({ speed, loadLeft, loadRight, vibration, current, motorState }) => {
  const [tick, setTick] = useState(0);
  const animRef = useRef<number>(0);
  const lastTime = useRef(0);

  useEffect(() => {
    const animate = (time: number) => {
      if (lastTime.current === 0) lastTime.current = time;
      const dt = (time - lastTime.current) / 1000;
      lastTime.current = time;
      if (motorState === 'RUNNING') {
        setTick((prev) => prev + dt * speed * 80);
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [speed, motorState]);

  const isRunning = motorState === 'RUNNING';
  const rollerAngle = tick * 3;
  const beltOffset = tick % 24;
  const vibShake = isRunning ? Math.sin(tick * 0.5) * vibration * 0.3 : 0;

  return (
    <div className="w-full bg-surface-container-low rounded-lg p-3 overflow-hidden">
      <svg className="w-full select-none" viewBox="0 0 800 340" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dtGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
          </pattern>
          <linearGradient id="dtRoller" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="50%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
          <linearGradient id="dtMotor" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e40af" />
            <stop offset="60%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
          <linearGradient id="dtBelt" x1="0" y1="0" x2="24" y2="0" gradientUnits="userSpaceOnUse" spreadMethod="repeat">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="50%" stopColor="#334155" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
          <filter id="dtGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Background */}
        <rect width="800" height="340" fill="#f8fafc" />
        <rect width="800" height="340" fill="url(#dtGrid)" />

        {/* Main assembly group with subtle vibration */}
        <g transform={`translate(0, ${vibShake})`}>

          {/* ── SUPPORT FRAME ── */}
          <rect x="60" y="222" width="580" height="8" fill="#94a3b8" rx="2" />
          {[80, 220, 440, 620].map((x) => (
            <g key={`leg-${x}`}>
              <line x1={x} y1={230} x2={x} y2={265} stroke="#64748b" strokeWidth="5" strokeLinecap="round" />
              <line x1={x - 16} y1={265} x2={x + 16} y2={265} stroke="#475569" strokeWidth="5" strokeLinecap="round" />
            </g>
          ))}

          {/* ── BELT LOOP (top + bottom + curves) ── */}
          <g>
            {/* Top belt */}
            <rect x="155" y="120" width="390" height="9" fill="#1e293b" rx="1" />
            {/* Belt texture dashes (animated) */}
            {Array.from({ length: 18 }).map((_, i) => (
              <line key={`dash-top-${i}`} x1={155 + ((i * 24 + beltOffset) % 390)} y1="121" x2={155 + ((i * 24 + beltOffset) % 390) + 10} y2="121" stroke="#38bdf8" strokeWidth="1.5" opacity="0.6" />
            ))}
            {/* Bottom belt */}
            <rect x="155" y="195" width="390" height="9" fill="#1e293b" rx="1" />
            {Array.from({ length: 18 }).map((_, i) => (
              <line key={`dash-bot-${i}`} x1={545 - ((i * 24 + beltOffset) % 390)} y1="199" x2={545 - ((i * 24 + beltOffset) % 390) - 10} y2="199" stroke="#475569" strokeWidth="1" opacity="0.4" />
            ))}
          </g>

          {/* ── MATERIAL ON BELT ── */}
          {isRunning && (
            <g>
              {Array.from({ length: 6 }).map((_, i) => {
                const xPos = 200 + ((i * 55 + beltOffset * 0.8) % 280);
                const w = 30 + Math.sin(i * 1.7) * 10;
                const h = 8 + Math.sin(i * 2.3) * 3;
                return (
                  <rect key={`mat-${i}`} x={xPos} y={120 - h} width={w} height={h} fill="#8b5cf6" opacity="0.7" rx="2" stroke="#7c3aed" strokeWidth="0.5" />
                );
              })}
            </g>
          )}

          {/* ── IDLER ROLLER (Left) ── */}
          <g transform={`translate(155, 162)`}>
            <circle cx="0" cy="0" r="38" fill="url(#dtRoller)" stroke="#475569" strokeWidth="2.5" />
            {/* Spoke lines that rotate */}
            {[0, 60, 120].map((a) => (
              <line key={`is-${a}`} x1="0" y1="-25" x2="0" y2="25" stroke="#475569" strokeWidth="1.5" transform={`rotate(${a + rollerAngle})`} opacity="0.5" />
            ))}
            <circle cx="0" cy="0" r="12" fill="#475569" stroke="#1e293b" strokeWidth="2" />
            <circle cx="0" cy="0" r="4" fill="#e2e8f0" />
          </g>

          {/* ── DRIVE ROLLER (Right) ── */}
          <g transform={`translate(545, 162)`}>
            <circle cx="0" cy="0" r="38" fill="url(#dtRoller)" stroke="#475569" strokeWidth="2.5" />
            {[0, 60, 120].map((a) => (
              <line key={`ds-${a}`} x1="0" y1="-25" x2="0" y2="25" stroke="#475569" strokeWidth="1.5" transform={`rotate(${a + rollerAngle})`} opacity="0.5" />
            ))}
            <circle cx="0" cy="0" r="12" fill="#475569" stroke="#1e293b" strokeWidth="2" />
            <circle cx="0" cy="0" r="4" fill="#e2e8f0" />
          </g>

          {/* ── DIRECTION ARROWS ── */}
          {isRunning && (
            <g opacity="0.8">
              {[270, 350, 430].map((x) => (
                <polygon key={`arr-${x}`} points={`${x},114 ${x + 14},110 ${x},106`} fill="#0284c7">
                  <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" />
                </polygon>
              ))}
            </g>
          )}

          {/* ── LOAD CELL 1 (LC-01) ── */}
          <g transform="translate(260, 133)">
            <rect x="-20" y="0" width="40" height="28" fill="#ffffff" stroke="#10b981" strokeWidth="2.5" rx="3" />
            <rect x="-14" y="28" width="28" height="20" fill="#d1fae5" stroke="#10b981" strokeWidth="1.5" rx="1" />
            <circle cx="0" cy="14" r="6" fill="#10b981" opacity="0.8">
              {isRunning && <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" />}
            </circle>
            <text x="0" y="17" fill="#065f46" fontFamily="IBM Plex Mono" fontSize="6" fontWeight="bold" textAnchor="middle">LC</text>
            {/* Label */}
            <rect x="-36" y="-24" width="72" height="18" fill="#10b981" rx="3" />
            <text x="0" y="-12" fill="#ffffff" fontFamily="IBM Plex Mono" fontSize="8" fontWeight="bold" textAnchor="middle">LC-01: {loadLeft.toFixed(1)}kg</text>
            <line x1="0" y1="-6" x2="0" y2="0" stroke="#10b981" strokeWidth="1.5" />
          </g>

          {/* ── LOAD CELL 2 (LC-02) ── */}
          <g transform="translate(440, 133)">
            <rect x="-20" y="0" width="40" height="28" fill="#ffffff" stroke="#10b981" strokeWidth="2.5" rx="3" />
            <rect x="-14" y="28" width="28" height="20" fill="#d1fae5" stroke="#10b981" strokeWidth="1.5" rx="1" />
            <circle cx="0" cy="14" r="6" fill="#10b981" opacity="0.8">
              {isRunning && <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" begin="0.5s" />}
            </circle>
            <text x="0" y="17" fill="#065f46" fontFamily="IBM Plex Mono" fontSize="6" fontWeight="bold" textAnchor="middle">LC</text>
            <rect x="-36" y="-24" width="72" height="18" fill="#10b981" rx="3" />
            <text x="0" y="-12" fill="#ffffff" fontFamily="IBM Plex Mono" fontSize="8" fontWeight="bold" textAnchor="middle">LC-02: {loadRight.toFixed(1)}kg</text>
            <line x1="0" y1="-6" x2="0" y2="0" stroke="#10b981" strokeWidth="1.5" />
          </g>

          {/* ── IMU SENSOR (MPU-6050) ── */}
          <g transform="translate(500, 108)">
            <rect x="-14" y="-12" width="28" height="24" fill="#065f46" stroke="#ef4444" strokeWidth="2" rx="3" />
            <circle cx="0" cy="0" r="5" fill="#ef4444" opacity="0.9">
              {isRunning && <animate attributeName="opacity" values="0.5;1;0.5" dur="0.8s" repeatCount="indefinite" />}
            </circle>
            <text x="0" y="3" fill="#ffffff" fontFamily="IBM Plex Mono" fontSize="5" fontWeight="bold" textAnchor="middle">IMU</text>
            <rect x="-28" y="-30" width="56" height="14" fill="#ef4444" rx="3" />
            <text x="0" y="-20" fill="#ffffff" fontFamily="IBM Plex Mono" fontSize="7" fontWeight="bold" textAnchor="middle">VIB: {vibration.toFixed(1)}mm/s</text>
            <line x1="0" y1="-16" x2="0" y2="-12" stroke="#ef4444" strokeWidth="1.5" />
          </g>

          {/* ── OPTICAL ENCODER ── */}
          <g transform="translate(155, 162)">
            <circle cx="0" cy="0" r="28" fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray="5 4">
              {isRunning && <animateTransform attributeName="transform" type="rotate" values={`0;${speed > 0 ? 360 : 0}`} dur={`${Math.max(0.5, 2 / speed)}s`} repeatCount="indefinite" />}
            </circle>
            <rect x="22" y="-38" width="16" height="14" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" rx="2" />
            <circle cx="30" cy="-31" r="2.5" fill="#ef4444">
              {isRunning && <animate attributeName="opacity" values="0;1;0" dur="0.3s" repeatCount="indefinite" />}
            </circle>
            <rect x="-8" y="42" width="70" height="14" fill="#f59e0b" rx="3" />
            <text x="27" y="52" fill="#ffffff" fontFamily="IBM Plex Mono" fontSize="7" fontWeight="bold" textAnchor="middle">ENCODER: {speed.toFixed(2)}m/s</text>
          </g>

          {/* ── COUPLING ── */}
          <rect x="584" y="152" width="22" height="18" fill="#64748b" stroke="#334155" strokeWidth="1.5" rx="2" />
          {[590, 598].map((x) => (
            <line key={`coup-${x}`} x1={x} y1="152" x2={x} y2="170" stroke="#475569" strokeWidth="1" />
          ))}

          {/* ── MOTOR BODY ── */}
          <g transform="translate(606, 140)">
            <rect x="0" y="0" width="100" height="44" fill="url(#dtMotor)" stroke="#1d4ed8" strokeWidth="2.5" rx="5" />
            <rect x="100" y="6" width="18" height="32" fill="#1d4ed8" stroke="#1e3a8a" strokeWidth="2" rx="3" />
            {/* Motor fins */}
            {[14, 30, 46, 62, 78].map((x) => (
              <line key={`fin-${x}`} x1={x} y1="0" x2={x} y2="44" stroke="#60a5fa" strokeWidth="2" opacity="0.4" />
            ))}
            {/* Motor status indicator */}
            <circle cx="90" cy="10" r="4" fill={isRunning ? '#10b981' : '#ef4444'}>
              {isRunning && <animate attributeName="opacity" values="0.5;1;0.5" dur="1s" repeatCount="indefinite" />}
            </circle>
            <text x="50" y="26" fill="#ffffff" fontFamily="IBM Plex Mono" fontSize="8" fontWeight="bold" textAnchor="middle">12V DC MOTOR</text>
            {/* Motor label */}
            <rect x="10" y="-22" width="80" height="16" fill="#1e40af" rx="3" />
            <text x="50" y="-11" fill="#ffffff" fontFamily="IBM Plex Mono" fontSize="8" fontWeight="bold" textAnchor="middle">{current.toFixed(1)}A / {isRunning ? 'RUN' : 'STOP'}</text>
            <line x1="50" y1="-6" x2="50" y2="0" stroke="#1e40af" strokeWidth="1.5" />
          </g>

          {/* ── TRACKING ROLLER ── */}
          <g transform="translate(350, 210)">
            <rect x="-50" y="0" width="100" height="8" fill="#94a3b8" stroke="#64748b" strokeWidth="1" rx="1" />
            <circle cx="0" cy="4" r="14" fill="url(#dtRoller)" stroke="#475569" strokeWidth="1.5">
              {isRunning && <animateTransform attributeName="transform" type="rotate" from="0" to="-360" dur={`${Math.max(0.5, 2 / speed)}s`} repeatCount="indefinite" />}
            </circle>
            <circle cx="0" cy="4" r="3" fill="#ffffff" />
          </g>

          {/* ── WIRING ── */}
          <g stroke="#94a3b8" strokeWidth="1" fill="none" strokeDasharray="3 2" opacity="0.6">
            <path d="M 260 131 L 260 80 L 300 80" />
            <path d="M 440 131 L 440 80 L 400 80" />
            <path d="M 500 96 L 500 72" />
            <path d="M 656 140 L 656 100" />
          </g>

        </g>

        {/* ── LABELS (outside shake group) ── */}
        <g fontFamily="IBM Plex Mono" fontSize="9">
          <text x="155" y="285" fill="#475569" fontWeight="bold" textAnchor="middle">IDLER / TAIL ROLLER</text>
          <text x="545" y="285" fill="#475569" fontWeight="bold" textAnchor="middle">DRIVE ROLLER</text>
          <text x="350" y="300" fill="#64748b" fontSize="8" textAnchor="middle">FEED DIRECTION →</text>
        </g>

        {/* ── STATUS BAR ── */}
        <rect x="10" y="310" width="780" height="24" fill="#f1f5f9" rx="4" stroke="#e2e8f0" strokeWidth="1" />
        <text x="20" y="326" fill="#64748b" fontFamily="IBM Plex Mono" fontSize="8">
          DIGITAL TWIN SYNC: LIVE • REFRESH: 60 FPS • BELT LENGTH: 1.2m • ROLLER Ø: 64mm • MOTOR: 12V DC GEARED
        </text>
        <circle cx="770" cy="322" r="4" fill="#10b981">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
};
