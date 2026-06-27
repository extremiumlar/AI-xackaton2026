"""Streamlit UI — Zakladchik Detector."""

import os
import tempfile
import time
from pathlib import Path

import cv2
import numpy as np
import streamlit as st
import pandas as pd

from src.pipeline import Pipeline, PipelineConfig


st.set_page_config(
    page_title="Zakladchik Detector",
    page_icon="🛡️",
    layout="wide",
)

st.title("🛡️ Zakladchik Detector")
st.caption("Xavfsiz Shahar tizimi uchun sun'iy intellekt asosida shubhali xatti-harakatlarni aniqlash")

# Sidebar — sozlamalar
st.sidebar.header("⚙️ Sozlamalar")

with st.sidebar.expander("Model", expanded=True):
    detector_model = st.selectbox(
        "Detector model",
        ["yolov8n.pt", "yolov8s.pt", "yolov8m.pt"],
        index=0,
        help="n = nano (tez), m = medium (aniq)",
    )
    pose_model = st.selectbox(
        "Pose model",
        ["yolov8n-pose.pt", "yolov8s-pose.pt", "yolov8m-pose.pt"],
        index=0,
    )
    device = st.selectbox("Device", ["cpu", "cuda:0"], index=0)

with st.sidebar.expander("Aniqlash thresholdlari", expanded=True):
    conf = st.slider("Detection confidence", 0.1, 0.9, 0.4, 0.05)
    alert_threshold = st.slider("Alert threshold", 0.1, 1.0, 0.55, 0.05)
    sustained_frames = st.slider("Sustained freymlar", 1, 60, 10, 1)

with st.sidebar.expander("Xatti-harakat thresholdlari"):
    crouch_ratio = st.slider("Crouch ratio", 0.3, 1.0, 0.65, 0.05)
    hand_ratio = st.slider("Hand-to-ground ratio", 0.5, 1.0, 0.85, 0.05)
    loiter_sec = st.slider("Loiter sekundlar", 5, 60, 15, 1)
    loiter_radius = st.slider("Loiter radius (px)", 20, 300, 80, 10)

with st.sidebar.expander("Vazn (suspicion weights)"):
    w_crouch = st.slider("Crouch weight", 0.0, 1.0, 0.30, 0.05)
    w_hand = st.slider("Hand weight", 0.0, 1.0, 0.40, 0.05)
    w_loiter = st.slider("Loiter weight", 0.0, 1.0, 0.20, 0.05)
    w_look = st.slider("Look-around weight", 0.0, 1.0, 0.10, 0.05)

with st.sidebar.expander("Video"):
    resize_width = st.number_input("Resize width (0=asl)", 0, 1920, 960, 60)
    skip_frames = st.number_input("Skip frames", 0, 5, 0, 1)
    max_frames = st.number_input("Max freymlar (0=cheksiz)", 0, 100000, 0, 100)


# Main — manba tanlash
col_left, col_right = st.columns([2, 1])

with col_left:
    st.subheader("📹 Video manba")
    source_type = st.radio("Manba turi", ["Video fayl", "Webcam", "Demo (samples/)"],
                            horizontal=True)

    source = None
    tmp_path = None

    if source_type == "Video fayl":
        uploaded = st.file_uploader("Video yuklang (mp4, avi, mov)",
                                     type=["mp4", "avi", "mov", "mkv"])
        if uploaded is not None:
            tmp_path = Path(tempfile.gettempdir()) / uploaded.name
            with open(tmp_path, "wb") as f:
                f.write(uploaded.read())
            source = str(tmp_path)
            st.success(f"Yuklandi: {uploaded.name}")

    elif source_type == "Webcam":
        source = 0
        st.info("Webcam ishga tushadi (manba = 0).")

    elif source_type == "Demo (samples/)":
        samples = Path("samples")
        if samples.exists():
            videos = sorted([p for p in samples.glob("*")
                              if p.suffix.lower() in [".mp4", ".avi", ".mov", ".mkv"]])
            if videos:
                pick = st.selectbox("Demo videoni tanlang", [v.name for v in videos])
                source = str(samples / pick)
            else:
                st.warning("samples/ ichida video yo'q. Test fayl qo'shing.")
        else:
            st.warning("samples/ papka topilmadi.")

    run_btn = st.button("▶️ ISHGA TUSHIRISH", type="primary", use_container_width=True,
                         disabled=(source is None))

with col_right:
    st.subheader("📊 Real-time hisobot")
    metric_frames = st.empty()
    metric_tracks = st.empty()
    metric_alerts = st.empty()
    metric_fps = st.empty()


# Asosiy oqim
@st.cache_resource(show_spinner="Modellar yuklanmoqda...")
def get_pipeline(detector_model: str, pose_model: str, device: str,
                  conf: float, alert_threshold: float, sustained_frames: int,
                  crouch_ratio: float, hand_ratio: float,
                  loiter_sec: float, loiter_radius: float,
                  w_crouch: float, w_hand: float, w_loiter: float, w_look: float,
                  resize_width: int, skip_frames: int):
    """Pipeline ni keshlash — model qayta yuklanmaydi."""
    config = PipelineConfig(
        detector=detector_model,
        pose=pose_model,
        device=device,
        conf=conf,
        alert_threshold=alert_threshold,
        sustained_frames=sustained_frames,
        crouch_ratio_threshold=crouch_ratio,
        hand_to_ground_threshold=hand_ratio,
        loiter_seconds=loiter_sec,
        loiter_radius_px=loiter_radius,
        weights={
            "crouch": w_crouch,
            "hand_to_ground": w_hand,
            "loiter": w_loiter,
            "look_around": w_look,
        },
        resize_width=resize_width,
        skip_frames=skip_frames,
        save_video=True,
        video_dir="output/",
        log_dir="logs/",
        alert_image_dir="output/alerts/",
    )
    return Pipeline(config)


if run_btn and source is not None:
    pipeline = get_pipeline(
        detector_model, pose_model, device,
        conf, alert_threshold, int(sustained_frames),
        crouch_ratio, hand_ratio,
        float(loiter_sec), float(loiter_radius),
        w_crouch, w_hand, w_loiter, w_look,
        int(resize_width), int(skip_frames),
    )
    pipeline.alert_log = []  # tarixni tozalash

    out_video = f"output/result_{int(time.time())}.mp4"
    Path("output").mkdir(exist_ok=True)

    video_placeholder = st.empty()
    alerts_placeholder = st.empty()

    start_t = time.time()

    def on_frame(vis, frame_idx, analyzed, alerts_total):
        # BGR -> RGB
        rgb = cv2.cvtColor(vis, cv2.COLOR_BGR2RGB)
        video_placeholder.image(rgb, channels="RGB", use_container_width=True)

        elapsed = time.time() - start_t
        live_fps = (frame_idx + 1) / max(elapsed, 1e-6)

        metric_frames.metric("Freymlar", frame_idx + 1)
        metric_tracks.metric("Aktiv tracker", len(analyzed))
        metric_alerts.metric("Alertlar", alerts_total)
        metric_fps.metric("FPS", f"{live_fps:.1f}")

    try:
        result = pipeline.run(
            source=source,
            output_path=out_video,
            on_frame=on_frame,
            show_window=False,
            max_frames=(None if max_frames == 0 else int(max_frames)),
        )

        st.success(f"✅ Tugadi! Freymlar: {result['frames_processed']}, "
                   f"Alertlar: {result['alerts_total']}")

        st.subheader("📂 Natijalar")
        c1, c2 = st.columns(2)
        with c1:
            st.write(f"**Output video:** `{result['output_video']}`")
            if Path(result["output_video"]).exists():
                with open(result["output_video"], "rb") as f:
                    st.download_button("⬇️ Videoni yuklab olish", f,
                                        file_name=Path(result["output_video"]).name)
        with c2:
            st.write(f"**Log CSV:** `{result['log_csv']}`")

        # Alert jadvali
        if pipeline.alert_log:
            st.subheader("🚨 Aniqlangan alertlar")
            df = pd.DataFrame(pipeline.alert_log)
            df["timestamp_s"] = df["timestamp_s"].round(2)
            df["score"] = df["score"].round(3)
            st.dataframe(df, use_container_width=True)

        # Alert rasmlar
        alert_dir = Path(result["alert_image_dir"])
        if alert_dir.exists():
            alert_imgs = sorted(alert_dir.glob("*.jpg"))[-12:]
            if alert_imgs:
                st.subheader("🖼️ Alert lavhalari")
                cols = st.columns(4)
                for i, img_p in enumerate(alert_imgs):
                    cols[i % 4].image(str(img_p), caption=img_p.name,
                                       use_container_width=True)

    except Exception as e:
        st.error(f"Xato: {e}")
        st.exception(e)

else:
    st.info("👈 Chap tomondan sozlamalarni tanlang va video yoki webcam manbasini bering.")
    st.markdown(
        """
        ### Qanday ishlaydi?

        1. **Person Detection** — YOLOv8 har bir freymda odamlarni topadi
        2. **Tracking** — ByteTrack har bir odamga `track_id` beradi
        3. **Pose Estimation** — YOLOv8-Pose 17 keypoint chiqaradi
        4. **Xatti-harakat tahlili:**
           - 🔻 **Crouch** — cho'qqaygan
           - ✋ **Hand-to-ground** — yerga qo'l uzatgan
           - ⏱️ **Loiter** — bir joyda sababsiz turgan
           - 👀 **Look-around** — atrofga tez-tez qarayotgan
        5. **Suspicion score** — har bir belgi vazni bilan jamlanadi
        6. **Alert** — score threshold ustida N freym davom etsa
        """
    )
