/*
 * Galley web app v2 — controller.
 * Engine: software/src/domain compiled to ./engine (npm run build:engine). Data: the repo's contracts/ and data/.
 * Nothing leaves the browser: profiles and face descriptors stay in localStorage.
 */
import { evaluateDay } from "./engine/index.js";
import { computeBaselines } from "./engine/baseline-engine/baselineCalculator.js";
import { createBodyScan, ZONES } from "./body-scan.js";
import { say, stopVoice, chime, setVoiceLang, setVoiceEnabled, onCaption, voiceMode } from "./voice.js";
import { makeT, ADVICE, SPOKEN_UNIT } from "./i18n.js";
import { createFaceId } from "./face-id.js";
import { icon, hydrateIcons, STATE_ICON } from "./icons.js";
import * as C from "./charts.js";
import { serialSupported, connectSerial, disconnectSerial, summarize } from "./serial.js";

const ROOT = "../../";
const FILES = {
  cfg: "contracts/medical-ranges-config.json",
  schema: "contracts/telemetry-payload.schema.json",
  ds: "data/synthetic/galley-14day-scenarios.json",
  env: "data/reference/environments.json",
  rules: "data/reference/rules.json",
  ie: "data/reference/indicator-explanations.json",
  rad: "data/reference/radiation.json",
  donki: "data/nasa/donki/donki-sep-demo.json",
  osdr: "data/nasa/osdr/inspiration4-crew-labs.json"
};
const D = {};
const INDICATORS = ["hr_rest_bpm", "spo2_pct", "skin_temp_c", "sleep_h", "mood_1_5", "pvt_lapses", "intake_pct", "exercise_pct"];
const CODE = { hr_rest_bpm: "HR·01", spo2_pct: "SPO2·02", skin_temp_c: "TSK·03", sleep_h: "SLP·04", mood_1_5: "MOOD·05", pvt_lapses: "PVT·06", intake_pct: "KCAL·07", exercise_pct: "EXR·08" };
const ZONE_CODE = { head: "H·A1", chest: "C·A2", abdomen: "B·A3", legs: "L·A4" };
const UNIT = { "score 1-5": "/5", "lapses (RT > 355 ms)": "lapses", "% of planned kcal": "%", "% of prescribed minutes": "%" };
const SCENARIOS = ["nominal", "fatigue", "bradycardia", "infection", "solar_storm"];
const ENV_NAME = { ISS: "ISS", MOON: "Moon", MARS: "Mars" };
const DEMO_CREW = { id: "CREW-A", name: "Cmdr. A. Rivera", role: { en: "Commander · demo profile", es: "Comandante · perfil demo" }, demo: true };
const MISSION_START = Date.parse("2026-11-14T13:00:00Z");

/* ---------- state ---------- */
const S = {
  lang: "en", crew: DEMO_CREW, by: "manual", dist: null,
  scenario: "bradycardia", day: 13, env: "ISS", view: "2d", voice: true,
  scanned: false, shown: [], running: false, runToken: 0,
  live: null, liveFrames: [], serialOn: false
};
try { const l = localStorage.getItem("galley-lang"); if (l === "en" || l === "es") S.lang = l; } catch (e) {}
const t = makeT(() => S.lang);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (x) => String(x ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const L = (o) => (o && typeof o === "object" ? o[S.lang] ?? o.en : o ?? "");
const num = (v, d = 1) => {
  if (!Number.isFinite(v)) return "—";
  const s = v.toFixed(d).replace("-", "−");
  return S.lang === "es" ? s.replace(".", ",") : s;
};
const fmtVal = (k, v) => (k === "skin_temp_c" || k === "sleep_h" ? num(v, 1) : num(Math.round(v), 0));
const unitOf = (k) => { const u = D.cfg.indicators[k].unit; const v = UNIT[u] ?? u; return S.lang === "es" && v === "lapses" ? "lapsos" : v; };
const labelOf = (k) => L(D.cfg.indicators[k].label);
const spokenLabel = (k) => { const s = labelOf(k).replace(/\s*\(.*?\)\s*/g, " ").trim(); return s.charAt(0).toLowerCase() + s.slice(1); };
const spokenUnit = (k) => SPOKEN_UNIT[S.lang][unitOf(k)] || unitOf(k);

/* ---------- toast ---------- */
let toastTimer = null;
function toast(msg) { const el = $("#toast"); el.textContent = msg; el.classList.add("on"); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("on"), 3800); }

/* ---------- evaluation ---------- */
function usual() {
  const u = { ...D.ds.baseline_profile };
  const b = S.crew && S.crew.base;
  if (b) {
    if (Number.isFinite(b.hr)) u.hr_rest_bpm = b.hr;
    if (Number.isFinite(b.sleep)) u.sleep_h = b.sleep;
    if (Number.isFinite(b.mood)) u.mood_1_5 = b.mood > 5 ? Math.max(1, Math.round(b.mood / 2)) : b.mood; /* older profiles used 1-10 */
  }
  return u;
}
function seriesDays() {
  const days = D.ds.scenarios[S.scenario].days.map((d) => ({ ...d }));
  if (S.live && S.live.n) {
    const today = days[S.day - 1];
    if (Number.isFinite(S.live.hr)) today.hr_rest_bpm = Math.round(S.live.hr);
    if (Number.isFinite(S.live.spo2)) today.spo2_pct = Math.round(S.live.spo2);
    if (Number.isFinite(S.live.temp)) today.skin_temp_c = S.live.temp;
  }
  return days;
}
function evaluate(dayNo = S.day) {
  const days = seriesDays(), idx = dayNo - 1, u = usual();
  const ev = evaluateDay({ days, index: idx, usual: u, cfg: D.cfg, environment: S.env, crewId: S.crew.id || "CREW-A" });
  const baselines = computeBaselines(days.slice(0, idx), u, D.cfg);
  return { ev, baselines, today: days[idx], days };
}
const zoneStatus = (c) => (c === "RED" ? "crit" : c === "YELLOW" ? "warn" : c === "GREEN" ? "ok" : null);

/* ---------- static texts ---------- */
function applyTexts() {
  document.documentElement.lang = S.lang;
  $$("[data-t]").forEach((el) => { el.textContent = t(el.dataset.t); });
  $$("[data-t-html]").forEach((el) => { el.innerHTML = t(el.dataset.tHtml); });
  $$("[data-t-aria]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.tAria)));
  $$("[data-lang-set]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.langSet === S.lang)));
  $("#scenario").innerHTML = SCENARIOS.map((s) => `<option value="${s}"${s === S.scenario ? " selected" : ""}>${esc(t("sc_" + s))}</option>`).join("");
  $("#voiceText").textContent = S.voice ? t("voice_on") : t("voice_off");
  $("#serialText").textContent = S.serialOn ? t("serial_connected") : t("serial_connect");
  $("#startText").textContent = S.running ? t("scanning") : S.scanned ? t("again") : t("start_scan");
  setVoiceLang(S.lang);
}

/* ---------- theme ---------- */
function setTheme(th) {
  document.documentElement.dataset.theme = th;
  try { localStorage.setItem("galley-theme", th); } catch (e) {}
  $$("[data-theme-set]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.themeSet === th)));
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = th === "night" ? "#15100c" : "#e9e7e1";
}

/* ================= CHECK-IN ================= */
let face = null;
function crewAll() {
  const reg = face ? face.list().map((p) => ({ id: p.id, name: p.name, role: p.role || "", base: p.base || {}, photo: p.photo, lastScan: p.lastScan, face: true })) : [];
  return reg.concat([DEMO_CREW]);
}
const initials = (n) => n.replace(/^(Cmdr|Dr|FE)\.?\s+/i, "").split(/\s+/).map((w) => w[0] || "").join("").slice(0, 2).toUpperCase();
const roleOf = (c) => L(c.role) || "";

function renderCrew() {
  const list = crewAll();
  $("#crewTitle").textContent = t("crew_title", { n: list.length });
  $("#crewList").innerHTML = list.map((c) => {
    const sel = S.crew && S.crew.id === c.id;
    const tag = sel && S.by === "face" ? "MATCH" : c.demo ? t("demo") : "FACE ID";
    const del = c.face ? `<button type="button" class="delbtn" data-del="${esc(c.id)}" aria-label="${esc(t("del"))} ${esc(c.name)}">${icon("x")}</button>` : "";
    return `<div class="crewitem"><button type="button" class="crewrow" data-id="${esc(c.id)}" aria-pressed="${sel}">
      <span class="av">${c.photo ? `<img alt="" src="${c.photo}">` : esc(initials(c.name))}</span>
      <span><span class="nm">${esc(c.name)}</span><span class="rl">${esc(roleOf(c))}</span></span>
      <span class="tagline">${esc(tag)}</span></button>${del}</div>`;
  }).join("");
  $$("#crewList .crewrow").forEach((b) => b.addEventListener("click", () => { const c = crewAll().find((x) => x.id === b.dataset.id); if (c) select(c, "manual"); }));
  $$("#crewList .delbtn").forEach((b) => b.addEventListener("click", () => {
    const p = face.get(b.dataset.del);
    if (!p || !window.confirm(t("del_confirm", { name: p.name }))) return;
    face.remove(p.id);
    if (S.crew && S.crew.id === p.id) select(DEMO_CREW, "manual");
    renderCrew();
  }));
  $("#proceedText").textContent = S.crew ? t("proceed", { name: S.crew.name }) : t("proceed_none");
}

function select(c, by, dist) {
  S.crew = c; S.by = by; S.dist = dist ?? null;
  const card = $("#idcard");
  card.hidden = false;
  $("#idWho").textContent = c.name;
  $("#idFace").innerHTML = c.photo ? `<img alt="" src="${c.photo}">` : esc(initials(c.name));
  $("#idDist").textContent = by === "face" && dist != null ? t("match_dist", { d: num(dist, 2) }) : t("manual").toUpperCase();
  $("#result").hidden = by !== "face";
  $("#resultName").textContent = t("recog", { name: c.name });
  setPill(by === "face" ? "match" : "standby");
  renderCrew(); fillCrewBar();
  if (S.scanned) refreshAll(true);
}

let pillState = "standby";
function setPill(s) {
  pillState = s;
  $("#pill").className = "pill " + s;
  $("#pillText").textContent = t("pill_" + s);
  $("#vf").classList.toggle("sensing", s === "sensing");
}
let statusKey = "st_ready", statusVars = null, statusWarn = false;
function setStatus(key, vars, warn) { statusKey = key; statusVars = vars || null; statusWarn = !!warn; $("#status").textContent = key ? t(key, vars || undefined) : ""; $("#status").className = "status" + (warn ? " warn" : ""); }
let regKey = null, regVars = null;
function regMsg(key, vars) { regKey = key; regVars = vars || null; $("#regMsg").textContent = key ? t(key, vars) : ""; }

async function bootCamera(show) {
  try { show("st_loading"); await face.ensure(); } catch (e) { show("models_fail", true); return false; }
  try { show("st_camera"); await face.startCam(); $("#vfIdle").hidden = true; } catch (e) { face.stopCam(); show(face.camErrorKey(e), true); return false; }
  return true;
}
function camOff() { face.stopCam(); $("#vfIdle").hidden = false; }

let idToken = 0;
async function identify() {
  const token = ++idToken, btn = $("#identify");
  btn.disabled = true; $("#result").hidden = true; face.stopPreview(); $("#regForm").hidden = true;
  if (!face.list().length) { setStatus("st_noprof", null, true); openRegister(); btn.disabled = false; return; }
  setPill("sensing");
  const ok = await bootCamera((k, err) => setStatus(k, null, err));
  if (!ok) { setPill("standby"); btn.disabled = false; return; }
  const res = await face.identify({ timeoutMs: 12000, onStatus: (s) => setStatus(s === "look" ? "st_look" : "st_match"), isCancelled: () => token !== idToken });
  camOff(); btn.disabled = false;
  if (res.status !== "ok") { setPill("standby"); if (res.status === "timeout") setStatus("st_timeout", null, true); return; }
  const c = crewAll().find((x) => x.id === res.id);
  select(c, "face", res.dist);
  setStatus("opening");
  setTimeout(() => { if (S.crew && S.crew.id === c.id && S.by === "face") goScan(); }, 1600);
}

async function openRegister() {
  $("#regForm").hidden = false; $("#regName").focus();
  if (!face.isLive()) { const ok = await bootCamera((k) => regMsg(k)); if (!ok) return; }
  setPill("sensing");
  face.preview((det) => regMsg(det ? "prev_face" : "prev_noface"));
}
async function saveRegister() {
  const name = $("#regName").value.trim();
  if (!name) return regMsg("reg_need_name");
  if (face.exists(name)) return regMsg("reg_exists");
  const hr = parseFloat($("#regHr").value), sleep = parseFloat(String($("#regSleep").value).replace(",", ".")), mood = parseFloat($("#regMood").value);
  if (!(hr >= 35 && hr <= 120 && sleep >= 3 && sleep <= 12 && mood >= 1 && mood <= 5)) return regMsg("reg_bad");
  if (!$("#regConsent").checked) return regMsg("reg_need_consent");
  const btn = $("#regSave"); btn.disabled = true; btn.classList.add("busy");
  face.stopPreview();
  try {
    if (!face.isLive()) { const ok = await bootCamera((k) => regMsg(k)); if (!ok) return; }
    regMsg("reg_look");
    const r = await face.register(name, { hr, sleep, mood }, { role: $("#regRole").value.trim() }, (n, total) => regMsg("reg_progress", { n, total }));
    if (!r.ok) { regMsg("reg_noface"); face.preview((det) => regMsg(det ? "prev_face" : "prev_noface")); return; }
    camOff(); setPill("standby");
    $("#regForm").hidden = true; $("#regName").value = ""; $("#regConsent").checked = false;
    setStatus(r.stored ? "reg_ok" : "reg_nostore", { name: r.profile.name }, !r.stored);
    regMsg(null); renderCrew();
  } catch (e) { camOff(); setPill("standby"); regMsg(face.camErrorKey(e)); }
  finally { btn.disabled = false; btn.classList.remove("busy"); }
}
function cancelRegister() { $("#regForm").hidden = true; regMsg(null); camOff(); setPill("standby"); }

/* ================= SCAN ================= */
let fig = null, fig3d = null;
function fillCrewBar() {
  const c = S.crew;
  $("#sAv").innerHTML = c.photo ? `<img alt="" src="${c.photo}">` : esc(initials(c.name));
  $("#sName").textContent = c.name;
  $("#sRole").textContent = (roleOf(c) ? roleOf(c) + " · " : "") + (S.by === "face" ? t("verified") : t("manual"));
}
function dataSourceLine() {
  $("#dataSource").innerHTML = S.live && S.live.n ? esc(t("data_live")) : esc(t("data_sim", { scenario: t("sc_" + S.scenario), day: S.day }));
}
function goScan() {
  document.getElementById("scan").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  setTimeout(runScan, 700);
}

function stateMark(color) { return `<span class="mark ${color}">${icon(STATE_ICON[color] || "nodata")}${esc(t("st_" + color))}</span>`; }

function wdtm(k, ind, base) {
  const e = D.ie.indicators[k];
  if (!e) return "";
  const q = D.ie.questions;
  const q3 = L(D.ie.q3_template)
    .replace("{baseline}", base ? fmtVal(k, base.center) : "—").replace("{value}", fmtVal(k, ind.value))
    .replace(/\{unit\}/g, unitOf(k)).replace("{z}", String(D.cfg.baseline.z_yellow));
  return `<details class="wdtm"><summary>${icon("chevron")}${esc(L(D.ie.button))}</summary><dl>
    <div><dt>${esc(L(q.q1))}</dt><dd>${esc(L(e.q1))}</dd></div>
    <div><dt>${esc(L(q.q2))}</dt><dd>${esc(L(e.q2))}</dd></div>
    <div><dt>${esc(L(q.q3))}</dt><dd>${esc(q3)}</dd></div>
    <div><dt>${esc(L(q.q4))}</dt><dd>${esc(L(e.q4))}</dd></div>
    ${e.link ? `<div><dd><a href="${esc(e.link)}" target="_blank" rel="noopener">${esc(t("wdtm_link"))}</a></dd></div>` : ""}
  </dl></details>`;
}

function tagHtml(ind, R) {
  const k = ind.key, base = R.baselines[k], cfg = D.cfg.indicators[k];
  const live = S.live && S.live.n && ["hr_rest_bpm", "spo2_pct", "skin_temp_c"].includes(k);
  const z = Number.isFinite(ind.z) ? num(ind.z, 1) : null;
  const why = ind.reasons && ind.reasons.length ? ind.reasons.join(" · ") : z !== null ? `z ${z}` : "";
  return `<article class="tag st-${ind.color}${live ? " src-live" : ""}" data-key="${k}">
    <div class="tag-top"><span class="code">${CODE[k]}</span>${C.barcode(CODE[k] + S.day)}</div>
    <div class="tag-main"><div><div class="lbl">${esc(labelOf(k))}</div><div class="val">${fmtVal(k, ind.value)}<small>${esc(unitOf(k))}</small></div></div>${stateMark(ind.color)}</div>
    <p class="normal">${esc(t("your_normal"))}: <b>${base ? fmtVal(k, base.center) + " " + esc(unitOf(k)) : "—"}</b>${z !== null ? ` · z ${z}` : ""}</p>
    ${why && ind.color !== "GREEN" ? `<p class="why">${esc(why)}</p>` : ""}
    ${C.bullet({ value: ind.value, base, abs: cfg.absolute, zY: D.cfg.baseline.z_yellow, zR: D.cfg.baseline.z_red, color: ind.color, label: `${labelOf(k)} ${fmtVal(k, ind.value)} ${unitOf(k)}` })}
    ${wdtm(k, ind, base)}
  </article>`;
}

function zoneHtml(z, R) {
  const inds = R.ev.indicators.filter((i) => D.cfg.indicators[i.key]?.zone === z && i.color !== "NONE");
  return `<section class="zone" data-zone="${z}" aria-label="${esc(t("zone_" + z))}">
    <div class="zone-h"><h3>${esc(t("zone_" + z))}</h3><span class="loc">${ZONE_CODE[z]}</span><span class="mark-wrap" style="margin-left:auto">${stateMark(R.ev.zones[z])}</span></div>
    <div class="tags">${inds.map((i) => tagHtml(i, R)).join("")}</div>
  </section>`;
}

function topAdvice(R) {
  const hits = [...R.ev.rules].sort((a, b) => b.level - a.level);
  const rule = hits.length ? D.rules.rules.find((r) => r.id === hits[0].id) : null;
  if (rule && rule.id !== "R7") return L(rule.advice);
  const worst = [...R.ev.indicators].filter((i) => i.color === "RED" || i.color === "YELLOW").sort((a, b) => Math.abs(b.z ?? 0) - Math.abs(a.z ?? 0))[0];
  if (worst) { const b = R.baselines[worst.key]; const dir = b && worst.value < b.center ? "low" : "high"; return ADVICE[S.lang][worst.key]?.[dir] || ""; }
  return "";
}

function renderNext(R) {
  const lv = R.ev.level, info = D.rules.escalation_levels[String(lv)];
  const env = D.env.environments[S.env];
  let extra = topAdvice(R);
  if (lv >= 3) extra = L(env.behavior_level3).replace("{minutes}", env.earth_reply_minutes_estimate) + (extra ? " " + extra : "");
  const rules = R.ev.rules.map((r) => { const d = D.rules.rules.find((x) => x.id === r.id); return `<span>${r.id} · ${esc(L(d?.name))}</span>`; }).join("");
  const el = $("#next");
  el.className = "next L" + lv;
  el.innerHTML = `<div class="lvl">${lv}<small>${esc(t("level").toUpperCase())}</small></div>
    <div><h3>${esc(L(info.name))}</h3><p><b>${esc(L(info.action))}</b>${extra ? " " + esc(extra) : ""}</p>${rules ? `<div class="rules" aria-label="${esc(t("rules_active"))}">${rules}</div>` : ""}</div>
    <div class="act"><a class="btn ${lv >= 3 ? "primary" : ""}" href="${lv >= 3 ? "#earth" : "#trends"}">${esc(lv >= 3 ? t("sbar_title") : t("trends_title"))}${icon("arrow")}</a></div>`;
  el.hidden = false;
}

function speechFor(ind, R, z) {
  const b = R.baselines[ind.key];
  const dir = b && ind.value < b.center ? "low" : "high";
  const advice = ADVICE[S.lang][ind.key]?.[dir] || "";
  const zone = t("zone_" + z);
  const full = t("say_ind_vals", { zone, label: labelOf(ind.key).replace(/\s*\(.*?\)\s*/g, " ").trim(), value: `${fmtVal(ind.key, ind.value)} ${spokenUnit(ind.key)}`, dir: t("dir_" + dir), normal: b ? fmtVal(ind.key, b.center) : "—", advice });
  const short = t("say_ind", { zone, label: spokenLabel(ind.key), dir: t("dir_" + dir), advice });
  return { full, short, clip: `ind_${ind.key}_${dir}` };
}

let lastR = null;
async function runScan() {
  if (S.running) return;
  S.running = true; const token = ++S.runToken;
  $("#start").disabled = true; applyTexts();
  stopVoice(); setVoiceEnabled(S.voice);
  const R = evaluate(); lastR = R;
  S.shown = []; S.scanned = true;
  $("#next").hidden = true;
  $("#readout").innerHTML = "";
  await say(t("say_start", { name: S.crew.name.replace(/^Cmdr\.\s*/, "") }), "start", t("say_start", { name: "" }).replace(/,\s*\./, "."));
  if (token !== S.runToken) return;
  const statuses = {}; for (const z of ZONES) statuses[z] = zoneStatus(R.ev.zones[z]);
  const view = S.view === "3d" && fig3d ? fig3d : fig;
  await view.run(statuses, {
    onZone: async (z) => {
      if (token !== S.runToken) return;
      S.shown.push(z);
      $("#readout").insertAdjacentHTML("beforeend", zoneHtml(z, R));
      $$(".zone").forEach((el) => { el.classList.toggle("active", el.dataset.zone === z); el.classList.toggle("dim", el.dataset.zone !== z); });
      const hr = R.ev.indicators.find((i) => i.key === "hr_rest_bpm");
      if (z === "chest" && hr && Number.isFinite(hr.value)) { fig.setHeartRate(hr.value); fig3d && fig3d.setHeartRate && fig3d.setHeartRate(hr.value); }
      labelZone(z, R);
      const bad = R.ev.indicators.filter((i) => D.cfg.indicators[i.key]?.zone === z && (i.color === "RED" || i.color === "YELLOW"));
      for (const ind of bad) {
        if (token !== S.runToken) return;
        const s = speechFor(ind, R, z);
        await say(s.full, s.clip, s.short);
      }
    }
  });
  if (token !== S.runToken) return;
  $$(".zone").forEach((el) => el.classList.remove("active", "dim"));
  renderNext(R);
  renderEarth(R);
  $("#next").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
  if (S.crew.face) face.touch(S.crew.id);
  const lv = R.ev.level, info = D.rules.escalation_levels[String(lv)];
  chime(lv >= 3 ? "crit" : lv === 2 ? "warn" : "ok");
  await say(t("say_end", { level: L(info.name), action: L(info.action) }), `level_${lv}`);
  S.running = false; $("#start").disabled = false; applyTexts();
}

function labelZone(z, R) {
  const inds = R.ev.indicators.filter((i) => D.cfg.indicators[i.key]?.zone === z && i.color !== "NONE");
  const worst = [...inds].sort((a, b) => ({ RED: 2, YELLOW: 1, GREEN: 0 }[b.color] - { RED: 2, YELLOW: 1, GREEN: 0 }[a.color]))[0];
  const text = worst ? `${labelOf(worst.key).replace(/\s*\(.*?\)\s*/g, " ").trim()} ${fmtVal(worst.key, worst.value)} ${unitOf(worst.key)}` : "";
  fig.setLabel(z, text);
  if (fig3d && fig3d.setLabel) fig3d.setLabel(z, text);
}

/* re-render results without animation (language, day, scenario or environment changed) */
function renderResultsStatic(R) {
  if (!S.scanned) {
    $("#readout").innerHTML = `<p class="empty">${esc(t("waiting"))}</p>`;
    $("#next").hidden = true;
    return;
  }
  $("#readout").innerHTML = ZONES.map((z) => zoneHtml(z, R)).join("");
  $$(".tag").forEach((el) => (el.style.animation = "none"));
  for (const z of ZONES) {
    fig.setZone(z, zoneStatus(R.ev.zones[z])); labelZone(z, R);
    if (fig3d) fig3d.setZone(z, zoneStatus(R.ev.zones[z]));
  }
  const hr = R.ev.indicators.find((i) => i.key === "hr_rest_bpm");
  if (hr && Number.isFinite(hr.value)) fig.setHeartRate(hr.value);
  renderNext(R);
}

function setCaption(text, mode) {
  $("#captionText").textContent = text;
  const note = $("#voiceNote");
  if (mode === "clips") { note.hidden = false; note.textContent = t("voice_none"); }
  else if (mode === "captions") { note.hidden = false; note.textContent = t("voice_captions"); }
  else note.hidden = true;
}

/* ================= EARTH LINK ================= */
function fmtDelay(sec) { return sec < 60 ? `${num(sec, sec < 10 ? 1 : 0)} ${t("delay_unit_s")}` : `${num(Math.round(sec / 60), 0)} ${t("delay_unit_min")}`; }
function renderEarth(R) {
  const env = D.env.environments[S.env];
  const ow = env.one_way_delay_s;
  const where = S.env === "ISS" ? "ISS" : S.env === "MOON" ? t("moon") : t("mars");
  $("#delayPanel").innerHTML = `<h3>${esc(L(env.label))}</h3>
    <div class="big">${env.earth_reply_minutes_estimate}<small>${esc(t("delay_unit_min"))} · ${esc(t("reply"))}</small></div>
    <div class="link">${C.linkDiagram({ from: S.lang === "es" ? "Tierra" : "Earth", to: where, seconds: ow.max, label: `${t("one_way")} ${fmtDelay(ow.min)}–${fmtDelay(ow.max)}` })}</div>
    <dl><dt>${esc(t("one_way"))}</dt><dd>${fmtDelay(ow.min)} – ${fmtDelay(ow.max)}</dd>
    <dt>${esc(t("evac"))}</dt><dd>${esc(L(env.evacuation))}</dd>
    <dt>${esc(t("behavior"))}</dt><dd>${esc(L(env.behavior_level3).replace("{minutes}", env.earth_reply_minutes_estimate))}</dd></dl>`;
  const sb = R.ev.sbar;
  if (!sb) {
    $("#sbarPanel").innerHTML = `<div class="sbar-h"><h3>${esc(t("sbar_title"))}</h3></div><p class="none">${esc(t("sbar_none"))}</p>`;
    return;
  }
  const tx = sb.transmission;
  $("#sbarPanel").innerHTML = `<div class="sbar-h"><h3>${esc(t("sbar_title"))}</h3><span class="tx ${tx.mode === "QUEUED" ? "queued" : "sent"}">${esc(t(tx.mode === "QUEUED" ? "tx_queued" : "tx_sent", { m: tx.eta_minutes }))}</span></div>
    <ol id="sbarText" lang="en"><li><b>S</b><p>${esc(sb.situation)}</p></li><li><b>B</b><p>${esc(sb.background)}</p></li><li><b>A</b><p>${esc(sb.assessment)}</p></li><li><b>R</b><p>${esc(sb.recommendation)}</p></li></ol>
    <p class="none" style="font-size:14px">${esc(t("sbar_lang"))}</p>
    <div class="actions"><button class="btn sm" type="button" id="sbarCopy">${icon("copy")}${esc(t("copy"))}</button><button class="btn sm ghost" type="button" id="sbarPrint">${icon("print")}${esc(t("print"))}</button></div>`;
  $("#sbarCopy").addEventListener("click", async () => {
    const text = `S-B-A-R — Galley\nS: ${sb.situation}\nB: ${sb.background}\nA: ${sb.assessment}\nR: ${sb.recommendation}\nTransmission: ${tx.mode} (reply ~${tx.eta_minutes} min)`;
    try { await navigator.clipboard.writeText(text); toast(t("copied")); } catch (e) { toast(t("copy_fail")); }
  });
  $("#sbarPrint").addEventListener("click", () => window.print());
}

/* ================= SPACE WEATHER ================= */
function renderWeather() {
  const R = evaluate();
  const events = D.donki.events || [];
  const replayDays = [{ date: "2024-05-10", label: "D12" }, { date: "2024-05-11", label: "D13" }];
  $("#wxTimeline").innerHTML = `<h3>${esc(t("wx_events", { n: events.length }))} · ${esc(t("wx_window"))}</h3>${C.seepTimeline({ events, replayDays, label: t("wx_events", { n: events.length }) })}`;
  const today = R.today, iss = D.env.environments.ISS.radiation_background;
  const r6 = R.ev.rules.some((r) => r.id === "R6");
  $("#wxSide").innerHTML = `
    <div class="wx-stat"><span>${esc(t("wx_sep"))}</span><b>${esc(today.sep_active ? t("wx_yes") : t("wx_no"))}</b></div>
    <div class="wx-stat"><span>${esc(t("wx_today"))}</span><b>${Number.isFinite(today.radiation_mgy_day) ? num(today.radiation_mgy_day, 2) : "—"}<small>mGy/day</small></b></div>
    <div class="wx-stat"><span>${esc(t("wx_bg"))}</span><b>${num(iss.value, 2)}<small>mGy/day</small></b></div>
    <div class="wx-stat"><span>${esc(t("wx_limit"))}</span><b>${D.rad.career_limit.value}<small>${esc(D.rad.career_limit.unit.split(" ")[0])}</small></b></div>
    ${r6 ? `<p>${stateMark("YELLOW")} R6 · ${esc(L(D.rules.rules.find((x) => x.id === "R6").name))}</p>` : ""}`;
}

/* ================= TRENDS ================= */
function renderTrends() {
  const evals = [];
  const n = D.ds.scenarios[S.scenario].days.length;
  for (let d = 1; d <= n; d++) evals.push(evaluate(d).ev);
  const R = evaluate();
  $("#trendLegend").innerHTML = `<span><i style="background:var(--ok-bg)"></i>${esc(t("lg_normal"))}</span><span><i style="background:var(--warn-bg)"></i>${esc(t("lg_watch"))}</span><span><i style="border-top:2px dashed var(--accent);height:0"></i>${esc(t("lg_today"))}</span>`;
  $("#trendGrid").innerHTML = INDICATORS.map((k) => {
    const series = evals.map((ev, i) => { const ind = ev.indicators.find((x) => x.key === k); return { day: i + 1, value: ind?.value, color: ind?.color || "NONE", z: ind?.z }; });
    const ind = R.ev.indicators.find((x) => x.key === k);
    return `<div class="panel trend draw" data-reveal><h3>${esc(labelOf(k))}<small>${fmtVal(k, ind?.value)} ${esc(unitOf(k))}</small></h3>
      ${C.trend({ series, base: R.baselines[k], zY: D.cfg.baseline.z_yellow, zR: D.cfg.baseline.z_red, selectedDay: S.day, label: labelOf(k) })}</div>`;
  }).join("");
  observeReveal($("#trendGrid"));
}

/* ================= REAL ASTRONAUT DATA ================= */
function renderScience() {
  const g = D.osdr.glucose_mg_dl;
  const tps = ["L-92", "L-44", "L-3", "R+1", "R+45", "R+82", "R+194"];
  $("#osdrPanel").innerHTML = `<h3>${esc(t("osdr_chart"))}</h3>${C.osdrRows({ crew: Object.fromEntries(Object.keys(g.crew).sort().map((k) => [k, g.crew[k]])), range: g.lab_reference_range, timepoints: tps, labels: { title: t("osdr_chart"), lab: t("osdr_lab"), base: t("osdr_base") } })}`;
  $("#osdrCopy").innerHTML = `<h3>Inspiration4 · OSD-575 / OSD-569</h3><p>${esc(t("osdr_p1"))}</p><p>${esc(t("osdr_p2"))}</p>
    <p class="caveat">${icon("alert")}<span>${esc(t("osdr_caveat"))}</span></p>`;
  const src = [
    ["NASA DONKI", S.lang === "es" ? "Eventos de partículas solares, tormenta de mayo 2024" : "Solar energetic particle events, May 2024 storm", "https://ccmc.gsfc.nasa.gov/tools/DONKI/"],
    ["NASA OSDR", "Inspiration4 · OSD-575 (CMP), OSD-569 (CBC)", "https://osdr.nasa.gov/bio/repo/data/studies/OSD-575"],
    ["NASA Human Research Program", S.lang === "es" ? "Riesgos del vuelo espacial humano" : "Risks of human spaceflight", "https://www.nasa.gov/hrp/"],
    ["NASA-STD-3001 Vol. 1", S.lang === "es" ? "Límite de radiación de carrera" : "Career radiation limit", "https://www.nasa.gov/ochmo/human-spaceflight-standards/"],
    ["NOAA SWPC", S.lang === "es" ? "Escala de tormentas de radiación solar" : "Solar radiation storm scale", "https://www.swpc.noaa.gov/noaa-scales-explanation"],
    ["ASI · Di Fino et al. 2023", "LIDAL, ISS Columbus 2020–2022 · doi:10.1016/j.lssr.2023.03.007", "https://doi.org/10.1016/j.lssr.2023.03.007"],
    ["Basner et al. 2011", "PVT-B · doi:10.1016/j.actaastro.2011.07.015", "https://doi.org/10.1016/j.actaastro.2011.07.015"],
    ["Barger et al. 2014", S.lang === "es" ? "Sueño en astronautas · doi:10.1016/S1474-4422(14)70122-X" : "Astronaut sleep · doi:10.1016/S1474-4422(14)70122-X", "https://doi.org/10.1016/S1474-4422(14)70122-X"],
    ["Stahn et al. 2017", S.lang === "es" ? "Temperatura corporal en misiones largas · doi:10.1038/s41598-017-15560-w" : "Body temperature on long missions · doi:10.1038/s41598-017-15560-w", "https://doi.org/10.1038/s41598-017-15560-w"],
    ["Kusumoto et al. 2019", S.lang === "es" ? "Guía de bradicardia ACC/AHA/HRS · doi:10.1016/j.hrthm.2018.10.036" : "ACC/AHA/HRS bradycardia guideline · doi:10.1016/j.hrthm.2018.10.036", "https://doi.org/10.1016/j.hrthm.2018.10.036"],
    ["Smith et al. 2005", S.lang === "es" ? "Nutrición en la ISS · doi:10.1093/jn/135.3.437" : "Nutrition on the ISS · doi:10.1093/jn/135.3.437", "https://doi.org/10.1093/jn/135.3.437"],
    ["Haig et al. 2006", "SBAR · doi:10.1016/S1553-7250(06)32022-3", "https://doi.org/10.1016/S1553-7250(06)32022-3"]
  ];
  $("#sourceList").innerHTML = src.map(([a, b, u]) => `<li><b><a href="${u}" target="_blank" rel="noopener">${esc(a)}</a></b> — ${esc(b)}</li>`).join("");
}

/* ================= live sensor (Web Serial) ================= */
function renderLive() {
  const el = $("#live");
  if (!S.serialOn) { el.hidden = true; return; }
  el.hidden = false;
  const l = S.live;
  if (!l || (!l.n && l.q === undefined)) { el.innerHTML = `<span>${esc(t("serial_waiting"))}</span>`; return; }
  el.innerHTML = `<span class="q ${l.q === 1 ? "good" : "bad"}"><i></i>${esc(l.q === 1 ? t("q_good") : t("q_bad"))}</span>
    <span>HR ${Number.isFinite(l.hr) ? Math.round(l.hr) : "—"} bpm</span><span>SpO₂ ${Number.isFinite(l.spo2) ? Math.round(l.spo2) : "—"} %</span>
    <span>${S.lang === "es" ? "Piel" : "Skin"} ${Number.isFinite(l.temp) ? num(l.temp, 1) : "—"} °C</span><span>src: ${esc(l.src || "—")}</span>`;
}
async function toggleSerial() {
  if (S.serialOn) { await disconnectSerial(); return; }
  if (!serialSupported()) { toast(t("serial_unsupported")); return; }
  try {
    await connectSerial({
      schema: D.schema.definitions.SerialFrame,
      onOpen: () => { S.serialOn = true; S.liveFrames = []; S.live = null; applyTexts(); renderLive(); dataSourceLine(); },
      onFrame: (f) => {
        S.liveFrames.push(f); if (S.liveFrames.length > 15) S.liveFrames.shift();
        S.live = summarize(S.liveFrames); renderLive(); dataSourceLine();
      }
    });
  } catch (e) { if (e && e.name !== "NotFoundError") toast(t("toast_sim")); }
  if (S.serialOn) toast(t("serial_lost"));
  S.serialOn = false; S.live = null; S.liveFrames = [];
  applyTexts(); renderLive(); dataSourceLine();
}

/* ================= refresh + controls ================= */
function refreshAll(withResults) {
  dataSourceLine();
  const R = evaluate(); lastR = R;
  if (withResults || S.scanned) renderResultsStatic(R);
  renderEarth(R); renderWeather(); renderTrends();
  $$("#envSeg button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.env === S.env)));
  $$("#viewSeg button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === S.view)));
  $("#dayOut").textContent = `${S.day}/14`;
}
function stopRun() { S.runToken++; stopVoice(); S.running = false; $("#start").disabled = false; }

/* ---------- scroll: reveal, progress, nav ---------- */
let revealObs = null;
function observeReveal(root = document) {
  if (!revealObs) return;
  $$("[data-reveal]", root).forEach((el) => {
    $$("path.line, .tl-draw", el).forEach((p) => { try { p.style.setProperty("--len", Math.ceil(p.getTotalLength())); } catch (e) {} });
    revealObs.observe(el);
  });
}
function setupScroll() {
  if (document.documentElement.classList.contains("js-reveal")) {
    revealObs = new IntersectionObserver((ents) => ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); revealObs.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    observeReveal();
  } else $$("[data-reveal]").forEach((el) => el.classList.add("in"));
  const links = $$("#nav a"), secs = links.map((a) => document.getElementById(a.getAttribute("href").slice(1)));
  const onScroll = () => {
    const h = document.documentElement, p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
    $("#progress").style.width = (p * 100).toFixed(1) + "%";
    let cur = secs[0];
    for (const s of secs) if (s && s.getBoundingClientRect().top < 140) cur = s;
    links.forEach((a, i) => a.setAttribute("aria-current", String(secs[i] === cur)));
  };
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
}

function tick() {
  const s = Math.max(0, Math.floor((Date.now() - MISSION_START) / 1000)), p = (n) => String(n).padStart(2, "0");
  $("#met").textContent = `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}`;
}

/* ---------- 3D view (lazy) ---------- */
async function ensure3d() {
  if (fig3d) return fig3d;
  try {
    const m = await import("./body-3d.js");
    fig3d = m.createBody3d($("#figure3d"), { hint: t("b3d_hint"), names: { head: t("zone_head"), chest: t("zone_chest"), abdomen: t("zone_abdomen"), legs: t("zone_legs") } });
    fig3d.onSelect && fig3d.onSelect((z) => { const el = document.querySelector(`.zone[data-zone="${z}"]`); if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" }); });
  } catch (e) { console.warn("3D view unavailable", e); fig3d = null; }
  return fig3d;
}
async function setView(v) {
  S.view = v;
  if (v === "3d") await ensure3d();
  const use3d = v === "3d" && fig3d;
  $("#figure2d").hidden = !!use3d; $("#figure3d").hidden = !use3d;
  $$("#viewSeg button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === (use3d ? "3d" : "2d"))));
  if (S.scanned && lastR) for (const z of ZONES) { const st = zoneStatus(lastR.ev.zones[z]); fig.setZone(z, st); fig3d && fig3d.setZone(z, st); labelZone(z, lastR); }
}

/* ================= boot ================= */
async function boot() {
  hydrateIcons();
  setTheme(document.documentElement.dataset.theme || "day");
  applyTexts();
  try {
    const entries = await Promise.all(Object.entries(FILES).map(async ([k, p]) => { const r = await fetch(ROOT + p, { cache: "no-cache" }); if (!r.ok) throw new Error(p + " " + r.status); return [k, await r.json()]; }));
    for (const [k, v] of entries) D[k] = v;
  } catch (e) {
    $("#readout").innerHTML = `<p class="empty">Could not load the mission data (${esc(e.message)}). Run <code>cd software && npm start</code> and open http://127.0.0.1:5174, or use the public link.</p>`;
    return;
  }

  face = createFaceId({ video: $("#camVideo"), overlay: $("#camOverlay"), box: $("#vf") });
  fig = createBodyScan($("#figure2d"), { ariaNames: { head: t("zone_head"), chest: t("zone_chest"), abdomen: t("zone_abdomen"), legs: t("zone_legs") } });
  fig.onSelect((z) => { const el = document.querySelector(`.zone[data-zone="${z}"]`); if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" }); });
  fig.setLayers({ labels: false }); /* readings live on the tags beside the figure, not stamped on it */
  onCaption(setCaption);

  /* controls */
  $$("[data-theme-set]").forEach((b) => b.addEventListener("click", () => setTheme(b.dataset.themeSet)));
  $$("[data-lang-set]").forEach((b) => b.addEventListener("click", () => {
    S.lang = b.dataset.langSet; try { localStorage.setItem("galley-lang", S.lang); } catch (e) {}
    stopRun(); applyTexts(); renderCrew(); select(S.crew, S.by, S.dist); setPill(pillState); setStatus(statusKey, statusVars, statusWarn); if (regKey) regMsg(regKey, regVars);
    refreshAll(); renderScience(); setCaption("", "speech");
  }));
  $("#identify").addEventListener("click", identify);
  $("#regOpen").addEventListener("click", openRegister);
  $("#regSave").addEventListener("click", saveRegister);
  $("#regCancel").addEventListener("click", cancelRegister);
  $("#proceed").addEventListener("click", goScan);
  $("#start").addEventListener("click", runScan);
  $("#scenario").addEventListener("change", (e) => { S.scenario = e.target.value; stopRun(); refreshAll(); });
  $("#day").addEventListener("input", (e) => { S.day = Number(e.target.value); stopRun(); refreshAll(); });
  $$("#envSeg button").forEach((b) => b.addEventListener("click", () => { S.env = b.dataset.env; refreshAll(); }));
  $$("#viewSeg button").forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));
  $("#voiceBtn").addEventListener("click", () => {
    S.voice = !S.voice; setVoiceEnabled(S.voice);
    $("#voiceBtn").setAttribute("aria-pressed", String(S.voice));
    $("#voiceBtn svg").outerHTML = icon(S.voice ? "volume" : "mute");
    applyTexts();
  });
  $("#serialBtn").addEventListener("click", toggleSerial);

  /* deep links for the demo video and judges: ?scenario=bradycardia&day=13&env=MARS&view=3d&lang=en&theme=night&autoscan=1 */
  const q = new URLSearchParams(location.search);
  if (SCENARIOS.includes(q.get("scenario"))) S.scenario = q.get("scenario");
  if (Number(q.get("day")) >= 1 && Number(q.get("day")) <= 14) S.day = Number(q.get("day"));
  if (["ISS", "MOON", "MARS"].includes(q.get("env"))) S.env = q.get("env");
  if (q.get("lang") === "es" || q.get("lang") === "en") S.lang = q.get("lang");
  if (q.get("theme") === "night" || q.get("theme") === "day") setTheme(q.get("theme"));
  if (q.get("voice") === "0") { S.voice = false; $("#voiceBtn").setAttribute("aria-pressed", "false"); }
  $("#day").value = S.day;

  applyTexts();
  renderCrew(); select(DEMO_CREW, "manual"); $("#idcard").hidden = true;
  setPill("standby"); setStatus("st_ready");
  refreshAll(); renderScience();
  if (q.get("view") === "3d") await setView("3d");
  setupScroll(); tick(); setInterval(tick, 1000);
  voiceMode().then((m) => { if (m === "clips") setCaption("", "clips"); });
  if (q.get("autoscan") === "1") setTimeout(runScan, 500);
}
boot();
