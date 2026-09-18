// =============================================================================
// Camera Inspection Page — Stitch SCADA Vision AI System
// Ultralytics YOLOv8n-seg Belt Tear, Damage & Safety Inspection
// =============================================================================

import React, { useState, useEffect, useRef } from 'react';

interface VisionStatus {
  model_loaded: boolean;
  model_path: string;
  classes: Record<string, string>;
  fps: number;
  latency_ms: number;
  source_mode: string;
  camera_open: boolean;
  latest_detections: Array<{
    class_id: number;
    class_name: string;
    confidence: number;
    bbox: number[];
    is_emergency: boolean;
  }>;
  defect_summary: Record<string, number>;
}

interface ImageDetectionResult {
  count: number;
  detections: Array<{
    class_id: number;
    class_name: string;
    confidence: number;
    bbox: number[];
    is_emergency: boolean;
  }>;
  annotated_image_base64: string;
  latency_ms: number;
  has_emergency: boolean;
}

const CLASS_PALETTE: Record<string, { color: string; bg: string; emergency?: boolean }> = {
  Tear: { color: '#dc2626', bg: '#fef2f2', emergency: true },
  Human: { color: '#eab308', bg: '#fefce8', emergency: true },
  Hole: { color: '#9333ea', bg: '#faf5ff' },
  Puncture: { color: '#ea580c', bg: '#fff7ed' },
  'impact damage': { color: '#ec4899', bg: '#fdf2f8' },
  'patch work': { color: '#0284c7', bg: '#f0f9ff' },
  'Other Objects': { color: '#d97706', bg: '#fffbeb' },
  Roller: { color: '#10b981', bg: '#f0fdf4' },
};

export const CameraInspection: React.FC = () => {
  const [status, setStatus] = useState<VisionStatus | null>(null);
  const [streamError, setStreamError] = useState(false);
  const [confThreshold, setConfThreshold] = useState(0.35);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedResult, setUploadedResult] = useState<ImageDetectionResult | null>(null);
  const [sourceMode, setSourceMode] = useState<'webcam' | 'simulation'>('webcam');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const host = window.location.hostname || 'localhost';
  const streamUrl = `http://${host}:8000/api/vision/stream?conf=${confThreshold}&t=${sourceMode}`;

  // Poll status every 1.5 seconds
  useEffect(() => {
    let unmounted = false;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`http://${host}:8000/api/vision/status`);
        if (res.ok) {
          const data = await res.json();
          if (!unmounted) {
            setStatus(data);
            setSourceMode(data.source_mode);
            setStreamError(false);
          }
        }
      } catch (err) {
        if (!unmounted) setStreamError(true);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 1500);
    return () => {
      unmounted = true;
      clearInterval(interval);
    };
  }, [host]);

  // Handle source toggle
  const toggleSource = async (newMode: 'webcam' | 'simulation') => {
    try {
      const res = await fetch(`http://${host}:8000/api/vision/source`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode }),
      });
      if (res.ok) {
        setSourceMode(newMode);
      }
    } catch (err) {
      console.error('Failed to change camera source:', err);
    }
  };

  // Handle file upload test
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`http://${host}:8000/api/vision/detect_image?conf=${confThreshold}`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setUploadedResult(data);
      }
    } catch (err) {
      console.error('Failed to process image:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const hasEmergency = status?.latest_detections.some((d) => d.is_emergency);

  return (
    <>
      <header className="w-full bg-surface-container-lowest shadow-sm rounded-lg p-space-md flex flex-col xl:flex-row xl:items-center justify-between gap-space-md">
        <div className="flex flex-wrap items-center gap-space-lg">
          <div className="bg-primary px-3 py-1.5 rounded text-on-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">videocam</span>
            <span className="font-headline-sm text-headline-sm tracking-wider">CV-IRON-01 // VISION AI SYSTEM</span>
          </div>
          <span className="font-label-sm text-label-sm px-1.5 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed font-bold rounded">
            YOLOv8n-seg
          </span>
          <span className="font-label-sm text-label-sm text-secondary">
            OPTICAL BELT INSPECTION • TEAR & PUNCTURE SEGMENTATION • SAFETY HAZARD MONITOR
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-label-sm text-label-sm font-bold ${
            hasEmergency
              ? 'bg-[#dc2626] text-white animate-pulse'
              : status?.model_loaded
                ? 'bg-[#10b981]/20 text-[#047857]'
                : 'bg-[#f59e0b]/20 text-[#b45309]'
          }`}>
            <span className={`w-2 h-2 rounded-full ${hasEmergency ? 'bg-white' : 'bg-current'} animate-ping`} />
            {hasEmergency ? '🚨 DEFECT DETECTED' : status?.model_loaded ? 'MODEL ACTIVE' : 'CONNECTING'}
          </div>
          <div className="bg-surface-container-low px-3 py-1.5 rounded">
            <span className="font-label-sm text-label-sm text-secondary">FPS:</span>
            <span className="font-label-md text-label-md font-bold text-on-surface ml-1">
              {status?.fps ? status.fps.toFixed(1) : '12.5'}
            </span>
          </div>
          <div className="bg-surface-container-low px-3 py-1.5 rounded">
            <span className="font-label-sm text-label-sm text-secondary">INFERENCE:</span>
            <span className="font-label-md text-label-md font-bold text-on-surface ml-1">
              {status?.latency_ms ? `${status.latency_ms}ms` : '240ms'}
            </span>
          </div>
        </div>
      </header>

      {/* Emergency Vision Banner if defect or hazard is detected */}
      {hasEmergency && (
        <div className="bg-[#dc2626] text-white p-4 rounded-lg shadow-lg flex flex-col md:flex-row items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[32px]">warning</span>
            <div>
              <div className="font-headline-sm text-headline-sm font-bold">
                CRITICAL OPTICAL DEFECT DETECTED ON CONVEYOR BELT!
              </div>
              <div className="text-sm opacity-95">
                Vision AI identified longitudinal tear / worker proximity hazard. SMS notification dispatched to +917305198655.
              </div>
            </div>
          </div>
          <button
            onClick={() => toggleSource(sourceMode)}
            className="bg-white text-[#dc2626] hover:bg-white/90 px-4 py-2 rounded font-bold text-xs uppercase shrink-0 shadow"
          >
            Acknowledge & Inspect
          </button>
        </div>
      )}

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-space-md">
        {/* Live Camera Stream (8 cols) */}
        <div className="xl:col-span-8 bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-space-sm mb-space-sm bg-surface-container-low px-space-sm py-1.5 rounded">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary">live_tv</span>
              <span className="font-headline-sm text-headline-sm text-on-surface">LIVE FEED WITH SEGMENTATION OVERLAY</span>
            </div>
            {/* Camera Source Controls */}
            <div className="flex items-center gap-2">
              <span className="font-label-sm text-label-sm text-secondary">SOURCE:</span>
              <button
                onClick={() => toggleSource('webcam')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  sourceMode === 'webcam'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container hover:bg-surface-container-high text-secondary'
                }`}
              >
                Webcam (USB / RPi)
              </button>
              <button
                onClick={() => toggleSource('simulation')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  sourceMode === 'simulation'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container hover:bg-surface-container-high text-secondary'
                }`}
              >
                Belt Simulator
              </button>
            </div>
          </div>

          {/* Video Stream Container */}
          <div className="w-full aspect-[4/3] bg-[#0f172a] rounded-lg relative overflow-hidden flex items-center justify-center border border-outline-variant shadow-inner">
            {!streamError ? (
              <img
                src={streamUrl}
                alt="Conveyor Belt Vision Stream"
                className="w-full h-full object-contain select-none"
                onError={() => setStreamError(true)}
              />
            ) : (
              <div className="text-center p-6">
                <span className="material-symbols-outlined text-[56px] text-secondary mb-2 block animate-pulse">
                  videocam_off
                </span>
                <div className="font-headline-sm text-headline-sm text-white mb-1">
                  CAMERA STREAM INITIALIZING
                </div>
                <div className="text-sm text-slate-400 mb-4 max-w-md mx-auto">
                  Connecting to backend video stream on port 8000. If no webcam is attached, the synthetic conveyor simulator will run automatically.
                </div>
                <button
                  onClick={() => setStreamError(false)}
                  className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded hover:bg-primary/90"
                >
                  Retry Connection
                </button>
              </div>
            )}

            {/* Stream HUD tags */}
            <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-[#0f172a]/85 backdrop-blur px-2.5 py-1 rounded text-xs text-white border border-white/10">
              <span className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse" />
              <span className="font-bold">ONNX RUNTIME</span>
              <span className="text-slate-400">|</span>
              <span className="font-mono text-slate-300">YOLOv8n-seg</span>
            </div>

            <div className="absolute bottom-2 left-2 bg-[#0f172a]/85 backdrop-blur px-2.5 py-1 rounded text-xs text-[#38bdf8] border border-white/10 font-mono">
              640×640 INFERENCE TENSOR • MULTI-CLASS INSTANCE MASKING
            </div>
          </div>

          {/* Stream Settings / Confidence Slider */}
          <div className="flex flex-wrap items-center justify-between pt-3 gap-3">
            <div className="flex items-center gap-3">
              <span className="font-label-sm text-label-sm text-secondary font-bold">CONFIDENCE THRESHOLD:</span>
              <input
                type="range"
                min="0.20"
                max="0.85"
                step="0.05"
                value={confThreshold}
                onChange={(e) => setConfThreshold(parseFloat(e.target.value))}
                className="w-32 accent-primary"
              />
              <span className="font-mono text-xs font-bold text-primary">{(confThreshold * 100).toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md font-bold rounded border border-outline-variant transition-all"
              >
                <span className="material-symbols-outlined text-[18px] text-primary">upload_file</span>
                {isUploading ? 'Analyzing Image...' : 'Test Belt Photo Upload'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Details Panel (4 cols) */}
        <div className="xl:col-span-4 flex flex-col gap-space-md">
          {/* Model Class Detection Summary */}
          <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-outline-variant">
              <span className="font-headline-sm text-headline-sm text-on-surface">DETECTED DEFECT TYPES</span>
              <span className="font-label-sm text-label-sm text-secondary font-mono">8 TRAINED CLASSES</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {Object.entries(CLASS_PALETTE).map(([className, styling]) => {
                const count = status?.defect_summary?.[className] || 0;
                const isAlert = count > 0 && styling.emergency;

                return (
                  <div
                    key={className}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded transition-all ${
                      isAlert ? 'bg-[#fef2f2] border border-[#dc2626] animate-pulse' : 'bg-surface-container-low'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: styling.color }} />
                      <span className={`font-label-md text-label-md font-semibold ${isAlert ? 'text-[#b91c1c] font-bold' : 'text-on-surface'}`}>
                        {className}
                      </span>
                    </div>
                    <span
                      className="font-label-sm text-label-sm font-bold px-2 py-0.5 rounded"
                      style={{
                        color: styling.color,
                        backgroundColor: styling.bg,
                      }}
                    >
                      {count > 0 ? `${count} ACTIVE` : 'CLEAR'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Model Architecture & Runtime Specs */}
          <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
            <div className="font-headline-sm text-headline-sm text-on-surface mb-2">VISION MODEL SPECS</div>
            <div className="grid grid-cols-2 gap-y-1.5 font-label-sm text-label-sm">
              <span className="text-secondary">FRAMEWORK:</span>
              <span className="font-bold text-on-surface">Ultralytics YOLOv8n-seg</span>

              <span className="text-secondary">MODEL BINARY:</span>
              <span className="font-mono text-xs font-bold text-primary">best.onnx (13.3 MB)</span>

              <span className="text-secondary">RUNTIME:</span>
              <span className="font-bold text-on-surface">ONNX Runtime (CPU)</span>

              <span className="text-secondary">TENSOR SHAPE:</span>
              <span className="font-mono text-xs text-on-surface">[1, 3, 640, 640]</span>

              <span className="text-secondary">TASK TYPE:</span>
              <span className="font-bold text-on-surface">Instance Segmentation</span>

              <span className="text-secondary">TRAINED CLASSES:</span>
              <span className="font-bold text-on-surface">8 Industrial Belt Classes</span>

              <span className="text-secondary">ALERT LINK:</span>
              <span className="font-bold text-[#dc2626]">Twilio SMS (+917305198655)</span>
            </div>
          </div>

          {/* Image Upload Test Result Preview */}
          {uploadedResult && (
            <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm border border-primary/30">
              <div className="flex items-center justify-between mb-2">
                <span className="font-headline-sm text-headline-sm text-primary">UPLOAD TEST RESULT</span>
                <span className="font-mono text-xs text-secondary">{uploadedResult.latency_ms}ms</span>
              </div>
              <img
                src={uploadedResult.annotated_image_base64}
                alt="Segmentation result"
                className="w-full rounded border border-outline-variant mb-2"
              />
              <div className="space-y-1 text-xs">
                <div className="font-bold text-on-surface">
                  Detections Found: {uploadedResult.count}
                </div>
                {uploadedResult.detections.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-secondary">
                    <span>{d.class_name}</span>
                    <span className="font-mono font-bold text-primary">{(d.confidence * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
};
