# Material de apoyo (B-roll) de Hardware para el video

Todo sale de la **simulación Wokwi del firmware real**. Los datos JSON son salida serie capturada con `wokwi-cli` (`src/wokwi-serial-*.log`): nada es inventado. Las imágenes llevan el rótulo **SIMULATION**. No aparecen personas ni logos de NASA.

| Archivo | Qué muestra | Uso sugerido |
|---|---|---|
| [`../pcb-schematics/galley-wiring.png`](../pcb-schematics/galley-wiring.png) | Diagrama de conexiones (foto 1) | Página del proyecto · diapositiva "How it works" |
| `hw-02-wokwi-nominal.png` | Nodo funcionando, deslizador en 36,5 °C | Página del proyecto |
| `hw-03-wokwi-fever.png` | Deslizador en 38,5 °C, `temp` lo sigue | Video (fiebre / infección) |
| `hw-04-serial-frame.png` | Una trama `SerialFrame` con cada campo explicado | Diapositiva técnica · README |
| `hw-05-wokwi-out-of-range.png` | Deslizador en 125 °C → `temp` **omitido** | Página: "never invents data" |
| `hw-clip-data-arriving-5s.mp4` | 5 s, 1920×1080, 30 fps: llega 1 línea por segundo y la temperatura sube 36,5 → 38,2 °C | Video: 2–3 s antes del escaneo (0:10) |

## Volver a generar
Necesita `google-chrome` y `ffmpeg`:
```bash
python3 hardware/media/src/render_media.py            # usa @wokwi/elements 1.9.1 desde unpkg
```
- `src/scene.html`: plantilla. El ESP32 es el gráfico oficial de Wokwi (`@wokwi/elements`, MIT). El DS18B20 y la resistencia están dibujados a mano, porque ese paquete no los trae.
- Para capturar logs nuevos: `hardware/simulation-wokwi/scenario-temp-slider.yaml` (ver su README).

## Si consiguen la placa física
Cambien `hw-02`/`hw-03` por fotos reales del montaje (fondo liso, buena luz, sin caras) y graben 5 s del dedo en el MAX30102 con el pulso llegando a la app. Mientras tanto, este material cubre la tarea.
