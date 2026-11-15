# Galley web app (Software team)

Static web app, no build step and no backend. Everything runs in the browser.

**Public link (GitHub Pages):** https://erickfp7314.github.io/synera-spaceapps/

## Run it

Needs Node.js 18 or newer (the project already uses it for `npm test`). No `npm install` is needed to run the app.

```bash
cd software
npm start
```

Open http://127.0.0.1:5174 (it redirects to `/software/app/`). The server serves the whole repo because the app reads `data/` and `contracts/`, exactly like GitHub Pages. Use another port with `PORT=5180 npm start` (PowerShell: `$env:PORT=5180; npm start`).

The camera only works on `127.0.0.1`, `localhost` or HTTPS (GitHub Pages). Opening `index.html` by double-click (`file://`) does not work, because the page uses ES modules.

Alternative without Node, from the repo root: `python -m http.server 5174 --bind 127.0.0.1`, then open http://127.0.0.1:5174/software/app/.

## Flow

1. **Crew biometric check-in.** Register a crew member (name, role, usual values, the sensors that person wears, consent). The camera shows a live preview, takes 5 face samples and turns off. "Identify with camera" recognizes a registered face and opens the scan. Without a camera, pick a crew member from the list.
2. **Body scan.** A scan line moves from head to feet over the figure. Each zone (head, chest, abdomen, legs) turns green, amber or red, and its readings appear on the right with a range bar (today's value vs. the person's usual value). Only the sensors assigned to that crew member are read. The voice guide (ES/EN) reads only the zones that need attention.

## Files

| File | What it does |
|---|---|
| `index.html` | The two screens and the demo logic |
| `body-scan.js` | SVG human figure, 4 clickable zones, scan animation. Presentation only: it receives the status of each zone |
| `face-id.js` | Local face recognition: camera, registration, matching, storage |
| `voice.js` | Voice guide (Web Speech API) and alert tones (Web Audio API) |
| `i18n.js` | All UI and voice texts in Spanish and English |
| `vendor/face-api/` | `@vladmandic/face-api` 1.7.12 and its 3 models (MIT license), so Face ID works offline |

## Browser APIs used

| Feature | API |
|---|---|
| Face recognition | `@vladmandic/face-api` (TensorFlow.js, WebGL or CPU): TinyFaceDetector, 68-point landmarks, 128-number face descriptor |
| Camera | `navigator.mediaDevices.getUserMedia` |
| Figure and range bars | Inline SVG drawn with JavaScript, `requestAnimationFrame` |
| Voice | `SpeechSynthesis` (`es-ES`, `en-US`) |
| Alert tone | Web Audio `OscillatorNode` |
| Storage | `localStorage` (profiles, face descriptors, language). Nothing is uploaded |

## Privacy

The camera is on only while registering or identifying. Photo and face descriptor stay in this browser's `localStorage`. Each registration can be deleted from the crew list.

## Status against plan v2.1 (to do next)

This first version still uses its own demo values. It is **not yet aligned** with the frozen contracts:

- Thresholds are hard-coded in `index.html`. They must be read from `contracts/medical-ranges-config.json` (personal baseline, z-score, absolute limits).
- Mood uses 1–10. The plan says **1–5**.
- Blood pressure and glucose still change the zone color. The plan says they must **not** raise alerts.
- The summary shows 3 levels. The plan has **4 action levels**.
- Scenarios are 3 built-in ones. They must come from `data/synthetic/galley-14day-scenarios.json`.
- Not connected yet: the TypeScript engine in `software/src/domain/`, the environment selector (ISS / Moon / Mars), the S-B-A-R report, the DONKI radiation card, the Inspiration4 card, "What does this mean?" and Web Serial.
