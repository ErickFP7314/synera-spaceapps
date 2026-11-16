# Space Apps project page (final text to paste into the submission form, in English)

## Project name
Galley: the check-up that does itself

## High-level summary
On the ISS, a crew member who feels off can talk to a flight surgeon within minutes. On Mars a reply can take up to 44 minutes, so the crew will have to look after themselves much more. Galley is a short daily check-in for that situation. The astronaut stands at the station screen, Galley recognizes their face on the device, and the camera turns off. Then it goes through eight readings (resting heart rate, blood oxygen, skin temperature, sleep, mood, reaction-test lapses, food intake and exercise) and compares each one with that person's own last two weeks. A population average would mislead here, because spaceflight changes the body; core temperature rises about 1 °C on long missions. Seven rules, each backed by a published source, turn the result into one next step, anywhere from "rest and measure again" to "act now". On the ISS the report goes to Earth right away. On Mars, Galley walks the crew through what to do on board and queues the report. It works offline and uses real NASA data from DONKI and OSDR. It is decision support and does not diagnose anything.

## Demo link
<paste the unlisted YouTube link here, after testing it in a private window>

## Final project link
https://github.com/ErickFP7314/synera-spaceapps

## Detailed description

### What it does
You can try it in a browser at https://erickfp7314.github.io/synera-spaceapps/ (no login), and the sensor firmware runs in a simulator at https://wokwi.com/projects/480771036190862337. Both links are also at the top of the repository README.

Galley replaces the daily health form with about a minute at a screen. Face login takes a few seconds, and the camera switches off once it finds a match. After that, a drawing of the body lights up one zone at a time and the readings show up next to it.

That drawing is easy to misread, so to be clear: it is not a body scanner and nothing gets imaged. We use it to group eight daily numbers so someone who just woke up can read them quickly. The head zone holds sleep, mood (1 to 5), reaction-test lapses and skin temperature. The chest has resting heart rate and blood oxygen (SpO₂). The abdomen shows food intake as a share of the planned calories, and the legs show exercise as a share of the prescribed minutes. We put exercise on the legs because microgravity wears down leg muscle and bone, and exercise is how crews fight it. Nothing is actually measured on the legs or feet.

Three of the readings come from a small wearable: an ESP32 with a MAX30102 sensor on the fingertip and a skin-temperature probe, sending one line of data per second over USB. We never got a physical board during the hackathon, which was frustrating, so the demo runs on a 14-day simulated dataset and the firmware runs in the Wokwi simulator. Sleep, mood, reaction-test lapses, food and exercise come from the daily log. Galley does not measure blood glucose. The data format has an optional field for a typed-in value, but it never raises an alert and the app doesn't ask for it yet.

When something looks wrong, Galley gives one next step. In the serious cases it also writes an S-B-A-R report (Situation, Background, Assessment, Recommendation) for the flight surgeon. On the ISS and the Moon the report goes out right away. On Mars it waits in a queue with the expected reply time, and meanwhile the crew gets steps they can follow on board.

There is more further down the page. A space-weather card replays the real solar particle events of the May 2024 storm from NASA DONKI. The 14-day charts show every reading against the person's normal band, plus a day-by-day map of when each one drifted out. Another card has real blood tests from the four Inspiration4 crew members (NASA OSDR). Every reading also has a "What does this mean?" panel that explains what it measures, which spaceflight hazard affects it, what is normal for this person and what to do now, with a link to the NASA Human Research Program risk page.

### How it works
A person's normal is the median of their last 14 days. We leave out the 3 most recent days, so a problem that is slowly building doesn't drag the baseline along with it. Each reading is compared with that median using a robust z-score (median and MAD), and the fixed safety limits win whenever they are crossed. Seven rules then look at combinations of readings:

- R1 flags short sleep.
- R2 flags acute fatigue: short sleep, plus reaction-test lapses or low mood, plus a heart rate above the baseline.
- R3 flags eating less than planned.
- R4 is an early infection warning: resting heart rate up for 2 days and temperature above the baseline, a pattern that wearable studies on Earth have used.
- R5 flags deconditioning.
- R6 flags a solar radiation storm (a NASA DONKI solar particle event, or GOES flux of 10 pfu or more).
- R7 escalates to the S-B-A-R report.

The output is one of four action levels: self-care, tell the crew, flight surgeon, urgent. What each level triggers depends on whether the crew is on the ISS, the Moon or Mars. The browser runs the same TypeScript engine our tests check, compiled to JavaScript.

### Designed for the crew's day
There is a day theme and a dim, warm "pre-sleep" theme with no blue light. The station already switches its own lights to a warmer setting before sleep, and we borrowed that idea. The app works in English and Spanish, and it uses Atkinson Hyperlegible, a typeface designed for readers with low vision. Colour is never the only signal; each status also has an icon and a word. If the browser has no built-in voice (Brave, for example), Galley plays recorded clips, and the text always appears on screen as well.

### How is our project creative? What factors did our team consider?
Health apps usually compare you with a textbook range. We wanted to know what normal looks like for one specific person after weeks in orbit, and that question drove most of the design. Every colour in Galley comes from the astronaut's own last 14 days, with the fixed safety limits underneath as a backstop.

Before building on that idea we checked whether it held up on real data. In the Inspiration4 blood tests from NASA OSDR, the four crew members' average glucose before flight ranged from 71 to 80 mg/dL. They flew together and were tested by the same study, and each one still had a different baseline. Seeing that spread in actual numbers convinced us more than any paper did.

The Mars part is probably what we are proudest of. On the ISS a sick crew member can be brought home within days, which is what happened with Crew-11 in January 2026. On Mars a reply from Earth takes up to 44 minutes and there is no early ride home. So the same low heart rate leads to "call the flight surgeon now" on the ISS, and to step-by-step instructions plus a queued report on Mars. The farther away the crew is, the more the app has to handle by itself.

We also wanted the screen to look like it was made for the station. It borrows from the ISS interior, with labelled panels and readings shown like small inventory tags, and the night theme copies the station's pre-sleep lighting. We honestly don't know if everyone will like the inventory-tag look, but it made the readings easier for us to scan.

Most of our decisions came back to a handful of constraints. Crew days are tightly scheduled, so the check-in had to fit in about a minute and end with one next step. A minute seems realistic to us, though we could not test it with astronauts. People will often read it tired, which is why the voice only mentions readings that need attention and never uses the word "danger". There is no internet on Mars, so everything runs offline, face models and voice included. And the camera is only on while it matches a face. Nothing leaves the device.

We tried not to promise more than we can back up. Galley is decision support. Every rule cites a source. Simulated data is labelled as simulated, and blood pressure and glucose never raise alerts because we can't measure them reliably. The wearable parts, an ESP32 and a pulse sensor, cost a few dollars, and when we couldn't get a board in time we switched to a simulator rather than make up sensor readings. The app is in English and Spanish because that's what our team speaks, and it's what the clinics we have in mind on Earth speak too.

### Why we think it helps
When Earth is far away or out of contact, astronauts still get an answer they can act on. Anyone can check why a reading turned yellow by looking at the baseline next to it and the rule that fired; there is no hidden model making the call. Nothing leaves the device, and Galley keeps working without internet because the engine, the NASA data snapshots, the face models and the voice clips are stored locally. After the first visit, the browser keeps a full copy of the app.

We're from Bolivia, and we see a version of this problem at home. Rural clinics and small hospitals across Latin America often have a weak connection and no specialist nearby. That's true in the Bolivian Altiplano, and it's true in rural Paraguay. The Andes add one more complication. At 3,600 m a resting SpO₂ in the low 90s can be normal for the people who live there, and an alarm set for sea level would keep going off. A tool that compares people with their own baseline and works offline would fit there, and probably in polar stations as well.

### Tools
- Software: HTML, CSS and JavaScript without a framework, SVG, Web Speech and Web Audio, face-api (TensorFlow.js), the Web Serial API, and a TypeScript domain engine tested with node:test. Hosted on GitHub Pages.
- Hardware: ESP32 + MAX30102 pulse and SpO₂ sensor + skin-temperature sensor (DS18B20 or MAX30205), tested in the Wokwi simulator, plus a Python simulator that sends the same data.
- Data: Python scripts that download the NASA data and build the simulated dataset.

## Use of AI
- Google Gemini: early brainstorming.
- Claude and Claude Code (Anthropic): source research, help with code, the interface and documentation.
- face-api: face matching that runs on the device. It is not generative.
- Kokoro-82M (an open text-to-speech model): the recorded voice clips the app plays when a browser has no built-in voice. They are AI-generated audio and are used only inside the app.
- ElevenLabs (voice "Jon - Children's Storyteller", model eleven_multilingual_v2): the English voiceover of the demo video. It is AI-generated audio. The video says so on screen for its whole length ("AI-generated voice · ElevenLabs"), and the subtitles match the voice word for word.
- We did not use AI-generated images or video. If we add any, they will carry a visible watermark.
- The idea is the team's, and every medical claim cites a source.

## NASA data
- NASA DONKI: solar energetic particle events (https://api.nasa.gov/DONKI/SEP).
- NASA OSDR, SpaceX Inspiration4: OSD-575 (comprehensive metabolic panel, glucose) and OSD-569 (complete blood count, white blood cells).
- NASA Human Research Program: the 5 hazards of human spaceflight (https://www.nasa.gov/hrp/hazards/) and the seven risk pages each "What does this mean?" panel links to: sleep and irregular schedules, cardiovascular adaptations, hypoxia, behavioral conditions, inadequate food and nutrition, altered immune responses, and spaceflight-induced bone changes (https://www.nasa.gov/reference/risk-of-cardiovascular-adaptations/ and the matching pages).
- NASA MSL/RAD radiation measurements (Zeitlin et al. 2013; Hassler et al. 2014).
- NASA-STD-3001 Vol. 1 (career radiation limit).
- NASA ISS Research Explorer: ISS internal radiation monitoring.

## Space agency partner data & other references
- ASI: Di Fino et al. 2023, LIDAL radiation measurements on the ISS (Life Sci Space Res 39:26-42).
- CSA: Monitoring radiation for astronaut health (2026), Why do we conduct science experiments in space?, and Physical activity in space (ISS crews exercise about two hours a day).
- NOAA SWPC: GOES integral proton flux (https://services.swpc.noaa.gov/json/goes/primary/integral-protons-1-day.json) and the space weather scales.
- Code, fonts and libraries: @vladmandic/face-api (MIT, vendored in software/app/vendor/face-api), the anatomy isometric drawing kit (MIT, software/tools/anatomy-kit), Atkinson Hyperlegible Next and Mono (SIL Open Font License), and the SparkFun MAX3010x library.

## References (APA 7)
- Barger, L. K., Flynn-Evans, E. E., Kubey, A., Walsh, L., Ronda, J. M., Wang, W., Wright, K. P., & Czeisler, C. A. (2014). Prevalence of sleep deficiency and use of hypnotic drugs in astronauts before, during, and after spaceflight: an observational study. The Lancet Neurology, 13(9), 904–912. https://doi.org/10.1016/s1474-4422(14)70122-x
- Basner, M., Dinges, D. F., Mollicone, D., Ecker, A., Jones, C. W., Hyder, E. C., Di Antonio, A., Savelev, I., Kan, K., Goel, N., Morukov, B. V., & Sutton, J. P. (2013). Mars 520-d mission simulation reveals protracted crew hypokinesis and alterations of sleep duration and timing. Proceedings of the National Academy of Sciences, 110(7), 2635–2640. https://doi.org/10.1073/pnas.1212646110
- Basner, M., Mollicone, D., & Dinges, D. F. (2011). Validity and sensitivity of a brief psychomotor vigilance test (PVT-B) to total and partial sleep deprivation. Acta Astronautica, 69(11-12), 949–959. https://doi.org/10.1016/j.actaastro.2011.07.015
- Basner, M., Savitt, A., Moore, T. M., Port, A. M., McGuire, S., Ecker, A. J., Nasrini, J., Mollicone, D. J., Mott, C. M., McCann, T., Dinges, D. F., & Gur, R. C. (2015). Development and Validation of the Cognition Test Battery for Spaceflight. Aerospace Medicine and Human Performance, 86(11), 942–952. https://doi.org/10.3357/amhp.4343.2015
- Crucian, B. E., Choukèr, A., Simpson, R. J., Mehta, S., Marshall, G., Smith, S. M., Zwart, S. R., Heer, M., Ponomarev, S., Whitmire, A., Frippiat, J. P., Douglas, G. L., Lorenzi, H., Buchheim, J.-I., Makedonas, G., Ginsburg, G. S., Ott, C. M., Pierson, D. L., Krieger, S. S., et al. (2018). Immune System Dysregulation During Spaceflight: Potential Countermeasures for Deep Space Exploration Missions. Frontiers in Immunology, 9. https://doi.org/10.3389/fimmu.2018.01437
- Di Fino, L., Romoli, G., Santi Amantini, G., Boretti, V., Lunati, L., Berucci, C., Messi, R., Rizzo, A., Albicocco, P., De Donato, C., Masciantonio, G., Morone, M. C., Nobili, G., Baiocco, G., Mentana, A., Pullia, M., Tommasino, F., Carrubba, E., Bardi, A., et al. (2023). Radiation measurements in the International Space Station, Columbus module, in 2020–2022 with the LIDAL detector. Life Sciences in Space Research, 39, 26–42. https://doi.org/10.1016/j.lssr.2023.03.007
- Haig, K. M., Sutton, S., & Whittington, J. (2006). SBAR: A Shared Mental Model for Improving Communication Between Clinicians. The Joint Commission Journal on Quality and Patient Safety, 32(3), 167–175. https://doi.org/10.1016/s1553-7250(06)32022-3
- Hassler, D. M., Zeitlin, C., Wimmer-Schweingruber, R. F., Ehresmann, B., Rafkin, S., Eigenbrode, J. L., Brinza, D. E., Weigle, G., Böttcher, S., Böhm, E., Burmeister, S., Guo, J., Köhler, J., Martin, C., Reitz, G., Cucinotta, F. A., Kim, M.-H., Grinspoon, D., Bullock, M. A., et al. (2014). Mars' Surface Radiation Environment Measured with the Mars Science Laboratory's Curiosity Rover. Science, 343(6169). https://doi.org/10.1126/science.1244797
- Kusumoto, F. M., Schoenfeld, M. H., Barrett, C., Edgerton, J. R., Ellenbogen, K. A., Gold, M. R., Goldschlager, N. F., Hamilton, R. M., Joglar, J. A., Kim, R. J., Lee, R., Marine, J. E., McLeod, C. J., Oken, K. R., Patton, K. K., Pellegrini, C. N., Selzman, K. A., Thompson, A., & Varosy, P. D. (2019). 2018 ACC/AHA/HRS guideline on the evaluation and management of patients with bradycardia and cardiac conduction delay: Executive summary. Heart Rhythm, 16(9), e227–e279. https://doi.org/10.1016/j.hrthm.2018.10.036
- Mehta, S. K., Laudenslager, M. L., Stowe, R. P., Crucian, B. E., Feiveson, A. H., Sams, C. F., & Pierson, D. L. (2017). Latent virus reactivation in astronauts on the international space station. Npj Microgravity, 3(1). https://doi.org/10.1038/s41526-017-0015-y
- Mishra, T., Wang, M., Metwally, A. A., Bogu, G. K., Brooks, A. W., Bahmani, A., Alavi, A., Celli, A., Higgs, E., Dagan-Rosenfeld, O., Fay, B., Kirkpatrick, S., Kellogg, R., Gibson, M., Wang, T., Hunting, E. M., Mamic, P., Ganz, A. B., Rolnik, B., et al. (2020). Pre-symptomatic detection of COVID-19 from smartwatch data. Nature Biomedical Engineering, 4(12), 1208–1220. https://doi.org/10.1038/s41551-020-00640-6
- O'Driscoll, B. R., Howard, L. S., Earis, J., & Mak, V. (2017). British Thoracic Society Guideline for oxygen use in adults in healthcare and emergency settings. BMJ Open Respiratory Research, 4(1), e000170. https://doi.org/10.1136/bmjresp-2016-000170
- Page, E. S. (1954). Continuous inspection schemes. Biometrika, 41(1-2), 100–115. https://doi.org/10.1093/biomet/41.1-2.100
- Quer, G., Radin, J. M., Gadaleta, M., Baca-Motes, K., Ariniello, L., Ramos, E., Kheterpal, V., Topol, E. J., & Steinhubl, S. R. (2020). Wearable sensor data and self-reported symptoms for COVID-19 detection. Nature Medicine, 27(1), 73–77. https://doi.org/10.1038/s41591-020-1123-x
- Smarr, B. L., Aschbacher, K., Fisher, S. M., Chowdhary, A., Dilchert, S., Puldon, K., Rao, A., Hecht, F. M., & Mason, A. E. (2020). Feasibility of continuous fever monitoring using wearable devices. Scientific Reports, 10(1). https://doi.org/10.1038/s41598-020-78355-6
- Smith, S. M., Zwart, S. R., Block, G., Rice, B. L., & Davis-Street, J. E. (2005). The Nutritional Status of Astronauts Is Altered after Long-Term Space Flight Aboard the International Space Station. The Journal of Nutrition, 135(3), 437–443. https://doi.org/10.1093/jn/135.3.437
- Stahn, A. C., Werner, A., Opatz, O., Maggioni, M. A., Steinach, M., von Ahlefeld, V. W., Moore, A., Crucian, B. E., Smith, S. M., Zwart, S. R., Schlabs, T., Mendt, S., Trippel, T., Koralewski, E., Koch, J., Choukèr, A., Reitz, G., Shang, P., Röcker, L., et al. (2017). Increased core body temperature in astronauts during long-duration space missions. Scientific Reports, 7(1). https://doi.org/10.1038/s41598-017-15560-w
- Van Dongen, H. P. A., Maislin, G., Mullington, J. M., & Dinges, D. F. (2003). The Cumulative Cost of Additional Wakefulness: Dose-Response Effects on Neurobehavioral Functions and Sleep Physiology From Chronic Sleep Restriction and Total Sleep Deprivation. Sleep, 26(2), 117–126. https://doi.org/10.1093/sleep/26.2.117
- Watson, N. F., Badr, M. S., Belenky, G., Bliwise, D. L., Buxton, O. M., Buysse, D., Dinges, D. F., Gangwisch, J., Grandner, M. A., Kushida, C., Malhotra, R. K., Martin, J. L., Patel, S. R., Quan, S., & Tasali, E. (2015). Recommended Amount of Sleep for a Healthy Adult: A Joint Consensus Statement of the American Academy of Sleep Medicine and Sleep Research Society. Sleep. https://doi.org/10.5665/sleep.4716
- Zeitlin, C., Hassler, D. M., Cucinotta, F. A., Ehresmann, B., Wimmer-Schweingruber, R. F., Brinza, D. E., Kang, S., Weigle, G., Böttcher, S., Böhm, E., Burmeister, S., Guo, J., Köhler, J., Martin, C., Posner, A., Rafkin, S., & Reitz, G. (2013). Measurements of Energetic Particle Radiation in Transit to Mars on the Mars Science Laboratory. Science, 340(6136), 1080–1084. https://doi.org/10.1126/science.1235989
- Zhang, S., Wimmer-Schweingruber, R. F., Yu, J., Wang, C., Fu, Q., Zou, Y., Sun, Y., Wang, C., Hou, D., Böttcher, S. I., Burmeister, S., Seimetz, L., Schuster, B., Knierim, V., Shen, G., Yuan, B., Lohf, H., Guo, J., Xu, Z., et al. (2020). First measurements of the radiation dose on the lunar surface. Science Advances, 6(39). https://doi.org/10.1126/sciadv.aaz1334
- National Aeronautics and Space Administration. (2022). *NASA-STD-3001, NASA space flight human-system standard, Volume 1, Revision B: Crew health* (Section 4.8.2, requirement V1 4030, career radiation limit).
- NASA Community Coordinated Modeling Center. (n.d.). *DONKI: Space Weather Database Of Notifications, Knowledge, Information* [Data set]. Retrieved November 15, 2026, from https://ccmc.gsfc.nasa.gov/tools/DONKI/
- NASA Open Science Data Repository. (n.d.). *OSD-575 and OSD-569: SpaceX Inspiration4 metabolic panel and complete blood count* [Data set]. Retrieved November 15, 2026, from https://osdr.nasa.gov/bio/repo/data/studies/OSD-575
- National Aeronautics and Space Administration. (n.d.). *Human Research Program: Risks*. Retrieved November 15, 2026, from https://www.nasa.gov/hrp/risks/
- NOAA Space Weather Prediction Center. (n.d.). *NOAA space weather scales*. Retrieved November 15, 2026, from https://www.swpc.noaa.gov/noaa-scales-explanation
