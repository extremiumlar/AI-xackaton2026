"""Train KeypointLSTM on UCF-Crime or any labelled video dataset.

═══════════════════════════════════════════════════════════════════════
DATASET TUZILMASI
═══════════════════════════════════════════════════════════════════════
1) UCF-Crime (https://www.crcv.ucf.edu/projects/real-world/):

   UCF_Crimes/
     Videos/
       Normal/
         Normal_Videos_001.mp4
         Normal_Videos_002.mp4
         ...
       Abuse/
         Abuse001_x264.mp4
         ...
       Stealing/
         Stealing001_x264.mp4
         ...
       Robbery/ Assault/ Arrest/ Shoplifting/ Vandalism/ ...

2) O'z datasetingiz (oddiy papka tuzilmasi):

   data/
     normal/        ← normal xatti-harakat videolari
     suspicious/    ← shubhali/xavfli xatti-harakat videolari

═══════════════════════════════════════════════════════════════════════
ISHLATISH
═══════════════════════════════════════════════════════════════════════
# UCF-Crime bilan:
python train_model.py --data UCF_Crimes/Videos --mode ucf --epochs 30

# O'z dataset bilan:
python train_model.py --data data/ --mode custom --epochs 30

# Natija: models/behavior_classifier.pt
═══════════════════════════════════════════════════════════════════════
"""

from __future__ import annotations
import argparse
import random
import time
from pathlib import Path

import cv2
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from ultralytics import YOLO

from src.ml_analyzer import KeypointLSTM, FEAT_DIM, SEQ_LEN, N_KP

# UCF-Crime da shubhali deb hisoblangan sinflar
UCF_SUSPICIOUS = {
    'Abuse', 'Arrest', 'Assault', 'Burglary', 'Fighting',
    'Robbery', 'Shooting', 'Shoplifting', 'Stealing', 'Vandalism',
}

VIDEO_EXTS = {'.mp4', '.avi', '.mov', '.mkv', '.webm'}


# ── Dataset ───────────────────────────────────────────
class KeypointDataset(Dataset):
    def __init__(self, sequences: list[np.ndarray], labels: list[int]):
        self.X = [torch.tensor(s, dtype=torch.float32) for s in sequences]
        self.y = torch.tensor(labels, dtype=torch.float32)

    def __len__(self):   return len(self.X)
    def __getitem__(self, i): return self.X[i], self.y[i]


# ── Keypoint extractor ────────────────────────────────
def extract_sequences(video_path: str, pose_model: YOLO,
                      seq_len: int = SEQ_LEN,
                      stride: int = 10,
                      max_frames: int = 600) -> list[np.ndarray]:
    """Videodan keypoint ketma-ketliklarini chiqaradi."""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return []

    frames_data: list[np.ndarray] = []   # har bir freym uchun (34,) vektor
    frame_idx = 0

    while len(frames_data) < max_frames:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_idx % 2 != 0:   # har 2-freymni o'tkazamiz (tezlik uchun)
            frame_idx += 1
            continue

        results = pose_model(frame, conf=0.3, verbose=False)
        feat = np.zeros(FEAT_DIM, dtype=np.float32)

        if results and results[0].keypoints is not None and len(results[0].keypoints.data):
            # Eng katta (yaqin) odamni olamiz
            kps = results[0].keypoints.data.cpu().numpy()   # (N, 17, 3)
            boxes = results[0].boxes
            if boxes is not None and len(boxes):
                areas = (boxes.xyxy[:, 2] - boxes.xyxy[:, 0]) * \
                        (boxes.xyxy[:, 3] - boxes.xyxy[:, 1])
                best = int(areas.argmax().item())
                bx = boxes.xyxy[best].cpu().numpy()
                kp = kps[best]   # (17, 3)
                bw = max(bx[2] - bx[0], 1.0)
                bh = max(bx[3] - bx[1], 1.0)
                for i in range(N_KP):
                    x, y, c = kp[i]
                    if c > 0.25:
                        feat[i*2]   = (x - bx[0]) / bw
                        feat[i*2+1] = (y - bx[1]) / bh

        frames_data.append(feat)
        frame_idx += 1

    cap.release()

    if len(frames_data) < seq_len:
        return []

    # Sliding window
    seqs = []
    for start in range(0, len(frames_data) - seq_len + 1, stride):
        seqs.append(np.stack(frames_data[start:start + seq_len]))
    return seqs


# ── Collect videos ────────────────────────────────────
def collect_videos_ucf(data_dir: Path) -> tuple[list, list]:
    """UCF-Crime tuzilmasidan video yo'llari + yorliqlarini yig'adi."""
    videos, labels = [], []
    for cls_dir in sorted(data_dir.iterdir()):
        if not cls_dir.is_dir():
            continue
        label = 1 if cls_dir.name in UCF_SUSPICIOUS else 0
        for f in cls_dir.glob('*'):
            if f.suffix.lower() in VIDEO_EXTS:
                videos.append(str(f))
                labels.append(label)
    return videos, labels


def collect_videos_custom(data_dir: Path) -> tuple[list, list]:
    """normal/ va suspicious/ papkalardan video yo'llari yig'adi."""
    videos, labels = [], []
    for label, name in [(0, 'normal'), (1, 'suspicious')]:
        sub = data_dir / name
        if sub.exists():
            for f in sub.glob('**/*'):
                if f.suffix.lower() in VIDEO_EXTS:
                    videos.append(str(f))
                    labels.append(label)
    return videos, labels


# ── Training ──────────────────────────────────────────
def train(args):
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f"[train] Qurilma: {device}")

    pose_model = YOLO('yolov8n-pose.pt')
    data_dir   = Path(args.data)

    print(f"[train] Videolar yig'ilmoqda: {data_dir}")
    if args.mode == 'ucf':
        videos, video_labels = collect_videos_ucf(data_dir)
    else:
        videos, video_labels = collect_videos_custom(data_dir)

    print(f"[train] Jami: {len(videos)} video "
          f"({sum(video_labels)} shubhali, {len(video_labels) - sum(video_labels)} normal)")

    if not videos:
        print("[XATO] Videolar topilmadi! Dataset yo'lini tekshiring.")
        return

    # Keypoint extraction
    all_seqs, all_labels = [], []
    for i, (vpath, vlabel) in enumerate(zip(videos, video_labels)):
        print(f"  [{i+1}/{len(videos)}] {Path(vpath).name} ...", end=' ')
        seqs = extract_sequences(vpath, pose_model,
                                  seq_len=SEQ_LEN,
                                  stride=args.stride,
                                  max_frames=args.max_frames)
        if seqs:
            # 5-ta chiqish uchun yorliq vektori
            target = np.array([vlabel, vlabel, vlabel, vlabel, vlabel], dtype=np.float32)
            for s in seqs:
                all_seqs.append(s)
                all_labels.append(target)
        print(f"{len(seqs)} ketma-ketlik")

    if not all_seqs:
        print("[XATO] Hech qanday ketma-ketlik yaratilmadi.")
        return

    print(f"\n[train] Jami ketma-ketliklar: {len(all_seqs)}")

    # Split
    idxs = list(range(len(all_seqs)))
    random.shuffle(idxs)
    split = int(len(idxs) * 0.85)
    tr_idx, val_idx = idxs[:split], idxs[split:]

    def make_loader(idx, shuffle=True):
        seqs   = [all_seqs[i]   for i in idx]
        labels = [all_labels[i] for i in idx]
        return DataLoader(KeypointDataset(seqs, labels),
                          batch_size=args.batch, shuffle=shuffle, num_workers=0)

    tr_loader  = make_loader(tr_idx, shuffle=True)
    val_loader = make_loader(val_idx, shuffle=False)

    # Model
    model = KeypointLSTM(input_size=FEAT_DIM, hidden=128, layers=2, n_classes=5).to(device)
    opt   = torch.optim.Adam(model.parameters(), lr=1e-3, weight_decay=1e-4)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=args.epochs)
    loss_fn = nn.BCELoss()

    best_val = float('inf')
    out_dir  = Path(args.output).parent
    out_dir.mkdir(parents=True, exist_ok=True)

    for epoch in range(1, args.epochs + 1):
        # Train
        model.train()
        tr_loss = 0.0
        for X, y in tr_loader:
            X, y = X.to(device), y.to(device)
            opt.zero_grad()
            loss = loss_fn(model(X), y)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            opt.step()
            tr_loss += loss.item()
        sched.step()

        # Validate
        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for X, y in val_loader:
                X, y = X.to(device), y.to(device)
                val_loss += loss_fn(model(X), y).item()

        tr_loss  /= max(len(tr_loader),  1)
        val_loss /= max(len(val_loader), 1)
        print(f"Epoch {epoch:3d}/{args.epochs} | train={tr_loss:.4f} | val={val_loss:.4f}")

        if val_loss < best_val:
            best_val = val_loss
            torch.save(model.state_dict(), args.output)
            print(f"  ✓ Saqlandi: {args.output}  (best val={best_val:.4f})")

    print(f"\n[train] Tayyor! Model: {args.output}")
    print("[train] Endi pipeline.py da ml_analyzer.MLBehaviorAnalyzer ni ishlating:")
    print(f"  from src.ml_analyzer import MLBehaviorAnalyzer")
    print(f"  analyzer = MLBehaviorAnalyzer(model_path='{args.output}', ...)")


# ── CLI ───────────────────────────────────────────────
if __name__ == '__main__':
    ap = argparse.ArgumentParser(description='SentinelAI — Behavior Classifier Training')
    ap.add_argument('--data',       required=True,  help='Dataset yo\'li')
    ap.add_argument('--mode',       default='custom', choices=['ucf', 'custom'],
                    help='Dataset tuzilmasi: ucf yoki custom (normal/suspicious)')
    ap.add_argument('--output',     default='models/behavior_classifier.pt',
                    help='Saqlash yo\'li (.pt)')
    ap.add_argument('--epochs',     type=int, default=30)
    ap.add_argument('--batch',      type=int, default=32)
    ap.add_argument('--stride',     type=int, default=10,  help='Sliding window qadam')
    ap.add_argument('--max-frames', type=int, default=600, help='Har video uchun max kadr')
    train(ap.parse_args())
