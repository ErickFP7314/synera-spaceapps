/*
 * Galley voice guide (Web Speech API) and soft alert tones (Web Audio API).
 * Extracted and adapted from the team kit (say, speakable, beep).
 *
 * Calm-voice policy (do not cause panic):
 *  - Green zones are not read one by one; only a short summary at the end.
 *  - Amber and red zones are read as: zone + value + what to do. No words like
 *    "danger" or "emergency" in the voice; the screen carries the level.
 *  - The tone plays once, softly, only for red. It never loops by itself.
 */

let LANG = "es";
let enabled = true;
let actx = null;

export function setVoiceLang(lang) { LANG = lang === "en" ? "en" : "es"; }
export function setVoiceEnabled(on) { enabled = !!on; if (!on) stopVoice(); }
export function stopVoice() { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); }

/* turn units into words so the voice reads them well */
export function speakable(text) {
  if (LANG === "es") {
    return text
      .replace(/°C/g, " grados")
      .replace(/(\d+)\/(\d+) mmHg/g, "$1 sobre $2")
      .replace(/(\d+),(\d) h\b/g, "$1 coma $2 horas").replace(/(\d) h\b/g, "$1 horas")
      .replace(/\/10/g, " de 10")
      .replace(/ lpm\b/g, " latidos por minuto")
      .replace(/ mg\/dL/g, " miligramos por decilitro")
      .replace(/ min\b/g, " minutos")
      .replace(/%/g, " por ciento");
  }
  return text
    .replace(/°C/g, " degrees")
    .replace(/(\d+)\/(\d+) mmHg/g, "$1 over $2")
    .replace(/(\d) h\b/g, "$1 hours")
    .replace(/\/10/g, " out of 10")
    .replace(/ bpm\b/g, " beats per minute")
    .replace(/ mg\/dL/g, " milligrams per deciliter")
    .replace(/ min\b/g, " minutes")
    .replace(/%/g, " percent");
}

/** speak and resolve when finished (or right away if voice is off/unavailable) */
export function speak(text) {
  return new Promise((resolve) => {
    if (!enabled || !("speechSynthesis" in window) || !text) return resolve();
    const u = new SpeechSynthesisUtterance(speakable(text));
    u.lang = LANG === "es" ? "es-ES" : "en-US";
    u.rate = 0.95;   /* a little slower than normal: calmer */
    u.pitch = 1;
    const voice = window.speechSynthesis.getVoices().find((v) => v.lang && v.lang.toLowerCase().startsWith(LANG));
    if (voice) u.voice = voice;
    let done = false;
    const end = () => { if (!done) { done = true; resolve(); } };
    u.onend = end; u.onerror = end;
    setTimeout(end, 12000); /* safety: never block the scan */
    window.speechSynthesis.speak(u);
  });
}

function tone(freq, start, dur, vol) {
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = "sine"; o.frequency.value = freq;
  g.gain.setValueAtTime(0, actx.currentTime + start);
  g.gain.linearRampToValueAtTime(vol, actx.currentTime + start + 0.03);
  g.gain.linearRampToValueAtTime(0, actx.currentTime + start + dur);
  o.connect(g); g.connect(actx.destination);
  o.start(actx.currentTime + start); o.stop(actx.currentTime + start + dur + 0.02);
}

/** "ok": short high tone, "warn": one low tone, "crit": two soft double tones */
export function chime(level) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (level === "crit") { tone(660, 0, 0.25, 0.09); tone(520, 0.3, 0.3, 0.09); tone(660, 0.9, 0.25, 0.09); tone(520, 1.2, 0.3, 0.09); }
    else if (level === "warn") tone(520, 0, 0.3, 0.07);
    else tone(740, 0, 0.18, 0.05);
  } catch (e) { /* audio blocked by the browser until the user clicks: fine */ }
}
