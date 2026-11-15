# Plan Maestro v2 — Synera · Galley Health Monitor
**NASA Space Apps Challenge 2026 · Universal Event (virtual) · 14–15 nov 2026**
*Reto: "Create Health Monitoring Software for Astronauts on Space Missions" (Intermedio · Human Exploration, Software, Space Exploration)*

> **Revisión v2 — domingo 15 nov 2026, 09:00 (UTC-4).** Cierre de envío: **hoy 23:59, hora local del Team Owner**. Meta interna: **enviar a las 20:00** y luego solo mejorar (se puede reenviar las veces que haga falta; cuenta la última versión guardada).
> Este documento reemplaza al plan v1. Todo lo marcado **VERIFICAR** se confirma con la fuente antes de mostrarlo como hecho.
>
> **v2.1 (09:40):**
> - Datos reales de NASA ya están en el repo (`data/`): OSDR Inspiration4, DONKI y GOES.
> - Contratos, umbrales, motor (`npm test` 9/9), simulador, firmware, README (EN) y `WORKFLOW.md` quedaron alineados.
> - Tareas por equipo en Trello.
> - Las incoherencias del §2.3 están corregidas.

---

## 0. Veredicto: ¿alcanza para ganar?

**El concepto es competitivo, pero hoy no alcanza para ganar.** Puede llegar si en las horas que quedan cerramos cuatro brechas. Puede ganar el premio local y entrar a la nominación global; para un premio global hay que ejecutar sin errores.

| Lo que ya juega a favor | Lo que hoy nos puede hacer perder |
|---|---|
| Responde casi todo lo que pide el texto del reto: figura humana clicable, colores, entornos, instrucciones simples. | **Eso mismo lo hará la mayoría de equipos.** El propio reto sugiere la figura clicable, el semáforo y los gráficos. No es diferenciador; es lo mínimo esperado. |
| Prototipo funcionando (escaneo, voz, cámara, registro, S-B-A-R, ISS/Marte). | **Datos de NASA débiles.** Todo era simulado. Para premio global es obligatorio usar al menos un dato o recurso de NASA. → **Resuelto en v2.1:** OSDR Inspiration4 + DONKI + HRP (§7). |
| Ética y honestidad: no diagnostica, cámara solo en el chequeo, límites declarados. | **Umbrales sin fuente.** `contracts/medical-ranges-config.json` cita "NASA Clinical Practice Guidelines & Artemis Medical Standards", que no es una fuente real para esas cifras. Es un riesgo de **Validez**. |
| Diferencia ISS vs Marte (retardo de comunicaciones), con un reporte S-B-A-R. | **Incoherencias entre README, plan, PDF y código.** Ver §2.3: ánimo 1–5 vs 1–10, sensores descartados que aparecen como usados, 3 vs 4 niveles y dos repositorios distintos. |
| | **La "línea base personal" se anuncia, pero no se usa.** `rulesEngine.ts` usa umbrales fijos (sueño < 6, FC > 85, T > 37,6). Con un solo valor "habitual" de registro, σ = 0 y `calculateZScore` devuelve siempre 0. |

**Las 4 brechas que deciden el resultado (en orden):**
1. **Entrega impecable:** demo ≤ 30 s con subtítulos en inglés (o ≤ 7 diapositivas), página del proyecto en inglés, enlaces públicos probados. Si se pasa del límite queda **fuera de la evaluación global**.
2. **Datos reales de NASA y agencias socias dentro de la app:** clima espacial (NASA DONKI), dosis de radiación ISS (ASI, socia 2026), recursos HRP y CSA del reto. Ver §7.
3. **Validez científica visible:** cada umbral y regla con su cita (§5–6) y datos simulados *calibrados* con estudios de vuelo publicados.
4. **Un diferenciador que nadie más tenga:** autonomía según el retardo (ISS / Luna / Marte) + línea base personal justificada por la fisiología espacial (la temperatura central sube ~1 °C en vuelo largo; un umbral fijo de fiebre falla) + un test objetivo de fatiga validado por NASA (PVT-B de 3 min).

---

## 1. El reto oficial y cómo nos evalúan

### 1.1 Lo que pide el reto (texto oficial, resumido)
- **Objetivo:** "una herramienta visual que ayude a los astronautas a evaluar su propia salud durante misiones y que oriente sobre tratamientos y mejoras de salud". Los datos pueden entrar por cualquier medio: teclado, clics o cámara.
- **Indicadores sugeridos:** presión arterial, frecuencia cardíaca, glucosa, temperatura, horas de sueño y ánimo.
- **Preguntas que el reto quiere ver respondidas:** ¿qué se puede medir en el espacio?, ¿por qué hace falta cada examen?, ¿cómo afectan los peligros a cada indicador?, ¿cuándo avisar a la tripulación o a los cirujanos de vuelo?, ¿qué acciones previenen una condición crítica?
- **Consideraciones opcionales:** distintos entornos (nave, estación, rover, base planetaria), recordatorios de rutina, gamificación, gráficos dinámicos, código de colores e instrucciones simples ("no asumir que el astronauta sabe evaluarse").
- **Contexto:** el texto oficial ya menciona que "Artemis logró un sobrevuelo lunar tripulado" (Artemis II, abril 2026).

### 1.2 Recursos oficiales del reto (hay que usarlos y citarlos)
| Agencia | Recurso | URL |
|---|---|---|
| NASA | 5 Hazards of Human Spaceflight (HRP) | https://www.nasa.gov/hrp/hazards/ |
| NASA | Risks of Human Spaceflight (HRP) | https://www.nasa.gov/hrp/risks/ |
| NASA | Ongoing HRP Research in Space | https://www.nasa.gov/hrp/ongoing-hrp-research/ |
| CSA | Monitoring Radiation for Astronaut Health (26-feb-2026): espectrómetro de neutrones CANS; los neutrones aportan ~30 % de la radiación en la ISS | https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp |
| CSA | Why do we conduct science experiments in space? | https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp |

### 1.3 Criterios de evaluación (los 5 pesan igual) y qué hacemos para cada uno
| Criterio | Qué miran | Acción concreta de Galley |
|---|---|---|
| **Impacto** | ¿Resuelve un problema real e importante? | Caso Crew-11 (ene-2026), autonomía médica en Marte y transferencia a la Tierra: clínicas remotas sin médico ni conectividad estable (§3.3). |
| **Creatividad** | ¿Es original? | "El chequeo que se hace solo" + autonomía según el retardo + PVT-B + clima espacial real. No basta con la figura del cuerpo. |
| **Validez** | ¿La ciencia es correcta y está citada? | Tabla de umbrales con fuentes (§5), datos sintéticos calibrados con estudios de vuelo, "no es dispositivo médico". |
| **Relevancia** | ¿Responde al reto? ¿Es completo, factible y usable? | Matriz pregunta del reto → pantalla (§1.4); los 5 peligros RIDGE; recursos HRP y CSA citados dentro de la app. |
| **Presentación** | ¿Se entiende rápido? | Video ≤ 30 s con historia clara (§11.2), capturas en la página y README en inglés. |

### 1.4 Matriz: pregunta del reto → dónde se responde en la app
| Pregunta del reto | Respuesta en Galley |
|---|---|
| ¿Qué se puede medir en el espacio? | Tabla de indicadores (§5) + botón "What does this mean?" → Q1 |
| ¿Por qué hace falta cada examen? | Cada zona del cuerpo explica su función y el riesgo HRP asociado (con enlace oficial) |
| ¿Cómo afectan los peligros a cada indicador? | Etiqueta RIDGE por indicador + Q2 del botón explicativo |
| ¿Cuándo avisar a la tripulación o a Tierra? | Matriz de escalamiento de 4 niveles × entorno ISS / Luna / Marte (§6.4, §6.5) |
| ¿Qué acciones previenen lo crítico? | Paso a paso en lenguaje simple por regla (§6) y remisión a la lista médica de a bordo |

---

## 2. Diagnóstico del estado actual

### 2.1 Fortalezas (no tocar, solo pulir)
- Escaneo de 4 zonas con voz ES/EN, alarma y barra de progreso.
- Registro con consentimiento y apagado de cámara.
- Selector de entorno con mensajes distintos.
- S-B-A-R en pantalla.
- Documentación honesta de límites (PDF §7).

### 2.2 Brechas técnicas y científicas
1. **Línea base no operativa.** Con un único valor habitual por persona no hay desviación estándar. **Solución:** usar σ mínima por indicador (§6.1) hasta tener ≥ 5 días de historia.
2. **Reglas con umbrales fijos poblacionales.** Contradicen el diferenciador. **Solución:** reglas expresadas como desviación de la línea base + límites absolutos de seguridad (§6).
3. **Temperatura con umbral fijo (37,6 °C).** En misiones largas la temperatura central de reposo sube ~1 °C en ~2,5 meses (Stahn et al., 2017), así que un umbral fijo da falsos positivos. Además, el MAX30205 mide **piel**, no núcleo. **Solución:** usar el delta respecto a la línea base y rotular la medición como "temperatura cutánea".
4. **Presión arterial y glucosa** siguen en `types.ts`, `medical-ranges-config.json` y en una regla de estrés cardiovascular, aunque están fuera del alcance. **Solución:** dejarlas como "entrada manual opcional / trabajo futuro". Que no disparen alertas en el demo.
5. **HRV y SpO₂ con MAX30102:** el sensor de dedo no es de grado clínico y la HRV no es confiable con él. **Solución:** no prometer HRV. Mostrar SpO₂ solo si llega con calidad de señal válida.

### 2.3 Incoherencias a corregir antes de enviar (los jueces abren el repo)
| Tema | Dónde choca | Decisión v2 |
|---|---|---|
| Escala de ánimo | App 1–5 · plan/README/config 1–10 · regla `moodScore <= 5` | **1–5 en todo** (más rápida de contestar); ajustar reglas |
| Niveles de alerta | PDF: 3 · README/plan: 4 | **3 colores + 4 niveles de acción** (§6.4) |
| Sensores | README lista AD8232, MLX90614, BMI270 y PocketGeiger como si se usaran | Tabla única "usado / simulado / futuro" (§8) |
| Radiación | README: fotodiodo PIN físico · plan: simulada | Dato **real** de NASA DONKI + baseline ASI; sin sensor físico (§7) |
| Repositorio | PDF: `BrendaCali/Nasa` · README: `ErickFP7314/synera-spaceapps` | **Un solo repo público** con app + docs + GitHub Pages |
| Persistencia | Plan: "localStorage / SQLite" | **localStorage** (IndexedDB = futuro) |
| Artemis II | Docs: "midió sueño, estrés…" como resultado | Incluyó el estudio **ARCHeR** con actígrafos; **aún no hay resultados publicados** |
| Número de miembros | PDF: duda entre 6 y 7 | Confirmar en reglas/registro (máximo por equipo: VERIFICAR) |

> ✅ **v2.1:** todas las filas de esta tabla quedaron corregidas en el repo. La única pendiente es que Software decida mover el prototipo a este repo (Trello).
> ✅ **Privacidad:** el documento de identidad se retiró, y `.gitignore` bloquea `*.pdf` y `*.zip` (salvo `PROYECTO_GALLEY_ES.pdf`). Para los artículos se cita el DOI.

---

## 3. Propuesta de valor y diferenciadores

### 3.1 Frase
**Galley — "The check-up that does itself."** Un chequeo de 60 segundos sin formularios: compara a cada astronauta contra *su propio normal* y le dice qué hacer, aunque la Tierra tarde 44 minutos en contestar.

### 3.2 Diferenciadores (lo que otros equipos probablemente no tendrán)
1. **Autonomía según el retardo.** La misma alerta se comporta distinto en ISS (avisar al cirujano de vuelo ya), en la Luna (~1,3 s por trayecto; aviso casi inmediato) y en Marte (~3–22 min por trayecto y apagón de ~2 semanas en la conjunción solar cada ~26 meses). En Marte hay protocolo guiado a bordo y un S-B-A-R en cola, con hora estimada de respuesta.
2. **Línea base personal con argumento espacial.** La fisiología cambia en vuelo: la temperatura sube ~1 °C (Stahn 2017) y en la ISS se duerme ~6,1 h de promedio (Barger 2014). Los rangos poblacionales terrestres no sirven; la comparación tiene que ser contra uno mismo.
3. **Fatiga objetiva, no solo subjetiva.** Un **PVT-B de 3 minutos** (Basner, Mollicone y Dinges, 2011, *Acta Astronautica*), el mismo tipo de prueba de la batería *Cognition* de NASA, complementa la escala de ánimo.
4. **Detección temprana de infección con evidencia.** Pulso en reposo y temperatura por encima de la línea base personal: el enfoque validado en Tierra con wearables (Mishra 2020; Smarr 2020; Quer 2021), aplicado al riesgo HRP de sistema inmune alterado (Crucian 2018; Mehta 2017).
5. **Radiación con datos reales.** Eventos de partículas solares de **NASA DONKI** más el flujo de protones GOES. La línea base de dosis de la ISS viene de **ASI/LIDAL** (Di Fino 2023) y la orientación usa el recurso de la CSA.
6. **Privacidad por diseño.** Reconocimiento facial 100 % local, cámara encendida solo durante el chequeo, botón de borrar y nada sale del dispositivo.

### 3.3 Beneficio en la Tierra (para el cierre del video: "look to the future")
El mismo modelo (local-first, línea base personal, reporte S-B-A-R en cola, conectividad intermitente) sirve para **puestos de salud rurales y comunidades remotas de altura** (por ejemplo, el Altiplano andino, donde la SpO₂ normal es más baja y un umbral poblacional confunde), bases antárticas, buques y plataformas.

---

## 4. Alcance congelado para hoy

**Regla de oro:** a las 09:30 no entra nada nuevo que no esté en P0 o P1.

| Prioridad | Qué | Dueño | Tiempo |
|---|---|---|---|
| **P0** (sin esto no hay entrega) | Video ≤ 30 s con subtítulos EN (o 7 diapositivas EN) | Bio (guion) · Software (grabaciones) · Hardware (edición) | 3 h |
| **P0** | Página del proyecto en inglés (`submission/project-page.md`): summary, descripción, NASA data, referencias, uso de IA | Bio | 3 h |
| **P0** | Repo público único + app desplegada en GitHub Pages, probada en ventana privada | Software | 1 h |
| **P0** | Coherencia: ánimo 1–5, 4 niveles, sin BP/glucosa en alertas, README sincronizado (§2.3) | Software + Docs | 1,5 h |
| **P1** (sube el puntaje) | Tarjeta de **clima espacial / radiación** con snapshot real de DONKI (tormenta solar de mayo 2024) y fetch en vivo opcional | Software | 2 h |
| **P1** | Tarjeta **"Real astronaut data"**: laboratorio real de Inspiration4 (OSDR) con línea base personal vs rango poblacional | Software (UI) + Bio (texto) | 1 h |
| **P1** | **σ mínima + reglas por desviación personal** (§6); etiqueta "Fuente:" en cada indicador | Software + Bio | 2 h |
| **P1** | **Datos sintéticos calibrados** con estudios de vuelo y 3 escenarios + 1 de infección (§7.2) | Bio | 2 h |
| **P1** | Botón "What does this mean?" con las 4 respuestas y el enlace HRP oficial por indicador | Bio + Software | 1,5 h |
| **P2** (solo si P0 y P1 están listos a las 16:00) | PVT-B de 3 min en el navegador | Software | 1,5 h |
| **P2** | Sensor real ESP32 + MAX30102 por Web Serial (go/no-go a las 12:00) | Hardware | — |
| **P2** | Vista Luna (tercer entorno) | Software | 0,5 h |
| **FUERA** | ECG AD8232, rPPG, PA y glucosa por hardware, chatbot médico, bloqueo de EVA, servidor/panel multiusuario, dosímetro físico, reconocer comida por cámara | — | — |

---

## 5. Indicadores, umbrales y fuentes

**Lógica de color:** (1) desviación de la línea base personal; (2) límites absolutos de seguridad que ganan siempre; (3) combinaciones y tendencias (§6). Los cortes marcados como "operativo" son decisiones de diseño del prototipo basadas en las fuentes. Se declaran como tales.

| Indicador (zona) | Fuente en demo | Verde | Amarillo | Rojo (o límite absoluto) | Riesgo HRP / RIDGE | Fuentes |
|---|---|---|---|---|---|---|
| **FC en reposo** (Pecho) | Sensor / simulado | dentro de ±2σ de su base | \|z\| ≥ 2 **o** < 50 / > 100 lpm | \|z\| ≥ 3 **o** < 40 / > 120 lpm | Cardiovascular Adaptations · G | Kusumoto 2019 (guía bradicardia, < 50 lpm); definición clínica de taquicardia (> 100); HRP Cardiovascular |
| **SpO₂** (Pecho) | Sensor / simulado | ≥ 94 % | 90–93 % | < 90 % | Risk of Hypoxia · E | O'Driscoll 2017 (BTS, objetivo 94–98 %); HRP Hypoxia |
| **Temperatura cutánea** (Cabeza) | Sensor / simulado | < base + 0,5 °C | ≥ base + 0,5 °C | ≥ base + 1,0 °C **o** ≥ 38,5 °C | Altered Immune Responses · E | Stahn 2017 (+~1 °C en vuelo largo); Smarr 2020 (fiebre con wearables) |
| **Sueño** (Cabeza) | Registro / simulado | ≥ 6 h y ≥ base − 1 h (consejo R1 si < 7 h) | < 6 h **o** < base − 1 h | < 5 h **o** 3 noches seguidas < 6 h | Inadequate Sleep & Irregular Schedules · I/E | Watson 2015 (≥ 7 h); Barger 2014 (ISS 6,09 h; solo 24 % de noches ≥ 7 h); Van Dongen 2003 (deuda acumulada) |
| **Ánimo 1–5** (Cabeza) | Registro | ≥ 3 y estable | ≤ 2 **o** caída ≥ 2 puntos vs base | 1 durante ≥ 2 días | Behavioral Conditions & Psychiatric Disorders · I | HRP Behavioral; Basner 2013 (Mars-500) |
| **PVT-B 3 min** (Cabeza, P2) | Test en pantalla | lapsos ≤ base + 2 | lapsos ≥ base + 3 | lapsos ≥ base + 6 (operativo) | Sleep / Behavioral · I | Basner 2011 (lapso PVT-B = TR > 355 ms); Basner 2015 (Cognition) |
| **Ingesta % del plan** (Abdomen) | Registro | ≥ 80 % | < 80 % (R3 si 2 días) | < 70 % durante ≥ 3 días (operativo) | Inadequate Food & Nutrition · E | HRP Nutrition; Smith 2005 (las tripulaciones de la ISS comen por debajo del requerimiento; ~80 %, VERIFICAR cifra); ESA EveryWear 2017; NASA ISS FIT |
| **Ejercicio % de la prescripción** (Piernas) | Registro | ≥ 75 % | < 75 % | < 50 % durante ≥ 3 días (operativo) | Bone Changes / Muscle · G | HRP Bone (pérdida de 1–1,5 %/mes sin contramedidas); prescripción ISS ~2 h/día (VERIFICAR) |
| **Radiación** (Cuerpo entero) | **Real**: DONKI + GOES; base ASI | Fondo nominal del entorno | Evento SEP activo / ≥ S1 (≥ 10 pfu, ≥ 10 MeV) | ≥ S3 (≥ 1000 pfu) **o** dosis acumulada > umbral de misión | Space Radiation · R | Di Fino 2023 (ISS 1,8–2,4 nGy/s ≈ 0,16–0,21 mGy/día); Zeitlin 2013 (crucero a Marte 1,84 mSv/día); Hassler 2014 (superficie de Marte ~0,64 mSv/día); Zhang 2020 (superficie lunar ~1,37 mSv/día); NASA-STD-3001 Vol. 1 (límite de carrera 600 mSv); escala NOAA S |

> **Glucosa:** entrada manual informativa, sin alertas. Como dato de ejemplo se usa el laboratorio **real** de la tripulación Inspiration4 (NASA OSDR OSD-575; rango de laboratorio 65–99 mg/dL).
> **Presión arterial:** trabajo futuro (tensiómetro BLE); no se mide ni alerta en el MVP.
> **Fuente única de los umbrales:** `contracts/medical-ranges-config.json`.

---

## 6. Motor de reglas v2 (determinista y explicable)

### 6.1 Línea base personal robusta
- **Arranque:** el valor habitual del registro es la media inicial. La σ mínima por indicador evita z = 0: FC 4 lpm · Temp 0,25 °C · Sueño 0,6 h · Ánimo 0,7 · Ingesta 8 % · Ejercicio 10 min (operativo; ajustable).
- **Con ≥ 5 días elegibles:** mediana y MAD de los últimos 14 días, **excluyendo los 3 más recientes**, para que un problema en curso no contamine su propia línea base. `escala = max(1,4826 · MAD, σ_min)`; `z_robusto = (x − mediana) / escala`.
- **Tendencia:** CUSUM de un lado sobre z (Page 1954). `S_t = max(0, S_{t−1} + z_t − 0,5)`; alerta si `S_t > 4`. Reemplaza la regla "3 días bajando seguidos", que es muy sensible al ruido.

### 6.2 Reglas combinadas (cada una con su fuente y su texto en lenguaje simple)
| ID | Si ocurre… | Nivel | Qué dice la app | Fuentes |
|---|---|---|---|---|
| R1 Sueño | Sueño < 7 h **o** < base − 1 h | 1 | "Adelanta tu hora de dormir y respeta el horario; evita pantallas antes de dormir." | Watson 2015; HRP Sleep |
| R2 Fatiga aguda | Sueño < 6 h (o 2 noches < base − 1,5 h) **+** (PVT lapsos ≥ base + 3 **o** ánimo ≤ 2) **+** FC reposo ≥ base + 2σ | 2 → 3 si persiste 48 h | "Señales de fatiga. Avisa al comandante, evita tareas críticas hasta descansar; vuelve a medir tras dormir." | Van Dongen 2003; Basner 2011; Barger 2014 |
| R3 Nutrición | Ingesta < 80 % durante ≥ 48 h (+ fatiga = sube un nivel) | 2 | "Come una porción extra del menú disponible y bebe agua; se informa al cirujano de vuelo." | HRP Nutrition; Smith 2005 |
| R4 Infección temprana | FC reposo ≥ base + 2σ durante 2 días **+** Temp ≥ base + 0,5 °C (la caída de sueño solo se reporta como apoyo) | 2 → 3 si Temp ≥ base + 1 °C | "Posible proceso infeccioso o inflamatorio. Revisa síntomas, mide cada 4 h, usa tapabocas si lo indica la lista médica." | Mishra 2020; Smarr 2020; Quer 2021; Crucian 2018; Mehta 2017 |
| R5 Desacondicionamiento | Ejercicio < 50 % durante ≥ 3 días | 2 | "Recupera tu sesión de ejercicio resistivo; es la contramedida #1 para hueso y músculo." | HRP Bone/Muscle |
| R6 Radiación | Evento SEP de DONKI o flujo GOES ≥ S1 | 2 (≥ S3 → 4) | "Tormenta de partículas solares: sigue el procedimiento de refugio de la nave y pospón las EVA; registra la dosis." | NOAA S-scale; DONKI; CSA; NASA-STD-3001 |
| R7 Escalamiento S-B-A-R | Cualquier rojo o ≥ 2 reglas activas | 3–4 | Genera el reporte S-B-A-R y lo encola o envía según el entorno | Haig 2006 (SBAR) |

> La app **sugiere y orienta**: no bloquea tareas ni receta. Para medicamentos dice "sigue la lista médica de a bordo / consulta al cirujano de vuelo".

### 6.3 Índice de chequeo corporal
Se mantiene: es el porcentaje de indicadores dentro de su rango habitual, con amarillo = 0,5. Se rotula siempre "resumen simple, no probabilidad médica".

### 6.4 Colores → niveles de acción
| Nivel | Disparo | Acción |
|---|---|---|
| 1 Autocuidado | Todo verde o un amarillo aislado | Consejo + próximo chequeo en 24 h |
| 2 Tripulación | ≥ 2 amarillos, una regla combinada o una tendencia CUSUM | Avisar a un compañero (supervisión cruzada) y repetir en 4–12 h |
| 3 Cirujano de vuelo | Un rojo, R7, o una regla de nivel 2 que persiste 48 h | S-B-A-R al cirujano de vuelo; posponer EVA (recomendación) |
| 4 Urgente | ≥ 3 rojos, un rojo que no mejora en la re-medición, o radiación ≥ S3 | Avisar al comandante ya + canal prioritario con Tierra + lista médica de emergencia |

### 6.5 Comportamiento por entorno
| Entorno | Retardo por trayecto | Ante nivel ≥ 3 | Radiación de fondo (referencia) |
|---|---|---|---|
| ISS (LEO) | < 1 s (con cortes de señal) | "Se avisa ahora al cirujano de vuelo." Precedente: la evacuación médica de Crew-11 (decisión el 8-ene-2026, amerizaje el 15-ene-2026) | 0,16–0,21 mGy/día (Di Fino 2023) |
| Luna (Artemis) | ~1,3 s | Aviso casi inmediato; retorno a Tierra en días | ~1,37 mSv/día en superficie (Zhang 2020) |
| Marte | ~3–22 min (≤ 44 min ida y vuelta) + apagón de ~2 semanas en conjunción | Protocolo guiado en pantalla, S-B-A-R en cola, "respuesta estimada en X min" | Crucero 1,84 mSv/día · superficie ~0,64 mSv/día (Zeitlin 2013; Hassler 2014) |

---

## 7. Datos de NASA y de agencias socias (sección del formulario "NASA Data")

### 7.1 Datos reales usados en la app
| # | Dato / recurso | Agencia | Uso en Galley | Estado |
|---|---|---|---|---|
| 0 | **OSDR – SpaceX Inspiration4**: OSD-575 (glucosa, panel metabólico) y OSD-569 (leucocitos, hemograma); CSV crudos + `data/nasa/osdr/inspiration4-crew-labs.json` | NASA | Datos **reales** de astronautas: línea base personal preflight (L-92/L-44/L-3) vs rango de laboratorio | ✅ En el repo. Ojo: la glucosa R+45 (36–44 mg/dL en toda la tripulación) es probable artefacto de muestra; no interpretar |
| 1 | **DONKI SEP API** (`https://api.nasa.gov/DONKI/SEP?startDate=…&endDate=…&api_key=…`) | NASA | Dispara R6. Snapshot real de la **tormenta solar de mayo 2024** (SEP ≥ 10 MeV el 10-may y ≥ 100 MeV el 11-may) para el demo sin internet | ✅ `data/nasa/donki/donki-sep-events.json` (may-2024 → feb-2025 descargado) + snapshot del demo `donki-sep-demo.json`. El evento del 10-nov-2025 se puede agregar con `fetch_nasa_data.py` cuando se libere el límite de `DEMO_KEY` |
| 2 | **GOES integral protons** (`https://services.swpc.noaa.gov/json/goes/primary/integral-protons-1-day.json`) | NOAA (se declara en "otras referencias") | Flujo ≥ 10 MeV en vivo → escala S | ✅ Snapshot de 7 días en `data/noaa/` |
| 3 | **LIDAL en Columbus/ISS** (Di Fino et al., 2023): 1,8–2,4 nGy/s | **ASI (socia 2026)** | Línea base de dosis en modo ISS | ✅ Artículo en mano (citar el DOI; no subir el PDF) |
| 4 | **MSL/RAD** (Zeitlin 2013; Hassler 2014) | NASA | Línea base de dosis en modo Marte | Cifras publicadas |
| 5 | **HRP Hazards / Risks / Ongoing Research** | NASA | Texto de "What does this mean?" y etiqueta RIDGE por indicador | Recurso oficial del reto |
| 6 | **CSA: Monitoring Radiation for Astronaut Health** (CANS, neutrones ~30 %) | **CSA (socia)** | Explicación de la zona de radiación | Recurso oficial del reto |
| 7 | **ISS Research Explorer: "ISS Internal Radiation Monitoring"** (el `.xlsx` descargado es la *ficha* de la investigación, sin series numéricas) | NASA | Contexto: MORD, límite de riesgo REID 3 % y dosimetría a bordo | ✅ Revisado: es metadato, no dataset |
| 8 | **NASA-STD-3001 Vol. 1** y fichas técnicas OCHMO | NASA | Límite de carrera de 600 mSv; marco de estándares | Por leer la sección exacta (VERIFICAR) |

### 7.2 Datos sintéticos calibrados (decir "simulated, calibrated on published spaceflight data")
✅ Generado: `data/synthetic/galley-14day-scenarios.json` (+ `.csv`), con el script `data/scripts/generate_synthetic_dataset.py` (seed 2026). La calibración y sus fuentes van dentro del JSON (`calibration`). El dataset v1 alternativo quedó en `data/synthetic/archive/` y la app no lo usa:
- **Sueño:** media 6,1 h, DE ~0,8 h; ~24 % de noches ≥ 7 h (Barger 2014).
- **Temperatura:** deriva de +0,0 a +0,5 °C entre los días 1–14 de la misión (Stahn 2017: +~1 °C en ~2,5 meses; en 14 días, fracción proporcional; operativo).
- **Ingesta:** media ~80 % del plan (Smith 2005, VERIFICAR).
- **Ejercicio:** prescripción ~2 h/día; cumplimiento 85–100 % en el escenario nominal (VERIFICAR).
- **Escenarios:** (1) nominal · (2) fatiga (sueño 4,5–5,5 h desde el día 9, ánimo ↓, FC +8 lpm, PVT ↑) · (3) bradicardia (FC 46 vs base 62) · **(4) infección** (FC +10 lpm y Temp +0,8 °C en los días 11–14) · (5) tormenta solar (R6 con el snapshot DONKI).

### 7.3 Datasets abiertos para validar reglas (opcional hoy; fuerte para "Best use of data" y trabajo futuro)
| Dataset | Qué trae | Para qué | Licencia |
|---|---|---|---|
| **PMData** (Simula; Thambawita 2020) | Fitbit (FC, sueño, pasos) + fatiga, ánimo, *readiness*, estrés + registro de comidas | Probar R1–R3 con datos reales humanos | CC BY 4.0 según Simula (VERIFICAR; un espejo indica NC) |
| **LifeSnaps** (Yfantidou 2022, *Sci Data*) | 71 personas, > 4 meses, Fitbit + encuestas y EMA | Validar la línea base robusta y CUSUM | Ver repositorio |
| **Stanford COVID-19 Wearables** (Mishra 2020) | FC en reposo y pasos alrededor de infecciones | Validar R4 (infección temprana) | Ver artículo |
| **NASA OSDR – Inspiration4 / SOMA**: otros estudios (ómicas, citoquinas OSD-575, Apple Watch/Cognition según Jones 2024) | Más datos reales de vuelo | Trabajo futuro (los laboratorios CMP/CBC **ya se usan**, §7.1) | Abierto (OSDR) |
| **NASA LSDA / LSAH** | Datos de astronautas | No disponibles a nivel individual para el hackatón (se declara) | Solicitud formal |
| **Artemis II – ARCHeR** | Actigrafía (acelerómetro, luz y temperatura) de los 4 tripulantes | Trabajo futuro, cuando se publiquen resultados | — |

---

## 8. Hardware (go/no-go a las 12:00)

| Pieza | Estado v2 | Nota honesta |
|---|---|---|
| ESP32 + **MAX30102** (FC/SpO₂, I²C 0x57) | P2: si a las 12:00 llega un valor estable a la app, entra | SpO₂ y FC de dedo no son de grado clínico; mostrar "señal no válida" sin dedo o con mala perfusión |
| Sensor de temperatura (MAX30205 o DS18B20) | P2 | Mide **piel**; se rotula así |
| AD8232 (ECG), PocketGeiger, BMI270 | **Fuera** | Ruido/electrodos o falta de tiempo |
| **Simulador** `hardware/hardware-simulator/simulator.py` | **Plan B garantizado** | Emite el mismo JSON a 1 Hz |

**Formato serie (115200 baud, 1 línea JSON por segundo):** `{"t":1731600000,"hr":62,"spo2":97,"temp":36.6,"q":1}`. El campo `q` es la calidad de señal: 0 = inválida, 1 = válida.
**Si no hay go a las 12:00:** Hardware pasa a grabar el clip del simulador, preparar el diagrama Wokwi para la página y apoyar la edición del video.

---

## 9. Arquitectura (sin cambios de fondo)

- **Hexagonal / local-first:** ver `docs/architecture-decisions/ADR-001`. El núcleo de dominio (línea base, semáforo, reglas, escalamiento y S-B-A-R) no depende de la UI ni del sensor.
- **Puertos:** `SensorInputPort` (Web Serial / simulador / manual), `SpaceWeatherPort` **(nuevo:** DONKI en vivo o snapshot local), `EarthSyncPort` (cola S-B-A-R store-and-forward).
- **Sin internet:** modelos de face-api y snapshot DONKI dentro del repo; la app funciona offline.
- **Contratos:** actualizar `contracts/medical-ranges-config.json` con la tabla del §5 y un campo `source` por umbral. Quitar la cita inexistente.

Estructura del monorepo v2.1: `contracts/` (interfaces congeladas) · `data/` (`nasa/`, `noaa/`, `reference/`, `synthetic/`, `scripts/`) · `software/` (motor TS probado + app) · `hardware/` (firmware, simulador, Wokwi) · `docs/` · `submission/` (textos de entrega en inglés). Los dueños de cada carpeta están en `WORKFLOW.md`.

---

## 10. Plan de horas — domingo 15 nov (UTC-4; ajustar a la hora del Team Owner)

> Las horas de sincronización y las reglas para no bloquearse están en **`WORKFLOW.md`**. Las tareas detalladas están en Trello (una lista por equipo).

| Hora | Software (Katherine, Brenda) | Hardware (Erick, Luana) | Bio/Datos (Ana, Fidel) | Docs/Entrega |
|---|---|---|---|---|
| 09:00–09:30 | **Reunión de congelamiento:** leer §0, §4 y §10; asignar dueños | ← | ← | ← |
| 09:30–12:00 | Coherencia (§2.3) + σ mínima y reglas v2 (§6) + deploy en GitHub Pages | Integración Web Serial; **go/no-go 12:00** | Regenerar dataset calibrado (§7.2) + textos "What does this mean?" con enlaces HRP | Borrador EN de summary y descripción (§11.3) |
| 12:00–15:00 | Tarjeta de radiación con DONKI (snapshot + fetch en vivo) + etiquetas "Source" | Clip del sensor o del simulador + diagrama Wokwi | Tabla de referencias final (§13) + revisión de cifras VERIFICAR | Guion del video (§11.2) + storyboard |
| 15:00–16:00 | **Congelar código.** Ensayo del demo completo en 2 navegadores | Apoyo a grabación | QA científico de los textos en pantalla | Capturas para la página |
| 16:00–18:00 | (P2 si sobra: PVT-B o vista Luna) | Edición del video | Llenar campos "NASA Data" y "References" | Edición del video ≤ 30 s, subtítulos EN, marca de agua si hay IA |
| 18:00–20:00 | README en inglés sincronizado | Probar enlaces en ventana privada | Revisión final de Validez | **ENVIAR a las 20:00** |
| 20:00–23:30 | Solo correcciones; reenviar si mejora | ← | ← | ← |

---

## 11. Entrega

### 11.1 Checklist del formulario (todo en inglés)
- [ ] Project name · High-level summary · Demo link (≤ 30 s **o** ≤ 7 diapositivas) · Final project link · Detailed description · AI use · **NASA Data** · Space agency partner data & references.
- [ ] Enlaces sin login: YouTube "no listado" o Drive público + GitHub público + GitHub Pages, probados en ventana privada.
- [ ] Sin menores de 18 en imágenes, video o audio. Caras reales solo con permiso escrito del equipo.
- [ ] **Sin logos, banderas ni insignias de NASA** en la app, el video o las diapositivas.
- [ ] Imágenes o video generados con IA: **marca de agua visible**. Audio, código o datos generados con IA: declararlo en el texto y en los metadatos.
- [ ] Casillas "Terms & Conditions" y "All work is original" → **Submit for Judging** → confirmar el banner.

### 11.2 Guion del video (≤ 30 s, inglés; se puede hablar en español con subtítulos EN)
| Tiempo | Imagen | Locución / subtítulo |
|---|---|---|
| 0:00–0:03 | Logo Synera + título del reto | "We're Team Synera — Health Monitoring Software for Astronauts." |
| 0:03–0:07 | Marte + contador "44 min" | "On Mars, a doctor's answer can take 44 minutes. Astronauts must check themselves." |
| 0:07–0:10 | Cara reconocida → la cámara se apaga | "Galley: the check-up that does itself. Private, on-device." |
| 0:10–0:19 | Escaneo de cabeza a pies con colores y alerta "HR 46 vs your normal 62" | "It compares you to *your own* normal — and tells you what to do." |
| 0:19–0:24 | Selector a Marte → pasos guiados + S-B-A-R en cola · tarjeta DONKI "Solar particle event" | "Mars mode guides you on board and queues a report for Earth. Real NASA space-weather data." |
| 0:24–0:30 | Tendencias + "Built on NASA HRP risks · ASI & CSA data" → clínica remota en la Tierra | "Built on NASA science. Ready for Artemis — and for remote clinics on Earth." |

**Alternativa de 7 diapositivas:** 1 Título, equipo y reto · 2 Problema (Crew-11, retardo a Marte) · 3 Solución y experiencia de usuario (capturas) · 4 Cómo funciona (línea base, reglas, entornos) · 5 Datos de NASA/ASI/CSA y ciencia · 6 Validez, ética y límites · 7 Futuro e impacto en la Tierra.

### 11.3 Borrador del High-level summary (EN) — versión de trabajo en `submission/project-page.md`
> *Galley is an on-device health check-up for astronauts on long missions. The crew member steps in front of the station screen; Galley recognizes them locally, switches the camera off, and runs a head-to-toe body scan with voice guidance. Each zone (head, chest, abdomen, legs) turns green, yellow or red by comparing today's sleep, mood, heart rate, SpO₂, skin temperature, food intake, exercise and radiation exposure against the astronaut's own baseline, not a population average, because spaceflight shifts physiology (e.g., core temperature rises ~1 °C on long missions). Deterministic, cited rules detect fatigue, early infection, under-nutrition and deconditioning, and explain in plain language what to do now. Galley adapts to the mission: on the ISS it alerts flight surgeons immediately; on Mars, with up to 44-minute round-trip delays, it guides the crew step by step and queues an S-B-A-R report for Earth. Radiation alerts use real NASA DONKI solar-particle events and ASI ISS dose data. Galley is decision support, not a medical device.*

### 11.4 Declaración de IA (resumen)
- Google Gemini: lluvia de ideas inicial y un primer esquema. Sus afirmaciones se rechequearon.
- Claude / Claude Code: búsqueda y revisión de fuentes, apoyo en código y documentación.
- face-api (@vladmandic/face-api, TensorFlow.js): reconocimiento facial local; no es IA generativa. Licencia: VERIFICAR en `package.json` y el repositorio.
- **La idea de la solución es del equipo.** Ninguna cifra médica se acepta porque "lo dijo una IA": cada una lleva su fuente.

---

## 12. Riesgos y plan B
| Riesgo | Gravedad | Plan B |
|---|---|---|
| Video > 30 s o > 7 diapositivas | **Crítica** (queda fuera del global) | Cronometrar; cortar sin piedad |
| No enviar a tiempo / zona horaria equivocada | **Crítica** | Enviar a las 20:00; confirmar la zona del Team Owner |
| Enlace privado o roto | Alta | Probar en ventana privada y desde otro dispositivo |
| DONKI caído en el demo | Media | Snapshot local (`data/nasa/donki/donki-sep-demo.json`) |
| Sensor no funciona | Media | Simulador y declararlo |
| Reconocimiento facial falla con la luz | Media | Botón visible "Select crew member" |
| Juez: "¿dónde está la IA?" | Media | "IA local solo para identidad; las decisiones de salud son reglas deterministas y citadas: es auditable a propósito." |
| Subir datos personales al repo | **Alta** | `.gitignore` + revisar `git status` antes de cada push |

---

## 13. Referencias (citar en la página del proyecto)

**Recursos oficiales del reto**
1. NASA HRP. *The Five Hazards of Human Spaceflight.* https://www.nasa.gov/hrp/hazards/
2. NASA HRP. *Risks of Human Spaceflight.* https://www.nasa.gov/hrp/risks/
3. NASA HRP. *Ongoing HRP Research.* https://www.nasa.gov/hrp/ongoing-hrp-research/
4. CSA (2026). *Monitoring radiation for astronaut health.* https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp
5. CSA. *Why do we conduct science experiments in space?* https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp

**Datos y APIs**
6. NASA CCMC. *DONKI – Space Weather Database Of Notifications, Knowledge, Information* (SEP API vía api.nasa.gov).
7. NOAA SWPC. *GOES integral proton flux (JSON)* y *NOAA Space Weather Scales (S-scale).*
8. Di Fino L. et al. (2023). Radiation measurements in the ISS, Columbus module, in 2020–2022 with the LIDAL detector. *Life Sci Space Res* 39:26–42. doi:10.1016/j.lssr.2023.03.007 *(ASI)*
9. Zeitlin C. et al. (2013). Measurements of energetic particle radiation in transit to Mars on the Mars Science Laboratory. *Science* 340:1080–1084.
10. Hassler D.M. et al. (2014). Mars' surface radiation environment measured with the MSL Curiosity rover. *Science* 343:1244797.
11. Zhang S. et al. (2020). First measurements of the radiation dose on the lunar surface. *Sci Adv* 6:eaaz1334.
12. NASA. *ISS Research Explorer – International Space Station Internal Radiation Monitoring.*
13. NASA. *NASA-STD-3001 Space Flight Human-System Standard, Vol. 1 (Crew Health)* + OCHMO technical briefs.

**Fisiología espacial**
14. Stahn A.C. et al. (2017). Increased core body temperature in astronauts during long-duration space missions. *Sci Rep* 7:16180. doi:10.1038/s41598-017-15560-w
15. Barger L.K. et al. (2014). Prevalence of sleep deficiency and use of hypnotic drugs in astronauts before, during, and after spaceflight. *Lancet Neurol* 13:904–912.
16. Basner M. et al. (2013). Mars 520-d mission simulation reveals protracted crew hypokinesis and alterations of sleep duration and timing. *PNAS* 110:2635–2640.
17. Crucian B.E. et al. (2018). Immune system dysregulation during spaceflight. *Front Immunol* 9:1437.
18. Mehta S.K. et al. (2017). Latent virus reactivation in astronauts on the International Space Station. *npj Microgravity* 3:11.
19. Smith S.M. et al. (2005). Nutritional status assessment of International Space Station crew. *J Nutr* 135:437–443.
20. Lee A.G. et al. (2020). Spaceflight associated neuro-ocular syndrome (SANS) and the neuro-ophthalmologic effects of microgravity. *npj Microgravity* 6:7.
21. Jones C.W. et al. (2024). Molecular and physiological changes in the SpaceX Inspiration4 civilian crew. *Nature.* · Overbey E.G. et al. (2024). The Space Omics and Medical Atlas (SOMA) and international astronaut biobank. *Nature.*
22. Garrett-Bakelman F.E. et al. (2019). The NASA Twins Study. *Science* 364:eaau8650.
23. ESA (2017). *Diet tracker in space* (EveryWear). · NASA. *ISS Food Intake Tracker (ISS FIT).*

**Fatiga, cognición y sueño**
24. Basner M., Mollicone D., Dinges D.F. (2011). Validity and sensitivity of a brief psychomotor vigilance test (PVT-B) to total and partial sleep deprivation. *Acta Astronaut* 69:949–959.
25. Basner M. et al. (2015). Development and validation of the Cognition test battery for spaceflight. *Aerosp Med Hum Perform* 86:942–952.
26. Van Dongen H.P.A. et al. (2003). The cumulative cost of additional wakefulness. *Sleep* 26:117–126.
27. Watson N.F. et al. (2015). Recommended amount of sleep for a healthy adult. *Sleep* 38:843–844.

**Detección temprana con wearables y métodos**
28. Mishra T. et al. (2020). Pre-symptomatic detection of COVID-19 from smartwatch data. *Nat Biomed Eng* 4:1208–1220.
29. Smarr B.L. et al. (2020). Feasibility of continuous fever monitoring using wearable devices. *Sci Rep* 10:21640.
30. Quer G. et al. (2021). Wearable sensor data and self-reported symptoms for COVID-19 detection. *Nat Med* 27:73–77.
31. Page E.S. (1954). Continuous inspection schemes. *Biometrika* 41:100–115. (CUSUM)

**Clínica y comunicación**
32. Kusumoto F.M. et al. (2019). 2018 ACC/AHA/HRS Guideline on the evaluation and management of patients with bradycardia. *Circulation* 140:e382–e482.
33. O'Driscoll B.R. et al. (2017). BTS guideline for oxygen use in adults. *Thorax* 72:ii1–ii90.
34. Haig K.M., Sutton S., Whittington J. (2006). SBAR: a shared mental model for improving communication between clinicians. *Jt Comm J Qual Patient Saf* 32:167–175.
35. NASA NTRS. *Communication Delays, Disruptions, and Blackouts for Crewed Mars Missions (ASCEND).*

**Contexto 2026**
36. NPR / Space.com (15-ene-2026). Crew-11 regresa un mes antes tras la primera evacuación médica de la ISS (misión de 167 días).
37. NASA (2026). *Artemis II crew to advance human spaceflight research* (estudio ARCHeR con actigrafía).

**Datasets de validación**
38. Thambawita V. et al. (2020). PMData: a sports logging dataset. *ACM MMSys '20.* https://datasets.simula.no/pmdata
39. Yfantidou S. et al. (2022). LifeSnaps, a 4-month multi-modal dataset. *Sci Data.* doi:10.1038/s41597-022-01764-x

> Precedentes para la sección "estado del arte": NASA Tempus Pro (telemedicina), CSA Bio-Monitor/Astroskin (camiseta inteligente en la ISS, VERIFICAR), NASA/Google CMO-DA (asistente de diagnóstico, prueba de concepto; fuente secundaria). Galley se diferencia por el **chequeo sin esfuerzo + línea base personal + autonomía según el retardo**.
