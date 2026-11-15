/*
 * Galley body scan: anatomical front figure + top-to-bottom scan line.
 * Extracted from the team kit (repo-nasa/src/index.html, buildFigure + runScan).
 * Presentation only: it does NOT decide health status. Pass it the status of
 * each zone (computed by the domain rules) and it paints and animates.
 *
 * Zones match Synera: head, chest, abdomen, legs.
 * Status values: "ok" | "warn" | "crit"  (green / amber / red)
 *
 * Usage:
 *   import { createBodyScan } from "./body-scan.js";
 *   const fig = createBodyScan(document.querySelector("#figure"));
 *   await fig.run({ head: "warn", chest: "ok", abdomen: "ok", legs: "ok" },
 *                 { onZone: (zone, status) => { ...show the readout row... } });
 */

export const ZONES = ["head", "chest", "abdomen", "legs"];

/* y position (in figure units) where the scan line reaches each zone */
const ZONE_Y = { head: 100, chest: 232, abdomen: 320, legs: 560 };
const H = 560;

const CSS = `
.gbs{position:relative;width:100%;max-width:360px;margin:0 auto}
.gbs svg{width:100%;height:auto;display:block;border-radius:12px;overflow:hidden}
.gbs .region{cursor:pointer;outline:none}
.gbs .region *{fill:var(--rc,rgba(214,178,132,.30));stroke:#3b2a1d;stroke-width:1.3;stroke-linejoin:round;transition:fill .5s,stroke .3s}
.gbs .region:hover *,.gbs .region:focus-visible *{stroke:#1d6fb8}
.gbs .region.ok{--rc:rgba(46,160,90,.30)}
.gbs .region.warn{--rc:rgba(245,179,1,.38)}
.gbs .region.crit{--rc:rgba(214,40,40,.36)}
.gbs .region.ok *{stroke:#2e8b57;stroke-width:2.2}
.gbs .region.warn *{stroke:#d99a00;stroke-width:2.6}
.gbs .region.crit *{stroke:#d62828;stroke-width:3.4}
.gbs .region.sel *{stroke:#1d6fb8;stroke-width:3.2}
.gbs .region.crit > *{filter:drop-shadow(0 0 7px #ff4d4f)}
.gbs .region.warn > *{filter:drop-shadow(0 0 5px #f5b301)}
.gbs .limb *{fill:rgba(214,178,132,.30);stroke:#3b2a1d;stroke-width:1.3}
.gbs .muscles,.gbs .bones,.gbs .organs,.gbs .labels{pointer-events:none}
.gbs .muscles *{fill:#b04a3c;fill-opacity:.88;stroke:#3b2a1d;stroke-width:1.1;stroke-linejoin:round}
.gbs .bones *{fill:#f4ecd8;stroke:#3b2a1d;stroke-width:1.3;stroke-linecap:round;stroke-linejoin:round}
.gbs .bones .ln{fill:none}
.gbs .bones .ln.o{stroke:#3b2a1d}
.gbs .bones .ln.i{stroke:#f4ecd8}
.gbs .bones .sk{fill:#3b2a1d;stroke:none}
.gbs .bones .dash{fill:none;stroke-dasharray:4 6}
.gbs .organs *{fill:rgba(240,150,170,.55);stroke:#3b2a1d;stroke-width:1}
.gbs .organs .lung{fill:rgba(120,170,220,.5)}
.gbs .organs .stomach{fill:rgba(230,160,90,.6)}
.gbs .organs .heart{fill:#e0334a;transform-box:fill-box;transform-origin:center}
.gbs svg.live .heart{animation:gbs-beat var(--beat,1s) infinite}
.gbs .labels text{font-size:11px;font-weight:600;text-anchor:middle;fill:#2a1a10;paint-order:stroke;stroke:#f3e8cf;stroke-width:3px}
.gbs.no-muscles .muscles,.gbs.no-bones .bones,.gbs.no-organs .organs,.gbs.no-labels .labels{display:none}
.gbs .gbs-bar{height:6px;margin-top:8px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden}
.gbs .gbs-bar i{display:block;height:100%;width:0;background:#4fd1ff}
@keyframes gbs-beat{0%,100%{transform:scale(1)}15%{transform:scale(1.2)}30%{transform:scale(1)}45%{transform:scale(1.1)}}
@media (prefers-reduced-motion:reduce){.gbs svg.live .heart{animation:none}}
`;

function injectCss() {
  if (document.getElementById("gbs-css")) return;
  const s = document.createElement("style");
  s.id = "gbs-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* ---------- drawing helpers (left side drawn, right side mirrored) ---------- */
const mir = (d) => d.replace(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g, (m, x, y) => (240 - parseFloat(x)) + " " + y);
const pth = (d, cls) => `<path d="${d}"${cls ? ` class="${cls}"` : ""}/>`;
const pair = (d, cls) => pth(d, cls) + pth(mir(d), cls);

function figureMarkup(ariaNames) {
  const legBase = "M78 300 Q70 340 72 380 Q74 410 78 432 Q70 470 80 500 Q84 520 86 536 L84 552 L108 552 L108 534 Q110 510 112 490 Q116 460 112 432 Q116 400 118 360 L120 316 Z";
  const armBase = "M56 122 Q38 150 34 196 Q32 232 28 268 Q24 296 30 316 Q40 326 48 316 Q52 290 56 262 Q62 230 66 196 Q72 160 70 124 Z";

  const shapes = {
    head: '<ellipse cx="120" cy="44" rx="26" ry="31"/><path d="M107 72 L107 98 Q120 104 133 98 L133 72 Z"/>',
    chest: pth("M72 104 Q96 94 120 96 Q144 94 168 104 Q176 130 172 170 Q168 200 160 228 L80 228 Q72 200 68 170 Q64 130 72 104 Z"),
    abdomen: pth("M80 228 L160 228 Q166 260 164 290 Q150 312 120 316 Q90 312 76 290 Q74 260 80 228 Z"),
    legs: pair(legBase)
  };
  const regions = ZONES.map((z) =>
    `<g class="region" data-zone="${z}" tabindex="0" role="button" aria-label="${ariaNames[z] || z}">${shapes[z]}</g>`).join("");

  let m = "";
  m += pair("M118 112 Q100 106 80 116 Q74 134 82 154 Q100 164 118 156 Z");
  m += pair("M70 106 Q58 108 52 124 Q52 140 60 146 Q72 138 76 120 Q76 110 70 106 Z");
  m += pair("M114 82 Q92 92 66 106 Q80 112 100 108 Q112 104 118 100 Z");
  m += pair("M110 74 L104 98 L112 96 L118 80 Z");
  m += pair("M106 232 Q92 240 82 236 Q76 262 82 292 Q96 296 104 286 Q100 262 106 232 Z");
  for (let i = 0; i < 3; i++) { const y = 236 + i * 18; m += pair(`M108 ${y} L119 ${y} L119 ${y + 15} L108 ${y + 15} Z`); }
  m += pair("M80 316 Q72 360 76 410 Q90 420 104 410 Q112 370 116 330 Q100 322 80 316 Z");
  m += pair("M80 440 Q72 470 82 504 Q92 510 100 498 Q108 470 104 440 Q92 434 80 440 Z");
  m += pair("M52 150 Q42 178 44 208 Q56 214 62 204 Q66 178 62 152 Z");
  m += pair("M34 232 Q28 270 28 300 Q38 308 46 298 Q52 270 56 236 Z");

  const lnB = (d, w) => `<path d="${d}" class="ln o" style="stroke-width:${w + 2.4}"/><path d="${d}" class="ln i" style="stroke-width:${w}"/>`;
  const lnP = (d, w) => lnB(d, w) + lnB(mir(d), w);
  const capP = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}"/><circle cx="${240 - x}" cy="${y}" r="${r}"/>`;
  let b = '<ellipse cx="120" cy="42" rx="21" ry="26"/>';
  b += '<ellipse class="sk" cx="111" cy="44" rx="4.5" ry="5.5"/><ellipse class="sk" cx="129" cy="44" rx="4.5" ry="5.5"/>';
  b += '<path class="sk" d="M117 52 L120 58 L123 52 Z"/>';
  b += lnB("M104 58 Q106 76 120 78 Q134 76 136 58", 2.4);
  b += pth("M120 98 L120 300", "dash");
  b += '<rect x="116" y="108" width="8" height="58" rx="3"/>';
  b += lnP("M118 108 Q98 100 74 108", 3);
  for (let i = 0; i < 7; i++) { const y = 120 + i * 13; b += lnP(`M117 ${y} Q ${96 - i} ${y - 4} ${84 + i * 2} ${y + 16}`, 2.2); }
  b += pair("M118 300 Q100 292 84 298 Q82 318 100 326 Q112 324 118 312 Z");
  b += lnP("M92 322 L94 412", 5.5) + lnP("M95 438 L96 534", 4.5) + lnP("M50 130 L44 210", 4) + lnP("M42 222 L34 312", 3.5);
  b += capP(52, 130, 5.5) + capP(43, 216, 5) + capP(92, 322, 6.5) + capP(95, 428, 7) + capP(96, 536, 5);

  let o = '<path d="M100 38 Q98 20 120 18 Q142 20 140 38 Q140 50 120 52 Q100 50 100 38 Z"/><path d="M120 20 L120 50" fill="none"/>';
  o += pair("M112 122 Q92 120 88 142 Q86 170 104 178 Q114 178 114 162 Z", "lung");
  o += '<path class="heart" d="M132 184 C108 168 114 144 132 154 C150 144 156 168 132 184 Z"/>';
  o += '<path class="stomach" d="M122 246 Q148 240 150 260 Q148 278 130 276 Q116 272 122 246 Z"/>';

  const labels = '<text x="120" y="6" data-label="head"></text><text x="120" y="206" data-label="chest"></text>' +
    '<text x="120" y="304" data-label="abdomen"></text><text x="120" y="392" data-label="legs"></text>';

  return `
<svg viewBox="0 -10 240 570" role="img" aria-label="Human figure with four zones">
  <defs>
    <linearGradient id="gbsScanGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1d6fb8" stop-opacity="0"/>
      <stop offset="1" stop-color="#1d6fb8" stop-opacity=".5"/>
    </linearGradient>
    <radialGradient id="gbsParch" cx="50%" cy="42%" r="78%"><stop offset="0" stop-color="#f3e8cf"/><stop offset="1" stop-color="#d6c196"/></radialGradient>
  </defs>
  <rect x="0" y="-10" width="240" height="570" fill="url(#gbsParch)"/>
  <ellipse cx="120" cy="552" rx="74" ry="6" fill="rgba(60,40,20,.22)"/>
  <g class="limb">${pair(armBase)}</g>
  <g class="regions">${regions}</g>
  <g class="muscles">${m}</g>
  <g class="bones">${b}</g>
  <g class="organs">${o}</g>
  <g class="labels">${labels}</g>
  <rect class="scan" x="0" y="-40" width="240" height="40" fill="url(#gbsScanGrad)" opacity="0"/>
  <line class="scanline" x1="0" x2="240" y1="0" y2="0" stroke="#1d6fb8" stroke-width="2" opacity="0"/>
</svg>
<div class="gbs-bar" aria-hidden="true"><i></i></div>`;
}

/**
 * @param {HTMLElement} container
 * @param {{ ariaNames?: Record<string,string> }} [opts]
 */
export function createBodyScan(container, opts = {}) {
  injectCss();
  const root = document.createElement("div");
  root.className = "gbs";
  root.innerHTML = figureMarkup(opts.ariaNames || {});
  container.appendChild(root);

  const svg = root.querySelector("svg");
  const scan = root.querySelector(".scan");
  const line = root.querySelector(".scanline");
  const bar = root.querySelector(".gbs-bar i");
  const zoneEl = (z) => root.querySelector(`.region[data-zone="${z}"]`);
  const labelEl = (z) => root.querySelector(`[data-label="${z}"]`);
  let token = 0;
  let selectCb = null;

  root.querySelectorAll(".region").forEach((g) => {
    const fire = () => { api.select(g.dataset.zone); if (selectCb) selectCb(g.dataset.zone); };
    g.addEventListener("click", fire);
    g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fire(); } });
  });

  const api = {
    element: root,

    /** paint one zone: "ok" | "warn" | "crit" | null (clear) */
    setZone(zone, status, label) {
      const g = zoneEl(zone);
      g.classList.remove("ok", "warn", "crit");
      if (status) g.classList.add(status);
      if (label !== undefined) labelEl(zone).textContent = label || "";
    },

    setLabel(zone, text) { labelEl(zone).textContent = text || ""; },

    /** heart animation speed from heart rate; pass null to stop */
    setHeartRate(bpm) {
      if (!bpm) { svg.classList.remove("live"); return; }
      svg.style.setProperty("--beat", (60 / Math.max(30, bpm)).toFixed(2) + "s");
      svg.classList.add("live");
    },

    /** show or hide layers: { muscles, bones, organs, labels } */
    setLayers(layers) {
      for (const k of ["muscles", "bones", "organs", "labels"]) {
        if (k in layers) root.classList.toggle("no-" + k, !layers[k]);
      }
    },

    select(zone) {
      root.querySelectorAll(".region").forEach((g) => g.classList.toggle("sel", g.dataset.zone === zone));
    },

    onSelect(cb) { selectCb = cb; },

    reset() {
      token++;
      ZONES.forEach((z) => api.setZone(z, null, ""));
      api.select(null);
      api.setHeartRate(null);
      scan.setAttribute("opacity", 0); line.setAttribute("opacity", 0);
      bar.style.width = "0%";
    },

    /**
     * Animate the scan line from head to feet. Each zone is painted with its
     * status when the line reaches it, and onZone is called (await-able, so
     * the caller can speak before the scan continues).
     * @param {Record<string,"ok"|"warn"|"crit">} statuses
     * @param {{ durationMs?: number, onZone?: (zone:string, status:string)=>void|Promise<void> }} [o]
     */
    async run(statuses, o = {}) {
      api.reset();
      const my = token;
      const dur = o.durationMs || 6200;
      const done = {};
      scan.setAttribute("opacity", 1); line.setAttribute("opacity", 1);
      let elapsed = 0, last = performance.now(), paused = false;

      await new Promise((resolve) => {
        function frame(now) {
          if (my !== token) return resolve();
          if (!paused) elapsed += now - last;
          last = now;
          const p = Math.min(1, elapsed / dur), y = p * H;
          scan.setAttribute("y", y - 40);
          line.setAttribute("y1", y); line.setAttribute("y2", y);
          bar.style.width = (p * 100).toFixed(1) + "%";
          for (const z of ZONES) {
            if (!done[z] && y >= ZONE_Y[z] - 6) {
              done[z] = true;
              /* null = no sensor for this zone: leave it uncoloured */
              const st = statuses[z] === undefined ? "ok" : statuses[z];
              api.setZone(z, st);
              if (o.onZone) {
                const r = o.onZone(z, st);
                if (r && typeof r.then === "function") { paused = true; r.finally(() => { paused = false; last = performance.now(); }); }
              }
            }
          }
          if (p < 1) requestAnimationFrame(frame); else resolve();
        }
        requestAnimationFrame(frame);
      });

      scan.setAttribute("opacity", 0); line.setAttribute("opacity", 0);
    }
  };
  return api;
}
