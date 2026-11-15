# Flujo de trabajo v2 — Synera · Galley (domingo 15-nov-2026)

> Objetivo: que **Hardware, Software y Biotecnología trabajen en paralelo sin bloquearse ni pisarse**.
> Plan completo y fuentes: [`plan.md`](./plan.md). Tareas: tablero Trello "Synera - Galley Health Monitor".

---

## 1. Equipos y dueños

| Equipo | Integrantes | Es dueño de (solo ellos editan) | Lee (sin editar) |
|---|---|---|---|
| **Hardware** | Erick, Luana | `hardware/**` | `contracts/telemetry-payload.schema.json` |
| **Software** | Katherine, Brenda | `software/**` (app + motor) · `.github/workflows/**` | `contracts/**` · `data/**` |
| **Biotecnología** | Ana, Fidel | `data/reference/**` · `data/synthetic/**` · `data/scripts/generate_synthetic_dataset.py` · `contracts/medical-ranges-config.json` · `docs/**` · `submission/**` | `software/tests/` (para ver si sus cambios rompen algo) |
| **Compartido** | Team Owner (Erick) | `README.md` · `plan.md` · `WORKFLOW.md` · envío final | — |

**Regla 1 — Cada equipo toca solo sus carpetas.** Así Git nunca tiene conflictos.

**Regla 2 — Los contratos están congelados desde las 10:00.** Para cambiar un contrato hay que avisar por el grupo y que acepten los equipos afectados. Los contratos son:
- `contracts/telemetry-payload.schema.json`: la trama `SerialFrame` (Hardware → Software) y el registro `DailyRecord` (Bio → Software).
- `contracts/medical-ranges-config.json`: los umbrales. Bio cambia los **valores**; las **claves** no cambian.
- `contracts/earth-report.schema.json`: el reporte S-B-A-R.
- La estructura de los JSON de `data/reference/`: Bio cambia los **textos**; las **claves** no cambian.

**Regla 3 — Nadie espera a nadie.** Todo lo que un equipo necesita de otro ya existe hoy en el repo, como versión v2 lista para usar:

| Necesito… | Ya está en… | Lo mejora… |
|---|---|---|
| Datos de sensores sin hardware | `hardware/hardware-simulator/simulator.py` (mismo JSON que el ESP32) | Hardware |
| Dataset de 14 días con 5 escenarios | `data/synthetic/galley-14day-scenarios.json` | Bio (re-ejecuta el script) |
| Umbrales con fuentes | `contracts/medical-ranges-config.json` | Bio |
| Textos de "What does this mean?" | `data/reference/indicator-explanations.json` | Bio |
| Reglas R1–R7 y consejos | `data/reference/rules.json` | Bio (textos) / Software (lógica) |
| Entornos ISS / Luna / Marte | `data/reference/environments.json` | Bio |
| Radiación y clima espacial real | `data/reference/radiation.json` + `data/nasa/donki/` + `data/noaa/` | Bio |
| Datos reales de astronautas (laboratorio) | `data/nasa/osdr/inspiration4-crew-labs.json` | Bio |
| Motor probado (línea base, reglas, nivel, S-B-A-R) | `software/src/domain/` (`npm test` → 9/9) | Software |

---

## 2. Horario de sincronización (lo único que interrumpe)

Fuera de estas horas, cada equipo trabaja solo. Las dudas se escriben en el grupo y se responden en la siguiente sincronización, salvo un bloqueo real.

| Hora (UTC-4) | Quiénes | Qué |
|---|---|---|
| **10:00** (10 min) | Todos | Arranque: cada uno lee su lista de Trello; contratos congelados |
| **12:00** (15 min) | Hardware + Software | Go/no-go del sensor real: probar Web Serial 10 min. Si falla, se usa el simulador y no se vuelve a discutir |
| **13:00** | Bio → Hardware y Software | Bio entrega el guion final del video (`submission/video-script.md`) |
| **15:30** | Software → Hardware | **Congelamiento del código.** Software entrega las grabaciones de pantalla del demo |
| **16:00** | Bio → Software | Últimos textos de la app (después de esta hora ya no se cambian textos) |
| **18:00** (20 min) | Todos | Revisión cruzada: cada equipo revisa SOLO su checklist (Trello → "🚀 Entrega") |
| **20:00** | Team Owner | **ENVIAR.** De 20:00 a 23:30 solo arreglos y reenvío |

---

## 3. Git sin conflictos

```bash
git pull --rebase origin main      # SIEMPRE antes de empezar y antes de cada push
# ...trabajar SOLO en las carpetas de tu equipo...
git add <tus-carpetas>             # nunca "git add ." desde la raíz
git commit -m "hw: firmware emite SerialFrame v2"   # prefijos: hw:, sw:, bio:, docs:
git push origin main
```
- Antes de cada push: `git status`. **No subir PDF, documentos de identidad, `.env`, claves ni tokens** (el `.gitignore` ya bloquea `*.pdf` y `*.zip`).
- Si Bio cambia umbrales, datos o reglas: correr `cd software && npm test`. Si algo falla, avisar a Software en la siguiente sincronización (no editar `software/`).

---

## 4. Comandos útiles

```bash
# Hardware: simulador (Plan B), mismo formato que el ESP32
python3 hardware/hardware-simulator/simulator.py --scenario normal        # normal | bradycardia | fever | no_signal

# Bio: regenerar el dataset sintético después de cambiar la calibración
python3 data/scripts/generate_synthetic_dataset.py

# Bio/Software: refrescar datos reales (DONKI, GOES, OSDR). DEMO_KEY = 30 consultas por hora
python3 data/scripts/fetch_nasa_data.py

# Software: probar el motor contra los datos reales del repo
cd software && npm test
```

---

## 5. Definición de "terminado" por equipo

| Equipo | Terminado cuando… |
|---|---|
| Hardware | A las 12:00 llega a la app un `SerialFrame` válido (sensor o fallback `src:"sim"`); hay diagrama y fotos o clip en `hardware/`; el video está editado a las 18:00 |
| Software | La app pública (GitHub Pages) corre el chequeo completo en Chrome/Edge en ventana privada, con los 5 escenarios, tarjeta de radiación DONKI, ISS / Luna / Marte y S-B-A-R; las grabaciones se entregan a las 15:30 |
| Bio | Umbrales, textos y referencias revisados (sin "VERIFICAR" pendientes en lo que se muestra); página del proyecto en inglés lista en `submission/project-page.md` a las 17:00 |
