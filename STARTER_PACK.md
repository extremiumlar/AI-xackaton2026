# 20 GB Starter Pack — Zakladchik Detection

> Bu birinchi prototip uchun. Hammasi ochiq manba, to'g'ridan-to'g'ri yuklab olinadigan.

## Tarkib (~18 GB jami)

| # | Dataset | Hajmi | Format | Maqsad |
|---|---------|-------|--------|--------|
| 1 | **UCF101** | 6.5 GB | RAR | Action recognition — 101 ta inson harakati |
| 2 | **HMDB-51** | 2 GB | RAR | Action — `pick`, `crawl`, `walk` |
| 3 | **UCSD Anomaly Ped1+Ped2** | 200 MB | TAR.GZ | Klassik anomaly detection benchmark |
| 4 | **COCO val2017** | 1 GB | ZIP | Person detection — YOLO base |
| 5 | **COCO annotations** | 250 MB | ZIP | Bbox annotations |
| 6 | **CUHK Avenue** | 1.5 GB | ZIP | Outdoor anomaly (yugurish, narsa tashlash) |
| 7 | **ShanghaiTech Campus** | 3 GB | ZIP | Kampus anomaly |
| 8 | **VisDrone (subset)** | 2 GB | ZIP | Yuqoridan kamera ko'rinishi — surveillance |
| 9 | **CrowdHuman val** | 1.2 GB | ZIP | Olomonda odam aniqlash |
| 10 | **Kinetics-400 mini sample** | 500 MB | MP4 | Action backbone sample |

**Jami:** ~18 GB

---

## Har bir dataset haqida

### 1. UCF101 (6.5 GB)
- **URL:** https://www.crcv.ucf.edu/data/UCF101/UCF101.rar
- **Annotations:** https://www.crcv.ucf.edu/data/UCF101/UCF101TrainTestSplits-RecognitionTask.zip
- **Foydali klasslari:** `PickUp`, `WalkingWithDog`, `Punch`, `Handstand`
- **Litsenziya:** Research only

### 2. HMDB-51 (2 GB)
- **URL:** http://serre-lab.clps.brown.edu/wp-content/uploads/2013/10/hmdb51_org.rar
- **Splits:** http://serre-lab.clps.brown.edu/wp-content/uploads/2013/10/test_train_splits.rar
- **Foydali klasslari:** `pick`, `crawl`, `sit`, `stand`, `wave`

### 3. UCSD Anomaly Detection (200 MB)
- **URL:** http://www.svcl.ucsd.edu/projects/anomaly/UCSD_Anomaly_Dataset.tar.gz
- **Mahalliy benchmark — eng tez sinov uchun**

### 4-5. COCO val2017 (1.3 GB)
- **Images:** http://images.cocodataset.org/zips/val2017.zip
- **Annotations:** http://images.cocodataset.org/annotations/annotations_trainval2017.zip
- **YOLO modelni person classida sinab ko'rish uchun**

### 6. CUHK Avenue (1.5 GB)
- **URL:** http://www.cse.cuhk.edu.hk/leojia/projects/detectabnormal/Avenue_Dataset.zip
- **Outdoor anomaly — eng yaqin yondashuv**

### 7. ShanghaiTech Campus (3 GB)
- **GitHub:** https://github.com/desenzhou/ShanghaiTechDataset
- **Bevosita Drive link:** sahifada
- **Universitet kampusida 13 sahna anomaliya**

### 8. VisDrone (2 GB subset)
- **URL:** https://github.com/VisDrone/VisDrone-Dataset
- **Dron/yuqori kamera ko'rinishi — surveillance simulation**

### 9. CrowdHuman (1.2 GB val set)
- **URL:** https://www.crowdhuman.org/download.html
- **Registratsiya kerak (bepul, email orqali)**
- **Olomon ichida odam topish**

### 10. Kinetics-400 Mini (500 MB)
- **Repo:** https://github.com/cvdfoundation/kinetics-dataset
- **Skript orqali small subset olish mumkin**

---

## Yuklab olish — 1 ta komanda bilan

`scripts/download_starter.ps1` skriptini ishga tushiring (pastda yaratiladi).

```powershell
cd D:\Project\narko-biznes
.\scripts\download_starter.ps1
```

---

## Yuklab olingandan keyin nima qilamiz

1. **Yo'naltirilgan sinov:** YOLOv8 + UCF-Crime/UCSD'da anomaly score chiqarish
2. **Action classifier:** UCF101 + HMDB-51 da SlowFast yoki VideoMAE fine-tune
3. **Person tracker:** ByteTrack yoki BoT-SORT — CrowdHuman da
4. **Pipeline:** Detection → Tracking → Action classification → Anomaly score

---

## Disk strukturasi

```
D:\Project\narko-biznes\
├── datasets\
│   ├── ucf101\
│   ├── hmdb51\
│   ├── ucsd_anomaly\
│   ├── coco_val\
│   ├── cuhk_avenue\
│   ├── shanghaitech\
│   ├── visdrone\
│   ├── crowdhuman\
│   └── kinetics_mini\
├── scripts\
│   └── download_starter.ps1
├── DATASETS.md
└── STARTER_PACK.md
```
