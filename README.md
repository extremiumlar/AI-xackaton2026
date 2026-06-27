# Zakladchik Detector

> Xavfsiz Shahar tizimi uchun sun'iy intellekt asosida shubhali xatti-harakatlarni avtomatik aniqlash.

## Nima qiladi?

CCTV videosi yoki webcam oqimidan **yashirin holda narsa qoldirayotgan** odamlarni aniqlaydi:

- 🔻 **Crouch** — cho'qqayish
- ✋ **Hand-to-ground** — yerga qo'l uzatish
- ⏱️ **Loiter** — sababsiz bir joyda turish
- 👀 **Look-around** — atrofga tez-tez qarash

Har bir odamga **suspicion score (0–1)** beriladi. Threshold ustida bo'lsa — **ALERT**.

---

## Arxitektura

```
[Video oqimi]
    |
    v
YOLOv8 (person detection)
    |
    v
ByteTrack (multi-object tracking) -- har odamga track_id
    |
    v
YOLOv8-Pose (17 keypoint)
    |
    v
Behavior Analyzer:
    crouch + hand_to_ground + loiter + look_around
    |
    v
Suspicion Score (weighted sum)
    |
    v
[Alert] -- log CSV + alert snapshot + draw on video
```

---

## O'rnatish

### 1. Python muhitini tayyorlash

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2. Modellar avto-yuklanadi

Birinchi ishga tushishda Ultralytics quyidagilarni yuklaydi:
- `yolov8n.pt` (~6 MB)
- `yolov8n-pose.pt` (~7 MB)

---

## Ishga tushirish

### A) Streamlit UI (eng oson)

```powershell
streamlit run app.py
```

Brauzerda `http://localhost:8501` ochiladi.

- Video fayl yuklash
- Webcam ulash
- Sozlamalarni real-time o'zgartirish
- Alert tarixini ko'rish

### B) Komanda qatori

```powershell
# Video fayl
python cli.py --source samples\test.mp4

# Webcam
python cli.py --source 0 --show

# To'liq parametrlar
python cli.py --source video.mp4 --config config.yaml --output result.mp4 --device cuda:0
```

### C) Python kodida

```python
from src.pipeline import Pipeline, PipelineConfig

config = PipelineConfig.from_yaml("config.yaml")
pipeline = Pipeline(config)
result = pipeline.run(source="video.mp4", output_path="out.mp4")
print(result)
```

---

## Loyiha tuzilishi

```
narko-biznes/
├── src/
│   ├── __init__.py
│   ├── detector.py        # YOLO + Pose + ByteTrack
│   ├── analyzer.py        # Xatti-harakat tahlili
│   ├── visualize.py       # Vizualizatsiya
│   └── pipeline.py        # Asosiy orchestrator
├── app.py                  # Streamlit UI
├── cli.py                  # Terminal interface
├── config.yaml             # Sozlamalar
├── requirements.txt
├── output/                 # Natija video va alert rasmlar
├── logs/                   # CSV log fayllari
└── samples/                # Test videolar
```

---

## Sozlamalar (config.yaml)

Asosiy parametrlar:

| Parametr | Default | Nima |
|---|---|---|
| `conf_threshold` | 0.4 | Detection confidence |
| `crouch_ratio_threshold` | 0.65 | Cho'qqayish chegarasi |
| `hand_to_ground_threshold` | 0.85 | Qo'l yerga uzatish chegarasi |
| `loiter_seconds` | 15 | Loiter uchun sekund |
| `alert_threshold` | 0.55 | Alert qachon |
| `sustained_frames` | 10 | Shuncha freym davom etishi kerak |

Vaznlar (har bir belgi qancha hissa qo'shadi):

| Belgi | Default vazn |
|---|---|
| Hand-to-ground | 0.40 (eng muhim) |
| Crouch | 0.30 |
| Loiter | 0.20 |
| Look-around | 0.10 |

---

## Natija fayllari

Har bir ishga tushirishdan keyin:

- `output/result_{timestamp}.mp4` — annotated video
- `output/alerts/alert_{frame}_{track_id}.jpg` — alert kadrlari
- `logs/alerts_{timestamp}.csv` — alert log

CSV ustunlari:
```
frame_idx, timestamp_s, track_id, suspicion_score,
crouch, hand_to_ground, loiter, look_around
```

---

## Performance

| Model | CPU FPS | GPU FPS (3060) |
|---|---|---|
| yolov8n | 8-12 | 60-80 |
| yolov8s | 4-7 | 40-60 |
| yolov8m | 2-3 | 25-35 |

CPU da real-time uchun **yolov8n + skip_frames=1** tavsiya etiladi.

---

## Keyingi qadamlar

1. **Custom dataset** — IIV bilan rasmiy hamkorlik orqali real CCTV bilan fine-tune
2. **Face recognition** — recidivistlar bazasi bilan tekshirish (CompreFace)
3. **Map integration** — alert qaysi kameradan kelganini xaritada ko'rsatish
4. **Push notification** — Telegram/Email orqali xavfsizlik xizmatiga
5. **NVR integration** — Frigate yoki DeepStream'ga ulanish
6. **Multi-camera** — bir necha kamerani parallel ishlash

---

## Litsenziya va etika

- Loyiha **faqat huquq-tartibot organlari** uchun mo'ljallangan
- Yuzlar real foydalanishda blur qilinishi kerak (GDPR-talab)
- Dataset to'plamida shaxsiy ma'lumotlarni himoya qilish

---

## Muammolar

**"Modellar yuklanmadi"** — internet bo'lmasa, qo'lda yuklang:
```powershell
yolo download model=yolov8n.pt
yolo download model=yolov8n-pose.pt
```

**"CUDA out of memory"** — `config.yaml` da `device: cpu` ga o'zgartiring yoki `yolov8n` ishlating.

**"Webcam ochilmadi"** — boshqa ilovalarda yopilganmi tekshiring.
