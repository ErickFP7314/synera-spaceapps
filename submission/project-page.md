# Space Apps project page — final text (paste into the submission form, in English)

## Project name
Galley — the check-up that does itself

## High-level summary
Galley is an on-device health check-up for astronauts on long missions. The crew member steps in front of the station screen; Galley recognizes them locally, switches the camera off, and runs a head-to-toe body scan with voice guidance. Each zone (head, chest, abdomen, legs) turns green, yellow or red by comparing today's sleep, mood, reaction-test lapses, resting heart rate, SpO₂, skin temperature, food intake and exercise against the astronaut's **own** 14-day baseline, not a population average, because spaceflight shifts physiology (core temperature rises ~1 °C on long missions). Seven deterministic, cited rules detect fatigue, early infection, under-eating, deconditioning and solar radiation storms, and explain in plain language what to do now. Galley adapts to the mission: on the ISS it alerts flight surgeons immediately; on Mars, with up to 44-minute round-trip delays, it guides the crew step by step and queues an S-B-A-R report for Earth. It uses real NASA DONKI space-weather events, real Inspiration4 crew labs from NASA OSDR, and ISS dose data from the Italian Space Agency. Galley is decision support, not a medical device.

## Demo link
<YouTube unlisted / Google Drive public link — test in a private window>

## Final project link
- App (public, no login): https://erickfp7314.github.io/synera-spaceapps/
- Code: https://github.com/ErickFP7314/synera-spaceapps
- Sensor firmware running in a simulator (Wokwi): https://wokwi.com/projects/480771036190862337

## Detailed description
**What it does.** It turns the daily health check into a 60-second, no-forms routine:
- face login with the camera switched off right after the match;
- a head-to-toe body scan, shown as an anatomical figure or as a 3D body scanner, with voice guidance, on-screen captions and a soft alert tone;
- one clear next step for each of four action levels, plus an S-B-A-R report for the flight surgeon (sent now on the ISS and the Moon, queued on Mars);
- a space-weather card with real NASA DONKI solar particle events;
- 14-day trend charts with the personal normal band;
- a "Real astronaut data" card with NASA OSDR Inspiration4 blood tests;
- "What does this mean?" answers for every indicator: what it measures, which NASA hazard affects it, what is normal for me, and what to do now. Each answer links to the NASA HRP risk page.

**How it works.**
- **Baseline.** A robust z-score (median and MAD of the last 14 days, excluding the 3 most recent) plus absolute safety limits.
- **Rules R1–R7:**
  - R1: short sleep.
  - R2: acute fatigue (short sleep + PVT-B lapses or low mood + heart rate above baseline).
  - R3: under-eating.
  - R4: early infection (resting heart rate up for 2 days + temperature above baseline), as validated with wearables on Earth.
  - R5: deconditioning.
  - R6: solar radiation storm (NASA DONKI SEP / GOES ≥ 10 pfu).
  - R7: S-B-A-R escalation.
- **Escalation.** Four action levels (self-care, tell the crew, flight surgeon, urgent) whose behavior changes per environment (ISS / Moon / Mars).

**Designed for the crew's day.** A day theme and a dim, warm "pre-sleep" theme (no blue light) like the station's own lighting modes, English and Spanish, large legible type (Atkinson Hyperlegible), and status never shown by colour alone.

**Benefits.**
- Astronauts get autonomy when Earth is far away.
- Recommendations are explainable and auditable, with no black-box AI.
- Privacy by design: everything runs and stays on the device.

**On Earth,** the same local-first, baseline-driven model fits remote clinics with intermittent connectivity, high-altitude communities (where the "normal" SpO₂ is lower) and polar stations.

**Tools.**
- **Software:** HTML/CSS/JavaScript with no framework, SVG, Web Speech and Web Audio, face-api (TensorFlow.js), Web Serial API, and a TypeScript domain engine with node:test tests (the app runs the same compiled engine). Hosted on GitHub Pages.
- **Hardware:** ESP32 + MAX30102 pulse/SpO₂ sensor + skin-temperature sensor (DS18B20 or MAX30205) sending one JSON line per second over USB, tested in the Wokwi simulator, plus a Python simulator. The demo uses simulated data (no physical board was available).
- **Data:** Python scripts.

## Use of AI
- Google Gemini: initial brainstorming.
- Claude / Claude Code (Anthropic): source research, code assistance, interface implementation and documentation.
- face-api: local, non-generative face matching.
- Kokoro-82M (open text-to-speech model): the recorded voice clips the app plays when a browser has no built-in speech voice. They are AI-generated audio, used only inside the app.
- No AI-generated images or video. If any are added, they carry a visible watermark.
- The solution idea is the team's. Every medical claim cites a source.

## NASA data
- NASA DONKI — Solar Energetic Particle events (https://api.nasa.gov/DONKI/SEP).
- NASA OSDR — SpaceX Inspiration4: OSD-575 (Comprehensive Metabolic Panel: glucose) and OSD-569 (Complete Blood Count: WBC).
- NASA Human Research Program — 5 Hazards, Risks of Human Spaceflight, Ongoing HRP Research.
- NASA MSL/RAD radiation measurements (Zeitlin et al. 2013; Hassler et al. 2014).
- NASA-STD-3001 Vol. 1 (career radiation limit).
- NASA ISS Research Explorer — ISS Internal Radiation Monitoring.

## Space agency partner data & other references
- **ASI:** Di Fino et al. 2023, LIDAL ISS radiation measurements (Life Sci Space Res 39:26-42).
- **CSA:** Monitoring radiation for astronaut health (2026); Why do we conduct science experiments in space?
- **NOAA SWPC:** GOES integral proton flux; Space Weather Scales.
- **CSA:** Physical activity in space (ISS crews exercise about two hours a day).
- **Code, fonts and libraries:** @vladmandic/face-api (MIT, vendored in software/app/vendor/face-api); the anatomy isometric drawing kit (MIT, software/tools/anatomy-kit); Atkinson Hyperlegible Next and Mono (SIL Open Font License); SparkFun MAX3010x library.

## References (APA 7)
- Barger, L. K., Flynn-Evans, E. E., Kubey, A., Walsh, L., Ronda, J. M., Wang, W., Wright, K. P., & Czeisler, C. A. (2014). Prevalence of sleep deficiency and use of hypnotic drugs in astronauts before, during, and after spaceflight: an observational study. The Lancet Neurology, 13(9), 904–912. https://doi.org/10.1016/s1474-4422(14)70122-x
- Basner, M., Dinges, D. F., Mollicone, D., Ecker, A., Jones, C. W., Hyder, E. C., Di Antonio, A., Savelev, I., Kan, K., Goel, N., Morukov, B. V., & Sutton, J. P. (2013). Mars 520-d mission simulation reveals protracted crew hypokinesis and alterations of sleep duration and timing. Proceedings of the National Academy of Sciences, 110(7), 2635–2640. https://doi.org/10.1073/pnas.1212646110
- Basner, M., Mollicone, D., & Dinges, D. F. (2011). Validity and sensitivity of a brief psychomotor vigilance test (PVT-B) to total and partial sleep deprivation. Acta Astronautica, 69(11-12), 949–959. https://doi.org/10.1016/j.actaastro.2011.07.015
- Basner, M., Savitt, A., Moore, T. M., Port, A. M., McGuire, S., Ecker, A. J., Nasrini, J., Mollicone, D. J., Mott, C. M., McCann, T., Dinges, D. F., & Gur, R. C. (2015). Development and Validation of the Cognition Test Battery for Spaceflight. Aerospace Medicine and Human Performance, 86(11), 942–952. https://doi.org/10.3357/amhp.4343.2015
- Di Fino, L., Romoli, G., Santi Amantini, G., Boretti, V., Lunati, L., Berucci, C., Messi, R., Rizzo, A., Albicocco, P., De Donato, C., Masciantonio, G., Morone, M. C., Nobili, G., Baiocco, G., Mentana, A., Pullia, M., Tommasino, F., Carrubba, E., Bardi, A., et al. (2023). Radiation measurements in the International Space Station, Columbus module, in 2020–2022 with the LIDAL detector. Life Sciences in Space Research, 39, 26–42. https://doi.org/10.1016/j.lssr.2023.03.007
- Haig, K. M., Sutton, S., & Whittington, J. (2006). SBAR: A Shared Mental Model for Improving Communication Between Clinicians. The Joint Commission Journal on Quality and Patient Safety, 32(3), 167–175. https://doi.org/10.1016/s1553-7250(06)32022-3
- Kusumoto, F. M., Schoenfeld, M. H., Barrett, C., Edgerton, J. R., Ellenbogen, K. A., Gold, M. R., Goldschlager, N. F., Hamilton, R. M., Joglar, J. A., Kim, R. J., Lee, R., Marine, J. E., McLeod, C. J., Oken, K. R., Patton, K. K., Pellegrini, C. N., Selzman, K. A., Thompson, A., & Varosy, P. D. (2019). 2018 ACC/AHA/HRS guideline on the evaluation and management of patients with bradycardia and cardiac conduction delay: Executive summary. Heart Rhythm, 16(9), e227–e279. https://doi.org/10.1016/j.hrthm.2018.10.036
- O’Driscoll, B. R., Howard, L. S., Earis, J., & Mak, V. (2017). British Thoracic Society Guideline for oxygen use in adults in healthcare and emergency settings. BMJ Open Respiratory Research, 4(1), e000170. https://doi.org/10.1136/bmjresp-2016-000170
- Smarr, B. L., Aschbacher, K., Fisher, S. M., Chowdhary, A., Dilchert, S., Puldon, K., Rao, A., Hecht, F. M., & Mason, A. E. (2020). Feasibility of continuous fever monitoring using wearable devices. Scientific Reports, 10(1). https://doi.org/10.1038/s41598-020-78355-6
- Smith, S. M., Zwart, S. R., Block, G., Rice, B. L., & Davis-Street, J. E. (2005). The Nutritional Status of Astronauts Is Altered after Long-Term Space Flight Aboard the International Space Station. The Journal of Nutrition, 135(3), 437–443. https://doi.org/10.1093/jn/135.3.437
- Stahn, A. C., Werner, A., Opatz, O., Maggioni, M. A., Steinach, M., von Ahlefeld, V. W., Moore, A., Crucian, B. E., Smith, S. M., Zwart, S. R., Schlabs, T., Mendt, S., Trippel, T., Koralewski, E., Koch, J., Choukèr, A., Reitz, G., Shang, P., Röcker, L., et al. (2017). Increased core body temperature in astronauts during long-duration space missions. Scientific Reports, 7(1). https://doi.org/10.1038/s41598-017-15560-w
- Van Dongen, H. P. A., Maislin, G., Mullington, J. M., & Dinges, D. F. (2003). The Cumulative Cost of Additional Wakefulness: Dose-Response Effects on Neurobehavioral Functions and Sleep Physiology From Chronic Sleep Restriction and Total Sleep Deprivation. Sleep, 26(2), 117–126. https://doi.org/10.1093/sleep/26.2.117
- Watson, N. F., Badr, M. S., Belenky, G., Bliwise, D. L., Buxton, O. M., Buysse, D., Dinges, D. F., Gangwisch, J., Grandner, M. A., Kushida, C., Malhotra, R. K., Martin, J. L., Patel, S. R., Quan, S., & Tasali, E. (2015). Recommended Amount of Sleep for a Healthy Adult: A Joint Consensus Statement of the American Academy of Sleep Medicine and Sleep Research Society. Sleep. https://doi.org/10.5665/sleep.4716
- National Aeronautics and Space Administration. (2022). *NASA-STD-3001, NASA space flight human-system standard, Volume 1, Revision B: Crew health* (Section 4.8.2, requirement V1 4030, career radiation limit).
- NASA Community Coordinated Modeling Center. (n.d.). *DONKI: Space Weather Database Of Notifications, Knowledge, Information* [Data set]. Retrieved November 15, 2026, from https://ccmc.gsfc.nasa.gov/tools/DONKI/
- NASA Open Science Data Repository. (n.d.). *OSD-575 and OSD-569: SpaceX Inspiration4 metabolic panel and complete blood count* [Data set]. Retrieved November 15, 2026, from https://osdr.nasa.gov/bio/repo/data/studies/OSD-575
- National Aeronautics and Space Administration. (n.d.). *Human Research Program: Risks*. Retrieved November 15, 2026, from https://www.nasa.gov/hrp/risks/
- NOAA Space Weather Prediction Center. (n.d.). *NOAA space weather scales*. Retrieved November 15, 2026, from https://www.swpc.noaa.gov/noaa-scales-explanation
