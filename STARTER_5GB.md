# 5 GB Starter Pack — Tezkor MVP

> Maqsad: 5 GB datasetlar bilan **ishlovchi prototip** model qurish.
> 3 ta asosiy komponentni qoplaydi: **Person Detection + Action Recognition + Anomaly Detection**

## Tanlangan datasetlar (~4.95 GB)

| # | Dataset | Hajmi | Maqsad |
|---|---------|-------|--------|
| 1 | **COCO val2017** | 1 GB | Person detection (YOLO base) |
| 2 | **COCO annotations** | 250 MB | Bbox annotatsiyalar |
| 3 | **HMDB-51** | 2 GB | Inson harakatlari — `pick`, `crawl`, `sit` |
| 4 | **CUHK Avenue** | 1.5 GB | Outdoor surveillance anomaly |
| 5 | **UCSD Ped1+Ped2** | 200 MB | Pedestrian anomaly benchmark |
| **JAMI** | | **~4.95 GB** | |

---

## Nima uchun aynan shu tanlandi?

### Pipeline qismlari uchun:

```
CCTV video
    |
    v
[1] Person Detection (COCO + YOLOv8)
    |
    v
[2] Multi-frame tracking (ByteTrack)
    |
    v
[3] Action Recognition (HMDB-51 + SlowFast)
    |
    v
[4] Anomaly Score (Avenue + UCSD)
    |
    v
Alert: "Shubhali xatti-harakat"
```

### Har bir dataset qaysi qismni o'rgatadi:

- **COCO** → YOLOv8 ni "person" classida fine-tune qilish
- **HMDB-51** → "pick" (yashirish), "crawl" (egilish), "stand" harakatlarini tanish
- **CUHK Avenue** → outdoor sahna anomaly score chiqarish
- **UCSD** → tez tekshirish uchun standart benchmark

---

## Tashlab ketilgan datasetlar (vaqt va joy yo'qligi tufayli)

- ~~UCF101 (6.5 GB)~~ — HMDB-51 yetarli
- ~~ShanghaiTech (3 GB)~~ — Avenue bilan bir xil domain
- ~~CrowdHuman (1.2 GB)~~ — COCO yetarli boshlanish uchun
- ~~Kinetics-400~~ — pretrained weights ishlatamiz

---

## MVP arxitektura rejasi

| Komponent | Model | Pretrained? |
|---|---|---|
| Person detector | **YOLOv8n** | Ha (COCO), Avenue da fine-tune |
| Tracker | **ByteTrack** | Hozirgi modelni qo'llaydi |
| Action classifier | **SlowFast R50** | HMDB-51 da fine-tune |
| Anomaly scorer | **Memory-Augmented AE** | Avenue + UCSD da nol noldan |

---

## Disk strukturasi

```
D:\Project\narko-biznes\
├── datasets\
│   ├── coco_val\          ~1.25 GB
│   ├── hmdb51\            ~2 GB
│   ├── cuhk_avenue\       ~1.5 GB
│   └── ucsd_anomaly\      ~200 MB
├── scripts\
│   └── download_5gb.ps1
└── STARTER_5GB.md
```

---

## Vaqt taxminiy

- Yuklash: **~30-45 daqiqa** (100 Mbps internetda)
- Extract: **~10 daqiqa**
- Birinchi YOLOv8 inference: **~5 daqiqa** (pretrained)
- Birinchi fine-tune (1 epoch): **~30 daqiqa** (GPU bilan)

**Jami 1.5-2 soatda ishlovchi prototip!**
