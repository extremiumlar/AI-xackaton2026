"""Asosiy pipeline — hammasini birlashtiruvchi."""

import os
import time
import csv
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Callable
import cv2
import yaml

from .detector import Detector
from .analyzer import BehaviorAnalyzer
from .visualize import draw_overlay, draw_hud


@dataclass
class PipelineConfig:
    detector: str = "yolov8n.pt"
    pose: str = "yolov8n-pose.pt"
    tracker: str = "bytetrack.yaml"
    device: str = "cpu"

    person_class_id: int = 0
    conf: float = 0.4
    iou: float = 0.5

    crouch_ratio_threshold: float = 0.65
    hand_to_ground_threshold: float = 0.85
    loiter_seconds: float = 15.0
    loiter_radius_px: float = 80.0
    look_around_window: int = 30
    look_around_threshold: int = 5

    weights: Optional[dict] = None
    alert_threshold: float = 0.55
    sustained_frames: int = 10

    resize_width: int = 960
    skip_frames: int = 0

    save_video: bool = True
    video_dir: str = "output/"
    log_dir: str = "logs/"
    alert_image_dir: str = "output/alerts/"

    draw_keypoints: bool = True
    draw_bbox: bool = True
    draw_track_id: bool = True
    draw_suspicion_score: bool = True

    @classmethod
    def from_yaml(cls, path: str) -> "PipelineConfig":
        with open(path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)

        return cls(
            detector=data["models"]["detector"],
            pose=data["models"]["pose"],
            tracker=data["models"]["tracker"],
            device=data["detection"]["device"],
            person_class_id=data["detection"]["person_class_id"],
            conf=data["detection"]["conf_threshold"],
            iou=data["detection"]["iou_threshold"],
            crouch_ratio_threshold=data["behavior"]["crouch_ratio_threshold"],
            hand_to_ground_threshold=data["behavior"]["hand_to_ground_threshold"],
            loiter_seconds=data["behavior"]["loiter_seconds"],
            loiter_radius_px=data["behavior"]["loiter_radius_px"],
            look_around_window=data["behavior"]["look_around_window"],
            look_around_threshold=data["behavior"]["look_around_threshold"],
            weights=data["suspicion"]["weights"],
            alert_threshold=data["suspicion"]["alert_threshold"],
            sustained_frames=data["suspicion"]["sustained_frames"],
            resize_width=data["video"]["resize_width"],
            skip_frames=data["video"]["skip_frames"],
            save_video=data["output"]["save_video"],
            video_dir=data["output"]["video_dir"],
            log_dir=data["output"]["log_dir"],
            alert_image_dir=data["output"]["alert_image_dir"],
            draw_keypoints=data["output"]["draw_keypoints"],
            draw_bbox=data["output"]["draw_bbox"],
            draw_track_id=data["output"]["draw_track_id"],
            draw_suspicion_score=data["output"]["draw_suspicion_score"],
        )


class Pipeline:
    def __init__(self, config: PipelineConfig, detector: Optional[Detector] = None):
        """Tashqaridan oldindan yuklangan Detector berilishi mumkin
        (Streamlit kabi UI'larda model qayta yuklanmasligi uchun)."""
        self.config = config
        self.detector = detector if detector is not None else Detector(
            det_model=config.detector,
            pose_model=config.pose,
            tracker=config.tracker,
            device=config.device,
            conf=config.conf,
            iou=config.iou,
            person_class_id=config.person_class_id,
        )
        self.analyzer = None  # fps bilan birga keyin yaratiladi
        self.alert_log = []

    @staticmethod
    def _open_writer(path: str, fps: float, w: int, h: int):
        """VideoWriter ochish — codec'lar fallback bilan.

        Qaytaradi: (writer | None, yangilangan_path).
        """
        candidates = [("mp4v", path)]
        # .mp4 → .avi fallback (XVID Windows'da ishonchli)
        if path.lower().endswith(".mp4"):
            candidates.append(("XVID", path[:-4] + ".avi"))
        candidates.append(("MJPG", path.rsplit(".", 1)[0] + ".avi"))

        for codec, p in candidates:
            fourcc = cv2.VideoWriter_fourcc(*codec)
            w_obj = cv2.VideoWriter(p, fourcc, fps, (w, h))
            if w_obj.isOpened():
                if p != path:
                    print(f"[Pipeline] mp4v ishlamadi, {codec} bilan saqlanadi: {p}")
                return w_obj, p
            w_obj.release()
        print(f"[Pipeline] Hech qaysi codec ishlamadi — video saqlanmaydi: {path}")
        return None, path

    def _init_analyzer(self, fps: float):
        self.analyzer = BehaviorAnalyzer(
            fps=fps,
            crouch_ratio_threshold=self.config.crouch_ratio_threshold,
            hand_to_ground_threshold=self.config.hand_to_ground_threshold,
            loiter_seconds=self.config.loiter_seconds,
            loiter_radius_px=self.config.loiter_radius_px,
            look_around_window=self.config.look_around_window,
            look_around_threshold=self.config.look_around_threshold,
            weights=self.config.weights,
            alert_threshold=self.config.alert_threshold,
            sustained_frames=self.config.sustained_frames,
        )

    def run(self,
            source,
            output_path: Optional[str] = None,
            on_frame: Optional[Callable] = None,
            show_window: bool = False,
            max_frames: Optional[int] = None) -> dict:
        """source: video fayl yo'li yoki 0 (webcam)."""

        # Raqamli string (masalan "0") int ga aylantiriladi —
        # cv2.VideoCapture("0") Windows'da ishlamaydi.
        if isinstance(source, str) and source.isdigit():
            source = int(source)

        cap = cv2.VideoCapture(source)
        if not cap.isOpened():
            raise RuntimeError(f"Video manbasi ochilmadi: {source}")

        src_fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        src_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        src_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        # Resize hisoblash
        if self.config.resize_width and self.config.resize_width > 0 and src_w > 0:
            scale = self.config.resize_width / src_w
            out_w = self.config.resize_width
            out_h = int(src_h * scale)
        else:
            out_w, out_h = src_w, src_h

        self._init_analyzer(src_fps)

        # Output writer — codec'lar tartib bo'yicha sinab ko'riladi
        writer = None
        if output_path and self.config.save_video:
            Path(output_path).parent.mkdir(parents=True, exist_ok=True)
            writer, output_path = self._open_writer(output_path, src_fps, out_w, out_h)

        # Alert papkasi
        alert_dir = Path(self.config.alert_image_dir)
        alert_dir.mkdir(parents=True, exist_ok=True)

        # Log fayl
        log_dir = Path(self.config.log_dir)
        log_dir.mkdir(parents=True, exist_ok=True)
        log_path = log_dir / f"alerts_{int(time.time())}.csv"
        log_file = open(log_path, "w", newline="", encoding="utf-8")
        log_writer = csv.writer(log_file)
        log_writer.writerow(["frame_idx", "timestamp_s", "track_id", "suspicion_score",
                             "crouch", "hand_to_ground", "loiter", "look_around"])

        frame_idx = 0
        processed = 0
        alerts_total = 0
        already_alerted_tracks = set()
        start_t = time.time()

        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                if self.config.skip_frames > 0 and frame_idx % (self.config.skip_frames + 1) != 0:
                    frame_idx += 1
                    continue

                if (out_w, out_h) != (src_w, src_h):
                    frame = cv2.resize(frame, (out_w, out_h))

                detections = self.detector.process_frame(frame, frame_idx)
                analyzed = self.analyzer.analyze(detections, frame_idx)

                # Alert hisoblash + log
                for det, state in analyzed:
                    if state.alert_triggered and state.track_id not in already_alerted_tracks:
                        already_alerted_tracks.add(state.track_id)
                        alerts_total += 1
                        ts = frame_idx / src_fps
                        log_writer.writerow([
                            frame_idx, f"{ts:.2f}", state.track_id,
                            f"{state.suspicion_score:.3f}",
                            int(state.is_crouching),
                            int(state.is_hand_to_ground),
                            int(state.is_loitering),
                            int(state.is_looking_around),
                        ])
                        log_file.flush()  # crash bo'lsa ham yozilsin
                        flags = []
                        if state.is_crouching:      flags.append("Cho'qqayish")
                        if state.is_hand_to_ground:  flags.append("Yerga qo'l uzatish")
                        if state.is_loitering:       flags.append("Bir joyda turib qolish")
                        if state.is_looking_around:  flags.append("Atrofga qarab turish")
                        self.alert_log.append({
                            "frame_idx": frame_idx,
                            "timestamp_s": round(ts, 2),
                            "track_id": state.track_id,
                            "score": round(state.suspicion_score, 3),
                            "flags": flags,
                        })
                        snap = draw_overlay(frame, [(det, state)],
                                            alert_threshold=self.config.alert_threshold)
                        cv2.imwrite(str(alert_dir / f"alert_{frame_idx}_{state.track_id}.jpg"), snap)

                # Yo'qolgan track ID'larni xotiradan tozalash (memory leak fix).
                # analyzer.states allaqachon stale track'larni o'chirib qo'ygan.
                if frame_idx % 300 == 0 and self.analyzer is not None:
                    live = set(self.analyzer.states.keys())
                    already_alerted_tracks &= live

                # Vizualizatsiya
                vis = draw_overlay(
                    frame, analyzed,
                    alert_threshold=self.config.alert_threshold,
                    draw_keypoints=self.config.draw_keypoints,
                    draw_bbox=self.config.draw_bbox,
                    draw_track_id=self.config.draw_track_id,
                    draw_score=self.config.draw_suspicion_score,
                )
                elapsed = time.time() - start_t
                live_fps = (processed + 1) / max(elapsed, 1e-6)
                vis = draw_hud(vis, frame_idx, live_fps,
                               active_tracks=len(analyzed),
                               alerts=alerts_total)

                if writer is not None:
                    writer.write(vis)

                if on_frame is not None:
                    on_frame(vis, frame_idx, analyzed, alerts_total)

                if show_window:
                    cv2.imshow("Zakladchik Detector", vis)
                    if cv2.waitKey(1) & 0xFF == ord("q"):
                        break

                frame_idx += 1
                processed += 1
                if max_frames is not None and processed >= max_frames:
                    break

        finally:
            cap.release()
            if writer is not None:
                writer.release()
            log_file.close()
            if show_window:
                cv2.destroyAllWindows()

        return {
            "frames_processed": processed,
            "alerts_total": alerts_total,
            "log_csv": str(log_path),
            "output_video": output_path,
            "alert_image_dir": str(alert_dir),
        }
