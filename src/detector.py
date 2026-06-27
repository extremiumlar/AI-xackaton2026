"""YOLO + Pose + ByteTrack ni o'rab oluvchi modul."""

from dataclasses import dataclass, field
from typing import Optional
import numpy as np
from ultralytics import YOLO


COCO_KEYPOINTS = [
    "nose", "left_eye", "right_eye", "left_ear", "right_ear",
    "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
    "left_wrist", "right_wrist", "left_hip", "right_hip",
    "left_knee", "right_knee", "left_ankle", "right_ankle",
]
KP = {name: i for i, name in enumerate(COCO_KEYPOINTS)}


@dataclass
class PersonDetection:
    track_id: int
    bbox: tuple             # (x1, y1, x2, y2)
    confidence: float
    keypoints: Optional[np.ndarray] = None   # shape (17, 3) -> x, y, conf
    frame_idx: int = 0

    @property
    def center(self) -> tuple:
        x1, y1, x2, y2 = self.bbox
        return ((x1 + x2) / 2, (y1 + y2) / 2)

    @property
    def height(self) -> float:
        return self.bbox[3] - self.bbox[1]

    @property
    def width(self) -> float:
        return self.bbox[2] - self.bbox[0]

    def kp(self, name: str) -> Optional[tuple]:
        if self.keypoints is None:
            return None
        idx = KP[name]
        x, y, c = self.keypoints[idx]
        if c < 0.3:
            return None
        return (float(x), float(y))


class Detector:
    def __init__(self, det_model: str = "yolov8n.pt",
                 pose_model: str = "yolov8n-pose.pt",
                 tracker: str = "bytetrack.yaml",
                 device: str = "cpu",
                 conf: float = 0.4,
                 iou: float = 0.5,
                 person_class_id: int = 0):
        self.detector = YOLO(det_model)
        self.poser = YOLO(pose_model)
        self.tracker = tracker
        self.device = device
        self.conf = conf
        self.iou = iou
        self.person_class_id = person_class_id

    def process_frame(self, frame: np.ndarray, frame_idx: int = 0) -> list:
        """Bitta freymdan barcha odamlarni topadi, kuzatadi va pose chiqaradi."""

        track_results = self.detector.track(
            frame,
            persist=True,
            classes=[self.person_class_id],
            conf=self.conf,
            iou=self.iou,
            tracker=self.tracker,
            device=self.device,
            verbose=False,
        )

        if not track_results or track_results[0].boxes is None:
            return []

        boxes = track_results[0].boxes
        if boxes.id is None:
            return []

        track_ids = boxes.id.cpu().numpy().astype(int)
        xyxys = boxes.xyxy.cpu().numpy()
        confs = boxes.conf.cpu().numpy()

        # Pose estimation alohida chaqiriladi (track yo'q, lekin keypoint kerak)
        pose_results = self.poser(frame, conf=self.conf, device=self.device, verbose=False)
        pose_kps = None
        pose_bboxes = None
        if pose_results and pose_results[0].keypoints is not None:
            pose_kps = pose_results[0].keypoints.data.cpu().numpy()  # (N, 17, 3)
            if pose_results[0].boxes is not None:
                pose_bboxes = pose_results[0].boxes.xyxy.cpu().numpy()

        detections = []
        for i, (tid, bbox, conf) in enumerate(zip(track_ids, xyxys, confs)):
            kps = self._match_pose(bbox, pose_kps, pose_bboxes)
            detections.append(PersonDetection(
                track_id=int(tid),
                bbox=tuple(bbox.tolist()),
                confidence=float(conf),
                keypoints=kps,
                frame_idx=frame_idx,
            ))
        return detections

    @staticmethod
    def _match_pose(bbox: np.ndarray,
                    pose_kps: Optional[np.ndarray],
                    pose_bboxes: Optional[np.ndarray]) -> Optional[np.ndarray]:
        """Pose modelining natijasidan eng yaqin bbox bilan mos keluvchi keypointsni topadi."""
        if pose_kps is None or pose_bboxes is None or len(pose_kps) == 0:
            return None

        bx = (bbox[0] + bbox[2]) / 2
        by = (bbox[1] + bbox[3]) / 2

        best_idx = -1
        best_dist = float("inf")
        for i, pb in enumerate(pose_bboxes):
            cx = (pb[0] + pb[2]) / 2
            cy = (pb[1] + pb[3]) / 2
            d = (cx - bx) ** 2 + (cy - by) ** 2
            if d < best_dist:
                best_dist = d
                best_idx = i

        if best_idx < 0:
            return None

        # Faqat yaqin bo'lsa qabul qilamiz
        bbox_w = bbox[2] - bbox[0]
        if best_dist > (bbox_w ** 2):
            return None

        return pose_kps[best_idx]
