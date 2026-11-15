# Herramientas de Hardware

## `gonogo.py`: decisión GO / NO-GO del sensor real
Aplica la regla de la tarjeta "[HW+SW] Go/No-Go": **≥ 10 s seguidos de tramas válidas del sensor real** (`src:"sensor"`, `q:1`, que cumplan el contrato `SerialFrame`) → **GO**. Si no, el demo usa el simulador y no se vuelve a discutir.

```bash
# Con la placa por USB (necesita pyserial en ~/.venvs/global o en un venv del proyecto)
python3 hardware/tools/gonogo.py --port /dev/ttyUSB0 --seconds 15     # Windows: --port COM3

# Con cualquier fuente de líneas por stdin (por ejemplo, el firmware en Wokwi)
wokwi-cli -q --timeout 14000 --timeout-exit-code 0 hardware/simulation-wokwi | python3 hardware/tools/gonogo.py
```
Código de salida: `0` = GO, `1` = NO-GO. Las líneas que no son JSON (el arranque del ESP32) se ignoran.

Pruebas: `python3 -m unittest hardware/tools/test_gonogo.py -v`

### Resultado del 15-nov-2026
- **No hay placa conectada** (ni ESP32 ni adaptador USB-serie).
- Firmware real en Wokwi → `gonogo.py`:
  - 13 tramas válidas, 0 inválidas, 10 líneas de arranque ignoradas.
  - `src=sim` en todas (Wokwi no tiene MAX30102).
  - **Cadena USB/JSON OK · VEREDICTO: NO-GO** para el sensor real → **el demo usa el simulador / Wokwi**.
- Si consiguen la placa: conectarla, correr el comando de arriba y, si sale **GO**, grabar 3–5 s del dedo en el sensor para el video.
