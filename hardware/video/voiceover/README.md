# Voz en off del video (IA, ElevenLabs)

- **Voz:** "Matilda" (voz prediseñada de ElevenLabs), modelo `eleven_multilingual_v2`, en inglés.
- **Atribución:** es audio generado con IA. El video lo indica en pantalla durante todo el clip ("AI-generated voice · ElevenLabs"), como piden el plan gratuito de ElevenLabs y las reglas de Space Apps sobre contenido generado con IA.
- **Guion y tiempos:** [`lines.json`](lines.json). Los subtítulos de `../index.html` dicen exactamente lo mismo que la voz.

## Rehacer la voz y el video
1. Generar los clips (la clave va **solo** en una variable de entorno, nunca en un archivo):
   ```bash
   export ELEVENLABS_API_KEY=...
   python3 tts.py
   ```
2. Recortar los silencios y armar la pista de 29,5 s con `ffmpeg`, usando `adelay` con los tiempos de `lines.json` y `loudnorm` a −16 LUFS. El resultado ya está en `voiceover.m4a`.
3. Renderizar el video sin audio y juntarlo con la voz:
   ```bash
   cd hardware/video
   npx hyperframes render -o /tmp/silent.mp4 --fps 30
   ffmpeg -i /tmp/silent.mp4 -i voiceover/voiceover.m4a -c:v copy -c:a aac -b:a 160k -shortest galley-demo.mp4
   ```
