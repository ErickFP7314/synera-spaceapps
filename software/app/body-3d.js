/*
 * Galley 3D body view: an isometric door-frame body scanner (drawn with the anatomy kit, see
 * software/tools/build-body-3d.mjs). Same API as body-scan.js, so the app can swap views:
 *   setZone(zone, "ok"|"warn"|"crit"|null), setLabel(zone, text), setHeartRate(bpm), select(zone),
 *   onSelect(cb), reset(), run(statuses, { onZone, durationMs })
 * What moves: the scan bar rides down the columns; each zone it passes takes its colour and the
 * matching lamp on the console lights up.
 */
import { BODY3D_SVG, BODY3D_UP, BODY3D_SCAN, BODY3D_KIT_CSS } from "./body-3d-art.js";

const ZONES = ["head", "chest", "abdomen", "legs"];
const ST = ["ok", "warn", "crit"];

/* the kit's tone variables, re-pointed at Galley's tokens (day and pre-sleep) */
const CSS = `
.iso.b3d{
  --anatomy-paper:var(--panel);--anatomy-face:var(--tag);
  --anatomy-top:color-mix(in srgb,#fff 55%,var(--panel));
  --anatomy-shade-0:color-mix(in srgb,#000 15%,var(--panel));--anatomy-shade-1:color-mix(in srgb,#000 10%,var(--panel));
  --anatomy-shade-2:color-mix(in srgb,#000 6%,var(--panel));--anatomy-shade-3:color-mix(in srgb,#000 2.5%,var(--panel));
  --anatomy-lit-top:color-mix(in srgb,var(--accent) 30%,var(--panel));--anatomy-lit-shade:color-mix(in srgb,var(--accent) 55%,var(--panel));
  --anatomy-hi:var(--ink);--anatomy-mid:var(--ink-3);--anatomy-lo:var(--seam-strong);--anatomy-faint:var(--seam);--anatomy-lit:var(--accent);
  --anatomy-halo:#3a3226;--anatomy-halo-opacity:.28;--anatomy-dot:var(--ink);--anatomy-weight:.7px;
  position:relative;max-width:360px;margin:0 auto;background:transparent;color:var(--ink)
}
:root[data-theme="night"] .iso.b3d{
  --anatomy-top:color-mix(in srgb,var(--ink) 9%,var(--panel));
  --anatomy-shade-0:color-mix(in srgb,#000 46%,var(--panel));--anatomy-shade-1:color-mix(in srgb,#000 34%,var(--panel));
  --anatomy-shade-2:color-mix(in srgb,#000 22%,var(--panel));--anatomy-shade-3:color-mix(in srgb,#000 10%,var(--panel));
  --anatomy-halo:#000;--anatomy-halo-opacity:.7
}
.b3d .z{cursor:pointer;outline:none}
.b3d .z.st-ok{--tint:var(--ok-fill)}.b3d .z.st-warn{--tint:var(--warn-fill)}.b3d .z.st-crit{--tint:var(--crit-fill)}
.b3d .z[class*="st-"]{
  --anatomy-paper:color-mix(in srgb,var(--tint) 26%,var(--panel));--anatomy-top:color-mix(in srgb,var(--tint) 22%,var(--panel));
  --anatomy-shade-0:color-mix(in srgb,var(--tint) 52%,var(--panel));--anatomy-shade-1:color-mix(in srgb,var(--tint) 42%,var(--panel));
  --anatomy-shade-2:color-mix(in srgb,var(--tint) 34%,var(--panel));--anatomy-shade-3:color-mix(in srgb,var(--tint) 27%,var(--panel));
  --anatomy-hi:color-mix(in srgb,var(--tint) 70%,var(--ink))
}
.b3d .z .iso-fill,.b3d .z .iso-shade,.b3d .z .iso-top{transition:fill .6s cubic-bezier(.16,1,.3,1)}
.b3d .z:hover,.b3d .z:focus-visible,.b3d .z.sel{--anatomy-hi:var(--sel);--anatomy-weight:1.4px}
.b3d .lamp .iso-top{fill:var(--panel-2);transition:fill .4s}
.b3d .lamp.st-ok .iso-top{fill:var(--ok-fill)}.b3d .lamp.st-warn .iso-top{fill:var(--warn-fill)}.b3d .lamp.st-crit .iso-top{fill:var(--crit-fill)}
.b3d .b3d-heart{fill:var(--crit-fill);opacity:0;transform-box:fill-box;transform-origin:center}
.b3d svg.live .b3d-heart{opacity:.9;animation:b3d-beat var(--beat,1s) infinite}
@keyframes b3d-beat{0%,100%{transform:scale(1)}15%{transform:scale(1.5)}30%{transform:scale(1)}45%{transform:scale(1.25)}}
.b3d [data-part="bar"]{will-change:transform}
.b3d-foot{display:flex;justify-content:space-between;gap:12px;font:500 12px/1.3 var(--mono);color:var(--ink-3);margin-top:8px}
.b3d-foot b{color:var(--ink);font-weight:600}
@media (prefers-reduced-motion:reduce){.b3d svg.live .b3d-heart{animation:none}}
`;

let cssDone = false;
function injectCss() {
  if (cssDone) return; cssDone = true;
  const s = document.createElement("style");
  s.textContent = BODY3D_KIT_CSS.replace(/\.iso\{/, ".iso-kit-vars{") + CSS; /* keep the kit's classes, use Galley's colours */
  document.head.appendChild(s);
}

export function createBody3d(container, opts = {}) {
  injectCss();
  const names = opts.names || {};
  const root = document.createElement("div");
  root.className = "iso b3d";
  root.innerHTML = BODY3D_SVG + `<div class="b3d-foot"><span>${opts.hint || ""}</span><span class="b3d-read" aria-live="polite"></span></div>`;
  container.appendChild(root);
  const svg = root.querySelector("svg");
  svg.setAttribute("role", "img");
  const bar = svg.querySelector('[data-part="bar"]');
  const read = root.querySelector(".b3d-read");
  const zoneEl = (z) => svg.querySelector(`.z[data-zone="${z}"]`);
  const lampEl = (z) => svg.querySelector(`.lamp[data-lamp="${z}"]`);
  const labels = {};
  let token = 0, selectCb = null;
  const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  ZONES.forEach((z) => {
    const g = zoneEl(z);
    g.setAttribute("aria-label", names[z] || z);
    const fire = () => { api.select(z); if (selectCb) selectCb(z); };
    g.addEventListener("click", fire);
    g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fire(); } });
  });

  const moveBar = (z) => bar.setAttribute("transform", `translate(${(BODY3D_UP[0] * z).toFixed(2)} ${(BODY3D_UP[1] * z).toFixed(2)})`);
  moveBar(BODY3D_SCAN.from);

  const api = {
    element: root,
    setZone(zone, status) {
      for (const el of [zoneEl(zone), lampEl(zone)]) { if (!el) continue; ST.forEach((s) => el.classList.remove("st-" + s)); if (status) el.classList.add("st-" + status); }
    },
    setLabel(zone, text) {
      labels[zone] = text || "";
      read.innerHTML = text ? `${names[zone] || zone} · <b>${String(text).replace(/[&<>]/g, "")}</b>` : "";
    },
    setHeartRate(bpm) {
      if (!bpm) { svg.classList.remove("live"); return; }
      svg.style.setProperty("--beat", (60 / Math.max(30, bpm)).toFixed(2) + "s");
      svg.classList.add("live");
    },
    select(zone) {
      ZONES.forEach((z) => zoneEl(z).classList.toggle("sel", z === zone));
      if (zone && labels[zone]) api.setLabel(zone, labels[zone]);
    },
    onSelect(cb) { selectCb = cb; },
    reset() {
      token++;
      ZONES.forEach((z) => api.setZone(z, null));
      api.select(null); api.setHeartRate(null); read.textContent = "";
      moveBar(BODY3D_SCAN.from);
    },
    async run(statuses, o = {}) {
      api.reset();
      const my = token, dur = o.durationMs || 6200;
      const { from, to, zones } = BODY3D_SCAN;
      const done = {};
      const hit = async (z) => {
        done[z] = true;
        api.setZone(z, statuses[z] === undefined ? "ok" : statuses[z]);
        if (o.onZone) await o.onZone(z, statuses[z]);
      };
      if (still()) {
        for (const z of ZONES) { if (my !== token) return; moveBar(zones[z] - 6); await hit(z); }
        moveBar(to); return;
      }
      let elapsed = 0, last = performance.now(), paused = false;
      await new Promise((resolve) => {
        const frame = (now) => {
          if (my !== token) return resolve();
          if (!paused) elapsed += now - last;
          last = now;
          const p = Math.min(1, elapsed / dur);
          const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; /* calm ease in-out */
          const z = from + (to - from) * e;
          moveBar(z);
          for (const zone of ZONES) {
            if (!done[zone] && z <= zones[zone] - 4) {
              paused = true;
              hit(zone).finally(() => { paused = false; last = performance.now(); });
            }
          }
          if (p < 1) requestAnimationFrame(frame); else resolve();
        };
        requestAnimationFrame(frame);
      });
    }
  };
  return api;
}
