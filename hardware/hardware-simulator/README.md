# Simulador de sensor (Plan B) — contrato `SerialFrame` v2

Emite **la misma línea JSON que el ESP32**, una por segundo:

```json
{"t":1794749635,"q":1,"src":"sim","hr":62,"spo2":98,"temp":36.5}
```

Contrato: [`contracts/telemetry-payload.schema.json`](../../contracts/telemetry-payload.schema.json) → `definitions/SerialFrame`.

## Uso
```bash
python3 hardware/hardware-simulator/simulator.py                          # normal, infinito, 1 Hz
python3 hardware/hardware-simulator/simulator.py --scenario bradycardia   # normal | bradycardia | fever | no_signal
python3 hardware/hardware-simulator/simulator.py --count 10 --interval 0.5
python3 hardware/hardware-simulator/simulator.py --port /dev/ttyUSB0      # escribe en un puerto serie (requiere pyserial en un venv)
```

| Escenario | Qué emite | Para qué sirve en el demo |
|---|---|---|
| `normal` | FC 60–66, SpO₂ 97–99, temp 36.4–36.7, q=1 | Todo verde |
| `bradycardia` | FC 44–48 | Pecho en ROJO frente a la línea base de 62 lpm |
| `fever` | temp 37.4–37.7, FC 76–84 | Apoyo a la regla R4 (infección temprana) |
| `no_signal` | q=0, sin FC ni SpO₂ | La app muestra "señal no válida" |

## Prueba de aceptación (tarjeta Trello "[HW] Validar simulador v2")
```bash
python3 -m unittest hardware/hardware-simulator/test_simulator.py -v
~/.venvs/global/bin/python -m unittest hardware/hardware-simulator/test_simulator.py -v   # + prueba de puerto serie (pyserial)
```
La prueba verifica cuatro cosas:
1. Los 4 escenarios corren sin errores.
2. Cada línea cumple el contrato: `t` y `q` obligatorios, rangos válidos, sin campos extra.
3. Cada escenario produce la fisiología que promete.
4. **El parser de Software (`parseSerialLine`) acepta todas las líneas.** Además, si pyserial está instalado, que `--port` escriba bien en un puerto serie (pty).

Resultado del 15-nov-2026: **4/4 OK**.
