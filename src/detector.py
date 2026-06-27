"""YOLO-Pose + ByteTrack ni o'rab oluvchi modul.

Eslatma: oldingi versiyada har freymda ikkita YOLO modeli (detector + pose)
alohida chaqirilardi va ularning bbox'lari markaz masofa orqali
moslashtirilardi — bu 2x sekin va olomonda noto'g'ri keypoint
biriktirardi. Endi faqat pose modeli ishlatiladi (u o'zi person'ni
track qiladi va keypointlarni qaytaradi).
"""

from dataclasses import dataclass
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
        # det_model endi backward-compatibility uchun saqlanadi, lekin
        # ishlatilmaydi — pose modeli o'zi person detect + track qiladi.
        if det_model and det_model != pose_model and "pose" not in det_model:
            print(f"[Detector] Eslatma: '{det_model}' o'tkazib yuborildi, "
                  f"faqat pose modeli ishlatiladi: {pose_model}")

        try:
            self.poser = YOLO(pose_model)
        except Exception as e:
            raise RuntimeError(
                f"Pose modelini yuklab bo'lmadi: {pose_model}\n"
                f"Sabab: {e}\n"
                f"Yechim: internetga ulaning yoki .pt faylini qo'lda yuklab, "
                f"loyiha papkasiga qo'ying."
            ) from e

        self.tracker = tracker
        self.device = device
        self.conf = conf
        self.iou = iou
        self.person_class_id = person_class_id

    def process_frame(self, frame: np.ndarray, frame_idx: int = 0) -> list:
        """Bitta freymdan barcha odamlarni topadi, kuzatadi va pose chiqaradi.

        Pose modeli bbox + track_id + 17 keypointni bitta inference'da beradi.
        """
        results = self.poser.track(
            frame,
            persist=True,
            classes=[self.person_class_id],
            conf=self.conf,
            iou=self.iou,
            tracker=self.tracker,
            device=self.device,
            verbose=False,
        )

        if not results:
            return []
        r = results[0]
        if r.boxes is None or r.boxes.id is None:
            return []

        track_ids = r.boxes.id.cpu().numpy().astype(int)
        xyxys = r.boxes.xyxy.cpu().numpy()
        confs = r.boxes.conf.cpu().numpy()

        kps_data = None
        if r.keypoints is not None and r.keypoints.data is not None \
                and len(r.keypoints.data):
            kps_data = r.keypoints.data.cpu().numpy()   # (N, 17, 3)

        detections = []
        for i, (tid, bbox, cf) in enumerate(zip(track_ids, xyxys, confs)):
            kps = kps_data[i] if (kps_data is not None and i < len(kps_data)) else None
            detections.append(PersonDetection(
                track_id=int(tid),
                bbox=tuple(bbox.tolist()),
                confidence=float(cf),
                keypoints=kps,
                frame_idx=frame_idx,
            ))
        return detections
