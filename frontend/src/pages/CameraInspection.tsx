// =============================================================================
// Camera Inspection Page — Stitch SCADA Vision System
// =============================================================================

import React from 'react';

export const CameraInspection: React.FC = () => {
  return (
    <>
      <header className="w-full bg-surface-container-lowest shadow-sm rounded-lg p-space-md flex flex-col xl:flex-row xl:items-center justify-between gap-space-md">
        <div className="flex flex-wrap items-center gap-space-lg">
          <div className="bg-primary px-3 py-1.5 rounded text-on-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">videocam</span>
            <span className="font-headline-sm text-headline-sm tracking-wider">CV-IRON-01 // VISION SYSTEM</span>
          </div>
          <span className="font-label-sm text-label-sm text-secondary">RPi Camera V2.1 (IMX219) • YOLOv8n-seg Instance Segmentation • ONNXRUNTIME EDGE</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#ef4444] text-white rounded font-label-sm text-label-sm font-bold animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />LIVE STREAM
          </div>
          <div className="bg-surface-container-low px-3 py-1.5 rounded">
            <span className="font-label-sm text-label-sm text-secondary">FPS:</span>
            <span className="font-label-md text-label-md font-bold text-on-surface ml-1">12.4</span>
          </div>
          <div className="bg-surface-container-low px-3 py-1.5 rounded">
            <span className="font-label-sm text-label-sm text-secondary">INFERENCE:</span>
            <span className="font-label-md text-label-md font-bold text-on-surface ml-1">82ms</span>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-space-md">
        <div className="xl:col-span-8 bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
          <div className="flex items-center justify-between pb-space-sm mb-space-sm bg-surface-container-low px-space-sm py-1.5 rounded">
            <span className="font-headline-sm text-headline-sm text-on-surface">LIVE CAMERA FEED — INFERENCE OVERLAY</span>
            <div className="flex items-center gap-2">
              <span className="font-label-sm text-label-sm text-secondary">RES: 640×480</span>
              <span className="font-label-sm text-label-sm text-secondary">•</span>
              <span className="font-label-sm text-label-sm text-secondary">MODEL: YOLOv8n-seg</span>
            </div>
          </div>
          <div className="w-full aspect-[4/3] bg-[#0f172a] rounded-lg flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1e293b] to-[#0f172a]" />
            <div className="relative z-10 text-center">
              <span className="material-symbols-outlined text-[48px] text-[#38bdf8] mb-2 block">videocam</span>
              <div className="font-headline-sm text-headline-sm text-[#38bdf8] mb-1">CAMERA FEED</div>
              <div className="font-label-sm text-label-sm text-[#64748b]">WAITING FOR LIVE STREAM CONNECTION...</div>
              <div className="font-label-sm text-label-sm text-[#64748b] mt-1">CONNECT RPi4 CAMERA TO VIEW FEED</div>
            </div>
            {/* Detection overlays would go here */}
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-[#0f172a]/80 px-2 py-1 rounded">
              <span className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse" />
              <span className="font-label-sm text-label-sm text-white font-bold">REC</span>
            </div>
            <div className="absolute bottom-2 left-2 bg-[#0f172a]/80 px-2 py-1 rounded font-label-sm text-label-sm text-[#38bdf8]">
              BELT SURFACE • CROSS-SECTION VIEW • TOP-DOWN
            </div>
          </div>
        </div>
        <div className="xl:col-span-4 flex flex-col gap-space-md">
          <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
            <div className="font-headline-sm text-headline-sm text-on-surface mb-2">DETECTION SUMMARY</div>
            <div className="flex flex-col gap-1.5">
              {[
                { label: 'Belt Material', conf: '98.4%', color: '#10b981', count: 'TRACKING' },
                { label: 'Iron Ore Bulk', conf: '94.1%', color: '#0284c7', count: '3 REGIONS' },
                { label: 'Edge Boundaries', conf: '92.7%', color: '#f59e0b', count: '2 LINES' },
                { label: 'Foreign Objects', conf: '0.0%', color: '#10b981', count: 'NONE' },
                { label: 'Belt Damage', conf: '0.0%', color: '#10b981', count: 'CLEAR' },
              ].map((det) => (
                <div key={det.label} className="flex items-center justify-between px-2 py-1.5 bg-surface-container-low rounded">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded" style={{ backgroundColor: det.color }} />
                    <span className="font-label-md text-label-md font-semibold text-on-surface">{det.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-label-sm text-label-sm text-secondary">{det.conf}</span>
                    <span className="font-label-sm text-label-sm font-bold px-1.5 py-0.5 rounded" style={{ color: det.color, backgroundColor: `${det.color}20` }}>{det.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
            <div className="font-headline-sm text-headline-sm text-on-surface mb-2">INFERENCE ENGINE</div>
            <div className="grid grid-cols-2 gap-1 font-label-sm text-label-sm">
              <span className="text-secondary">MODEL:</span><span className="font-bold text-on-surface">YOLOv8n-seg</span>
              <span className="text-secondary">RUNTIME:</span><span className="font-bold text-on-surface">ONNX (CPU)</span>
              <span className="text-secondary">INPUT SIZE:</span><span className="font-bold text-on-surface">640×480</span>
              <span className="text-secondary">LATENCY:</span><span className="font-bold text-on-surface">82 ms</span>
              <span className="text-secondary">THROUGHPUT:</span><span className="font-bold text-on-surface">12.4 FPS</span>
              <span className="text-secondary">MEMORY:</span><span className="font-bold text-on-surface">214 MB RSS</span>
              <span className="text-secondary">CLASSES:</span><span className="font-bold text-on-surface">5 CUSTOM</span>
              <span className="text-secondary">NMS THRESH:</span><span className="font-bold text-on-surface">0.45</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
