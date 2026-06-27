"""FastAPI backend — SentinelAI Platform."""

import asyncio
import base64
import json
import tempfile
import time
import uuid
from pathlib import Path
import sys

import cv2
from fastapi import FastAPI, File, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

sys.path.insert(0, str(Path(__file__).parent.parent))
from src.pipeline import Pipeline, PipelineConfig

app = FastAPI(title="SentinelAI API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_jobs: dict[str, dict] = {}


def _build_config(cfg: dict) -> PipelineConfig:
    return PipelineConfig(
        detector=cfg.get("detector", "yolov8n.pt"),
        pose=cfg.get("pose", "yolov8n-pose.pt"),
        device=cfg.get("device", "cpu"),
        conf=float(cfg.get("conf", 0.4)),
        alert_threshold=float(cfg.get("alert_threshold", 0.55)),
        sustained_frames=int(cfg.get("sustained_frames", 10)),
        crouch_ratio_threshold=float(cfg.get("crouch_ratio", 0.65)),
        hand_to_ground_threshold=float(cfg.get("hand_ratio", 0.85)),
        loiter_seconds=float(cfg.get("loiter_sec", 15)),
        loiter_radius_px=float(cfg.get("loiter_radius", 80)),
        weights={
            "crouch":        float(cfg.get("w_crouch", 0.30)),
            "hand_to_ground": float(cfg.get("w_hand",  0.40)),
            "loiter":        float(cfg.get("w_loiter", 0.20)),
            "look_around":   float(cfg.get("w_look",   0.10)),
        },
        resize_width=int(cfg.get("resize_width", 960)),
        skip_frames=int(cfg.get("skip_frames", 0)),
        save_video=True,
        video_dir="output/",
        log_dir="logs/",
        alert_image_dir="output/alerts/",
    )


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "2.0"}


@app.post("/api/upload")
async def upload_video(file: UploadFile = File(...)):
    job_id = uuid.uuid4().hex[:10]
    suffix = Path(file.filename).suffix or ".mp4"
    tmp = Path(tempfile.gettempdir()) / f"sentinel_{job_id}{suffix}"
    content = await file.read()
    tmp.write_bytes(content)
    _jobs[job_id] = {
        "status": "uploaded",
        "source": str(tmp),
        "filename": file.filename,
        "size": len(content),
    }
    return {"job_id": job_id, "filename": file.filename, "size": len(content)}


@app.get("/api/samples")
async def list_samples():
    p = Path("samples")
    if not p.exists():
        return {"samples": []}
    exts = {".mp4", ".avi", ".mov", ".mkv"}
    return {"samples": [f.name for f in sorted(p.iterdir()) if f.suffix.lower() in exts]}


@app.websocket("/ws/{job_id}")
async def run_ws(ws: WebSocket, job_id: str):
    await ws.accept()
    loop = asyncio.get_running_loop()

    try:
        raw = await asyncio.wait_for(ws.receive_text(), timeout=15.0)
        cfg = json.loads(raw)
    except Exception:
        await ws.close(code=1002)
        return

    source_type = cfg.get("source_type", "file")
    if source_type == "webcam":
        source = int(cfg.get("cam_index", 0))
    elif source_type == "demo":
        demo_name = cfg.get("demo_path", "")
        source = str(Path("samples") / demo_name)
    else:
        job = _jobs.get(job_id, {})
        source = job.get("source", "")
        if not source or not Path(str(source)).exists():
            await ws.send_json({"type": "error", "message": "Fayl topilmadi"})
            return

    queue: asyncio.Queue = asyncio.Queue(maxsize=4)
    start_t = time.time()

    def on_frame(vis, frame_idx, analyzed, alerts_total):
        h, w = vis.shape[:2]
        if w > 720:
            vis = cv2.resize(vis, (720, int(h * 720 / w)))
        _, buf = cv2.imencode(".jpg", vis, [cv2.IMWRITE_JPEG_QUALITY, 72])
        b64 = base64.b64encode(buf.tobytes()).decode()
        elapsed = time.time() - start_t
        fps = (frame_idx + 1) / max(elapsed, 1e-9)

        # Real-time per-person behavior
        live = []
        for det, state in analyzed:
            if state.suspicion_score >= 0.25:
                flags = []
                if state.is_crouching:       flags.append("Cho'qqayish")
                if state.is_hand_to_ground:  flags.append("Qo'l yerga")
                if state.is_loitering:       flags.append("Turib qolgan")
                if state.is_looking_around:  flags.append("Atrofga qaraydi")
                live.append({
                    "id": state.track_id,
                    "score": round(state.suspicion_score, 2),
                    "alert": state.alert_triggered,
                    "flags": flags,
                })
        live.sort(key=lambda x: -x["score"])

        msg = {
            "type": "frame",
            "frame": b64,
            "idx": frame_idx,
            "tracks": len(analyzed),
            "alerts": alerts_total,
            "fps": round(fps, 1),
            "live": live[:6],
        }
        fut = asyncio.run_coroutine_threadsafe(queue.put(msg), loop)
        try:
            fut.result(timeout=2.0)
        except Exception:
            pass

    async def run_pipeline():
        try:
            pipeline = Pipeline(_build_config(cfg))
            pipeline.alert_log = []
            Path("output").mkdir(exist_ok=True)
            out = f"output/result_{int(time.time())}.mp4"
            max_f = cfg.get("max_frames", 0)
            result = await loop.run_in_executor(
                None,
                lambda: pipeline.run(
                    source=source,
                    output_path=out,
                    on_frame=on_frame,
                    show_window=False,
                    max_frames=(None if not max_f else int(max_f)),
                ),
            )
            await queue.put({
                "type": "done",
                "frames": result["frames_processed"],
                "alerts_total": result["alerts_total"],
                "output_video": result.get("output_video", ""),
                "log_csv": result.get("log_csv", ""),
                "alert_log": pipeline.alert_log,
            })
        except Exception as exc:
            await queue.put({"type": "error", "message": str(exc)})

    task = asyncio.create_task(run_pipeline())

    try:
        while True:
            msg = await asyncio.wait_for(queue.get(), timeout=120.0)
            await ws.send_json(msg)
            if msg["type"] in ("done", "error"):
                break
    except (WebSocketDisconnect, asyncio.TimeoutError):
        task.cancel()
    except Exception:
        task.cancel()


@app.get("/api/download/{filename}")
async def download(filename: str):
    path = Path("output") / filename
    if path.exists():
        return FileResponse(str(path), filename=filename, media_type="video/mp4")
    raise HTTPException(404, "Not found")
