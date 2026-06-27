"""Freym ustiga bbox, keypoint va alert chizish."""

import cv2
import numpy as np


COCO_SKELETON = [
    (5, 7), (7, 9),         # left arm
    (6, 8), (8, 10),        # right arm
    (5, 6),                 # shoulders
    (11, 13), (13, 15),     # left leg
    (12, 14), (14, 16),     # right leg
    (11, 12),               # hips
    (5, 11), (6, 12),       # torso
    (0, 5), (0, 6),         # neck-shoulder
]


def _color_for_score(score: float) -> tuple:
    """Yashildan qizilga gradient (BGR)."""
    score = max(0.0, min(1.0, score))
    r = int(255 * score)
    g = int(255 * (1.0 - score))
    return (0, g, r)


def draw_overlay(frame: np.ndarray,
                 detections_and_states: list,
                 alert_threshold: float = 0.55,
                 draw_keypoints: bool = True,
                 draw_bbox: bool = True,
                 draw_track_id: bool = True,
                 draw_score: bool = True) -> np.ndarray:
    """Hammasi shartli tarzda chiziladi."""
    out = frame.copy()

    for det, state in detections_and_states:
        x1, y1, x2, y2 = [int(v) for v in det.bbox]
        color = _color_for_score(state.suspicion_score)

        if state.alert_triggered:
            color = (0, 0, 255)  # qizil
            thickness = 4
        else:
            thickness = 2

        if draw_bbox:
            cv2.rectangle(out, (x1, y1), (x2, y2), color, thickness)

        # Track ID va score
        labels = []
        if draw_track_id:
            labels.append(f"ID:{det.track_id}")
        if draw_score:
            labels.append(f"S:{state.suspicion_score:.2f}")

        flags = []
        if state.is_crouching:        flags.append("CROUCH")
        if state.is_hand_to_ground:   flags.append("HAND-DOWN")
        if state.is_loitering:        flags.append("LOITER")
        if state.is_looking_around:   flags.append("LOOK-AROUND")
        if state.alert_triggered:     flags.append("!ALERT!")

        if labels:
            text = " ".join(labels)
            cv2.putText(out, text, (x1, max(y1 - 8, 14)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
        if flags:
            ftext = " ".join(flags)
            cv2.putText(out, ftext, (x1, min(y2 + 18, out.shape[0] - 4)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

        if draw_keypoints and det.keypoints is not None:
            _draw_pose(out, det.keypoints, color)

    return out


def _draw_pose(frame: np.ndarray, kps: np.ndarray, color: tuple,
               kp_conf_threshold: float = 0.3):
    """COCO 17 keypoint skeletini chizadi."""
    for i, (x, y, c) in enumerate(kps):
        if c < kp_conf_threshold:
            continue
        cv2.circle(frame, (int(x), int(y)), 3, color, -1)

    for a, b in COCO_SKELETON:
        if a >= len(kps) or b >= len(kps):
            continue
        if kps[a, 2] < kp_conf_threshold or kps[b, 2] < kp_conf_threshold:
            continue
        pa = (int(kps[a, 0]), int(kps[a, 1]))
        pb = (int(kps[b, 0]), int(kps[b, 1]))
        cv2.line(frame, pa, pb, color, 2)


def draw_hud(frame: np.ndarray,
             frame_idx: int,
             fps: float,
             active_tracks: int,
             alerts: int) -> np.ndarray:
    """Yuqorida sarlavha — model status."""
    h, w = frame.shape[:2]
    cv2.rectangle(frame, (0, 0), (w, 28), (0, 0, 0), -1)
    text = (f"ZAKLADCHIK DETECTOR | frame:{frame_idx} | "
            f"FPS:{fps:.1f} | tracks:{active_tracks} | alerts:{alerts}")
    cv2.putText(frame, text, (10, 20),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
    return frame
