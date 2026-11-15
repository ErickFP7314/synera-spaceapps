# Galley web app (Software team)

Static web app with no build step and no backend. Everything runs in the browser.

**Public link (GitHub Pages):** https://erickfp7314.github.io/synera-spaceapps/

## Run it locally

You need Node.js 18 or newer. You don't need `npm install` to run the app.

```bash
cd software
npm start
```

Then open http://127.0.0.1:5174 (it redirects to `/software/app/`).

- The server serves the whole repo because the app reads `data/` and `contracts/`, exactly like GitHub Pages.
- The camera only works on `127.0.0.1`, `localhost` or HTTPS.
- Without Node, run this from the repo root and open http://127.0.0.1:5174/software/app/:
  ```bash
  python -m http.server 5174 --bind 127.0.0.1
  ```

### Demo deep links (for the video and the judges)

`?scenario=bradycardia&day=13&env=MARS&view=3d&lang=en&theme=night&voice=0&autoscan=1`

| Parameter | Values |
|---|---|
| `scenario` | `nominal`, `fatigue`, `bradycardia`, `infection`, `solar_storm` |
| `day` | `1`–`14` |
| `env` | `ISS`, `MOON`, `MARS` |
| `view` | `2d`, `3d` |
| `theme` | `day`, `night` |
| `voice` | `0` (off) |
| `autoscan` | `1` (starts the scan on load) |

## Flow (one scrolling page)

1. **Check-in.** Face ID: the camera turns on only while identifying, then off. You can also register a crew member or pick the demo profile (Cmdr. A. Rivera, CREW-A).
2. **Body scan.**
   - A scan walks from head to feet, over the anatomical figure or the 3D body scanner.
   - Each reading appears as a tag: today's value, *your normal*, the z-score, a bullet bar, and "What does this mean?".
   - It ends with **one next step**, one of 4 levels: self-care, tell the crew, flight surgeon, urgent.
3. **Earth link.** Shows the delay for the ISS, the Moon or Mars, and the **S-B-A-R** report, sent now or queued with its reply time. The report can be copied or printed.
4. **Space weather.** Real NASA DONKI solar particle events from the May 2024 storm, today's dose, and rule R6.
5. **14-day trends.** One chart per indicator, with your personal band. The dots grow with the distance from your normal.
6. **Real astronaut data.** NASA OSDR Inspiration4 glucose (OSD-575 / OSD-569), each crew member against their own pre-flight mean, with the R+45 caveat.

Data source line:
- `SIMULATION` = the 14-day dataset.
- `LIVE SENSOR` = values from the USB sensor.

## Files

| File | What it does |
|---|---|
| `index.html` | Page structure, and the theme set before first paint |
| `styles.css` | "Station interior" design: day and pre-sleep (warm, low-blue) themes, panels, inventory tags, scroll reveal |
| `app.js` | Controller: loads `contracts/` and `data/`, runs the engine, renders every section |
| `engine/` | **Generated** from `software/src/domain` with `npm run build:engine`. `tests/app-engine.test.ts` fails if it is stale |
| `body-scan.js` | 2D anatomical SVG figure with the scan line |
| `body-3d.js` + `body-3d-art.js` | 3D isometric body scanner. The art is **generated** by `node tools/build-body-3d.mjs` with the MIT anatomy kit in `software/tools/anatomy-kit` |
| `voice.js` | Voice guide (details below) |
| `voice/` | Recorded voice clips in EN/ES. **Generated** by `node tools/build-voice.mjs` with the open Kokoro-82M model (AI-generated audio, listed in `voice/manifest.json`) |
| `serial.js` | Web Serial reader for the ESP32 sensor, with frames checked against `contracts/telemetry-payload.schema.json` |
| `charts.js`, `icons.js` | Dependency-free SVG charts and one drawn icon set |
| `i18n.js` | All UI and voice texts in English (default) and Spanish |
| `face-id.js`, `vendor/face-api/` | Local face recognition (`@vladmandic/face-api` 1.7.12, MIT), works offline |
| `fonts/` | Atkinson Hyperlegible Next + Mono (SIL OFL) |

### How the voice works

1. If the browser has a voice for the current language, Galley uses it (Web Speech).
2. If it has none (Brave, or Chrome on Linux without speech-dispatcher), Galley plays its recorded clips instead.
3. In every case, the sentence also appears as a caption under the figure.

## Hardware (USB sensor)

1. Press **Connect sensor (USB)** in Chrome or Edge.
2. The ESP32 sends one JSON line per second, for example `{"t":12,"hr":61,"spo2":98,"temp":36.6,"q":1,"src":"sensor"}`.
3. Today's pulse, SpO₂ and skin temperature then come from the sensor: the median of the last good frames, where `q=1`.
4. If the sensor is unplugged, the app goes back to the dataset.

The demo uses the simulator: the Go/No-Go decision was NO-GO because there was no physical board. See `hardware/tools/gonogo.py`.

## Privacy

- The camera is on only while registering or identifying.
- Photos and face descriptors stay in this browser's `localStorage`, and each crew member can be deleted from the list.
- Nothing is uploaded.

## Decision support

Galley is decision support, not a medical device. Thresholds and rules come from `contracts/medical-ranges-config.json` and `data/reference/rules.json`, with their sources.
