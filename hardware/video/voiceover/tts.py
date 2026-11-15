import json, os, subprocess, sys, urllib.request
HERE = os.path.dirname(os.path.abspath(__file__))
KEY = os.environ["ELEVENLABS_API_KEY"]  # never hard-code the key; VOICE = sys.argv[1] if len(sys.argv) > 1 else "XrExE9yKIg1WjnnlVkGX"
only = set(sys.argv[2:])
lines = json.load(open(os.path.join(HERE, "lines.json")))
for i, L in enumerate(lines):
    if only and L["id"] not in only: continue
    body = {"text": L["text"], "model_id": "eleven_multilingual_v2",
            "voice_settings": {"stability": 0.55, "similarity_boost": 0.8, "style": 0.15, "use_speaker_boost": True, "speed": L.get("speed", 1.05)},
            "previous_text": lines[i - 1]["text"] if i else None, "next_text": lines[i + 1]["text"] if i + 1 < len(lines) else None}
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}?output_format=mp3_44100_128", data=json.dumps(body).encode(),
                                 headers={"xi-api-key": KEY, "Content-Type": "application/json", "Accept": "audio/mpeg"})
    out = os.path.join(HERE, L["id"] + ".mp3")
    with urllib.request.urlopen(req) as r, open(out, "wb") as f: f.write(r.read())
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out]).decode())
    win = L["end"] - L["start"]
    print(f'{L["id"]} {dur:5.2f}s / window {win:4.2f}s  {"OK" if dur <= win else "OVER x%.2f" % (dur / win)}  {L["text"]}')
