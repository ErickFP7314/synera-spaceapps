// Generates Galley's recorded voice clips (used when the browser has no Web Speech voice, e.g. Brave
// or Chrome on Linux). Sentences are number-free so they stay true for any reading.
// Engine: Kokoro-82M (open model) through `npx hyperframes tts`; needs HYPERFRAMES_PYTHON pointing at
// a venv with kokoro-onnx + soundfile. Run: node tools/build-voice.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { makeT, ADVICE } from "../app/i18n.js";
import { speakable } from "../app/voice.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const OUT = join(HERE, "..", "app", "voice");
const cfg = JSON.parse(readFileSync(join(ROOT, "contracts/medical-ranges-config.json"), "utf8"));
const rules = JSON.parse(readFileSync(join(ROOT, "data/reference/rules.json"), "utf8"));
const VOICE = { en: "af_heart", es: "ef_dora" };
const lines = [];
for (const lang of ["en", "es"]) {
  const t = makeT(() => lang);
  const label = (k) => { const s = cfg.indicators[k].label[lang].replace(/\s*\(.*?\)\s*/g, " ").trim(); return s.charAt(0).toLowerCase() + s.slice(1); };
  lines.push({ lang, key: "start", text: t("say_start", { name: "" }).replace(/,\s*\./, ".") });
  for (const [k, dirs] of Object.entries(ADVICE[lang])) {
    for (const [dir, advice] of Object.entries(dirs)) {
      if (!advice) continue;
      lines.push({ lang, key: `ind_${k}_${dir}`, text: t("say_ind", { zone: t("zone_" + cfg.indicators[k].zone), label: label(k), dir: t("dir_" + dir), advice }) });
    }
  }
  for (const lv of ["1", "2", "3", "4"]) {
    const L = rules.escalation_levels[lv];
    lines.push({ lang, key: `level_${lv}`, text: t("say_end", { level: L.name[lang], action: L.action[lang] }) });
  }
}
const only = process.argv.includes("--list");
if (only) { console.log(JSON.stringify(lines, null, 1)); process.exit(0); }
for (const { lang, key, text } of lines) {
  const dir = join(OUT, lang); mkdirSync(dir, { recursive: true });
  const wav = join(dir, key + ".wav"), mp3 = join(dir, key + ".mp3");
  execFileSync("npx", ["-y", "hyperframes@0.9.53", "tts", speakable(text, lang), "-v", VOICE[lang], "-s", "0.95", "-o", wav, "--json"], { stdio: ["ignore", "pipe", "inherit"] });
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", wav, "-ac", "1", "-ar", "24000", "-b:a", "48k", mp3]);
  if (existsSync(wav)) rmSync(wav);
  console.log(lang, key);
}
writeFileSync(join(OUT, "manifest.json"), JSON.stringify({ engine: "Kokoro-82M via hyperframes tts", voices: VOICE, note: "AI-generated voice clips; number-free sentences.", lines }, null, 1) + "\n");
console.log("done", lines.length, "clips");
