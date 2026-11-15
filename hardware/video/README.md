# Video demo (≤ 30 s) — edición de Hardware

Video final renderizado: [`galley-demo.mp4`](galley-demo.mp4). Dura **29,5 s**, en 1920×1080 a 30 fps, con subtítulos en inglés incrustados.

Sigue el guion de Bio ([`submission/video-script.md`](../../submission/video-script.md)). Está hecho con [HyperFrames](https://hyperframes.studio): el video es un HTML (`index.html`) que se renderiza a MP4.

## Estado
- ✅ Tarjeta de título, tarjeta de demora a Marte (contador hasta 44 min), HUD de telemetría, subtítulos EN y tarjeta final con fuentes.
- ✅ Clip del sensor (Wokwi) en miniatura durante los primeros 2 s del escaneo. Se puede quitar con la variable `showSensorPip`.
- ✅ Chips con datos reales del repo: "46 bpm vs 62" (escenario `bradycardia`, día 13) y "NASA DONKI · 10–11 May 2024".
- ✅ **Las 5 tomas son grabaciones reales de la app v2** (`assets/rec-0N-*.mp4`), hechas con Chrome automatizado en el tema pre-sueño, a 1920×1080. `rec-01` muestra el ingreso eligiendo al tripulante en la lista. Si alguien mayor de 18, que acepte salir en el video, graba el login con su cara, se reemplaza ese archivo y se renderiza de nuevo.
- Colores del video: tokens del tema pre-sueño de la app, para que gráficos y grabaciones se vean como un solo producto.

## Cuando lleguen las grabaciones de Software
1. Copien cada grabación a `assets/` **con el mismo nombre**:

   | Archivo | Toma | Se usa |
   |---|---|---|
   | `rec-01-login.mp4` | Login con cámara → cámara apagada (adulto que consiente) | 3 s (0:07–0:10) |
   | `rec-02-bradycardia-day13.mp4` | Escaneo, escenario bradycardia, día 13: pecho ROJO | 9 s (0:10–0:19) |
   | `rec-03-mars-sbar.mp4` | Selector Marte + "S-B-A-R queued · reply ~44 min" | 3 s (0:19–0:22) |
   | `rec-04-solar-storm-donki.mp4` | Tarjeta de radiación, escenario solar_storm | 2,5 s (0:22–0:24,5) |
   | `rec-05-trends-14d.mp4` | Tendencias de 14 días | 2,5 s (0:24,5–0:27) |

2. Si el momento bueno no está al inicio del archivo, cambien `data-media-start="0"` en el `<video>` de esa toma (en segundos). Por ejemplo, `data-media-start="4.5"` usa la grabación desde el segundo 4,5.
3. Rendericen:
   ```bash
   cd hardware/video
   npx hyperframes lint                       # 0 errores
   npx hyperframes render -o galley-demo.mp4 --fps 30
   ```
   Tarda menos de 1 minuto. Para ver los cambios en vivo: `npx hyperframes preview`.

`./make_placeholders.sh` regenera las placas, pero nunca pisa un archivo que ya sea una grabación real.

## Reglas de la entrega (verificadas en el borrador)
- [x] Duración ≤ 30 s: 29,5 s (`data-duration` del root; comprobado con ffprobe).
- [x] Subtítulos en inglés incrustados.
- [x] Sin logos ni insignias de NASA (solo el nombre en texto). Sin personas en el borrador.
- [x] Sin imágenes ni video generados con IA: todo se renderiza desde código y datos reales, así que no lleva marca de agua.
- [x] Sin personas en las tomas actuales (el login usa la lista de tripulantes).
- [ ] Subirlo a YouTube (no listado) o a un Drive público, probar el enlace en una ventana privada y pegarlo en Trello y en la página del proyecto.

## Diseño
- Concepto: consola de telemetría de salud de la tripulación (HUD con reloj MET, marcas de registro, escala lateral).
- Colores: los tokens de la app Galley (`software/app/index.html`), para que las grabaciones y los gráficos se vean como un solo producto.
- Fuentes: Montserrat + JetBrains Mono (vienen incluidas en el renderizador).
- Tiene voz en off en inglés generada con IA (ElevenLabs, voz "Matilda"). En pantalla dice "AI-generated voice · ElevenLabs" durante todo el video, y los subtítulos coinciden palabra por palabra con la voz. Detalles y cómo rehacerla: [`voiceover/`](voiceover/).
