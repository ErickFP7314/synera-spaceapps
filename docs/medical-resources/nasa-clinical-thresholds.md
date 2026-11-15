# Umbrales clínicos v2 y sus fuentes (resumen legible)

> **Fuente única de la verdad:** [`contracts/medical-ranges-config.json`](../../contracts/medical-ranges-config.json). Si este resumen y el JSON difieren, manda el JSON.
> Dueño: Biotecnología (Ana y Fidel). Galley es apoyo a la decisión, **no** un dispositivo médico.

## Lógica de color
1. **Desviación de la línea base personal.** Se usa un z robusto (mediana y MAD de los últimos 14 días, **sin los 3 más recientes**). Al empezar se usa el valor habitual del registro más una σ mínima.
2. **Límites absolutos de seguridad.** Siempre ganan.
3. **Reglas combinadas (R1–R7) y tendencias.** Pueden subir el nivel. Ver [`data/reference/rules.json`](../../data/reference/rules.json).

## Tabla
| Indicador (zona) | Verde | Amarillo | Rojo | Riesgo HRP / RIDGE | Fuentes |
|---|---|---|---|---|---|
| FC en reposo (pecho) | \|z\| < 2 y 50–100 lpm | \|z\| ≥ 2 **o** < 50 / > 100 | \|z\| ≥ 3 **o** < 40 / ≥ 120 | Cardiovascular · G | Kusumoto 2019; taquicardia > 100; 40/120 operativo |
| SpO₂ (pecho) | ≥ 94 % | 90–93 % | < 90 % | Hypoxia · E | O'Driscoll 2017 (BTS 94–98 %) |
| Temp. cutánea (cabeza) | < base + 0,5 °C | ≥ base + 0,5 °C | ≥ base + 1,0 °C **o** ≥ 38,5 °C | Immune · E | Stahn 2017; Smarr 2020 |
| Sueño (cabeza) | ≥ 6 h y ≥ base − 1 h (consejo R1 si < 7 h) | < 6 h **o** < base − 1 h | < 5 h **o** 3 noches < 6 h | Sleep · I/E | Watson 2015; Barger 2014; Van Dongen 2003 |
| Ánimo 1–5 (cabeza) | ≥ 3 | ≤ 2 **o** caída ≥ 2 vs base | 1 durante 2 días | Behavioral · I | HRP; Basner 2013 |
| PVT-B lapsos (cabeza, opcional) | < base + 3 | ≥ base + 3 | ≥ base + 6 | Sleep · I | Basner 2011 (lapso > 355 ms); Basner 2015 |
| Ingesta % plan (abdomen) | ≥ 80 % | < 80 % | < 70 % durante 3 días | Nutrition · E | HRP; Smith 2005 (VERIFICAR ~80 %) |
| Ejercicio % prescripción (piernas) | ≥ 75 % | < 75 % | < 50 % durante 3 días | Bone · G | HRP (1–1,5 %/mes) |
| Glucosa (abdomen, manual) | — | — | — (sin alertas) | Nutrition · E | Rango de laboratorio 65–99 mg/dL (NASA OSDR OSD-575) |
| Radiación (cuerpo) | fondo del entorno | SEP (DONKI) o ≥ S1 (≥ 10 pfu) | ≥ S3 (≥ 1000 pfu) | Radiation · R | NOAA S-scale; DONKI; Di Fino 2023; NASA-STD-3001 |
| Presión arterial | — | — | — | Cardiovascular · G | **Trabajo futuro** (no se mide en el MVP) |

## Escala de acción (4 niveles)
1. **Autocuidado:** todo verde o un amarillo aislado.
2. **Avisar a la tripulación:** ≥ 2 amarillos, una regla de nivel 2 o una tendencia.
3. **Cirujano de vuelo:** un rojo, R7, o una regla de nivel 2 que persiste 48 h. Se genera el S-B-A-R.
4. **Urgente:** ≥ 3 rojos, un rojo que no mejora en la re-medición, o radiación ≥ S3.

Referencias completas: `plan.md` §13.
