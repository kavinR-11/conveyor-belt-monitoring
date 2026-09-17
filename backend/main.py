# =============================================================================
# FastAPI Backend — Conveyor Belt Monitoring System
# =============================================================================
# Features:
#   - WebSocket endpoint for real-time telemetry streaming to frontend
#   - ML inference on every incoming sensor frame
#   - SMS alerting via Twilio on CRITICAL/EMERGENCY events
#   - REST endpoints for alerts, health, and system status
#   - Data simulator for demo mode (replays sensor data from JSON)
# =============================================================================

import asyncio
import json
import logging
import os
import random
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import base64
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Load .env
load_dotenv(Path(__file__).parent / ".env")

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)-14s] %(levelname)-7s %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("main")

# ---------------------------------------------------------------------------
# ML Engine + Alert Manager + Vision Engine
# ---------------------------------------------------------------------------
from backend.ml_engine import engine as ml_engine
from backend.alert_manager import alert_manager
from backend.sms_service import sms_service
from backend.vision_engine import vision_engine, CLASS_NAMES
from backend.mqtt_subscriber import mqtt_subscriber


# ---------------------------------------------------------------------------
# Data Simulator — replays real sensor data from JSON files
# ---------------------------------------------------------------------------
class DataSimulator:
    """Loads real sensor records and replays them for demo/testing."""

    def __init__(self):
        self.records: list[dict] = []
        self.index = 0
        self.loaded = False

    def load(self):
        """Load records from the first available dataset file."""
        project_root = Path(__file__).resolve().parent.parent
        for name in ["Datasetsih1.json", "Datasetsih2.json", "Datasetsih3.json"]:
            fp = project_root / name
            if fp.exists():
                logger.info("Loading simulator data from %s …", name)
                try:
                    with open(fp, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    self.records = data.get("records", [])
                    self.loaded = True
                    logger.info("Simulator loaded %d records", len(self.records))
                    return
                except Exception as e:
                    logger.error("Failed to load %s: %s", name, e)
        logger.warning("No sensor data files found — simulator disabled")

    def next_frame(self) -> Optional[dict]:
        """Return the next sensor frame, cycling through records."""
        if not self.loaded or not self.records:
            return None
        frame = self.records[self.index]
        self.index = (self.index + 1) % len(self.records)
        # Update timestamp to now
        frame["timestamp"] = datetime.now(timezone.utc).isoformat()
        return frame


simulator = DataSimulator()


# ---------------------------------------------------------------------------
# WebSocket Connection Manager
# ---------------------------------------------------------------------------
class ConnectionManager:
    """Manages WebSocket connections to frontend clients."""

    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info("WebSocket client connected (%d total)", len(self.active_connections))

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info("WebSocket client disconnected (%d remaining)", len(self.active_connections))

    async def broadcast(self, message: dict):
        """Send message to all connected clients."""
        disconnected = []
        for conn in self.active_connections:
            try:
                await conn.send_json(message)
            except Exception:
                disconnected.append(conn)
        for conn in disconnected:
            self.disconnect(conn)


ws_manager = ConnectionManager()


last_live_telemetry_time = 0.0
active_source = "SIMULATOR"


async def process_and_broadcast_frame(frame: dict, source: str = "SIMULATOR") -> tuple[dict, Optional[dict]]:
    """Run ML inference, trigger SMS alerts if needed, and broadcast to frontend."""
    global last_live_telemetry_time, active_source

    if source != "SIMULATOR":
        last_live_telemetry_time = time.time()
        active_source = source

    # Run ML prediction
    prediction = ml_engine.predict(frame)

    # Process alerts
    alert = alert_manager.process_prediction(prediction, frame)

    # Check for vision defect data forwarded from Raspberry Pi edge webcam
    vision_data = frame.get("vision") or {}
    vision_defect = vision_data.get("defect_type") or vision_data.get("defect") or frame.get("vision_defect")
    if vision_defect and str(vision_defect).upper() not in ("NONE", "CLEAR", "NORMAL"):
        v_conf = float(vision_data.get("confidence", 0.92))
        v_name = str(vision_defect).strip()
        v_sev = "EMERGENCY" if v_name.lower() in ("tear", "human") else "CRITICAL"
        v_comp = "CONVEYOR BELT (SURFACE TEAR - RPI VISION)" if v_name.lower() == "tear" else f"CONVEYOR BELT ({v_name.upper()} - RPI VISION)"
        v_cause = vision_data.get("details") or f"Raspberry Pi webcam vision model detected {v_name} ({v_conf*100:.1f}%)"

        vision_alert = alert_manager.process_prediction({
            "severity": v_sev,
            "classification": f"VISION {v_name.upper()}",
            "confidence": v_conf,
            "failed_component": v_comp,
            "failure_cause": v_cause,
        }, frame)
        if vision_alert:
            alert = vision_alert

    # Build message for frontend
    message = {
        "type": "telemetry",
        "source": active_source,
        "timestamp": frame.get("timestamp", datetime.now(timezone.utc).isoformat()),
        "sensors": {
            "vibration_left_g": frame.get("vibration_left_g", 0),
            "vibration_right_g": frame.get("vibration_right_g", 0),
            "vibration_left_mps2": frame.get("vibration_left_mps2", 0),
            "vibration_right_mps2": frame.get("vibration_right_mps2", 0),
            "load_left_kg": frame.get("load_left_kg", 0),
            "load_right_kg": frame.get("load_right_kg", 0),
            "load_imbalance_kg": frame.get("load_imbalance_kg", 0),
            "total_load_kg": frame.get("total_load_kg", 0),
            "current_A": frame.get("current_A", 0),
            "ir_left_blocked": frame.get("ir_left_blocked", False),
            "ir_right_blocked": frame.get("ir_right_blocked", False),
            "motor_state": frame.get("motor_state", "IDLE"),
            "estop_active": frame.get("estop_active", False),
            "fault_active": frame.get("fault_active", False),
        },
        "ml": prediction,
    }

    if vision_data:
        message["vision"] = {
            "defect_detected": bool(vision_data.get("defect_detected", bool(vision_defect))),
            "defect_type": vision_defect or "NONE",
            "confidence": float(vision_data.get("confidence", 0.0)),
            "is_emergency": str(vision_defect).lower() in ("tear", "human"),
            "details": vision_data.get("details", ""),
            "source": vision_data.get("source", "RPI_WEBCAM"),
            "timestamp": frame.get("timestamp", datetime.now(timezone.utc).isoformat()),
        }

    # If there's an alert, include it
    if alert:
        message["alert"] = {
            "severity": alert["severity"],
            "classification": alert["classification"],
            "failed_component": alert.get("failed_component", "CONVEYOR SUBSYSTEM"),
            "failure_cause": alert.get("failure_cause", ""),
            "confidence": alert["confidence"],
            "sms_sent": alert.get("sms_sent", False),
            "timestamp": alert["timestamp"],
        }

    await ws_manager.broadcast(message)
    return prediction, alert


# ---------------------------------------------------------------------------
# Background telemetry loop
# ---------------------------------------------------------------------------
async def telemetry_loop():
    """
    Main telemetry processing loop:
    1. If live telemetry (e.g. Raspberry Pi) is active, pause simulator replay.
    2. Otherwise, get next sensor frame from simulator.
    3. Run ML inference & broadcast.
    """
    global active_source
    logger.info("Telemetry loop started")
    while True:
        try:
            # Check if live hardware is currently sending frames (within last 3 seconds)
            if time.time() - last_live_telemetry_time < 3.0:
                await asyncio.sleep(0.2)
                continue

            active_source = "SIMULATOR"
            frame = simulator.next_frame()
            if frame is None:
                await asyncio.sleep(1)
                continue

            await process_and_broadcast_frame(frame, source="SIMULATOR")

            # Simulate ~10 Hz sensor rate
            await asyncio.sleep(0.1)

        except Exception as e:
            logger.error("Telemetry loop error: %s", e)
            await asyncio.sleep(1)


# ---------------------------------------------------------------------------
# Application Lifecycle
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("=" * 60)
    logger.info("  CONVEYOR BELT MONITORING SYSTEM — STARTING")
    logger.info("=" * 60)

    # Load ML models
    ml_engine.load_models()

    # Load Vision YOLOv8n-seg model
    vision_engine.load_model()

    # Configure SMS
    sms_service.configure()
    alert_manager.configure()

    # Load simulator data
    simulator.load()

    # Start background telemetry loop
    task = asyncio.create_task(telemetry_loop())

    # Start MQTT subscriber to receive telemetry from Raspberry Pi over Wi-Fi
    mqtt_subscriber.set_callback(process_and_broadcast_frame)
    mqtt_subscriber.start(asyncio.get_running_loop())

    logger.info("System ready — accepting connections")
    yield

    # Shutdown
    task.cancel()
    mqtt_subscriber.stop()
    logger.info("System shutdown complete")


# ---------------------------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Conveyor Belt Monitoring API",
    description="Industrial conveyor belt health monitoring with ML anomaly detection and SMS alerting",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# REST Endpoints
# ---------------------------------------------------------------------------
@app.get("/health", tags=["system"])
async def health_check():
    """System health check."""
    return {
        "status": "ok",
        "active_source": active_source,
        "is_live_hardware": (time.time() - last_live_telemetry_time < 3.0),
        "ml_loaded": ml_engine.loaded,
        "sms_configured": sms_service.configured,
        "simulator_loaded": simulator.loaded,
        "simulator_records": len(simulator.records),
        "ws_clients": len(ws_manager.active_connections),
    }


@app.post("/api/telemetry", tags=["telemetry"])
async def ingest_telemetry(payload: dict):
    """
    Direct ingestion endpoint for Raspberry Pi / ESP32 sensor telemetry.
    Accepts JSON frames with vibration, load, current, and status.
    Runs ML prediction, triggers SMS alerts if needed, and broadcasts to dashboard.
    """
    prediction, alert = await process_and_broadcast_frame(payload, source="RASPBERRY_PI")
    return {
        "status": "received",
        "source": "RASPBERRY_PI",
        "prediction": prediction,
        "alert": alert,
    }


@app.get("/api/alerts", tags=["alerts"])
async def get_alerts(limit: int = 50):
    """Get recent alerts."""
    return {
        "alerts": alert_manager.get_recent_alerts(limit),
        "total": len(alert_manager.alert_history),
    }


@app.get("/api/alerts/stats", tags=["alerts"])
async def get_alert_stats():
    """Get alert statistics."""
    history = alert_manager.alert_history
    stats = {
        "total": len(history),
        "emergency": sum(1 for a in history if a["severity"] == "EMERGENCY"),
        "critical": sum(1 for a in history if a["severity"] == "CRITICAL"),
        "warning": sum(1 for a in history if a["severity"] == "WARNING"),
        "sms_sent": sum(1 for a in history if a.get("sms_sent", False)),
    }
    return stats


@app.get("/api/ml/status", tags=["ml"])
async def ml_status():
    """ML engine status."""
    return {
        "loaded": ml_engine.loaded,
        "features": ml_engine.features,
        "classes": ml_engine.classes,
    }


# ---------------------------------------------------------------------------
# Vision System Endpoints (YOLOv8n-seg Belt Inspection)
# ---------------------------------------------------------------------------
@app.get("/api/vision/status", tags=["vision"])
async def vision_status():
    """Returns current vision AI status, inference latency, and detection counts."""
    return {
        "model_loaded": vision_engine.loaded,
        "model_path": vision_engine.model_path,
        "classes": CLASS_NAMES,
        "fps": vision_engine.last_fps,
        "latency_ms": vision_engine.last_inference_time_ms,
        "source_mode": vision_engine.source_mode,
        "camera_open": vision_engine.cap.isOpened() if vision_engine.cap else False,
        "latest_detections": vision_engine.latest_detections,
        "defect_summary": vision_engine.latest_defect_summary,
    }


@app.get("/api/vision/stream", tags=["vision"])
async def vision_stream(conf: float = Query(0.35, ge=0.1, le=0.95)):
    """Live MJPEG video stream with YOLOv8n-seg overlays."""
    return StreamingResponse(
        vision_engine.generate_mjpeg_stream(conf_threshold=conf),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


class VisionSourceRequest(BaseModel):
    mode: str  # 'webcam' or 'simulation'


@app.post("/api/vision/source", tags=["vision"])
async def set_vision_source(req: VisionSourceRequest):
    """Switch camera source between physical webcam and synthetic conveyor simulator."""
    if req.mode in ("webcam", "simulation"):
        vision_engine.source_mode = req.mode
        if req.mode == "webcam":
            vision_engine.init_camera()
        return {"status": "ok", "mode": vision_engine.source_mode}
    return {"status": "error", "message": "Mode must be 'webcam' or 'simulation'"}


@app.post("/api/vision/detect_image", tags=["vision"])
async def detect_image(
    file: UploadFile = File(...),
    conf: float = Query(0.35, ge=0.1, le=0.95)
):
    """Upload any conveyor belt image file to test YOLOv8n-seg model directly."""
    import cv2
    import numpy as np
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        return {"error": "Invalid image file format"}

    annotated, detections = vision_engine.predict(img, conf_threshold=conf)
    ret, jpeg = cv2.imencode(".jpg", annotated, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
    b64_img = base64.b64encode(jpeg.tobytes()).decode("utf-8") if ret else ""

    # Check for emergency tears or worker safety hazards
    emergency_detections = [d for d in detections if d.get("is_emergency")]
    if emergency_detections:
        for ed in emergency_detections:
            alert_manager.process_prediction({
                "severity": "EMERGENCY",
                "classification": f"VISION {ed['class_name'].upper()}",
                "confidence": ed["confidence"],
                "failed_component": f"CONVEYOR BELT ({ed['class_name'].upper()})",
                "failure_cause": f"Optical camera detected {ed['class_name']} on belt (Conf: {ed['confidence']*100:.1f}%)",
            }, raw_frame={})

    return {
        "detections": detections,
        "count": len(detections),
        "annotated_image_base64": f"data:image/jpeg;base64,{b64_img}",
        "latency_ms": vision_engine.last_inference_time_ms,
        "has_emergency": len(emergency_detections) > 0,
    }


# ---------------------------------------------------------------------------
# WebSocket Endpoint
# ---------------------------------------------------------------------------
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time telemetry streaming.
    Clients connect here to receive live sensor data + ML predictions.
    """
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive, listen for client messages
            data = await websocket.receive_text()
            # Client can send commands (future: e-stop, motor control, etc.)
            logger.info("WS received: %s", data[:100])
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)


# ---------------------------------------------------------------------------
# Serve Frontend Static Assets (when built for Web Hosting)
# ---------------------------------------------------------------------------
frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    from fastapi.staticfiles import StaticFiles
    from starlette.responses import FileResponse

    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        target = frontend_dist / full_path
        if full_path and target.exists() and target.is_file():
            return FileResponse(target)
        return FileResponse(frontend_dist / "index.html")
