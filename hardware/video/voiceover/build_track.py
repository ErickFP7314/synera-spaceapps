#!/usr/bin/env python3
"""Build the voiceover track from 9 clips (v0.mp3 ... v8.mp3) and mux it onto the silent render.

  python3 build_track.py <clips_dir> <silent.mp4> <out.mp4>

Each clip is trimmed of silence, placed at its "at" time from lines.json and, if it would run past
"end", sped up (max x1.15, pitch kept). The mix is loudness-normalized (-16 LUFS target).
"""
import json, os, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
clips, silent, out = sys.argv[1], sys.argv[2], sys.argv[3]
lines = json.load(open(os.path.join(HERE, "lines.json")))
tmp = tempfile.mkdtemp()
dur = lambda f: float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).decode())
run = lambda *a: subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *a], check=True)
inputs, filters = [], []
for i, L in enumerate(lines):
    src = os.path.join(clips, L["id"] + ".mp3")
    trim = os.path.join(tmp, L["id"] + ".wav")
    run("-i", src, "-af", "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,"
        "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse", "-ar", "44100", "-ac", "1", trim)
    d, win = dur(trim), L["end"] - L["at"]
    tempo = max(1.0, d / win)
    if tempo > 1.15:
        print(f"WARNING {L['id']}: {d:.2f}s does not fit {win:.2f}s even at x1.15; regenerate it shorter or faster")
    tempo = min(tempo, 1.15)
    print(f"{L['id']}: {d:.2f}s in {win:.2f}s window" + (f" -> x{tempo:.2f}" if tempo > 1 else ""))
    inputs += ["-i", trim]
    filters.append(f"[{i}]atempo={tempo:.3f},adelay={int(L['at'] * 1000)}:all=1[a{i}]")
mix = "".join(f"[a{i}]" for i in range(len(lines)))
track = os.path.join(tmp, "voiceover.wav")
run(*inputs, "-filter_complex", ";".join(filters) + f";{mix}amix=inputs={len(lines)}:normalize=0,apad=whole_dur=29.5,atrim=0:29.5,"
    "loudnorm=I=-16:TP=-1.5:LRA=7,aresample=48000", "-ac", "2", track)
run("-i", track, "-c:a", "aac", "-b:a", "160k", os.path.join(HERE, "voiceover.m4a"))
run("-i", silent, "-i", track, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", out)
print("wrote", out, "and voiceover/voiceover.m4a")
