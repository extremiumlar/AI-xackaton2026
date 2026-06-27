# Tayyor Modellar — Integratsiya Qilinadigan

> Maqsad: Noldan o'rgatish o'rniga, mavjud pretrained modellarni birlashtirib, **bir necha kunda ishlovchi tizim** qurish.

---

## PIPELINE — qaysi model qaysi qadamda

```
[CCTV oqimi]
    |
    v
[1] YOLOv8 — person detection (kim?)
    |
    v
[2] ByteTrack — tracking (qayerga ketyapti?)
    |
    v
[3] YOLOv8-Pose — pose estimation (cho'qqaydimi? egildimi?)
    |
    v
[4] VideoMAE / SlowFast — action recognition (nima qildi?)
    |
    v
[5] AnomalyCLIP / Memory-AE — anomaly score (shubhalimi?)
    |
    v
[6] Rule engine — final qaror
    |
    v
"ZAKLADCHIK ALERT!"
```

---

## 1. Person Detection — YOLOv8 / YOLOv11 (Ultralytics)

**Eng oson va eng kuchli**. Hozir industry standart.

- **GitHub:** https://github.com/ultralytics/ultralytics
- **O'rnatish:** `pip install ultralytics`
- **Pretrained:** COCO da o'rgatilgan, "person" classni darhol topadi

```python
from ultralytics import YOLO
model = YOLO('yolov8n.pt')  # avtomatik yuklab oladi
results = model('video.mp4', classes=[0])  # 0 = person
```

**Modellar:**
- `yolov8n.pt` — 6 MB, eng tez (CPU da ham)
- `yolov8s.pt` — 22 MB, balanslangan
- `yolov8m.pt` — 52 MB, aniqroq
- `yolov8x.pt` — 136 MB, eng aniq

---

## 2. Pose Estimation — Cho'qqayish/Egilish aniqlash

**Bu zakladchik aniqlashda KRITIK** — chunki "yerga qo'l uzatish" pozasi asosiy belgi.

### YOLOv8-Pose
- **Manba:** Ultralytics (yuqoridagi paket)
- **17 ta keypoint** (COCO formatda) — yelka, tirsak, bilak, tizza, va h.k.
- **O'rnatish:** allaqachon `ultralytics` ichida

```python
model = YOLO('yolov8n-pose.pt')
results = model('cctv.mp4')
# har bir odam uchun 17 ta nuqta keladi
```

### MediaPipe Pose (Google)
- **URL:** https://developers.google.com/mediapipe
- **O'rnatish:** `pip install mediapipe`
- **33 ta keypoint** — yanada batafsil
- **CPU da real-time ishlaydi**

### RTMPose (MMPose)
- **URL:** https://github.com/open-mmlab/mmpose
- **Eng aniq** — papers with code da rekord

### ViTPose
- **HuggingFace:** https://huggingface.co/usyd-community/vitpose-base-simple
- **Transformer-based, eng yangi**

**Foydalanish:** keypointlar bo'yicha "crouch_angle" yoki "hand_to_ground_distance" hisoblash.

---

## 3. Multi-Object Tracking — bir odamni kuzatib borish

### ByteTrack
- **GitHub:** https://github.com/ifzhang/ByteTrack
- **Ultralytics ichiga integratsiya qilingan:**
```python
results = model.track(source='cctv.mp4', tracker='bytetrack.yaml')
```
- Har bir odamga `track_id` beradi — 30 sekund loitering aniqlash uchun ideal

### BoT-SORT
- **Ultralytics:** `tracker='botsort.yaml'`
- Re-ID bilan kuchaytirilgan — odam kameradan o'tib qaytsa ham tanaydi

### DeepSORT
- **GitHub:** https://github.com/nwojke/deep_sort
- Klassik, hali ham ishlatiladi

---

## 4. Action Recognition — Harakatni tanish

### VideoMAE v2 (HuggingFace)
- **Model:** https://huggingface.co/OpenGVLab/VideoMAEv2-Base
- **Kinetics-700 da pretrained** — 700 ta inson harakati
- **O'rnatish:**
```python
from transformers import VideoMAEForVideoClassification
model = VideoMAEForVideoClassification.from_pretrained(
    "MCG-NJU/videomae-base-finetuned-kinetics"
)
```

### SlowFast (Meta)
- **GitHub:** https://github.com/facebookresearch/SlowFast
- **AVA dataset uchun:** atomic actionlar (`crouch`, `pick up`, `bend`)
- Modellar zoo: https://github.com/facebookresearch/SlowFast/blob/main/MODEL_ZOO.md

### X3D
- **PyTorch Hub:** `torch.hub.load('facebookresearch/pytorchvideo', 'x3d_xs')`
- **Eng yengil** action classifier

### MMAction2 Model Zoo
- **GitHub:** https://github.com/open-mmlab/mmaction2
- 60+ pretrained model — TimeSformer, MViT, UniFormer va h.k.

### TimeSformer (HuggingFace)
- **Model:** https://huggingface.co/facebook/timesformer-base-finetuned-k400
- Transformer-based action recognition

---

## 5. Anomaly Detection (Surveillance specifik)

### AnomalyCLIP
- **GitHub:** https://github.com/zqhang/AnomalyCLIP
- **Zero-shot** anomaly — text prompt orqali ("a person hiding something")
- HuggingFace: https://huggingface.co/zhang0jhon/AnomalyCLIP

### VadCLIP
- **GitHub:** https://github.com/nwpu-zxr/VadCLIP
- Video anomaly detection — UCF-Crime da SOTA

### Real-Time Anomaly Detection (Sultani et al.)
- **GitHub:** https://github.com/WaqasSultani/AnomalyDetectionCVPR2018
- UCF-Crime asoschilarining rasmiy implementatsiyasi

### MGFN (Memory-augmented Multi-level Glance and Focus)
- **GitHub:** https://github.com/carolchenyx/MGFN
- ShanghaiTech va UCF-Crime da SOTA

### Pretrained checkpoints (HuggingFace search):
- https://huggingface.co/models?search=anomaly+detection
- https://huggingface.co/models?search=surveillance

---

## 6. End-to-End Surveillance Systems (tayyor freymworklar)

### Frigate NVR (eng tavsiya)
- **GitHub:** https://github.com/blakeblackshear/frigate
- **Open source NVR + AI** — Coral TPU bilan real-time
- Person detection, object tracking, motion detection darhol ishlaydi
- Home Assistant bilan integratsiya
- Custom modellarni qo'shish mumkin

### NVIDIA DeepStream + Metropolis
- **URL:** https://developer.nvidia.com/metropolis
- **Smart city / Safe city uchun maxsus**
- Tayyor pipelinelar: people counting, ROI monitoring, loitering detection
- Production-ready

### DeepCamera
- **GitHub:** https://github.com/SharpAI/DeepCamera
- Face recognition + person tracking

### CompreFace
- **GitHub:** https://github.com/exadel-inc/CompreFace
- Yuz tanish (qaytar jinoyatchilarni topish uchun)

### Viseron
- **GitHub:** https://github.com/roflcoopter/viseron
- NVR + multiple AI backends

---

## 7. Multimodal Video Understanding (eng yangi yondashuv)

### LLaVA-Video
- **HuggingFace:** https://huggingface.co/lmms-lab/LLaVA-Video-7B-Qwen2
- Videoga "odam shubhali harakat qilyaptimi?" deb savol berish mumkin

### InternVideo2
- **GitHub:** https://github.com/OpenGVLab/InternVideo
- Eng kuchli video foundation model

### Qwen2-VL / Qwen2.5-VL
- **HuggingFace:** https://huggingface.co/Qwen/Qwen2.5-VL-7B-Instruct
- Video frame'larini tahlil qiladi, chat orqali

### Google Gemini Video API
- Cloud-based, lekin pullik
- API orqali video tahlil

---

## TAVSIYA QILGAN MVP STACK

**Bu kombinatsiya 1-2 kunda ishlaydi:**

```python
# requirements.txt
ultralytics>=8.0.0       # YOLOv8 + ByteTrack + Pose
mediapipe>=0.10.0        # Backup pose estimator
transformers>=4.40.0     # VideoMAE
torch>=2.0.0
opencv-python>=4.8.0
numpy
```

```python
# zakladchik_detector.py — minimal MVP
from ultralytics import YOLO
import cv2

# 1. YOLOv8 — person + pose
detector = YOLO('yolov8n.pt')
poser = YOLO('yolov8n-pose.pt')

# 2. Track + classify per frame
cap = cv2.VideoCapture('cctv.mp4')

while cap.isOpened():
    ret, frame = cap.read()
    if not ret: break

    # Person tracking
    results = detector.track(frame, classes=[0], persist=True,
                              tracker='bytetrack.yaml')

    # Pose estimation
    poses = poser(frame)

    # Heuristika: agar hip-ankle distance kichik = cho'qqaygan
    for pose in poses[0].keypoints.xy:
        if len(pose) >= 17:
            hip_y = pose[11][1]    # left hip
            ankle_y = pose[15][1]  # left ankle
            if abs(hip_y - ankle_y) < 50:  # cho'qqaygan
                print(f"SHUBHALI: cho'qqayish aniqlandi!")

    # Display
    cv2.imshow('detection', results[0].plot())
    if cv2.waitKey(1) == ord('q'): break
```

**Bu kod 50 qatorda ishlovchi prototip beradi!**

---

## QO'LLANILADIGAN GITHUB REPOS (clone qilish uchun)

```bash
# 1. Asosiy YOLO + tracker
git clone https://github.com/ultralytics/ultralytics

# 2. Action recognition
git clone https://github.com/facebookresearch/SlowFast
git clone https://github.com/open-mmlab/mmaction2

# 3. Anomaly detection
git clone https://github.com/zqhang/AnomalyCLIP
git clone https://github.com/nwpu-zxr/VadCLIP

# 4. NVR sistema (production uchun)
git clone https://github.com/blakeblackshear/frigate

# 5. Loitering detection nazarlari
# (qidirish: "loitering detection github")
```

---

## PRIORITET — qaysidan boshlash

1. **BUGUN** — Ultralytics YOLOv8 + Pose (1 soat, code yuqorida)
2. **ERTAGA** — VideoMAE action classification qo'shish
3. **3-KUN** — AnomalyCLIP zero-shot anomaly
4. **HAFTA** — Hammasi birlashtirilgan pipeline + Streamlit UI
5. **2 HAFTA** — Custom dataset bilan fine-tuning
6. **OY** — Frigate NVR'ga integratsiya + production
