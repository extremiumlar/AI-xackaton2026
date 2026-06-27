"""Xatti-harakatlarni tahlil qilish — crouch, loiter, hand-to-ground, look-around."""

import math
from collections import defaultdict, deque
from dataclasses import dataclass, field
from typing import Optional
import numpy as np

from .detector import PersonDetection


@dataclass
class BehaviorState:
    track_id: int
    position_history: deque = field(default_factory=lambda: deque(maxlen=300))
    nose_x_history: deque = field(default_factory=lambda: deque(maxlen=30))
    crouch_history: deque = field(default_factory=lambda: deque(maxlen=15))
    hand_history: deque = field(default_factory=lambda: deque(maxlen=15))
    # suspicion_history maxlen analyzer tomonidan dinamik o'rnatiladi
    # (sustained_frames'dan past bo'lmasligi uchun)
    suspicion_history: deque = field(default_factory=lambda: deque(maxlen=30))
    first_seen_frame: int = 0
    last_seen_frame: int = 0
    alert_triggered: bool = False

    # Joriy belgilar
    is_crouching: bool = False
    is_hand_to_ground: bool = False
    is_loitering: bool = False
    is_looking_around: bool = False
    suspicion_score: float = 0.0


class BehaviorAnalyzer:
    def __init__(self,
                 fps: float = 25.0,
                 crouch_ratio_threshold: float = 0.65,
                 hand_to_ground_threshold: float = 0.85,
                 loiter_seconds: float = 15.0,
                 loiter_radius_px: float = 80.0,
                 look_around_window: int = 30,
                 look_around_threshold: int = 5,
                 weights: Optional[dict] = None,
                 alert_threshold: float = 0.55,
                 sustained_frames: int = 10):
        self.fps = max(fps, 1.0)
        self.crouch_ratio_threshold = crouch_ratio_threshold
        self.hand_to_ground_threshold = hand_to_ground_threshold
        self.loiter_seconds = loiter_seconds
        self.loiter_radius_px = loiter_radius_px
        self.look_around_window = look_around_window
        self.look_around_threshold = look_around_threshold

        self.weights = weights or {
            "crouch": 0.30,
            "hand_to_ground": 0.40,
            "loiter": 0.20,
            "look_around": 0.10,
        }
        self.alert_threshold = alert_threshold
        self.sustained_frames = max(1, int(sustained_frames))
        # suspicion_history bufer hech bo'lmaganda sustained_frames'ga
        # teng bo'lishi shart, aks holda alert hech qachon tetiklanmaydi.
        self._suspicion_maxlen = max(30, self.sustained_frames * 2)

        self.states: dict = {}

    def analyze(self, detections: list, frame_idx: int) -> list:
        """Har bir aniqlangan odam uchun xatti-harakatlarni hisoblaydi."""
        analyzed = []
        active_ids = set()

        for det in detections:
            active_ids.add(det.track_id)
            state = self.states.get(det.track_id)
            if state is None:
                state = BehaviorState(track_id=det.track_id,
                                       first_seen_frame=frame_idx)
                state.suspicion_history = deque(maxlen=self._suspicion_maxlen)
                self.states[det.track_id] = state

            state.last_seen_frame = frame_idx
            state.position_history.append(det.center)

            # Belgilar
            state.is_crouching = self._check_crouch(det)
            state.crouch_history.append(state.is_crouching)

            state.is_hand_to_ground = self._check_hand_to_ground(det)
            state.hand_history.append(state.is_hand_to_ground)

            state.is_loitering = self._check_loiter(state, frame_idx)

            nose = det.kp("nose")
            if nose is not None:
                state.nose_x_history.append(nose[0])
            state.is_looking_around = self._check_look_around(state, det)

            # Suspicion ball
            score = self._suspicion_score(state)
            state.suspicion_score = score
            state.suspicion_history.append(score)

            # Alert tekshirish
            recent_above = sum(1 for s in list(state.suspicion_history)[-self.sustained_frames:]
                               if s >= self.alert_threshold)
            if recent_above >= self.sustained_frames:
                state.alert_triggered = True

            analyzed.append((det, state))

        # Yo'qolgan trackerlarni tozalash (60s harakat yo'q bo'lsa)
        ttl = int(60 * self.fps)
        stale = [tid for tid, s in self.states.items()
                 if frame_idx - s.last_seen_frame > ttl and tid not in active_ids]
        for tid in stale:
            del self.states[tid]

        return analyzed

    def _check_crouch(self, det: PersonDetection) -> bool:
        """Cho'qqayish — hip ankle masofa bbox heightga nisbatan kichik bo'lsa."""
        if det.keypoints is None:
            return False
        left_hip = det.kp("left_hip")
        right_hip = det.kp("right_hip")
        left_ankle = det.kp("left_ankle")
        right_ankle = det.kp("right_ankle")

        hip_y = self._avg_y(left_hip, right_hip)
        ankle_y = self._avg_y(left_ankle, right_ankle)
        if hip_y is None or ankle_y is None or det.height < 30:
            return False

        ratio = abs(ankle_y - hip_y) / det.height
        return ratio < self.crouch_ratio_threshold

    def _check_hand_to_ground(self, det: PersonDetection) -> bool:
        """Yerga qo'l uzatish — bilakning Y koordinati bbox tagiga yaqin bo'lsa."""
        if det.keypoints is None:
            return False
        left_wrist = det.kp("left_wrist")
        right_wrist = det.kp("right_wrist")
        wrist_y = self._max_y(left_wrist, right_wrist)
        if wrist_y is None or det.height < 30:
            return False

        bbox_top = det.bbox[1]
        bbox_bottom = det.bbox[3]
        # bilak qancha pastda
        ratio = (wrist_y - bbox_top) / det.height
        return ratio > self.hand_to_ground_threshold

    def _check_loiter(self, state: BehaviorState, frame_idx: int) -> bool:
        """Loitering — N sekund mobaynida shu radiusda turish."""
        needed = int(self.loiter_seconds * self.fps)
        if len(state.position_history) < needed:
            return False

        recent = list(state.position_history)[-needed:]
        cx = sum(p[0] for p in recent) / len(recent)
        cy = sum(p[1] for p in recent) / len(recent)
        for p in recent:
            if math.hypot(p[0] - cx, p[1] - cy) > self.loiter_radius_px:
                return False
        return True

    def _check_look_around(self, state: BehaviorState, det: PersonDetection) -> bool:
        """Atrofga qarash — nose X koordinati yelkalarga nisbatan tez-tez almashsa."""
        if len(state.nose_x_history) < self.look_around_window:
            return False

        left_shoulder = det.kp("left_shoulder")
        right_shoulder = det.kp("right_shoulder")
        if left_shoulder is None or right_shoulder is None:
            return False

        shoulder_mid_x = (left_shoulder[0] + right_shoulder[0]) / 2
        shoulder_width = abs(left_shoulder[0] - right_shoulder[0])
        if shoulder_width < 10:
            return False

        # nose offset hisoblash va belgisi o'zgarishini sanash
        offsets = [(x - shoulder_mid_x) / shoulder_width for x in state.nose_x_history]
        sign_changes = 0
        prev_sign = 0
        for o in offsets:
            if abs(o) < 0.05:
                continue
            sign = 1 if o > 0 else -1
            if prev_sign != 0 and sign != prev_sign:
                sign_changes += 1
            prev_sign = sign

        return sign_changes >= self.look_around_threshold

    def _suspicion_score(self, state: BehaviorState) -> float:
        """0-1 oralig'idagi shubha bali."""
        # Crouch va hand-to-ground uchun yaqin freymlardagi nisbatni olamiz
        crouch_ratio = sum(state.crouch_history) / max(len(state.crouch_history), 1)
        hand_ratio = sum(state.hand_history) / max(len(state.hand_history), 1)

        score = 0.0
        score += self.weights["crouch"] * crouch_ratio
        score += self.weights["hand_to_ground"] * hand_ratio
        score += self.weights["loiter"] * (1.0 if state.is_loitering else 0.0)
        score += self.weights["look_around"] * (1.0 if state.is_looking_around else 0.0)
        return min(score, 1.0)

    @staticmethod
    def _avg_y(a, b):
        if a is None and b is None:
            return None
        if a is None:
            return b[1]
        if b is None:
            return a[1]
        return (a[1] + b[1]) / 2

    @staticmethod
    def _max_y(a, b):
        if a is None and b is None:
            return None
        if a is None:
            return b[1]
        if b is None:
            return a[1]
        return max(a[1], b[1])
