/* Small, dependency-free SVG charts for Galley. Each function returns an SVG string. */

const esc = (x) => String(x).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const COLOR_VAR = { GREEN: "var(--ok-fill)", YELLOW: "var(--warn-fill)", RED: "var(--crit-fill)", NONE: "var(--none)" };

/** deterministic barcode strip for an inventory tag (decorative) */
export function barcode(code, h = 16) {
  let x = 0, bars = "";
  const s = String(code);
  for (let i = 0; i < s.length * 3; i++) {
    const c = s.charCodeAt(i % s.length) + i * 7;
    const w = 1 + (c % 3), gap = 1 + ((c >> 2) % 2);
    bars += `<rect x="${x}" y="0" width="${w}" height="${h}"/>`;
    x += w + gap;
  }
  return `<svg viewBox="0 0 ${x} ${h}" fill="currentColor" aria-hidden="true">${bars}</svg>`;
}

/** domain that holds the value, the personal bands and the absolute limits */
export function domainFor(value, base, abs, zR) {
  const pts = [value];
  if (base) pts.push(base.center - (zR + 1) * base.scale, base.center + (zR + 1) * base.scale);
  if (abs) for (const k of ["red_low", "red_high", "yellow_low", "yellow_high"]) if (abs[k] !== undefined) pts.push(abs[k]);
  const lo = Math.min(...pts.filter(Number.isFinite)), hi = Math.max(...pts.filter(Number.isFinite));
  const pad = (hi - lo) * 0.06 || 1;
  return [lo - pad, hi + pad];
}

/**
 * Bullet bar: your normal (±zY), watch band (±zR), absolute limits, today's value.
 */
export function bullet({ value, base, abs, zY = 2, zR = 3, color = "NONE", label = "" }) {
  const W = 300, H = 34, [lo, hi] = domainFor(value, base, abs, zR);
  const X = (v) => clamp(((v - lo) / (hi - lo)) * W, 0, W);
  let s = `<svg class="bullet" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${esc(label)}">`;
  s += `<rect x="0" y="12" width="${W}" height="10" fill="var(--panel-2)"/>`;
  if (base) {
    s += `<rect x="${X(base.center - zR * base.scale)}" y="12" width="${X(base.center + zR * base.scale) - X(base.center - zR * base.scale)}" height="10" fill="var(--warn-bg)"/>`;
    s += `<rect x="${X(base.center - zY * base.scale)}" y="12" width="${X(base.center + zY * base.scale) - X(base.center - zY * base.scale)}" height="10" fill="var(--ok-bg)"/>`;
    s += `<line x1="${X(base.center)}" x2="${X(base.center)}" y1="8" y2="26" stroke="var(--ink-3)" stroke-width="1.5"/>`;
  }
  if (abs) for (const k of ["red_low", "red_high"]) if (abs[k] !== undefined) s += `<line x1="${X(abs[k])}" x2="${X(abs[k])}" y1="6" y2="28" stroke="var(--crit-fill)" stroke-width="1.5" stroke-dasharray="2 2"/>`;
  if (Number.isFinite(value)) s += `<rect x="${X(value) - 3}" y="5" width="6" height="24" rx="1" fill="${COLOR_VAR[color]}" stroke="var(--ink)" stroke-width="1.2"/>`;
  return s + "</svg>";
}

/**
 * 14-day trend with the personal band and dots sized on a fixed |z| ramp.
 * series: [{ day, value, color, z }]
 */
export function trend({ series, base, zY = 2, zR = 3, selectedDay, label = "" }) {
  const W = 300, H = 120, L = 30, R = 8, T = 10, B = 20;
  const vals = series.map((p) => p.value).filter(Number.isFinite);
  if (!vals.length) return "";
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (base) { lo = Math.min(lo, base.center - zR * base.scale); hi = Math.max(hi, base.center + zR * base.scale); }
  const pad = (hi - lo) * 0.08 || 1; lo -= pad; hi += pad;
  const n = series.length;
  const X = (d) => L + ((d - 1) / Math.max(1, n - 1)) * (W - L - R);
  const Y = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const fmt = (v) => (Math.abs(hi - lo) < 10 ? v.toFixed(1) : Math.round(v));
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">`;
  if (base) {
    s += `<rect class="band2" x="${L}" y="${Y(base.center + zR * base.scale)}" width="${W - L - R}" height="${Y(base.center - zR * base.scale) - Y(base.center + zR * base.scale)}"/>`;
    s += `<rect class="band" x="${L}" y="${Y(base.center + zY * base.scale)}" width="${W - L - R}" height="${Y(base.center - zY * base.scale) - Y(base.center + zY * base.scale)}"/>`;
  }
  s += `<line class="axis" x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}"/>`;
  s += `<text x="${L - 4}" y="${Y(hi - pad) + 3}" text-anchor="end">${fmt(hi - pad)}</text><text x="${L - 4}" y="${Y(lo + pad) + 3}" text-anchor="end">${fmt(lo + pad)}</text>`;
  for (const d of [1, 7, n]) s += `<text x="${X(d)}" y="${H - 5}" text-anchor="middle">D${d}</text>`;
  if (selectedDay) s += `<line class="today" x1="${X(selectedDay)}" x2="${X(selectedDay)}" y1="${T - 4}" y2="${H - B}"/>`;
  const pts = series.filter((p) => Number.isFinite(p.value));
  const d = pts.map((p, i) => `${i ? "L" : "M"}${X(p.day).toFixed(1)},${Y(p.value).toFixed(1)}`).join("");
  s += `<path class="line" d="${d}"/>`;
  for (const p of pts) {
    const r = 2.6 + Math.min(Math.abs(p.z || 0), 5) * 1.1;
    const sel = p.day === selectedDay;
    s += `<circle cx="${X(p.day)}" cy="${Y(p.value)}" r="${r.toFixed(1)}" fill="${COLOR_VAR[p.color] || COLOR_VAR.NONE}" stroke="${sel ? "var(--ink)" : "var(--panel)"}" stroke-width="${sel ? 2 : 1.2}"><title>D${p.day}: ${esc(p.value)}</title></circle>`;
  }
  return s + "</svg>";
}

/** Inspiration4 glucose: one row per crew member, lab range band + personal pre-flight mean */
export function osdrRows({ crew, range, timepoints, labels }) {
  const W = 520, rowH = 64, L = 54, R = 28, top = 26;
  const ids = Object.keys(crew);
  const H = top + ids.length * rowH + 22;
  const lo = 30, hi = 110;
  const X = (i) => L + (i / (timepoints.length - 1)) * (W - L - R);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(labels.title)}">`;
  timepoints.forEach((tp, i) => { s += `<text x="${X(i)}" y="14" text-anchor="middle">${esc(tp)}</text>`; });
  ids.forEach((id, r) => {
    const y0 = top + r * rowH, Y = (v) => y0 + 6 + (1 - (v - lo) / (hi - lo)) * (rowH - 16);
    const c = crew[id];
    s += `<rect x="${L}" y="${Y(range[1])}" width="${W - L - R}" height="${Y(range[0]) - Y(range[1])}" fill="var(--panel-2)"/>`;
    s += `<line x1="${L}" x2="${W - R}" y1="${Y(c.preflight_baseline_mean)}" y2="${Y(c.preflight_baseline_mean)}" stroke="var(--accent)" stroke-width="1.6" stroke-dasharray="5 4"/>`;
    s += `<text x="${L - 8}" y="${y0 + rowH / 2}" text-anchor="end" style="font-weight:600;fill:var(--ink)">${esc(id)}</text>`;
    let d = "";
    timepoints.forEach((tp, i) => {
      const v = c.series[tp]; if (!Number.isFinite(v)) return;
      d += `${d ? "L" : "M"}${X(i).toFixed(1)},${Y(v).toFixed(1)}`;
    });
    s += `<path d="${d}" fill="none" stroke="var(--ink-3)" stroke-width="1.2"/>`;
    timepoints.forEach((tp, i) => {
      const v = c.series[tp]; if (!Number.isFinite(v)) return;
      const out = v < range[0] || v > range[1];
      s += `<circle cx="${X(i)}" cy="${Y(v)}" r="4" fill="${out ? "var(--warn-fill)" : "var(--ink)"}" stroke="var(--panel)" stroke-width="1.5"><title>${esc(id)} ${esc(tp)}: ${v} mg/dL</title></circle>`;
    });
    if (r < ids.length - 1) s += `<line x1="${L}" x2="${W - R}" y1="${y0 + rowH}" y2="${y0 + rowH}" stroke="var(--seam)" stroke-width="1"/>`;
  });
  const ly = H - 6;
  s += `<rect x="${L}" y="${ly - 9}" width="16" height="9" fill="var(--panel-2)" stroke="var(--seam-strong)"/><text x="${L + 22}" y="${ly}">${esc(labels.lab)}</text>`;
  s += `<line x1="${L + 230}" x2="${L + 252}" y1="${ly - 4}" y2="${ly - 4}" stroke="var(--accent)" stroke-width="1.6" stroke-dasharray="5 4"/><text x="${L + 258}" y="${ly}">${esc(labels.base)}</text>`;
  return s + "</svg>";
}

/** DONKI SEP events on a 5-day axis (9–13 May 2024) */
export function seepTimeline({ events, start = "2024-05-09T00:00Z", days = 5, label = "", replayDays = [] }) {
  const W = 640, H = 170, L = 16, R = 16, axisY = 120;
  const t0 = Date.parse(start), span = days * 86400000;
  const X = (t) => L + ((t - t0) / span) * (W - L - R);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">`;
  for (let i = 0; i < days; i++) {
    const x0 = X(t0 + i * 86400000), x1 = X(t0 + (i + 1) * 86400000);
    const dt = new Date(t0 + i * 86400000);
    const replay = replayDays.find((r) => r.date === dt.toISOString().slice(0, 10));
    if (replay) s += `<rect x="${x0}" y="20" width="${x1 - x0}" height="${axisY - 20}" fill="var(--warn-bg)"/><text x="${(x0 + x1) / 2}" y="34" text-anchor="middle" style="font:600 11px var(--mono);fill:var(--warn)">${esc(replay.label)}</text>`;
    s += `<line x1="${x0}" x2="${x0}" y1="${axisY}" y2="${axisY + 6}" stroke="var(--seam-strong)"/>`;
    s += `<text x="${(x0 + x1) / 2}" y="${axisY + 22}" text-anchor="middle" style="font:500 12px var(--mono);fill:var(--ink-2)">${dt.toISOString().slice(5, 10)}</text>`;
  }
  s += `<path class="tl-draw" style="--len:${W}" d="M${L},${axisY}H${W - R}" stroke="var(--ink-2)" stroke-width="1.5" fill="none"/>`;
  const sorted = [...events].sort((a, b) => Date.parse(a.eventTime) - Date.parse(b.eventTime));
  const stack = {};
  for (const e of sorted) {
    const t = Date.parse(e.eventTime); if (!Number.isFinite(t)) continue;
    const x = X(t), key = Math.round(x / 10);
    const k = (stack[key] = (stack[key] || 0) + 1);
    const y = axisY - 18 - (k - 1) * 12;
    s += `<line x1="${x}" x2="${x}" y1="${axisY}" y2="${y}" stroke="var(--crit-fill)" stroke-width="1.4"/><circle cx="${x}" cy="${y}" r="4.5" fill="var(--crit-fill)" stroke="var(--panel)" stroke-width="1.5"><title>${esc(e.sepID || e.eventTime)}</title></circle>`;
  }
  return s + "</svg>";
}

/** Earth ↔ destination link with a travelling signal */
export function linkDiagram({ from = "Earth", to = "ISS", seconds = 1, label = "" }) {
  const dur = clamp(1.2 + Math.log10(Math.max(1, seconds)) * 1.6, 1.2, 6).toFixed(2);
  return `<svg viewBox="0 0 400 54" role="img" aria-label="${esc(label)}">
    <style>.sig{animation:sig ${dur}s cubic-bezier(.45,0,.55,1) infinite;transform-box:view-box}@keyframes sig{from{transform:translateX(0)}to{transform:translateX(330px)}}@media (prefers-reduced-motion:reduce){.sig{animation:none}}</style>
    <line x1="35" x2="365" y1="22" y2="22" stroke="var(--seam-strong)" stroke-width="1.5" stroke-dasharray="3 5"/>
    <circle cx="20" cy="22" r="13" fill="var(--panel-2)" stroke="var(--ink)" stroke-width="1.5"/><path d="M11 18c5 2 6-3 11-1M12 27c4-2 8 2 13-1" stroke="var(--ink-3)" stroke-width="1.2" fill="none"/>
    <circle cx="380" cy="22" r="10" fill="var(--ink)"/>
    <circle class="sig" cx="35" cy="22" r="4" fill="var(--accent)"/>
    <text x="20" y="50" text-anchor="middle" style="font:500 11px var(--mono);fill:var(--ink-3)">${esc(from)}</text>
    <text x="380" y="50" text-anchor="middle" style="font:500 11px var(--mono);fill:var(--ink-3)">${esc(to)}</text>
  </svg>`;
}
