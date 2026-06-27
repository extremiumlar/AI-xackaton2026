# Zakladchik Detection — Open Source Datasetlar

> **Maqsad:** "Xavfsiz Shahar" CCTV uchun zakladchiklarni avtomatik aniqlash modelini o'rgatish.
> **Strategiya:** To'g'ridan-to'g'ri "zakladchik" dataseti yo'q, shuning uchun yondosh sohalardan (anomaly detection, action recognition, person detection) foydalanib **transfer learning** + **fine-tuning** qilamiz.

---

## 1-DARAJA — Surveillance Anomaly Detection (eng muhim)

### 1.1 UCF-Crime Dataset
- **Manba:** University of Central Florida (CRCV)
- **URL:** https://www.crcv.ucf.edu/projects/real-world/
- **Hajmi:** 128 soat video, 1900 ta klip, 13 ta anomaliya klassi
- **Nimasi foydali:**
  - "Stealing", "Shoplifting", "Burglary", "Vandalism" klasslari — yashirin harakatlar
  - Real CCTV sifatida tortilgan
  - Weakly-supervised (video-level label)
- **Yuklab olish:** Dropbox link CRCV sahifasida
- **Format:** MP4, ~110 GB

### 1.2 ShanghaiTech Campus Dataset
- **URL:** https://svip-lab.github.io/dataset/campus_dataset.html
- **Hajmi:** 437 video, 13 sahna
- **Nimasi foydali:** Universitet kampusida anomal harakatlar (yugurish, velosiped, jangari)
- **Yuklab olish:** Google Drive / Baidu Pan

### 1.3 CUHK Avenue Dataset
- **URL:** http://www.cse.cuhk.edu.hk/leojia/projects/detectabnormal/dataset.html
- **Hajmi:** 16 ta train + 21 ta test video
- **Nimasi foydali:** Outdoor anomaly (yugurish, narsa tashlash, noto'g'ri yo'nalish)

### 1.4 UCSD Pedestrian Anomaly (Ped1, Ped2)
- **URL:** http://www.svcl.ucsd.edu/projects/anomaly/dataset.html
- **Nimasi foydali:** Piyodalar yo'lagidagi anomaliyalar

### 1.5 Street Scene Dataset (MERL)
- **URL:** https://www.merl.com/research/highlights/video-anomaly-detection
- **Nimasi foydali:** Ko'cha sahnasidagi 205 ta anomaliya turi

---

## 2-DARAJA — Action Recognition (xatti-harakat aniqlash)

### 2.1 AVA (Atomic Visual Actions) — Google
- **URL:** https://research.google.com/ava/
- **Hajmi:** 437 video, 1.62M action label
- **Eng muhim klasslari (zakladchik uchun):**
  - `bend/bow (at the waist)`
  - `crouch/kneel`
  - `pick up`
  - `put down`
  - `touch (an object)`
  - `look at phone`
  - `carry/hold (an object)`
- **Yuklab olish:** Google Cloud, annotatsiya CSV alohida

### 2.2 Kinetics-700 — DeepMind
- **URL:** https://github.com/cvdfoundation/kinetics-dataset
- **Hajmi:** 700 ta action, 650K+ klip
- **Nimasi foydali:** Pretraining uchun ideal backbone (SlowFast, MViT, VideoMAE)
- **Yuklab olish skripti:** repo'da `download.sh` mavjud

### 2.3 HMDB-51
- **URL:** https://serre-lab.clps.brown.edu/resource/hmdb-a-large-human-motion-database/
- **Hajmi:** 7000 klip, 51 klass
- **Foydali klasslari:** `pick`, `walk`, `run`, `crawl`

### 2.4 UCF101
- **URL:** https://www.crcv.ucf.edu/data/UCF101.php
- **Hajmi:** 13K klip, 101 klass

### 2.5 Charades
- **URL:** https://prior.allenai.org/projects/charades
- **Nimasi foydali:** Indoor mundane actions — putting/taking objects

### 2.6 Something-Something V2
- **URL:** https://www.qualcomm.com/developer/software/something-something-v-2-dataset
- **Hajmi:** 220K klip
- **Nimasi foydali:** Object interaction (qo'l + narsa) — "putting something behind", "hiding something"

---

## 3-DARAJA — Person Detection / Tracking (asosiy backbone)

### 3.1 COCO Dataset
- **URL:** https://cocodataset.org/
- **Foydali:** YOLO/Detectron2 ni pretrain qilish uchun

### 3.2 CrowdHuman
- **URL:** https://www.crowdhuman.org/
- **Hajmi:** 24K image, 470K person bbox
- **Nimasi foydali:** Olomon sharoitida ham odam aniqlash

### 3.3 MOT17 / MOT20 (Multi-Object Tracking)
- **URL:** https://motchallenge.net/
- **Nimasi foydali:** Bir odamni bir necha freym davomida kuzatib borish (track_id)

### 3.4 PRW (Person Re-identification in the Wild)
- **URL:** http://www.liangzheng.com.cn/Project/project_prw.html
- **Nimasi foydali:** Bitta odamni har xil kameralardan tanish

---

## 4-DARAJA — Surveillance / CCTV Specific

### 4.1 VIRAT Video Dataset
- **URL:** https://viratdata.org/
- **Hajmi:** 8.5 soat HD outdoor surveillance
- **Foydali activitylar:** `person_enters_vehicle`, `person_carries_heavy_object`, `person_picks_up_object`

### 4.2 MEVA (Multiview Extended Video with Activities)
- **URL:** https://mevadata.org/
- **Hajmi:** 9300+ soat, ko'p kameralı
- **Nimasi foydali:** Real surveillance, ko'p ракurs, KW18 activity annotations

### 4.3 DukeMTMC (re-id qismi mavjud)
- **URL:** archive — https://exposing.ai/duke_mtmc/ (etika sababli o'chirilgan, lekin mirror mavjud)

### 4.4 PETS (Performance Evaluation of Tracking & Surveillance)
- **URL:** http://www.cvg.reading.ac.uk/PETS2009/
- **Nimasi foydali:** Klassik benchmark

---

## 5-DARAJA — Telegram/OSINT Manbalar (qonuniy)

### 5.1 IIV/MIA rasmiy kanallari
- **O'zbekiston IIV Telegram:** @iiv_press_uz (qo'lga olish video'lari)
- **Rossiya MVD:** @mvd_official
- **Manbalardan klip yig'ish va MANUAL annotatsiya**

### 5.2 YouTube qidiruvlar
Quyidagi so'rovlar bo'yicha klip yig'ish:
```
"zakladchik задержан"
"закладка наркотиков камера"
"narkotik moddasi yashirgan"
"surveillance drug dealer caught"
"CCTV drug drop"
```
- **Tool:** `yt-dlp` orqali yuklab olish

### 5.3 Kaggle qidirish
- **URL:** https://www.kaggle.com/datasets?search=surveillance+anomaly
- "anomaly", "surveillance", "CCTV", "suspicious behavior" kalit so'zlari

### 5.4 HuggingFace Datasets
- **URL:** https://huggingface.co/datasets?search=surveillance
- Video classification datasetlari

### 5.5 Roboflow Universe
- **URL:** https://universe.roboflow.com/
- "person detection", "suspicious activity" — annotated qilingan ko'p dataset

---

## 6-DARAJA — Synthetic Data Generation

### 6.1 Unity Perception Package
- **URL:** https://github.com/Unity-Technologies/com.unity.perception
- 3D shahar muhitida sintetik annotated video generatsiya

### 6.2 NVIDIA Omniverse Replicator
- **URL:** https://developer.nvidia.com/omniverse/replicator

### 6.3 GTA V mod (academic)
- **JTA Dataset:** http://aimagelab.ing.unimore.it/jta — GTA'dan olingan pedestrian data

---

## YUKLAB OLISH PRIORITETI

| Birinchi navbatda yuklash | Sabab |
|---|---|
| UCF-Crime (~110 GB) | Eng yaqin domain — surveillance anomaly |
| AVA (~150 GB) | Atomic actionlar — crouch/bend/pickup |
| VIRAT (~60 GB) | Real outdoor CCTV |
| Kinetics-700 (~700 GB, subset olish mumkin) | Backbone pretraining |
| CrowdHuman (~2 GB) | Person detector base |

**Jami minimal disk:** ~400 GB (subset bilan)
**To'liq:** ~1.5 TB

---

## YUKLAB OLISH SKRIPTI (draft)

`scripts/download_all.sh` quyidagicha tuziladi:

```bash
#!/bin/bash
mkdir -p datasets/{ucf_crime,ava,virat,kinetics,crowdhuman}

# 1. CrowdHuman (eng kichik, eng tez)
cd datasets/crowdhuman
wget https://www.crowdhuman.org/download.html  # registratsiya kerak

# 2. AVA annotations (videolarni alohida YouTube'dan)
cd ../ava
wget https://research.google.com/ava/download/ava_train_v2.2.csv
wget https://research.google.com/ava/download/ava_val_v2.2.csv

# 3. Kinetics (subset)
cd ../kinetics
git clone https://github.com/cvdfoundation/kinetics-dataset
cd kinetics-dataset && bash k700_targz_files.sh

# 4. UCF-Crime — Dropbox link rasmiy sahifadan
# 5. VIRAT — registratsiya talab qiladi
```

---

## ETIK/HUQUQIY ESKARTMA

- **Yuzlarni blur qilish:** dataset jamoatchilikka tarqatilsa
- **License tekshirish:** har bir dataset o'z litsenziyasiga ega (CC BY, research-only, va h.k.)
- **IIV bilan kelishuv:** real "Xavfsiz Shahar" arxivlaridan foydalanish uchun rasmiy hujjat
- **Dual-use policy:** texnologiya faqat huquq-tartibot organlari uchun

---

## KEYINGI QADAM

1. Disk joyini tayyorlash (~500 GB SSD tavsiya)
2. `yt-dlp`, `wget`, `aria2c` o'rnatish
3. UCF-Crime + AVA + VIRAT yuklab olishni boshlash (eng prioritet)
4. CVAT yoki Label Studio o'rnatish — qo'shimcha annotatsiya uchun
5. Pilot model: YOLOv8 + SlowFast / VideoMAE backbone
