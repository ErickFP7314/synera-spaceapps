/* One authored icon set: 24×24, 1.8 stroke, round caps. <svg data-icon="name"> gets filled in by hydrateIcons(). */
export const ICONS = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
  data: '<path d="M4 19V5M4 19h16"/><path d="M7 15l4-5 3 3 5-7"/>',
  orbit: '<circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(-25 12 12)"/>',
  scan: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><path d="M4 12h16"/>',
  shield: '<path d="M12 3l7 3v6c0 4.2-3 7.4-7 9-4-1.6-7-4.8-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  volume: '<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/>',
  mute: '<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5"/>',
  usb: '<path d="M12 3v14"/><circle cx="12" cy="19" r="2"/><path d="M12 13l-4-2.5V7.5M12 10.5l4-2.5V6"/><rect x="6.8" y="5.3" width="2.4" height="2.4"/><circle cx="16" cy="5" r="1.2"/>',
  play: '<path d="M8 5.5v13l10-6.5z"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>',
  print: '<path d="M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2"/><rect x="7" y="14" width="10" height="6"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  ok: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.8 2.8L16.5 9.5"/>',
  watch: '<path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.5M12 17v.4"/>',
  act: '<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7"/>',
  nodata: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>'
};

export function icon(name, cls = "") {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name] || ""}</svg>`;
}

export function hydrateIcons(root = document) {
  root.querySelectorAll("svg[data-icon]").forEach((el) => {
    const name = el.getAttribute("data-icon");
    el.setAttribute("viewBox", "0 0 24 24");
    el.setAttribute("fill", name === "play" ? "currentColor" : "none");
    el.setAttribute("stroke", "currentColor");
    el.setAttribute("stroke-width", "1.8");
    el.setAttribute("stroke-linecap", "round");
    el.setAttribute("stroke-linejoin", "round");
    el.setAttribute("aria-hidden", "true");
    el.setAttribute("focusable", "false");
    el.innerHTML = ICONS[name] || "";
  });
}

/* state mark icon per engine colour: shape differs, so colour is never the only cue */
export const STATE_ICON = { GREEN: "ok", YELLOW: "watch", RED: "act", NONE: "nodata" };
