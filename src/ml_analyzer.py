"""ML-based behavior classifier — LSTM on keypoint sequences.

Model: KeypointLSTM
  Input : (batch, SEQ_LEN, 34)  — 17 keypoints × (x, y), normalized
  Output: (batch, 5)            — [crouch, hand, loiter, look, suspicious]

Train with train_model.py, then pass model_path= to MLBehaviorAnalyzer.
Falls back to rule-based BehaviorAnalyzer if no model is loaded.
"""

from __future__ import annotations
from pathlib import Path
from typing import Optional

import numpy as np
import torch
import torch.nn as nn

from .analyzer import BehaviorAnalyzer
from .detector import PersonDetection

SEQ_LEN   = 30     # frames per window  (~1 sec at 30fps)
N_KP      = 17     # COCO keypoints
FEAT_DIM  = N_KP * 2  # x, y per keypoint

OUTPUT_CLASSES = ['crouching', 'hand_to_ground', 'loitering', 'looking_around', 'suspicious']


# ── Model ─────────────────────────────────────────────
class KeypointLSTM(nn.Module):
    """Lightweight LSTM for keypoint sequence classification."""

    def __init__(self, input_size: int = FEAT_DIM, hidden: int = 128,
                 layers: int = 2, n_classes: int = 5, dropout: float = 0.3):
        super().__init__()
        self.lstm = nn.LSTM(input_size, hidden, layers,
                            batch_first=True, dropout=dropout)
        self.drop = nn.Dropout(dropout)
        self.fc   = nn.Linear(hidden, n_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:   # x: (B, T, F)
        out, _ = self.lstm(x)
        return torch.sigmoid(self.fc(self.drop(out[:, -1, :])))


# ── Analyzer ──────────────────────────────────────────
class MLBehaviorAnalyzer(BehaviorAnalyzer):
    """Rule-based analyzer augmented with optional LSTM predictions."""

    def __init__(self, model_path: Optional[str] = None,
                 device: str = 'cpu',
                 ml_weight: float = 0.5,   # blend ratio ML vs rules
                 **kwargs):
        super().__init__(**kwargs)
        self.device     = device
        self.ml_weight  = ml_weight
        self.model: Optional[KeypointLSTM] = None
        self._bufs: dict[int, list] = {}   # track_id → feature list

        if model_path and Path(model_path).exists():
            self.model = KeypointLSTM()
            self.model.load_state_dict(
                torch.load(model_path, map_location=device, weights_only=True)
            )
            self.model.eval()
            print(f"[MLAnalyzer] Model yuklandi: {model_path}")
        else:
            print("[MLAnalyzer] Model topilmadi — qoidalarga asoslangan tahlil ishlatilmoqda")

    def _featurize(self, det: PersonDetection) -> np.ndarray:
        """17 keypointni bbox ga nisbatan normalizatsiya qiladi → (34,) float32."""
        feat = np.zeros(FEAT_DIM, dtype=np.float32)
        if det.keypoints is None:
            return feat
        x1, y1, x2, y2 = det.bbox
        bw = max(x2 - x1, 1.0)
        bh = max(y2 - y1, 1.0)
        for i in range(N_KP):
            kx, ky, kc = det.keypoints[i]
            if kc > 0.25:
                feat[i * 2]     = (kx - x1) / bw
                feat[i * 2 + 1] = (ky - y1) / bh
        return feat

    def analyze(self, detections: list, frame_idx: int) -> list:
        results = super().analyze(detections, frame_idx)

        if self.model is None:
            return results

        active_ids = {det.track_id for det in detections}

        for det, state in results:
            tid = det.track_id
            buf = self._bufs.setdefault(tid, [])
            buf.append(self._featurize(det))
            if len(buf) > SEQ_LEN:
                del buf[0]

            if len(buf) < 8:
                continue   # not enough history yet

            # Build padded sequence tensor
            seq = buf[-SEQ_LEN:]
            if len(seq) < SEQ_LEN:
                pad = [np.zeros(FEAT_DIM, dtype=np.float32)] * (SEQ_LEN - len(seq))
                seq = pad + seq

            x = torch.tensor(np.stack(seq), dtype=torch.float32).unsqueeze(0)
            with torch.no_grad():
                preds = self.model(x)[0].cpu().numpy()   # (5,)

            ml_cr, ml_hg, ml_lo, ml_lk, ml_sus = preds.tolist()

            # Blend: OR override for binary flags above threshold
            state.is_crouching      = state.is_crouching      or (ml_cr > 0.52)
            state.is_hand_to_ground = state.is_hand_to_ground or (ml_hg > 0.52)
            state.is_loitering      = state.is_loitering      or (ml_lo > 0.52)
            state.is_looking_around = state.is_looking_around or (ml_lk > 0.52)

            # Weighted suspicion score
            rule_score = state.suspicion_score
            state.suspicion_score = (
                (1 - self.ml_weight) * rule_score +
                self.ml_weight * ml_sus
            )

        # Clean stale buffers
        for tid in list(self._bufs):
            if tid not in active_ids and tid not in self.states:
                del self._bufs[tid]

        return results
