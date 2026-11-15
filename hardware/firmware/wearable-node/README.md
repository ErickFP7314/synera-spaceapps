# Firmware del nodo sensor (ESP32 + MAX30102) — contrato `SerialFrame` v2

Emite **una línea JSON por segundo** por USB a 115200 baudios, por ejemplo:
```json
{"t":12,"hr":62,"temp":36.6,"q":1,"src":"sensor"}
```
Contrato: [`contracts/telemetry-payload.schema.json`](../../../contracts/telemetry-payload.schema.json) → `definitions/SerialFrame`.

## Cableado (ESP32 DevKit v1)
| MAX30102 | ESP32 |
|---|---|
| VIN | 3V3 |
| GND | GND |
| SDA | GPIO21 |
| SCL | GPIO22 |

Dirección I²C: `0x57`.

### Temperatura cutánea (opcional; se detecta sola al arrancar)
| Sensor | Conexión | Precisión | Se detecta si… |
|---|---|---|---|
| **MAX30205** (recomendado) | Mismo bus I²C: VCC→3V3, GND, SDA→GPIO21, SCL→GPIO22, A0–A2→GND (dirección `0x48`) | ±0,1 °C | Responde una dirección entre `0x48` y `0x4F` |
| **DS18B20** | DATA→**GPIO4** con resistencia de **4,7 kΩ** a 3V3, VCC→3V3, GND | ±0,5 °C | Aparece en el bus 1-Wire |
| Ninguno | — | — | Se omite `temp`; nunca se inventa |

- La lectura se suaviza con un promedio móvil exponencial (α = 0,3), `TempFilter` en `src/temp.h`.
- Se descartan los valores centinela del DS18B20 (`-127` desconectado y `85` sin conversión).
- Si hay 3 lecturas malas seguidas, se deja de enviar `temp`.
- Mide **piel**, no temperatura central. Pégalo siempre en el mismo sitio (por ejemplo, frente o sien con cinta médica). Galley compara contra la línea base personal, así que la diferencia de sitio no importa si es constante.
- Atención: otro dispositivo I²C en `0x48`–`0x4F` (por ejemplo, un ADS1115) se confundiría con un MAX30205.

## Modos
| Modo | Cómo compilar | Qué envía | `q = 1` cuando… |
|---|---|---|---|
| **HR** (por defecto) | `pio run -e esp32dev -t upload` | `hr` (promedio de 4 latidos, detector de SparkFun) | Hay dedo (IR ≥ 50000), un latido en los últimos 3 s y FC entre 25 y 240 |
| **HR + SpO₂** | `pio run -e esp32dev_spo2 -t upload` | `hr` + `spo2` (algoritmo de Maxim) | Hay dedo y el algoritmo marca FC y SpO₂ como válidas y en rango |
| **Sin sensor** | (automático) | Valores simulados con `"src":"sim"` | Siempre; la app debe mostrar que son simulados |

Reglas que cumplen los tres modos:
- **Nunca se inventan ni se recortan valores.** Lo inválido o fuera de rango se omite.
- **Con `q = 0` no se envían `hr` ni `spo2`.**
- **`temp` se envía solo si hay un MAX30205 o DS18B20 con lectura válida.** La temperatura interna del MAX30102 no es temperatura corporal y nunca se envía.

Con Arduino IDE o arduino-cli: instala las librerías `SparkFun MAX3010x`, `OneWire` y `DallasTemperature`. Copia `src/main.cpp` como `galley_node/galley_node.ino`, junto con `src/frame.h` y `src/temp.h`, y compila para la placa `esp32:esp32:esp32`. Para el modo SpO₂ agrega `--build-property "compiler.cpp.extra_flags=-DGALLEY_SPO2=1"`.

## Pruebas en la laptop (sin placa)
```bash
python3 -m unittest hardware/firmware/wearable-node/test/test_firmware_host.py -v
```
1. Compila `test/host/test_frame.cpp` con g++ contra `src/frame.h` y `src/temp.h`, que son la **misma lógica que corre en el ESP32**. Prueba la calidad `q`, el promedio de latidos, la omisión de valores inválidos, que no haya desbordes, la conversión del MAX30205, los centinelas del DS18B20 y el filtro de temperatura.
2. Valida cada trama contra el contrato.
3. Comprueba que el lector de Software (`parseSerialLine`) las acepta.
4. Si hay arduino-cli con el core `esp32:esp32` y la librería SparkFun MAX3010x, **compila el firmware real en los dos modos**.

Resultado del 15-nov-2026 (con temperatura): **4/4 OK**, sin avisos de compilación en nuestro código. Uso de memoria (DevKit v1):
- HR: flash 303 023 B (23 %), RAM 23 956 B (7 %).
- SpO₂: flash 303 851 B (23 %), RAM 25 452 B (7 %).

## Con la placa real (go/no-go 12:00)
1. `pio device monitor -b 115200`: después del log de arranque del ESP32 deben salir **solo líneas JSON**. Ese log lo imprime la ROM del chip, no se puede quitar desde el firmware, y la app ya ignora las líneas que no son JSON.
2. Pon el dedo quieto sobre el sensor: en 5–10 s debe aparecer `q:1` con un `hr` estable.
3. Quita el dedo: `q:0` y desaparece `hr`.
4. Desconecta el sensor y reinicia: deben salir líneas con `"src":"sim"`.
5. Con el sensor de temperatura pegado a la piel: en unos 5 s aparece `temp` con 1 decimal, entre 30 y 40 °C. Al despegarlo baja poco a poco; si lo desconectas, `temp` desaparece después de 3 s.
6. Conecta la placa a la app (Chrome/Edge → "Connect sensor (USB)").

Precisión: un sensor de dedo no es de grado clínico. Mostrarlo así en la app y en la página del proyecto.
