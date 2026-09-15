// =============================================================================
// ConveyorSchematic — 2D Engineering Diagram (from Stitch overview)
// =============================================================================

import React from 'react';

export const ConveyorSchematic: React.FC = () => (
  <div className="w-full relative bg-surface-container-low rounded-lg p-2 overflow-hidden flex items-center justify-center min-h-[290px]">
    <svg className="w-full h-full select-none" viewBox="0 0 740 270" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="schematicGrid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#cbd5e1" strokeWidth="0.6" strokeOpacity="0.6" />
        </pattern>
        <linearGradient id="rollerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="50%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id="motorBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="60%" stopColor="#0369a1" />
          <stop offset="100%" stopColor="#075985" />
        </linearGradient>
      </defs>
      {/* Background */}
      <rect width="740" height="270" fill="#f8fafc" />
      <rect width="740" height="270" fill="url(#schematicGrid)" />

      {/* Support frame */}
      <rect x="40" y="190" width="660" height="8" fill="#94a3b8" rx="2" />
      {/* Support legs */}
      {[60, 230, 460, 640].map((x) => (
        <g key={x}>
          <line x1={x} y1={198} x2={x} y2={225} stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
          <line x1={x-15} y1={225} x2={x+15} y2={225} stroke="#475569" strokeWidth="4" strokeLinecap="round" />
        </g>
      ))}

      {/* Belt loop */}
      <path d="M 140 100 L 520 100 A 35 35 0 0 1 520 170 L 140 170 A 35 35 0 0 1 140 100 Z" fill="none" stroke="#0f172a" strokeWidth="8" strokeLinejoin="round" />
      <path d="M 140 100 L 520 100" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="12 8" />

      {/* Belt material on top */}
      <rect x="205" y="104" width="250" height="8" fill="#3b82f6" rx="2" stroke="#1d4ed8" strokeWidth="1" />

      {/* Idler roller (left) */}
      <circle cx="140" cy="135" r="31" fill="url(#rollerGrad)" stroke="#475569" strokeWidth="2" />
      <circle cx="140" cy="135" r="10" fill="#475569" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx="140" cy="135" r="4" fill="#e2e8f0" />
      <line x1="140" y1="104" x2="140" y2="166" stroke="#475569" strokeWidth="1.5" strokeDasharray="3 3" />

      {/* Drive roller (right) */}
      <circle cx="520" cy="135" r="31" fill="url(#rollerGrad)" stroke="#475569" strokeWidth="2" />
      <circle cx="520" cy="135" r="10" fill="#475569" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx="520" cy="135" r="4" fill="#e2e8f0" />
      <line x1="520" y1="104" x2="520" y2="166" stroke="#475569" strokeWidth="1.5" strokeDasharray="3 3" />

      {/* Direction arrows (top) */}
      <g opacity="0.9">
        {[260,340,420].map((x) => (
          <polygon key={x} points={`${x},94 ${x+15},90 ${x},86`} fill="#0284c7" />
        ))}
        {[390,310].map((x) => (
          <polygon key={x} points={`${x},176 ${x-15},180 ${x},184`} fill="#64748b" />
        ))}
      </g>

      {/* Load cell 1 */}
      <g transform="translate(235, 114)">
        <rect x="-16" y="0" width="32" height="24" fill="#ffffff" stroke="#0284c7" strokeWidth="2" rx="2" />
        <circle cx="0" cy="12" r="5" fill="#38bdf8" />
        <rect x="-10" y="24" width="20" height="28" fill="#cbd5e1" stroke="#64748b" strokeWidth="1.5" />
        <circle cx="0" cy="38" r="3" fill="#475569" />
        <rect x="-14" y="52" width="28" height="6" fill="#64748b" rx="1" />
        <text x="0" y="15" fill="#0369a1" fontFamily="IBM Plex Mono" fontSize="6.5" fontWeight="bold" textAnchor="middle">LC1</text>
      </g>

      {/* Load cell 2 */}
      <g transform="translate(425, 114)">
        <rect x="-16" y="0" width="32" height="24" fill="#ffffff" stroke="#0284c7" strokeWidth="2" rx="2" />
        <circle cx="0" cy="12" r="5" fill="#38bdf8" />
        <rect x="-10" y="24" width="20" height="28" fill="#cbd5e1" stroke="#64748b" strokeWidth="1.5" />
        <circle cx="0" cy="38" r="3" fill="#475569" />
        <rect x="-14" y="52" width="28" height="6" fill="#64748b" rx="1" />
        <text x="0" y="15" fill="#0369a1" fontFamily="IBM Plex Mono" fontSize="6.5" fontWeight="bold" textAnchor="middle">LC2</text>
      </g>

      {/* Tracking roller */}
      <rect x="270" y="174" width="120" height="8" fill="#94a3b8" stroke="#64748b" strokeWidth="1" rx="1" />
      <circle cx="330" cy="178" r="12" fill="url(#rollerGrad)" stroke="#475569" strokeWidth="1.5" />
      <circle cx="330" cy="178" r="3" fill="#ffffff" />

      {/* Coupling */}
      <rect x="552" y="128" width="18" height="14" fill="#64748b" stroke="#334155" strokeWidth="1" rx="1" />
      <line x1="556" y1="128" x2="556" y2="142" stroke="#475569" strokeWidth="1" />
      <line x1="564" y1="128" x2="564" y2="142" stroke="#475569" strokeWidth="1" />

      {/* Motor body */}
      <rect x="570" y="115" width="80" height="40" fill="url(#motorBodyGrad)" stroke="#0369a1" strokeWidth="2" rx="4" />
      <rect x="650" y="121" width="14" height="28" fill="#0369a1" stroke="#075985" strokeWidth="1.5" rx="2" />
      {/* Motor fins */}
      {[582,596,610,624,638].map((x) => (
        <line key={x} x1={x} y1={115} x2={x} y2={155} stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.6" />
      ))}
      <text x="610" y="139" fill="#ffffff" fontFamily="IBM Plex Mono" fontSize="8" fontWeight="bold" textAnchor="middle">12V DC MOTOR</text>

      {/* IMU sensor */}
      <g transform="translate(510, 88)">
        <rect x="-12" y="-10" width="24" height="20" fill="#065f46" stroke="#10b981" strokeWidth="1.5" rx="2" />
        <circle cx="0" cy="0" r="4" fill="#34d399" />
        <circle cx="0" cy="0" r="2" fill="#ffffff" />
        <text x="0" y="3" fill="#ffffff" fontFamily="IBM Plex Mono" fontSize="5" fontWeight="bold" textAnchor="middle">I2C</text>
      </g>

      {/* Encoder on idler */}
      <g transform="translate(140, 135)">
        <circle cx="0" cy="0" r="22" fill="none" stroke="#1e293b" strokeWidth="4" strokeDasharray="4 3" />
        <rect x="-3" y="-34" width="20" height="12" fill="#0284c7" stroke="#0369a1" strokeWidth="1" rx="2" />
        <circle cx="7" cy="-28" r="2" fill="#ef4444" />
      </g>

      {/* Wiring lines */}
      <g stroke="#64748b" strokeWidth="1" fill="none">
        <path d="M 140 76 L 140 45 L 110 45" />
        <circle cx="140" cy="76" r="2" fill="#64748b" />
        <path d="M 235 114 L 235 60 L 260 60" />
        <circle cx="235" cy="114" r="2" fill="#64748b" />
        <path d="M 425 114 L 425 60 L 400 60" />
        <circle cx="425" cy="114" r="2" fill="#64748b" />
        <path d="M 510 78 L 510 45 L 470 45" />
        <circle cx="510" cy="78" r="2" fill="#64748b" />
        <path d="M 610 115 L 610 45 L 630 45" />
        <circle cx="610" cy="115" r="2" fill="#64748b" />
        <path d="M 140 195 L 140 235 L 120 235" />
        <circle cx="140" cy="195" r="2" fill="#64748b" />
      </g>

      {/* Labels */}
      <g fontFamily="IBM Plex Mono" fontSize="9">
        <g transform="translate(10, 36)">
          <rect width="95" height="20" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" rx="2" />
          <text x="8" y="14" fill="#0f172a" fontWeight="bold">OPTICAL ENCODER</text>
        </g>
        <g transform="translate(265, 50)">
          <rect width="130" height="20" fill="#ffffff" stroke="#0284c7" strokeWidth="1" rx="2" />
          <text x="8" y="14" fill="#0369a1" fontWeight="bold">LOAD CELLS (HX711)</text>
        </g>
        <g transform="translate(400, 36)">
          <rect width="65" height="20" fill="#ffffff" stroke="#059669" strokeWidth="1" rx="2" />
          <text x="6" y="14" fill="#065f46" fontWeight="bold">MPU-6050</text>
        </g>
        <g transform="translate(635, 36)">
          <rect width="90" height="20" fill="#ffffff" stroke="#0284c7" strokeWidth="1" rx="2" />
          <text x="6" y="14" fill="#0369a1" fontWeight="bold">GEARED DRIVE</text>
        </g>
        <g transform="translate(15, 226)">
          <rect width="100" height="20" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" rx="2" />
          <text x="6" y="14" fill="#475569" fontWeight="bold">IDLER / TAIL ROLL</text>
        </g>
      </g>

      {/* Dashed sensor wiring */}
      <line x1="235" y1="126" x2="210" y2="126" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="2 2" />
      <line x1="210" y1="126" x2="210" y2="160" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="2 2" />
      <line x1="425" y1="126" x2="450" y2="126" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="2 2" />
      <line x1="450" y1="126" x2="450" y2="160" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="2 2" />
      <path d="M 510 88 Q 500 70 485 70" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="2 2" />
      <path d="M 147 107 Q 160 105 170 105" fill="none" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="2 2" />
    </svg>
  </div>
);
