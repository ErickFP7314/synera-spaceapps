# Plan Maestro del Proyecto: Synera — Galley Health Monitor
**NASA Space Apps Challenge 2026**
*Monitor de salud autónomo para astronautas: el chequeo que se hace solo*

---

## 1. Visión, Alcance y Concepto "Galley"

### Concepto y Propósito
El proyecto **Synera** (Equipo) desarrolla **Galley** (Prototipo), una aplicación web de soporte a decisiones médicas y monitoreo autónomo para astronautas en misiones de exploración de larga duración (Luna / Artemis y Marte), donde la comunicación con la Tierra sufre retardos críticos (hasta 44 minutos ida y vuelta en Marte) o apagones de señal.

El núcleo conceptual es **"El chequeo que se hace solo"**: el astronauta no debe lidiar con formularios tediosos ni registros manuales complejos. Se sitúa frente a la estación de cabina, la cámara lo reconoce localmente mediante biometría facial, se carga su perfil con su línea base personal, y una animación de escaneo corporal de arriba a abajo evalúa sus zonas anatómicas acompañada de retroalimentación por voz y alarmas sonoras.

### Criterios de Alcance para el Hackatón (39 Horas)

| DENTRO del Alcance (MVP Prioritario) | FUERA del Alcance (Descartado / Trabajo Futuro) |
|---|---|
| **Reconocimiento Facial Local:** Detección de perfil con `face-api` (@vladmandic/face-api + TensorFlow.js) y apagado inmediato de cámara por privacidad. | **Cámara siempre encendida:** Se rechaza la vigilancia continua por ética y privacidad. |
| **Escaneo Anatómico en 4 Zonas:** Cabeza, Pecho, Abdomen y Piernas con SVG anatómico dinámico. | **ECG invasivo con AD8232:** Descartado por ruido eléctrico, cables y electrodos en 39 horas. |
| **Síntesis de Voz y Alarmas:** Web Speech API (narración de estados) y Web Audio (alarmas en zonas rojas). | **Pulso por cámara (rPPG):** Descartado por falta de validación espacial y artefactos al moverse/masticar. |
| **Ingesta Dual de Datos:** Sensores físicos vía **Web Serial API (USB directo a 115200 baudios)** y simulador sintético Plan B. | **Presión arterial y glucosa invasivas en hardware:** Descartadas en el prototipo físico de 39h; se manejan simuladas. |
| **Nutrición y Ejercicio:** Ingesta de alimentos (ESA 2017) y contramedidas de ejercicio integradas a la fatiga. | **Chatbot médico de caja negra:** Descartado; prohibición estricta de alucinaciones diagnósticas o recetas de fármacos. |
| **Reporte S-B-A-R para Tierra:** Estructura clínica aeroespacial (*Situation, Background, Assessment, Recommendation*). | **Servidor Central / Base de datos en la nube:** Todo opera **Local-First** en el navegador del dispositivo (`localStorage` / SQLite). |
| **Selectores de Entorno:** ISS (respuesta rápida) vs. Marte (guía autónoma en cabina con retraso de ~44 min). | **Bloqueo punitivo de tareas (EVA):** La app sugiere y orienta; la decisión final es del comandante y el médico. |

---

## 2. Indicadores Biológicos, Nutrición y Sensores de Hardware

### Matriz de Indicadores del Prototipo Galley

| Indicador | Fuente en Prototipo MVP | Hardware Físico / Comercial | Peligro NASA (RIDGE) | Justificación Clínica / Espacial |
|---|---|---|---|---|
| **Frecuencia Cardíaca y SpO2** | Sensor físico Web Serial / Simulado | Maxim MAX30102 (I2C) / Polar H10 | Gravedad Alterada (G) | Desacondicionamiento miocárdico y desplazamiento cefálico de fluidos. |
| **Temperatura Corporal** | Sensor físico / Simulado | Maxim MAX30205 (±0.1 °C) / Infrarrojo | Entorno Hostil (E) | Termorregulación en trajes/módulos y detección precoz de infecciones. |
| **Horas y Fases de Sueño** | Registro habitual / Simulado | Actigrafía Oura / IMU BMI270 | Aislamiento (I) y Entorno (E) | Desincronización circadiana, degradación cognitiva y fatiga acumulada. |
| **Estado de Ánimo (1 a 10)** | Registro rápido en pantalla | Cuestionario subjetivo / Test PVT | Aislamiento y Confinamiento (I) | Impacto del confinamiento extremo en salud mental y trabajo en equipo. |
| **Ingesta de Comida / Nutrición** | Registro de porciones de menú | Registro ISS FIT / EveryWear ESA | Entorno Hostil (E) | Fatiga de menú y déficit calórico crónico demostrado en microgravedad. |
| **Ejercicio Físico Realizado** | Registro de sesión / Simulado | Cicloergómetro / ARED / Strava | Gravedad Alterada (G) | Contramedida médica #1 contra pérdida de densidad ósea y atrofia muscular. |
| **Radiación Espacial** | Barra acumulada simulada | Dosímetro RadPC / Fotodiodo PIN | Radiación Espacial (R) | Exposición acumulada en mSv y monitoreo de tormentas de protones solares. |

### Arquitectura de Integración Hardware-Software: Web Serial API

```text
+-----------------------+               USB Serial (115200 baud)             +-----------------------+
|  Microcontrolador     | -------------------------------------------------> |   Navegador Web       |
|  ESP32-S3 / ESP32     |   Línea JSON cada 1s:                              |   (Chrome / Edge)     |
|  + MAX30102           |   {"t": 1731600000, "hr": 65, "spo2": 98, ...}    |   Web Serial API      |
+-----------------------+                                                    +-----------------------+
           ^                                                                             ^
           |                                                                             |
           +------------------ Plan B: Hardware Simulator (Python / JS) -----------------+
```

1. **Protocolo:** Web Serial API conectando directamente el navegador con el puerto USB/COM sin necesidad de bridges complejos ni servidores locales.
2. **Formato de Transmisión (1 Hz):**
   ```json
   {"t": 1731600000, "hr": 64, "spo2": 98, "temp": 36.6, "env": "ISS"}
   ```
3. **Plan B Indispensable:** Si el hardware físico no está listo o falla durante la demostración, el script `hardware/hardware-simulator/simulator.py` emite las mismas tramas por puerto serie virtual o consola, asegurando un demo 100% funcional.

---

## 3. Arquitectura de Software Hexagonal y Flujo Clínico

### Las 4 Zonas Anatómicas del Escaneo Corporal
La figura anatómica SVG desciende en escaneo evaluando:
1. **Cabeza:** Estado de ánimo, fatiga neurocognitiva, temperatura cutánea cefálica y calidad del sueño.
2. **Pecho:** Frecuencia cardíaca (BPM), variabilidad (HRV), saturación de oxígeno (SpO2) y esfuerzo cardiovascular.
3. **Abdomen:** Ingesta de alimentos/calorías, hidratación, glucosa metabólica y confort gastrointestinal.
4. **Piernas / Musculoesquelético:** Cumplimiento de contramedidas de ejercicio, actigrafía y prevención de atrofia por microgravedad.

### Motor de Reglas de Cansancio y Desnutrición
Combinación multivariable determinista fundamentada en NASA HRP Roadmap y ESA:
* **Regla 1 (Aviso de Sueño):** Sueño $< 6.0\text{ h}$ respecto a la línea base habitual $\rightarrow$ Recomendar ajuste de horario circadiano y descanso activo.
* **Regla 2 (Alerta de Fatiga Aguda):** Sueño bajo ($< 5.5\text{ h}$) + Taquicardia compensatoria ($> 85\text{ bpm}$) + Estado de ánimo bajo ($\le 4/10$) $\rightarrow$ Nivel 2 o 3: Notificar al comandante, restringir tareas críticas/EVA y descansar.
* **Regla 3 (Alerta Nutricional):** Ingesta calórica/porciones deficientes por más de 48h combinadas con fatiga $\rightarrow$ Alertar riesgo de catabolismo y orientar consumo de la lista médica/menú de abordo.
* **Regla 4 (Escalamiento S-B-A-R):** Parámetros en rojo o alertas multivariables disparan la generación del reporte S-B-A-R para el Cirujano de Vuelo.

---

## 4. Estructura del Monorepo Actualizada

```text
synera-spaceapps/
├── README.md                           # Documentación integral del proyecto y demo
├── plan.md                             # Plan arquitectónico maestro
├── WORKFLOW.md                         # Flujo de trabajo y responsabilidades por equipo
├── INFORME 2.docx                      # Especificación clínica original
├── PROYECTO_GALLEY_ES.pdf              # Especificación del prototipo Galley y alcance
│
├── contracts/                          # FUENTE ÚNICA DE LA VERDAD (Hardware, Software, Biotec)
│   ├── telemetry-payload.schema.json   # Esquema JSON ampliado con nutrición y ejercicio
│   ├── earth-report.schema.json        # Esquema oficial del reporte clínico S-B-A-R
│   ├── ble-gatt-profile.yaml           # Perfil BLE para nodo wearable
│   └── medical-ranges-config.json      # Rangos de referencia clínica NASA-STD-3001
│
├── hardware/                           # CÉLULA DE HARDWARE (Erick y Luana)
│   ├── firmware/wearable-node/         # Código C++ (PlatformIO / Arduino) para ESP32
│   ├── simulation-wokwi/               # Diagramas y configuraciones de Wokwi
│   ├── hardware-simulator/             # Simulador de respaldo en Python para el demo
│   ├── pcb-schematics/                 # Esquemáticos de conexión en KiCad
│   └── enclosure-cad/                  # Modelos 3D de carcasas
│
├── software/                           # CÉLULA DE SOFTWARE (Katherine y Brenda)
│   ├── src/
│   │   ├── domain/                     # Núcleo clínico: línea base, semáforo, fatiga, S-B-A-R
│   │   ├── application/                # Casos de uso e interfaces de puertos
│   │   ├── infrastructure/             # Adaptador Web Serial, localStorage y validadores
│   │   └── ui/                         # Interfaz web: escaneo 4 zonas SVG, face-api, voz
│   └── tests/                          # Pruebas unitarias de reglas de decisión
│
└── docs/                               # CÉLULA DE BIOTECNOLOGÍA Y CIENCIA (Johan y Fidel)
    ├── architecture-decisions/         # ADRs de diseño y trade-offs
    ├── medical-resources/              # Citas de NASA-STD-3001, HRP Roadmap y ESA
    ├── synthetic-datasets/             # Datasets de 14 días (normal, cansancio, infección)
    └── scientific-evidence/            # Justificación de las 4 preguntas de explicabilidad
```

---

## 5. Asignación de Roles del Equipo y Entregables

### Célula 1: Hardware — Erick & Luana
* **Responsabilidad:** Construcción del nodo sensor, lectura de bioseñales, simulación en Wokwi y enlace serial USB.
* **Entregables:**
  1. Montaje y circuito simulado en **Wokwi** (ESP32 + sensor MAX30102).
  2. Firmware funcional en C++ (PlatformIO/Arduino) que emite tramas JSON formateadas a 115200 baudios por USB.
  3. Script de simulador de sensor físico (Plan B) probado con la aplicación web.
  4. Diagrama esquemático de conexiones y documentación de pines para la entrega.

### Célula 2: Software — Katherine & Brenda
* **Responsabilidad:** Prototipo web frontend interactivo, reconocimiento facial local, escaneo anatómico SVG, Web Speech/Audio y adaptador Web Serial.
* **Entregables:**
  1. Integración de **Reconocimiento Facial Local** con `face-api` (registro, login biométrico y apagado de cámara).
  2. Animación de **Escaneo en 4 Zonas Anatómicas (SVG)** con voz sintetizada bilingüe (ES/EN) y alarma sonora.
  3. Lector **Web Serial API** para recibir tramas desde el ESP32 o el simulador.
  4. Panel de tendencias de 14 días, selector de entorno (ISS / Marte) y visualizador del **Reporte S-B-A-R**.
  5. Empaquetado sin internet y despliegue público en GitHub Pages.

### Célula 3: Biotecnología, Datos y Ciencia — Johan & Fidel
* **Responsabilidad:** Validez científica, umbrales clínicos de la NASA, modelado de reglas de cansancio/nutrición y dataset de 14 días.
* **Entregables:**
  1. Búsqueda y blindaje de fuentes oficiales (**NASA-STD-3001 Vol. 1**, HRP Evidence Reports, ESA EveryWear).
  2. Generación del dataset sintético de 14 días con 3 escenarios clínicos validados (nominal, cansancio/fatiga, infección/bradicardia).
  3. Formulación de las reglas deterministas de fatiga, desnutrición y correlación con los 5 riesgos RIDGE.
  4. Redacción del contenido del reporte **S-B-A-R** y las 4 respuestas clínicas del botón "¿Qué significa esto?".
  5. Declaración de uso ético de IA y compilación de referencias bibliográficas para los jueces.
