# Fuentes Oficiales de la NASA y Umbrales Fisiológicos

## 1. Contexto Clínico y Lecciones de Misiones Reales
- **Evacuación Médica ISS Crew-11 (Enero 2026):**
  - Primera evacuación médica anticipada de la tripulación en 25 años continuos de presencia humana en la Estación Espacial Internacional. La decisión de retornar prematuramente a los cuatro astronautas debido al deterioro médico de un solo tripulante evidenció que determinar el momento exacto de gravedad clínica es un evento de altísimo impacto operativo y financiero.
- **Misión Artemis II (Abril 2026):**
  - Generación de los primeros conjuntos de datos fisiológicos continuos más allá de la órbita baja terrestre (LEO) en más de 50 años. El despliegue de sensores vestibles (wearables) midió sueño, estrés, función neurocognitiva y dinámica de equipo bajo radiación del espacio profundo.

## 2. Los 5 Riesgos del Vuelo Espacial de la NASA (RIDGE) y su Mapeo
1. **R (Space Radiation - Radiación Espacial):**
   - *Impacto fisiológico:* Daño al ADN, aumento de riesgo oncogénico, síndrome agudo por radiación.
   - *Mapeo en Synera:* Monitor de dosimetría acumulada (mSv) y tasa de dosis en tiempo real (µSv/h) mediante fotodiodo PIN.
2. **I (Isolation and Confinement - Aislamiento y Confinamiento):**
   - *Impacto fisiológico:* Alteración circadiana, depresión reactiva, fatiga mental, pérdida de cohesión grupal.
   - *Mapeo en Synera:* Registro subjetivo de estado de ánimo (1-10), actigrafía de fases de sueño y test PVT (Psychomotor Vigilance Task).
3. **D (Distance from Earth - Distancia de la Tierra):**
   - *Impacto operativo:* Retraso en comunicaciones (hasta 20-22 minutos en Marte), imposibilidad de evacuación inmediata.
   - *Mapeo en Synera:* Paradigma Local-First, motor de decisión autónomo y generación de "Parte para Tierra" asíncrono.
4. **G (Gravity Fields - Campos Gravitatorios y Microgravedad):**
   - *Impacto fisiológico:* Desplazamiento cefálico de fluidos (síndrome SANS), desacondicionamiento cardiovascular, arritmias.
   - *Mapeo en Synera:* Frecuencia cardíaca, variabilidad del pulso (VFC/HRV) y presión arterial continua/estimada.
5. **E (Hostile / Closed Environments - Entornos Cerrados y Hostiles):**
   - *Impacto fisiológico:* Disregulación térmica en trajes espaciales, hipercapnia por acumulación de CO2, metabolismo glucídico alterado.
   - *Mapeo en Synera:* Monitoreo de temperatura corporal cutánea (±0.1 °C) y glucosa intersticial continua (CGM).

## 3. Umbrales Clínicos de Referencia (Base)
| Indicador | Rango Verde (Nominal) | Rango Amarillo (Atención) | Rango Rojo (Crítico) |
|---|---|---|---|
| **Frecuencia Cardíaca** | 50 - 90 bpm | 45-50 / 90-105 bpm | < 40 o > 120 bpm |
| **Presión Arterial (Sistólica)** | 95 - 130 mmHg | 90-95 / 130-140 mmHg | < 85 o > 160 mmHg |
| **Presión Arterial (Diastólica)** | 60 - 85 mmHg | 55-60 / 85-90 mmHg | < 50 o > 100 mmHg |
| **Temperatura Cutánea/Núcleo** | 36.1 - 37.3 °C | 35.8-36.1 / 37.3-37.8 °C | < 35.0 o > 38.5 °C |
| **Glucosa** | 70 - 140 mg/dL | 60-70 / 140-180 mg/dL | < 50 o > 250 mg/dL |
| **Horas de Sueño (24h)** | 7.0 - 9.5 h | 5.5 - 7.0 h | < 5.5 h |
| **Estado de Ánimo** | 7 - 10 / 10 | 5 - 6 / 10 | 1 - 4 / 10 |
