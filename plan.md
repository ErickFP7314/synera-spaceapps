El diseño del sistema "Copiloto de salud para astronautas" requiere combinar instrumentación biomédica de bajo consumo con una arquitectura de software tolerante a desconexiones prolongadas para cubrir los 6 indicadores principales y las variables ambientales del vuelo espacial.

## 1. Dispositivos y Sensores de Hardware Específicos

Para que el equipo de hardware pueda construir un prototipo funcional e integrarlo con el software, la tabla presenta tanto los sensores electrónicos a nivel de componente (ideales para una placa personalizada) como sus equivalentes comerciales de grado médico/espacial inspirados en misiones como Artemis II.

| Indicador | Sensor de Prototipo | Equivalente Comercial | Interfaz | Variable Medida |
| --- | --- | --- | --- | --- |
| Frecuencia cardíaca | Maxim MAX30102 o AD8232 | Polar H10 o Hexoskin | I2C o Analog | Pulso, SpO2 y VFC |
| Presión arterial | Omron D6F-PH o Módulo NIBP | ConTEC08A o Omron Evolv | UART o BLE | Sistólica y diastólica |
| Temperatura corporal | Maxim MAX30205 o MLX90614 | Core Temp Sensor | I2C | Temperatura cutánea precisa |
| Glucosa | Lector NFC PN532 | FreeStyle Libre 3 o Dexcom | SPI o BLE | Glucosa intersticial |
| Horas de sueño | Bosch BMI270 o MPU6050 | Oura Ring Gen 3 o Garmin | I2C o SPI | Actigrafía y fases de sueño |
| Estado de ánimo | Pantalla táctil o Encoder | Tablet de cabina | GPIO o I2C | Escala subjetiva y test PVT |
| Radiación espacial | Fotodiodo PIN PocketGeiger | Dosímetro NASA RadPC | GPIO Interrupt | Dosis acumulada en mSv |



### Detalles de implementación para el equipo de hardware

* **Microcontrolador Nodo Wearable (Adquisición):** Se recomienda un **ESP32-S3** o un **Nordic nRF52840**. El nRF52840 destaca por su ultra bajo consumo en Bluetooth Low Energy (BLE 5.0), ideal para el parche o pulsera que mide pulso (MAX30102), temperatura de contacto de grado clínico (MAX30205 con precisión de ±0.1 °C) y actigrafía del sueño (acelerómetro/giroscopio BMI270).
* **Estimación de Presión Arterial sin Manguito (Opcional en Wearable):** En microgravedad, el equipo de hardware puede combinar el sensor óptico **MAX30102** (fotopletismografía - PPG) con el front-end analógico de ECG **AD8232** para calcular el Tiempo de Tránsito del Pulso (PTT), o bien integrar por puerto serial (UART) un módulo esfigmomanómetro oscilométrico OEM para mediciones puntuales diarias.
* **Glucosa sin Pinchazos Diarios:** Integrar un sensor bioquímico invasivo desde cero es riesgoso; la práctica recomendada es usar un módulo NFC/BLE conectado al microcontrolador para leer parches de Monitoreo Continuo de Glucosa (CGM) comerciales o implementar un potenciómetro digital/simulador de hardware para inyectar curvas de glucosa de prueba durante la validación del sistema.
* **Nodo Central de Cabina (Edge Gateway):** Una **Raspberry Pi 5** con pantalla táctil de 7 pulgadas o una tablet robusta. Recibe las tramas BLE de los sensores del astronauta, ejecuta la base de datos local, muestra la figura humana interactiva y permite el ingreso manual como respaldo ante fallos de sensores.



## 2. Arquitectura de Software y Trade-offs

Dadas las restricciones críticas del proyecto —comunicación intermitente o nula con la Tierra, necesidad de explicabilidad médica para un usuario que no sabe autoevaluarse y trabajo simultáneo entre equipos de hardware y software—, la arquitectura óptima es una **Arquitectura Hexagonal (Puertos y Adaptadores) con enfoque Local-First y un Motor de Reglas Determinista en el Borde (Edge Computing)**.

### Estructura lógica de la arquitectura

1. **Capa de Dominio (Núcleo Médico Autónomo):** Contiene la lógica pura sin dependencias externas. Incluye el calculador estadístico de línea base personal (media móvil y desviación estándar/Z-Score del Paso 2), el evaluador del semáforo (Paso 3), el motor de correlación multivariable para alertas de combinación (Paso 4), el detector de regresión lineal para tendencias (Paso 5) y la máquina de estados finitos para los 4 niveles de escalamiento (Paso 6).


2. **Puertos de Entrada (Ingesta Dual):** Define una interfaz única de lectura fisiológica. Gracias a los adaptadores, el dominio no distingue si la temperatura de 36.5 °C entró por el adaptador Bluetooth del sensor MAX30205, por un simulador JSON o por el formulario manual con validación de errores de captura (Paso 1).


3. **Almacenamiento Local-First y Cola Store-and-Forward:** Utiliza una base de datos embebida de series temporales o relacional ligera (SQLite en modo WAL). Cuando se genera el "Parte para Tierra" (Paso 7), se guarda en una cola persistente local que se sincroniza automáticamente en segundo plano apenas se detecta ventana de enlace satelital.



### Matriz de Trade-offs de Atributos de Calidad

| Atributo Priorizado | Atributo Sacrificado | Decisión Arquitectónica | Efecto en la Misión |
| --- | --- | --- | --- |
| Disponibilidad offline | Consistencia global inmediata | Base de datos Local-First y cola asíncrona | Funciona sin conexión a la Tierra |
| Determinismo y seguridad | Flexibilidad de IA caja negra | Motor de reglas explícito y Z-Score estadístico | Explicaciones trazables sin alucinaciones |
| Desacoplamiento y testabilidad | Simplicidad inicial de código | Arquitectura Hexagonal con contratos JSON | Hardware y software avanzan sin bloquearse |
| Confiabilidad de captura | Automatización exclusiva | Ingesta híbrida por sensores BLE y manual | Continúa operando si falla un sensor físico |



### Justificación de los Trade-offs

* **Disponibilidad y Autonomía en el Borde vs. Consistencia en la Nube:** En una misión como Artemis II o en una base lunar, depender de un servidor en la Tierra (arquitectura cliente-servidor clásica) inutilizaría la aplicación durante cortes de comunicación. Sacrificamos la sincronización en tiempo real con el control de misión a favor de una autonomía total en el dispositivo del astronauta (Teorema CAP volcado a Disponibilidad y Tolerancia a Particiones), empaquetando resúmenes ligeros ("Parte para Tierra") mediante el patrón Store-and-Forward.


* **Auditabilidad Clínica y Explicabilidad vs. Modelos Complejos de Machine Learning:** El proyecto exige explicar siempre por qué se activó un nivel de escalamiento y responder las 4 preguntas del botón "¿qué significa esto?". Usar redes neuronales profundas (Deep Learning) introduciría una "caja negra" imposible de auditar ante una emergencia médica como la evacuación de Crew-11. En su lugar, un motor de reglas determinista combinado con estadística personalizada (desviación respecto a la línea base individual del Paso 2 y pendiente de tendencia del Paso 5) garantiza un 100 % de trazabilidad y consume mínimos recursos de CPU y batería.


* **Desacoplamiento (Puertos y Adaptadores) vs. Velocidad de Prototipado Monolítico:** Crear capas de abstracción añade archivos iniciales al proyecto, pero evita el problema clásico donde el equipo de software está detenido esperando a que el equipo de hardware suelde y calibre los sensores.

## 3. Estructura de Carpetas del Monorepo

Para que los equipos de hardware y software trabajen en el mismo repositorio sin conflictos de fusión (merge conflicts), la clave es aislar ambos mundos y unirlos únicamente a través de un directorio compartido de **Contratos de Datos**.

```text
astronaut-health-copilot/
├── README.md
├── contracts/                          # PUNTO DE UNIÓN: Nadie cambia esto sin acuerdo mutuo
│   ├── telemetry-payload.schema.json   # Esquema JSON de lecturas de sensores (BLE/Serial)
│   ├── earth-report.schema.json        # Esquema del "Parte para Tierra" (Paso 7)
│   ├── ble-gatt-profile.yaml           # UUIDs de servicios y características Bluetooth
│   └── medical-ranges-config.json      # Rangos base por entorno (ISS, Nave, Base Lunar)
│
├── hardware/                           # ÁREA EXCLUSIVA DEL EQUIPO DE HARDWARE
│   ├── firmware/
│   │   ├── wearable-node/              # Código C/C++ (PlatformIO/Arduino) para ESP32/nRF52
│   │   │   ├── src/
│   │   │   │   ├── main.cpp
│   │   │   │   ├── sensors/            # Drivers: MAX30102, MAX30205, BMI270, Dosímetro
│   │   │   │   ├── filters/            # Filtrado de ruido de movimiento y validación física
│   │   │   │   └── comms/              # Emisor BLE GATT / Serial JSON según /contracts
│   │   │   └── platformio.ini
│   │   └── calibration-tools/          # Scripts de calibración de sensores
│   ├── pcb-schematics/                 # Esquemáticos y diseño de placa en KiCad
│   ├── enclosure-cad/                  # Modelos 3D (.STL / .STEP) de la carcasa del wearable
│   └── hardware-simulator/             # Script Python que finge ser el ESP32 para pruebas de SW
│
├── software/                           # ÁREA EXCLUSIVA DEL EQUIPO DE SOFTWARE
│   ├── src/
│   │   ├── domain/                     # Núcleo puro (Cero dependencias de UI o BD)
│   │   │   ├── models/                 # Entidades: Astronauta, LecturaDiaria, Alerta
│   │   │   ├── baseline-engine/        # Paso 2: Cálculo del "normal" personal
│   │   │   ├── traffic-light/          # Paso 3: Evaluación Verde, Amarillo, Rojo
│   │   │   ├── anomaly-rules/          # Pasos 4 y 5: Combinación de indicadores y tendencias
│   │   │   ├── escalation-matrix/      # Paso 6: Máquina de estados de los 4 niveles
│   │   │   └── environment-profiles/   # Paso 11: Ajustes para ISS, Nave o Base Lunar
│   │   │
│   │   ├── application/                # Casos de uso y puertos (Interfaces)
│   │   │   ├── ports/
│   │   │   │   ├── SensorInputPort.ts  # Interfaz que acepta datos de HW o Manuales
│   │   │   │   └── EarthSyncPort.ts    # Interfaz para encolar el Parte para Tierra
│   │   │   └── use-cases/
│   │   │       ├── RecordDailyHealth.ts
│   │   │       └── GenerateEarthReport.ts
│   │   │
│   │   ├── infrastructure/             # Adaptadores al mundo exterior
│   │   │   ├── hardware-adapters/      # Receptor Bluetooth BLE / Serial / MQTT
│   │   │   ├── persistence/            # SQLite local + Cola Store-and-Forward offline
│   │   │   └── validators/             # Paso 1: Validador de rangos absurdos (ej. 360 °C)
│   │   │
│   │   └── ui/                         # Interfaz visual para el astronauta
│   │       ├── components/
│   │       │   ├── HumanFigure2D3D/    # Figura humana interactiva codificada por colores
│   │       │   ├── ExplainButton/      # Pasos 8 y 9: Modal "¿Qué significa esto?" (4 preguntas)
│   │       │   ├── TrendCharts/        # Gráficas dinámicas contra la línea base personal
│   │       │   └── WellnessTips/       # Paso 10: Consejos accionables según estado
│   │       └── pages/
│   │           ├── DailyCheckIn/       # Formulario manual + lectura automática de sensores
│   │           ├── EscalationDashboard/# Vista principal con el nivel de acción (1 al 4)
│   │           └── EarthReportView/    # Vista previa de 1 página lista para transmitir
│   └── tests/                          # Pruebas unitarias de reglas médicas y simulaciones
│
└── docs/                               # DOCUMENTACIÓN COMPARTIDA
    ├── architecture-decisions/         # Justificación de trade-offs para el jurado del reto
    └── medical-resources/              # Fuentes oficiales de la NASA y umbrales fisiológicos

```

### Flujo de trabajo independiente entre ambos equipos

1. **Definición del Contrato (Día 1):** Ambos equipos acuerdan el formato de datos dentro de la carpeta **contracts** (por ejemplo, cómo se estructura el paquete JSON con los 6 indicadores y los UUIDs de Bluetooth).
2. **Desarrollo paralelo sin bloqueos:**
* El **equipo de hardware** trabaja únicamente dentro de la carpeta **hardware**, programando los drivers en C/C++, filtrando el ruido eléctrico de los sensores y emitiendo tramas que cumplan el esquema de **contracts**.
* El **equipo de software** trabaja únicamente dentro de la carpeta **software**. Para probar las gráficas, la línea base y las alertas de combinación sin tener el hardware físico conectado, ejecutan el simulador ubicado en **hardware/hardware-simulator**, el cual inyecta tramas falsas (por ejemplo, una caída progresiva de horas de sueño combinada con aumento de pulso) directamente al adaptador de entrada.


3. **Regla de control de versiones (Git):** Se pueden configurar reglas de permisos (archivo CODEOWNERS en GitHub/GitLab) para que los cambios en **hardware** solo requieran aprobación del líder de electrónica, los cambios en **software** del líder de desarrollo, y cualquier cambio en **contracts** exija la firma de ambos líderes.

