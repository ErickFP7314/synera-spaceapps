#!/usr/bin/env python3
"""Render the Hardware B-roll for the demo video from REAL Wokwi serial captures.

Outputs (hardware/media/):
  hw-02-wokwi-nominal.png      node running, slider 36.5 °C
  hw-03-wokwi-fever.png        slider moved to 38.5 °C, temp follows
  hw-04-serial-frame.png       close-up of one SerialFrame with every field explained
  hw-05-wokwi-out-of-range.png slider at 125 °C -> temp omitted (never invented)
  hw-clip-data-arriving-5s.mp4 5 s, 1920x1080, 30 fps: JSON lines arriving 1 per second, temp 36.5 -> 38.2
(hw-01 is the wiring diagram: ../pcb-schematics/galley-wiring.png)

Needs: google-chrome (headless), ffmpeg. Usage:
  python3 hardware/media/src/render_media.py [--elements PATH_OR_URL]
"""
import argparse
import json
import pathlib
import shutil
import subprocess
import tempfile

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
ELEMENTS_URL = "https://unpkg.com/@wokwi/elements@1.9.1/dist/wokwi-elements.bundle.js"
FPS_RENDER, FPS_OUT, CLIP_S = 10, 30, 5


def read_log(name: str) -> list:
    lines = (HERE / f"wokwi-serial-{name}.log").read_text().splitlines()
    frames = [l for l in lines if l.startswith("{")]
    for l in frames:
        json.loads(l)  # every line must be valid JSON (SerialFrame)
    return frames


def chrome() -> str:
    for c in ("google-chrome", "chromium", "chromium-browser"):
        if shutil.which(c):
            return c
    raise SystemExit("google-chrome / chromium not found")


def shot(page: pathlib.Path, profile: str, hash_: str, out: pathlib.Path) -> None:
    subprocess.run([chrome(), "--headless=new", "--disable-gpu", "--hide-scrollbars",
                    f"--user-data-dir={profile}", "--window-size=1920,1080",
                    "--virtual-time-budget=4000", f"--screenshot={out}",
                    f"{page.as_uri()}#{hash_}"], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--elements", default=ELEMENTS_URL, help="path or URL of wokwi-elements.bundle.js")
    args = ap.parse_args()
    src = args.elements if args.elements.startswith("http") else pathlib.Path(args.elements).resolve().as_uri()
    data = {"nominal": read_log("nominal"), "slider": read_log("slider")}
    html = (HERE / "scene.html").read_text().replace("__ELEMENTS_SRC__", src).replace("__DATA__", json.dumps(data))

    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        page = tmp / "scene.html"
        page.write_text(html)
        profile = str(tmp / "profile")
        stills = {
            "hw-02-wokwi-nominal.png": "view=scene&log=nominal&n=4&slider=36.5",
            "hw-03-wokwi-fever.png": "view=scene&log=slider&n=13&slider=38.5",
            "hw-04-serial-frame.png": "view=closeup&log=nominal&n=2",
            "hw-05-wokwi-out-of-range.png": "view=scene&log=slider&n=16&slider=125",
        }
        for name, h in stills.items():
            shot(page, profile, h, OUT / name)
            print("ok", name)

        # clip: slider log, lines arrive once per second (real firmware rate), typing effect 0.35 s
        frames = tmp / "frames"
        frames.mkdir()
        for i in range(CLIP_S * FPS_RENDER):
            t = i / FPS_RENDER                     # seconds into the clip
            n = int(t) + 1                         # complete lines: t=1 already shown at 0 s
            f = t - int(t)
            slider = "36.5" if t < 0.5 else "38.5"  # slider moved right after the first line
            shot(page, profile, f"view=scene&log=slider&n={n}&f={f:.2f}&slider={slider}", frames / f"f{i:03d}.png")
        clip = OUT / "hw-clip-data-arriving-5s.mp4"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS_RENDER),
                        "-i", str(frames / "f%03d.png"), "-vf", f"fps={FPS_OUT},format=yuv420p",
                        "-c:v", "libx264", "-crf", "20", "-movflags", "+faststart", str(clip)], check=True)
        print("ok", clip.name)


if __name__ == "__main__":
    main()
