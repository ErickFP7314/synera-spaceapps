// Builds the isometric "3D" body view for the Galley app: software/app/body-3d-art.js
// Object: a door-frame body scanner on a base plate. A jointed mannequin stands on two foot pads;
// a scan bar rides down two columns behind it; a console on the base shows one lamp per zone.
// What moves: the scan bar (head -> feet). What it means: the zone it passes is evaluated.
// Kit: MIT-licensed anatomy kit (tools/anatomy-kit). Run: node tools/build-body-3d.mjs
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "./anatomy-kit/iso-kit.mjs";
import * as G from "./anatomy-kit/lathe.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "app", "body-3d-art.js");
const W = 380, H = 520;

/* ---- world (1 unit ≈ 1 cm of a 182 cm crew member) ---- */
const PLATE = { x: -66, y: -50, w: 132, d: 108, r: 8 };
const PLATE_H = 9, FOOT_H = 4;
const COL = [[-50, -34], [50, -34]];          // column centres (behind the body)
const COL_W = 9, COL_TOP = 198;
const BAR = { y: -31, d: 6, h: 7 };          // scan bar at rest (z = 0), between the columns
const CONSOLE = { x: 34, y: 30, w: 26, d: 22, r: 3 };
const CONSOLE_H = 14;

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [-55, -34, COL_TOP + 8], [55, -34, COL_TOP + 8], [0, 0, 186]],
  W, H, { pad: 16, azimuth: 45 },
);

const at = (p) => k.iso(p, P);
const S = (paths, o) => k.solidSvg(paths, o);
const Ln = (d, o) => k.lineSvg(d, o);
const Dt = (pts, o) => k.dotsSvg(pts, o);
const depth = (p) => k.depthOf(p, P);
const sphere = (c, r, o = { tone: "hi" }) => S(G.sphereOf(c, r, P, { steps: 40 }), o);

/* ---------- base ---------- */
function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  const feet = k.corners(PLATE, 16).sort((a, b) => depth([a[0], a[1], 0]) - depth([b[0], b[1], 0]));
  for (const [x, y] of feet) {
    out.push(S(k.cylinder(x, y, 6, -PLATE_H - FOOT_H, 1.4, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 4.6, -PLATE_H - FOOT_H + 1.4, FOOT_H - 1.4, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.4), { tone: "mid" }));
  out.push(Ln(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 9);
  out.push(Ln(screws.map(([x, y]) => k.ring(x, y, 2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(Dt(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // ruler strip along the front-left edge, ticks every 4 units, major every 5th
  const strip = { x: PLATE.x + 12, y: PLATE.y + PLATE.d - 12, w: 66, d: 6, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 3, strip.x + strip.w - 3, 4, 5, strip.y + 0.6, 0.6, [1.8, 3.4], P);
  out.push(Ln(ticks.minor, { tone: "lo" }), Ln(ticks.major, { tone: "mid" }));
  // two foot pads where the crew member stands
  for (const x of [-11, 11]) {
    const pad = { x: x - 8, y: -10, w: 16, d: 30, r: 5 };
    out.push(S(k.slabOf(pad, 0, 0.8, P, 6, 0.3), { tone: "lo", crease: "none" }));
    out.push(Ln(k.planOutline(k.insetPlan(pad, 2.2), 0.8, P, 6), { tone: "faint" }));
  }
  return out.join("");
}

/* ---------- console with one lamp per zone ---------- */
const LAMPS = ["head", "chest", "abdomen", "legs"].map((z, i) => ({ z, x: CONSOLE.x + 5 + i * 5.4, y: CONSOLE.y + 11 }));
function consoleBox() {
  const out = [];
  out.push(S(k.slabOf(CONSOLE, 0, CONSOLE_H, P, 4, 0.6), { tone: "mid" }));
  out.push(Ln(k.planOutline(k.insetPlan(CONSOLE, 2), CONSOLE_H, P, 4), { tone: "faint" }));
  // label plate with three rule lines (printed text)
  const plate = { x: CONSOLE.x + 4, y: CONSOLE.y + 15, w: 18, d: 4.5, r: 0.6 };
  out.push(S(k.slabOf(plate, CONSOLE_H, 0.4, P, 2), { tone: "lo", crease: "none" }));
  for (let i = 0; i < 3; i++) out.push(Ln(k.lineOnTop([plate.x + 2, plate.y + 1.2 + i * 1.1], [plate.x + 10 - i * 2.5, plate.y + 1.2 + i * 1.1], CONSOLE_H + 0.4, P), { tone: "faint", free: "both" }));
  out.push(Dt([at([CONSOLE.x + 2, CONSOLE.y + 2, CONSOLE_H]), at([CONSOLE.x + CONSOLE.w - 2, CONSOLE.y + 2, CONSOLE_H]), at([CONSOLE.x + 2, CONSOLE.y + CONSOLE.d - 2, CONSOLE_H]), at([CONSOLE.x + CONSOLE.w - 2, CONSOLE.y + CONSOLE.d - 2, CONSOLE_H])], { size: 0.45 }));
  for (const L of LAMPS) {
    out.push(`<g class="lamp" data-lamp="${L.z}">` + S(k.cylinder(L.x, L.y, 2.1, CONSOLE_H, 1.6, P, 24), { tone: "mid" }) + `</g>`);
  }
  return out.join("");
}

/* ---------- frame: two columns, header, scan bar (behind the body) ---------- */
function column([cx, cy]) {
  const plan = { x: cx - COL_W / 2, y: cy - COL_W / 2, w: COL_W, d: COL_W, r: 1.4 };
  const out = [];
  const foot = { x: cx - 8, y: cy - 8, w: 16, d: 16, r: 2 };
  out.push(S(k.slabOf(foot, 0, 4, P, 4, 0.5), { tone: "mid" }));
  out.push(Dt(k.corners(foot, 3).map(([x, y]) => at([x, y, 4])), { size: 0.45 }));
  out.push(S(k.slabOf(plan, 4, COL_TOP - 4, P, 4, 0.5), { tone: "mid" }));
  // rail groove on the inner face + ruler ticks on the front face
  // ruler ticks on the front face, hanging from its outer edge, every 8 units, major every 5th
  const face = cy + COL_W / 2, edge = cx < 0 ? cx - COL_W / 2 : cx + COL_W / 2, dir = cx < 0 ? 1 : -1;
  const minor = [], major = [];
  for (let z = 16, i = 2; z <= COL_TOP - 10; z += 8, i++) {
    const len = i % 5 === 0 ? 3.2 : 1.6;
    const a = at([edge, face, z]), b = at([edge + dir * len, face, z]);
    (i % 5 === 0 ? major : minor).push(`M${a[0].toFixed(1)},${a[1].toFixed(1)}L${b[0].toFixed(1)},${b[1].toFixed(1)}`);
  }
  out.push(Ln(minor.join(""), { tone: "lo" }), Ln(major.join(""), { tone: "mid" }));
  return out.join("");
}
function header() {
  const beam = { x: COL[0][0] - 6, y: COL[0][1] - 6, w: COL[1][0] - COL[0][0] + 12, d: 12, r: 2 };
  const out = [S(k.slabOf(beam, COL_TOP, 9, P, 4, 0.6), { tone: "mid" })];
  out.push(Ln(k.planOutline(k.insetPlan(beam, 2.5), COL_TOP + 9, P, 4), { tone: "faint" }));
  out.push(Dt([at([beam.x + 4, beam.y + 6, COL_TOP + 9]), at([beam.x + beam.w - 4, beam.y + 6, COL_TOP + 9])], { size: 0.5 }));
  return out.join("");
}
function scanBar() {
  // built at z = 0; the runtime moves it with translateAlong(P, [0, 0, z])
  const x0 = COL[0][0] + COL_W / 2, x1 = COL[1][0] - COL_W / 2;
  const out = [];
  for (const [cx, cy] of COL) {   // carriages hugging each column's front face
    const car = { x: cx - 7, y: cy + COL_W / 2, w: 14, d: 5, r: 1 };
    out.push(S(k.slabOf(car, -5, BAR.h + 10, P, 3, 0.4), { tone: "mid" }));
    out.push(Dt([at([cx - 4, car.y + car.d, 0]), at([cx + 4, car.y + car.d, 0])], { size: 0.45 }));
  }
  const bar = { x: x0, y: BAR.y, w: x1 - x0, d: BAR.d, r: 1.2 };
  out.push(S(k.slabOf(bar, 0, BAR.h, P, 3, 0.5), { tone: "hi" }));
  // the sensor strip: the one lit part the reader watches
  const strip = { x: x0 + 4, y: BAR.y + BAR.d - 0.6, w: x1 - x0 - 8, d: 0.6, r: 0.2 };
  out.push(S(k.slabOf(strip, 2, 3, P, 2), { tone: "lit", lit: true, crease: "none" }));
  return out.join("");
}

/* ---------- the mannequin (zones: head, chest, abdomen, legs) ---------- */
const Z = {};
function seg(zone, svg) { (Z[zone] = Z[zone] || []).push(svg); }
function mannequin() {
  // legs: feet, shins, knees, thighs, hips (sorted far -> near: -x first)
  for (const s of [-1, 1]) {
    const x = 11 * s;
    seg("legs", S(k.slabOf({ x: x - 6, y: -6, w: 12, d: 24, r: 4.5 }, 0.8, 6.5, P, 6, 1), { tone: "hi" }));
    seg("legs", sphere([x, 2, 9.5], 4.6));
    seg("legs", S(k.cylinder(x, 0, 5, 10, 38, P, 32, 0.6), { tone: "hi" }));
    seg("legs", sphere([x, 0, 51], 6.2));
    seg("legs", S(k.cylinder(x, 0, 6.8, 54, 36, P, 32, 0.6), { tone: "hi" }));
    seg("legs", sphere([x, 0, 92], 7.2));
  }
  // abdomen: pelvis + belly
  seg("abdomen", S(k.slabOf({ x: -19, y: -11, w: 38, d: 22, r: 9 }, 92, 14, P, 8, 1.2), { tone: "hi" }));
  seg("abdomen", S(k.slabOf({ x: -16, y: -10, w: 32, d: 20, r: 8 }, 106, 18, P, 8, 1.2), { tone: "hi" }));
  // far arm (-x) is behind the chest, near arm (+x) in front of it
  const arm = (s) => {
    const x = 27 * s, parts = [];
    parts.push(sphere([x, 0, 78], 4.6));
    parts.push(S(k.cylinder(x, 0, 4.1, 82, 26, P, 28, 0.5), { tone: "hi" }));
    parts.push(sphere([x, 0, 111], 4.9));
    parts.push(S(k.cylinder(x, 0, 4.7, 114, 28, P, 28, 0.5), { tone: "hi" }));
    parts.push(sphere([x, 0, 145], 6.4));
    return parts.join("");
  };
  seg("chest", arm(-1));
  seg("chest", S(k.slabOf({ x: -21, y: -12, w: 42, d: 24, r: 10 }, 124, 27, P, 10, 1.6), { tone: "hi" }));
  // sternum seam + collar line on the chest top
  seg("chest", Ln(k.lineOnTop([-12, 6], [12, 6], 151, P), { tone: "faint" }));
  seg("chest", arm(1));
  // head: neck, skull, visor band
  seg("head", S(k.cylinder(0, 0, 5, 151, 9, P, 28, 0.5), { tone: "hi" }));
  seg("head", sphere([0, 1, 171], 11.5));
}

/* ---------- assemble in painter's order ---------- */
mannequin();
const farCol = column(COL[0]), nearCol = column(COL[1]);
const zoneG = (z) => `<g class="z z-${z}" data-zone="${z}" tabindex="0" role="button">${Z[z].join("")}</g>`;
const heart = at([-5, 12.2, 141]);
const svg = k.figureSvg({
  width: W, height: H,
  label: "Isometric body scanner: a jointed mannequin stands on a base plate between two columns; a scan bar moves down behind it from head to feet, and a console shows one lamp per body zone.",
  body: [
    base(),
    farCol,
    nearCol,
    header(),
    `<g data-part="bar">${scanBar()}</g>`,
    consoleBox(),
    zoneG("legs"), zoneG("abdomen"), zoneG("chest"), zoneG("head"),
    `<circle class="b3d-heart" cx="${heart[0].toFixed(2)}" cy="${heart[1].toFixed(2)}" r="2.2"/>`,
  ],
});

// screen offset of one unit of z, so the runtime can move the bar without the kit
const up = k.axisVector(P, [0, 0, 1]);
const lampAt = Object.fromEntries(LAMPS.map((L) => [L.z, at([L.x, L.y, CONSOLE_H + 1.6])]));
const art = `// GENERATED by software/tools/build-body-3d.mjs — do not edit by hand.
// Drawing made with the MIT-licensed anatomy kit (software/tools/anatomy-kit/LICENSE).
export const BODY3D_SVG = ${JSON.stringify(svg)};
export const BODY3D_UP = ${JSON.stringify(up.map((v) => Math.round(v * 10000) / 10000))};
export const BODY3D_LAMPS = ${JSON.stringify(lampAt)};
export const BODY3D_KIT_CSS = ${JSON.stringify(k.ISO_CSS)};
export const BODY3D_SCAN = { from: 186, to: 2, zones: { head: 182, chest: 151, abdomen: 124, legs: 92 } };
`;
writeFileSync(OUT, art);
console.log("wrote", OUT, (art.length / 1024).toFixed(1) + " KB");
