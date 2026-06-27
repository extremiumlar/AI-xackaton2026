"""Komanda qatori orqali ishga tushirish.

Misol:
    python cli.py --source samples/test.mp4
    python cli.py --source 0 --show
    python cli.py --source video.mp4 --config config.yaml --output result.mp4
"""

import argparse
import sys
import time
from pathlib import Path

from src.pipeline import Pipeline, PipelineConfig


def parse_args():
    p = argparse.ArgumentParser(description="Zakladchik Detector CLI")
    p.add_argument("--source", required=True,
                   help="Video fayl yoki webcam id (0)")
    p.add_argument("--config", default="config.yaml",
                   help="Sozlamalar fayli")
    p.add_argument("--output", default=None,
                   help="Output video yo'li")
    p.add_argument("--show", action="store_true",
                   help="Real-time oynani ko'rsatish")
    p.add_argument("--max-frames", type=int, default=None,
                   help="Maksimal freymlar (test uchun)")
    p.add_argument("--device", default=None,
                   help="cpu yoki cuda:0 (config'dagini bekor qiladi)")
    return p.parse_args()


def main():
    args = parse_args()

    # Source: int (webcam) yoki str
    source = args.source
    if source.isdigit():
        source = int(source)

    # Config yuklash
    cfg_path = Path(args.config)
    if cfg_path.exists():
        config = PipelineConfig.from_yaml(str(cfg_path))
        print(f"[+] Config yuklandi: {cfg_path}")
    else:
        config = PipelineConfig()
        print(f"[!] {cfg_path} topilmadi - default sozlamalar")

    if args.device:
        config.device = args.device

    # Output yo'li — webcam (int) bo'lsa ham timestamp asosida saqlanadi
    output_path = args.output
    if output_path is None:
        ts = int(time.time())
        Path(config.video_dir).mkdir(parents=True, exist_ok=True)
        prefix = "webcam" if isinstance(source, int) else "result"
        output_path = str(Path(config.video_dir) / f"{prefix}_{ts}.mp4")

    print(f"[+] Manba: {source}")
    print(f"[+] Output: {output_path}")
    print(f"[+] Device: {config.device}")
    print(f"[+] Model: {config.detector} + {config.pose}")

    pipeline = Pipeline(config)
    start = time.time()
    result = pipeline.run(
        source=source,
        output_path=output_path,
        show_window=args.show,
        max_frames=args.max_frames,
    )
    elapsed = time.time() - start

    print("")
    print("=" * 50)
    print("YAKUNIY NATIJA")
    print("=" * 50)
    print(f"Freymlar:       {result['frames_processed']}")
    print(f"Alertlar:       {result['alerts_total']}")
    print(f"Vaqt:           {elapsed:.1f}s")
    print(f"FPS:            {result['frames_processed'] / max(elapsed, 1):.1f}")
    print(f"Output video:   {result['output_video']}")
    print(f"Log CSV:        {result['log_csv']}")
    print(f"Alert rasmlar:  {result['alert_image_dir']}")


if __name__ == "__main__":
    sys.exit(main())
