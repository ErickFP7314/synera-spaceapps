/*
 * Galley voice guide + soft alert tones.
 *
 * Why three paths: Web Speech voices depend on the browser and the OS. Brave (and Chrome on Linux
 * without speech-dispatcher) exposes ZERO voices, so speak() is silent. Galley therefore:
 *   1. uses a Web Speech voice for the current language when one exists (reads the values too);
 *   2. otherwise plays its recorded voice clips (voice/<lang>/<key>.mp3, generated offline with the
 *      open Kokoro-82M model; number-free sentences);
 *   3. and ALWAYS shows the same sentence as an on-screen caption, so nothing depends on audio.
 *
 * Calm-voice policy: green zones are not read one by one; amber/red are read as zone + what to do;
 * never "danger" or "emergency"; the tone plays once, softly, only for red.
 */

let LANG = "en";
let enabled = true;
let actx = null;
let captionCb = () => {};
let clipBase = "voice";
let voicesReady = null;
let current = null; /* currently playing <audio> */
let token = 0;

export function setVoiceLang(lang) { LANG = lang === "es" ? "es" : "en"; }
export function setVoiceEnabled(on) { enabled = !!on; if (!on) stopVoice(); }
export function onCaption(cb) { captionCb = cb || (() => {}); }
export function setClipBase(path) { clipBase = path; }

export function stopVoice() {
  token++;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  if (current) { current.pause(); current = null; }
}

/* voices load asynchronously in Chrome; wait for them (max 1.5 s) */
function loadVoices() {
  if (voicesReady) return voicesReady;
  voicesReady = new Promise((resolve) => {
    if (!("speechSynthesis" in window)) return resolve([]);
    const now = window.speechSynthesis.getVoices();
    if (now.length) return resolve(now);
    const done = () => resolve(window.speechSynthesis.getVoices());
    window.speechSynthesis.addEventListener("voiceschanged", done, { once: true });
    setTimeout(done, 1500);
  });
  return voicesReady;
}

/** best voice for a language: local voices first (network voices cut out after ~15 s in Chrome) */
async function pickVoice(lang) {
  const all = await loadVoices();
  const mine = all.filter((v) => v.lang && v.lang.toLowerCase().replace("_", "-").startsWith(lang));
  if (!mine.length) return null;
  const pref = lang === "es" ? ["es-es", "es-mx", "es-us"] : ["en-us", "en-gb"];
  mine.sort((a, b) => (b.localService - a.localService) || (pref.indexOf(a.lang.toLowerCase()) === -1) - (pref.indexOf(b.lang.toLowerCase()) === -1));
  return mine[0];
}

/** which engine will speak in the current language: "speech" | "clips" | "captions" */
export async function voiceMode() {
  if (await pickVoice(LANG)) return "speech";
  return "clips";
}

function speakWebSpeech(text, voice, my) {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    /* split into sentences: long utterances get cut in Chrome */
    const parts = text.match(/[^.!?]+[.!?]*/g) || [text];
    let i = 0, keep = null;
    const finish = () => { clearInterval(keep); resolve(); };
    const next = () => {
      if (my !== token || i >= parts.length) return finish();
      const u = new SpeechSynthesisUtterance(parts[i++].trim());
      u.voice = voice; u.lang = voice.lang; u.rate = 0.95; u.pitch = 1;
      let ended = false;
      const end = () => { if (!ended) { ended = true; next(); } };
      u.onend = end; u.onerror = end;
      setTimeout(end, 9000); /* safety: never block the scan */
      synth.speak(u);
    };
    synth.cancel();
    /* Chrome pauses long queues silently; nudging resume() keeps it alive */
    keep = setInterval(() => { if (synth.paused) synth.resume(); }, 4000);
    next();
  });
}

function playClip(key, my) {
  return new Promise((resolve) => {
    if (!key) return resolve(false);
    const a = new Audio(`${clipBase}/${LANG}/${key}.mp3`);
    current = a;
    let settled = false;
    const done = (ok) => { if (!settled) { settled = true; if (current === a) current = null; resolve(ok); } };
    a.onended = () => done(true);
    a.onerror = () => done(false);
    setTimeout(() => done(true), 15000);
    if (my !== token) return done(false);
    a.play().catch(() => done(false));
  });
}

/** read ranges and units out loud ("4-12 h" -> "4 to 12 hours") */
export function speakable(text, lang = LANG) {
  const to = lang === "es" ? " a " : " to ", hours = lang === "es" ? " horas" : " hours";
  return String(text).replace(/(\d+)\s*[-–]\s*(\d+)\s*h\b/g, `$1${to}$2${hours}`).replace(/(\d)\s*h\b/g, `$1${hours}`).replace(/S-B-A-R/g, "S B A R");
}

const readingTime = (text) => Math.min(6000, 900 + text.length * 45);

/**
 * Say one sentence.
 * @param {string} text      full sentence (may include values) — spoken by Web Speech and shown as caption
 * @param {string} [clipKey] recorded clip to use when the browser has no voice (number-free version)
 * @param {string} [clipText] caption to show when the clip plays (the number-free sentence)
 */
export async function say(text, clipKey, clipText) {
  const my = ++token;
  if (!text) return;
  if (!enabled) { captionCb(text, "off"); return; }
  const voice = await pickVoice(LANG);
  if (my !== token) return;
  if (voice) { captionCb(text, "speech"); await speakWebSpeech(speakable(text), voice, my); return; }
  captionCb(clipText || text, "clips");
  const ok = await playClip(clipKey, my);
  if (!ok && my === token) { captionCb(clipText || text, "captions"); await new Promise((r) => setTimeout(r, readingTime(clipText || text))); }
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
  if (!enabled) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === "suspended") actx.resume();
    if (level === "crit") { tone(660, 0, 0.25, 0.09); tone(520, 0.3, 0.3, 0.09); tone(660, 0.9, 0.25, 0.09); tone(520, 1.2, 0.3, 0.09); }
    else if (level === "warn") tone(520, 0, 0.3, 0.07);
    else tone(740, 0, 0.18, 0.05);
  } catch (e) { /* audio blocked until the user clicks: fine */ }
}
