# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Primary: astronauts on a long mission.** Each crew member does a daily check-up of about 60 seconds at a station screen, with hands free: face login, a head-to-toe body scan and voice guidance. Their job is to know whether they are fine today and what to do if they are not, without filling in forms.
- **Secondary: the flight surgeon on Earth.** They receive an S-B-A-R report when the escalation level is 3 or higher.
- **Evaluators: NASA Space Apps 2026 judges.** They open the public link (GitHub Pages) and the ≤ 30 s video with no prior context, and must understand the idea quickly.

## Product Purpose
Galley ("the check-up that does itself") detects early deviations in a crew member's health and turns them into clear actions on board: self-care, tell the crew, call the flight surgeon, or urgent. Success means the astronaut understands the colour and the next step in seconds, and the judge sees real NASA data behind every number.

## Positioning
- Each person is compared against **their own 14-day normal**: a robust z-score from the median and MAD, plus absolute safety limits. A generic population range is not the reference.
- The app adapts to the mission environment. On the ISS and the Moon the report goes out now. On Mars, with a reply time of about 44 minutes, it guides the crew on board and queues the S-B-A-R.

## Operating Context
- Camera, voice and an optional USB sensor (ESP32 + MAX30102 + skin temperature) through Web Serial. The demo uses simulated data because of the NO-GO decision.
- Five 14-day scenarios: nominal, fatigue, bradycardia, infection and solar storm.
- Mission environments: ISS, Moon and Mars.
- Space Apps rules for the demo: ≤ 30 s, English subtitles, no NASA logos.

## Capabilities and Constraints
- Static web app with no build step and no backend: `software/app`, plain HTML, CSS and JavaScript ES modules.
- It runs on GitHub Pages and locally with `npm start`.
- Engine: `software/src/domain` (TypeScript), compiled to `software/app/engine`.
- It reads the frozen contracts in `contracts/` and the data in `data/`.
- Face recognition is local (face-api) and the camera turns off after the match. Profiles live in `localStorage`, and nothing is uploaded.
- Languages: English by default and Spanish.
- Blood pressure and glucose never raise alerts. Mood uses a 1–5 scale. There are 4 escalation levels.

## Brand Commitments
- Name: **Galley**, by Team Synera.
- Tagline: "the check-up that does itself".
- Disclaimer that must always be visible: "Decision support, not a medical device".
- Do not use NASA logos or insignia; NASA may appear only as text in data sources.

## Evidence on Hand
- NASA DONKI: real SEP events of the May 2024 storm (`data/nasa/donki/donki-sep-demo.json`).
- NASA OSDR: Inspiration4 crew labs, OSD-575 glucose and OSD-569 WBC (`data/nasa/osdr/inspiration4-crew-labs.json`).
- NASA HRP risk pages, linked for each indicator (`data/reference/indicator-explanations.json`).
- Rules R1–R7 and the S-B-A-R template (`data/reference/rules.json`), and environments (`data/reference/environments.json`).
- Synthetic 14-day dataset calibrated from the literature (`data/synthetic/`).
- Absences: there are no real users, testimonials or clinical validation. Never invent them.

## Product Principles
1. **Calm over alarm.** The colour carries the level. The voice never says "danger"; it says what to do.
2. **Your normal, not the average.** Every colour can be explained against the person's own baseline.
3. **Honest data.** Every number shows its source, and simulated data is labelled as such.
4. **Private by default.** The camera is on only while identifying, and everything stays on the device.
5. **Works without Earth.** Offline snapshots, autonomous guidance on Mars.

## Accessibility & Inclusion
- Hands-busy use: voice guidance with on-screen captions, and the status is never shown by colour alone (icon + text).
- Bilingual EN/ES.
- Respect `prefers-reduced-motion` and `prefers-color-scheme`.
