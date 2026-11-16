# Space Apps project page (final text to paste into the submission form, in English)

## Project name
Galley: the check-up that does itself

## High-level summary
On the ISS, a crew member with a strange symptom can talk to a flight surgeon within minutes. On Mars the answer can take up to 44 minutes, so astronauts will have to check on themselves. Galley is a daily check-in that takes about a minute. The astronaut looks at the station screen, Galley recognizes their face on the device and turns the camera off, and then it walks through eight daily readings: resting heart rate, blood oxygen, skin temperature, sleep, mood, reaction-test lapses, food intake and exercise. Each reading is compared with that person's own last 14 days, not with a population average, because spaceflight shifts what "normal" looks like (core temperature rises about 1 °C on long missions). Seven written rules, each with a cited source, turn the result into one next step: rest and re-check, tell a crewmate, call the flight surgeon, or act now. On the ISS the report goes to Earth at once. On Mars, Galley guides the crew on board and queues the report. It runs offline and uses real NASA data from DONKI and OSDR. It is decision support, not a medical device.

## Demo link
<paste the unlisted YouTube link here, after testing it in a private window>

## Final project link
- App (public, no login): https://erickfp7314.github.io/synera-spaceapps/
- Code: https://github.com/ErickFP7314/synera-spaceapps
- Sensor firmware running in a simulator (Wokwi): https://wokwi.com/projects/480771036190862337

## Detailed description

### What it does
Galley replaces the daily health form with a short routine at a screen. Face login takes a few seconds and the camera switches off as soon as it finds a match. Then a figure of the body lights up zone by zone while the readings appear next to it.

We want to be clear about what that figure is. It is not a body scanner and it does not image anything. It is a way to group eight daily numbers so a tired person can read them at a glance:

- Head: sleep, mood (1 to 5), reaction-test lapses and skin temperature.
- Chest: resting heart rate and blood oxygen (SpO₂).
- Abdomen: food intake, as a share of the planned calories.
- Legs: exercise, as a share of the prescribed minutes. Muscle and bone loss in the legs is one of the main risks in microgravity, and exercise is the countermeasure. Nothing is measured on the legs or feet themselves.

Where the numbers come from matters too. Pulse, SpO₂ and skin temperature come from a small wearable: an ESP32 with a MAX30102 sensor on the fingertip and a skin-temperature probe. It sends one line of data per second over USB. We did not have a physical board for the hackathon, so the demo uses a 14-day simulated dataset, and the firmware runs in the Wokwi simulator. Sleep, mood, reaction-test lapses, food and exercise come from the daily log. Galley does not measure blood glucose. The data format has an optional field for a hand-entered value, but it never raises an alert and the app does not ask for it yet.

After the readings, Galley gives one next step and, when it is serious, writes an S-B-A-R report (Situation, Background, Assessment, Recommendation) for the flight surgeon. On the ISS and the Moon the report is sent at once. On Mars it is queued with the expected reply time, and the crew gets on-board steps in the meantime.

The app also has:

- a space-weather card that replays the real solar particle events of the May 2024 storm from NASA DONKI;
- 14-day charts for every reading, with the person's normal band and a day-by-day map of which readings left it;
- a card with real blood tests from the four Inspiration4 crew members (NASA OSDR);
- a "What does this mean?" panel on every reading. It explains what the reading measures, which spaceflight hazard affects it, what is normal for this person and what to do now, with a link to the NASA Human Research Program risk page.

### How it works
Each person's normal is the median of their last 14 days, leaving out the 3 most recent so a problem that is building up does not hide itself. A reading is compared with that median using a robust z-score (median and MAD). Fixed safety limits always win over the personal baseline. On top of that, seven rules combine readings:

- R1 flags short sleep.
- R2 flags acute fatigue: short sleep, plus reaction-test lapses or low mood, plus a heart rate above the baseline.
- R3 flags eating less than planned.
- R4 is an early infection warning: resting heart rate up for 2 days and temperature above the baseline, a pattern that wearable studies on Earth have used.
- R5 flags deconditioning.
- R6 flags a solar radiation storm (NASA DONKI solar particle event, or GOES flux of 10 pfu or more).
- R7 escalates to the S-B-A-R report.

The result is one of four action levels: self-care, tell the crew, flight surgeon, urgent. What happens at each level depends on where the crew is (ISS, Moon or Mars).

The app runs the same TypeScript engine that our tests check, compiled for the browser.

### Designed for the crew's day
The app has a day theme and a dim, warm "pre-sleep" theme without blue light, similar to the lighting modes the station already uses before sleep. It works in English and Spanish and uses a typeface built for legibility (Atkinson Hyperlegible). A colour is never the only signal: every status also has a shape and a word. If the browser has no built-in voice, Galley plays its own recorded clips and always shows the text on screen.

### How is our project creative? What factors did our team consider?
Most health apps compare you with a textbook range. We started from a different question: what is normal for this one person, up here, after weeks in orbit? So every colour in Galley is measured against the astronaut's own last 14 days, and the fixed safety limits only act as a floor. We checked the idea against real data before building on it. In the Inspiration4 blood tests from NASA OSDR, the four crew members' pre-flight glucose averages range from 71 to 80 mg/dL. Each person has their own level, and a population range hides that.

The second idea is that the same reading should lead to a different action depending on where the crew is. A low heart rate on the ISS means "call the flight surgeon now". The same reading on Mars, 44 minutes from an answer, means "here are the steps on board, and the report is already queued". On the ISS a crew member can even be brought home within days, as happened with Crew-11 in January 2026. On Mars that option does not exist, so the app has to be more useful on its own.

We also tried to make it feel like part of the station instead of a phone app. The screen borrows the look of the ISS interior, with labelled panels and readings shown as small inventory tags. The night theme copies the warm pre-sleep lighting the crew already uses to protect their sleep.

These are the factors we kept coming back to:

- Time. Crews have packed schedules, so the check-in has to fit in about a minute and end with a single next step.
- A tired reader. Each status uses colour, shape and a word, the voice reads only what needs attention, and it never says "danger".
- No connection. Everything runs offline, including the face models, the NASA data and the voice.
- Privacy. The camera is on only while matching a face, and nothing leaves the device.
- Medical honesty. Galley is decision support. Every rule cites a source, simulated data is labelled as simulated, and blood pressure and glucose never raise alerts because we cannot measure them well.
- Cost and parts we could actually get. The wearable is an ESP32 with a pulse sensor that costs a few dollars. When we had no board, we moved to a simulator instead of faking sensor readings.
- Language. The app works in English and Spanish, because our own team, and the clinics we have in mind on Earth, speak both.

### Why we think it helps
Astronauts get a usable answer when Earth is far away or out of contact. Every colour can be explained: you can see the baseline, the reading and the rule that fired. There is no black-box model making the call. Nothing leaves the device, and Galley keeps working without internet. The engine, the NASA data snapshots, the face models and the voice clips are all local, and after the first visit the web app is cached on the screen.

We are from Bolivia, and we kept thinking about the same problem at home. A rural clinic on the Altiplano has a weak connection and no specialist nearby, and at 3,600 m a resting SpO₂ in the low 90s can be normal. A tool that compares people with their own baseline and still works offline makes sense there too, and in polar stations.

### Tools
- Software: HTML, CSS and JavaScript without a framework, SVG, Web Speech and Web Audio, face-api (TensorFlow.js), the Web Serial API, and a TypeScript domain engine tested with node:test. Hosted on GitHub Pages.
- Hardware: ESP32 + MAX30102 pulse and SpO₂ sensor + skin-temperature sensor (DS18B20 or MAX30205), tested in the Wokwi simulator, plus a Python simulator that sends the same data.
- Data: Python scripts that download the NASA data and build the simulated dataset.

## Use of AI
- Google Gemini: early brainstorming.
- Claude and Claude Code (Anthropic): source research, help with code, the interface and documentation.
- face-api: face matching that runs on the device. It is not generative.
- Kokoro-82M (an open text-to-speech model): the recorded voice clips the app plays when a browser has no built-in voice. They are AI-generated audio and are used only inside the app.
- ElevenLabs (voice "Matilda", model eleven_multilingual_v2): the English voiceover of the demo video. It is AI-generated audio. The video says so on screen for its whole length ("AI-generated voice · ElevenLabs"), and the subtitles match the voice word for word.
- We did not use AI-generated images or video. If we add any, they will carry a visible watermark.
- The idea is the team's, and every medical claim cites a source.

## NASA data
- NASA DONKI: solar energetic particle events (https://api.nasa.gov/DONKI/SEP).
- NASA OSDR, SpaceX Inspiration4: OSD-575 (comprehensive metabolic panel, glucose) and OSD-569 (complete blood count, white blood cells).
- NASA Human Research Program: the 5 hazards of human spaceflight, the risk pages and ongoing HRP research.
- NASA MSL/RAD radiation measurements (Zeitlin et al. 2013; Hassler et al. 2014).
- NASA-STD-3001 Vol. 1 (career radiation limit).
- NASA ISS Research Explorer: ISS internal radiation monitoring.

## Space agency partner data & other references
- ASI: Di Fino et al. 2023, LIDAL radiation measurements on the ISS (Life Sci Space Res 39:26-42).
- CSA: Monitoring radiation for astronaut health (2026), Why do we conduct science experiments in space?, and Physical activity in space (ISS crews exercise about two hours a day).
- NOAA SWPC: GOES integral proton flux and the space weather scales.
- Code, fonts and libraries: @vladmandic/face-api (MIT, vendored in software/app/vendor/face-api), the anatomy isometric drawing kit (MIT, software/tools/anatomy-kit), Atkinson Hyperlegible Next and Mono (SIL Open Font License), and the SparkFun MAX3010x library.

## References (APA 7)
- Barger, L. K., Flynn-Evans, E. E., Kubey, A., Walsh, L., Ronda, J. M., Wang, W., Wright, K. P., & Czeisler, C. A. (2014). Prevalence of sleep deficiency and use of hypnotic drugs in astronauts before, during, and after spaceflight: an observational study. The Lancet Neurology, 13(9), 904–912. https://doi.org/10.1016/s1474-4422(14)70122-x
- Basner, M., Dinges, D. F., Mollicone, D., Ecker, A., Jones, C. W., Hyder, E. C., Di Antonio, A., Savelev, I., Kan, K., Goel, N., Morukov, B. V., & Sutton, J. P. (2013). Mars 520-d mission simulation reveals protracted crew hypokinesis and alterations of sleep duration and timing. Proceedings of the National Academy of Sciences, 110(7), 2635–2640. https://doi.org/10.1073/pnas.1212646110
- Basner, M., Mollicone, D., & Dinges, D. F. (2011). Validity and sensitivity of a brief psychomotor vigilance test (PVT-B) to total and partial sleep deprivation. Acta Astronautica, 69(11-12), 949–959. https://doi.org/10.1016/j.actaastro.2011.07.015
- Basner, M., Savitt, A., Moore, T. M., Port, A. M., McGuire, S., Ecker, A. J., Nasrini, J., Mollicone, D. J., Mott, C. M., McCann, T., Dinges, D. F., & Gur, R. C. (2015). Development and Validation of the Cognition Test Battery for Spaceflight. Aerospace Medicine and Human Performance, 86(11), 942–952. https://doi.org/10.3357/amhp.4343.2015
- Di Fino, L., Romoli, G., Santi Amantini, G., Boretti, V., Lunati, L., Berucci, C., Messi, R., Rizzo, A., Albicocco, P., De Donato, C., Masciantonio, G., Morone, M. C., Nobili, G., Baiocco, G., Mentana, A., Pullia, M., Tommasino, F., Carrubba, E., Bardi, A., et al. (2023). Radiation measurements in the International Space Station, Columbus module, in 2020–2022 with the LIDAL detector. Life Sciences in Space Research, 39, 26–42. https://doi.org/10.1016/j.lssr.2023.03.007
- Haig, K. M., Sutton, S., & Whittington, J. (2006). SBAR: A Shared Mental Model for Improving Communication Between Clinicians. The Joint Commission Journal on Quality and Patient Safety, 32(3), 167–175. https://doi.org/10.1016/s1553-7250(06)32022-3
- Kusumoto, F. M., Schoenfeld, M. H., Barrett, C., Edgerton, J. R., Ellenbogen, K. A., Gold, M. R., Goldschlager, N. F., Hamilton, R. M., Joglar, J. A., Kim, R. J., Lee, R., Marine, J. E., McLeod, C. J., Oken, K. R., Patton, K. K., Pellegrini, C. N., Selzman, K. A., Thompson, A., & Varosy, P. D. (2019). 2018 ACC/AHA/HRS guideline on the evaluation and management of patients with bradycardia and cardiac conduction delay: Executive summary. Heart Rhythm, 16(9), e227–e279. https://doi.org/10.1016/j.hrthm.2018.10.036
- O'Driscoll, B. R., Howard, L. S., Earis, J., & Mak, V. (2017). British Thoracic Society Guideline for oxygen use in adults in healthcare and emergency settings. BMJ Open Respiratory Research, 4(1), e000170. https://doi.org/10.1136/bmjresp-2016-000170
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
