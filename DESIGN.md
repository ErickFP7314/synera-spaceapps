---
name: Galley
description: On-device daily health check-up for astronauts, drawn as labelled equipment on a module wall.
colors:
  ground: "#e9e7e1"
  panel: "#f7f6f2"
  panel-2: "#efede7"
  seam: "#cdc9bf"
  seam-strong: "#b3ada1"
  fastener: "#a9a396"
  ink: "#1b1d1f"
  ink-2: "#44474a"
  ink-3: "#5f6265"
  tag: "#ffffff"
  accent: "#2443b3"
  accent-ink: "#ffffff"
  accent-hover: "#1b358f"
  accent-soft: "#e3e8f8"
  ok: "#17784a"
  ok-fill: "#2a9d63"
  ok-bg: "#dcefe3"
  warn: "#8a5a00"
  warn-fill: "#d99413"
  warn-bg: "#f7e9c8"
  crit: "#a8231b"
  crit-fill: "#d23a2f"
  crit-bg: "#f6dcd8"
  none: "#8a8d90"
  night-ground: "#15100c"
  night-panel: "#1f1813"
  night-panel-2: "#271f18"
  night-seam: "#3a2f25"
  night-seam-strong: "#54453a"
  night-fastener: "#5d4d40"
  night-ink: "#f1e3d0"
  night-ink-2: "#d2bea6"
  night-ink-3: "#b29d86"
  night-tag: "#2a211a"
  night-accent: "#ecc596"
  night-accent-ink: "#1b140e"
  night-accent-hover: "#f6d6ae"
  night-accent-soft: "#3a2c1f"
  night-ok: "#8fd1a6"
  night-ok-fill: "#5fae7f"
  night-ok-bg: "#1f2b20"
  night-warn: "#f0c46a"
  night-warn-fill: "#d9a443"
  night-warn-bg: "#33281a"
  night-crit: "#ff9a8c"
  night-crit-fill: "#e0665a"
  night-crit-bg: "#3a1f1a"
  night-none: "#8c7b6b"
typography:
  display:
    fontFamily: "Atkinson Next, Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "clamp(40px, 5.4vw, 76px)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.03em"
  numeral:
    fontFamily: "Atkinson Next, Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "clamp(56px, 7vw, 96px)"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Atkinson Next, Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "clamp(28px, 3.2vw, 40px)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Atkinson Next, Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  reading:
    fontFamily: "Atkinson Next, Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  body:
    fontFamily: "Atkinson Next, Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.55
    fontFeature: "tnum"
  label:
    fontFamily: "Atkinson Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.12em"
  data:
    fontFamily: "Atkinson Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.2
rounded:
  mark: "3px"
  tag: "4px"
  panel: "6px"
  pill: "99px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  panel: "28px"
  hero-gap: "56px"
  section: "72px"
components:
  button:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "0 18px"
    height: "44px"
  button-hover:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.ink}"
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.panel}"
    padding: "0 18px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "{colors.accent-ink}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.panel}"
    padding: "0 18px"
    height: "44px"
  button-sm:
    padding: "0 12px"
    height: "36px"
  panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel}"
  tag:
    backgroundColor: "{colors.tag}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tag}"
    padding: "0 16px 14px"
  mark-green:
    backgroundColor: "{colors.ok-bg}"
    textColor: "{colors.ok}"
    rounded: "{rounded.mark}"
    padding: "4px 9px 4px 6px"
  mark-yellow:
    backgroundColor: "{colors.warn-bg}"
    textColor: "{colors.warn}"
    rounded: "{rounded.mark}"
    padding: "4px 9px 4px 6px"
  mark-red:
    backgroundColor: "{colors.crit-bg}"
    textColor: "{colors.crit}"
    rounded: "{rounded.mark}"
    padding: "4px 9px 4px 6px"
  mark-none:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.ink-3}"
    rounded: "{rounded.mark}"
    padding: "4px 9px 4px 6px"
  seg:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.panel}"
    padding: "0 12px"
    height: "36px"
  seg-pressed:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.panel}"
  next-band:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "26px 30px"
  crew-row:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "8px 12px 8px 8px"
    height: "60px"
  crew-row-selected:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.ink}"
  input:
    backgroundColor: "{colors.tag}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "0 12px"
    height: "44px"
---

# Design System: Galley

## Overview

**Creative North Star: "The Labelled Module Wall"**

Galley is a piece of station equipment, not a dashboard. Every surface is a panel bolted to a wall: an off-white or warm-dark plate with a 1px seam, four fastener dots in its corners and, where it has one, a small mono location code stamped at the top-right edge. Readings are inventory tags hung on those panels, each with a dashed tear line, a code and a barcode strip. The page reads top to bottom like a walk along the module: check in, scan, read, act, then the supporting evidence.

Two lighting states share one structure. Day is neutral general lighting with a cobalt interaction colour. Pre-sleep is a warm, dim, blue-free palette where the interaction colour becomes a pale amber; every token flips, the components never change shape. The theme is applied before first paint from saved choice or `prefers-color-scheme`, and the switch lives in the top bar as a segmented control.

Density is moderate and calm: 17px body on a 1280px column, panels padded 28px, sections 72px apart. Hierarchy comes from scale (large values, small mono labels), not from colour or ornament.

**Key Characteristics:**
- Fastened panels: 1px seam, 6px corners, four radial-gradient fastener dots, optional mono location code.
- Readings as inventory tags with a deterministic decorative barcode.
- One interaction colour per theme; health colours reserved for health state only.
- State always shown as shape + colour + word.
- Two complete token sets (day, pre-sleep) on identical components.
- Atkinson Next for everything, Atkinson Mono for codes, units and data.

## Colors

A low-chroma warm-grey equipment palette with one interaction colour and a three-step health scale, re-cast wholesale for pre-sleep lighting. Night tokens below are the same custom properties redefined under `:root[data-theme="night"]`; the `night-` prefix in the frontmatter exists only to list both sets.

### Primary
- **Station Cobalt** (accent): links, primary buttons, focus rings, selection, the active nav underline, the trend "today" rule, the step numerals in the Earth-link queue, the 3D scanner's lit faces. Hover deepens to **Deep Cobalt** (accent-hover); **Cobalt Wash** (accent-soft) fills the selected crew row.
- **Pre-sleep Amber** (night-accent): the same role in pre-sleep lighting. It replaces cobalt entirely; no blue survives the theme switch. Text on it is near-black (night-accent-ink).

### Secondary (health state only)
- **Nominal Green** (ok / ok-fill / ok-bg): GREEN state and level-1 next step. `ok` is the text colour, `ok-fill` the chart/figure fill, `ok-bg` the mark and band fill.
- **Caution Amber** (warn / warn-fill / warn-bg): YELLOW state, level-2, queued transmissions, data caveats.
- **Alert Red** (crit / crit-fill / crit-bg): RED state, levels 3-4, absolute-limit ticks on bullet charts, the beating heart, delete hover.
- **No-data Grey** (none): readings with no state.

### Neutral
- **Module Ground** (ground): page background and scrollbar track.
- **Panel Plate** (panel) and **Recessed Plate** (panel-2): panel faces; panel-2 for hover fills, crew rows, chart tracks, NONE marks.
- **Seam** and **Strong Seam** (seam, seam-strong): 1px borders, dividers, dashed tag tear lines; strong seam for buttons, inputs, segmented controls.
- **Fastener** (fastener): only the four corner dots of a panel.
- **Tag Stock** (tag): inventory tags and input fields, a step brighter than the panel in day and a step lifted in pre-sleep.
- **Ink, Ink 2, Ink 3** (ink, ink-2, ink-3): primary text, secondary copy, mono labels and metadata.

### Named Rules
**The One Action Colour Rule.** The accent marks only what you can act on or what is selected. It never decorates, never encodes health.

**The Health Colours Are Earned Rule.** Green, amber and red appear only when they report a measured state (marks, tag borders, figure zones, bands, lamps, next-step level). Never as decoration or brand.

**The Lighting Swap Rule.** A new component must read correctly under both token sets using custom properties only; pre-sleep contains no blue.

## Typography

**Display Font:** Atkinson Next (self-hosted variable 200-800, fallback Atkinson Hyperlegible, system-ui)
**Body Font:** Atkinson Next
**Label/Mono Font:** Atkinson Mono (self-hosted variable 200-800, fallback ui-monospace)

**Character:** A legibility-first grotesque used at heavy weights for scale contrast, paired with its own mono for everything that is a code, unit, timestamp or data row. Numerals are tabular everywhere (`font-variant-numeric: tabular-nums` on body).

### Hierarchy
- **Display**: the single page headline, tight tracking.
- **Numeral**: monumental single figures (Earth-link delay) with a small 22px unit beside them.
- **Headline**: section headings; supporting copy under them capped at 62ch.
- **Next-step title** (700, clamp(24px, 2.6vw, 34px), -0.02em): the NEXT STEP band heading.
- **Title**: zone headings (20px); panel headings run 16-22px.
- **Reading**: the value on an inventory tag, with its unit at 15px/500 in ink-3.
- **Body**: 17px, 16px under 640px; copy blocks capped 62-70ch.
- **Label**: mono, uppercase-style codes (panel location codes, tag codes, zone location, level captions), wide tracking.
- **Data**: mono for MET clock, live strip, transmission queue, chart axes (10-11px), why-lines (12px).

### Named Rules
**The Scale Not Colour Rule.** Values are large and labels are small; hierarchy is built from size and weight before any colour is added.

**The Mono Means Machine Rule.** Mono is for codes, units, clocks and data. Prose is never set in mono.

## Layout

Single column at `max-width: 1280px`, 24px side padding (16px under 640px). Sticky top bar, 64px tall, with a 2px reading-progress line under it. Sections are separated by 72px top padding (52px on small screens); each opens with a section head (heading + optional source line aligned to the end).

Two-column grids per section: check-in (1fr / 1.05fr, 56px gap), scan (figure 300-420px sticky / readouts), Earth link (.9fr / 1.1fr), weather (1.4fr / .6fr), science (1fr / 1fr), all 24px gaps. Tags and trends tile with `auto-fill, minmax(260px | 280px, 1fr)` at 12-16px gaps.

Breakpoints: at 1100px the section nav hides, all two-column grids collapse to one column and the figure panel stops being sticky; at 640px panel padding drops to 20px, form fields stack, the module tagline and MET hide, and segmented controls drop their text labels. Print hides everything except the Earth-link report.

## Elevation & Depth

Hybrid: depth is mostly 1px seams and tonal plates, with a soft warm ambient shadow that makes panels and tags sit slightly proud of the wall. Shadow is tinted warm-brown in day and pure black in pre-sleep. Only the NEXT STEP band uses the lifted shadow.

### Shadow Vocabulary
- **Mounted** (`--shadow`; day `0 1px 1px rgba(40,34,24,.06), 0 6px 18px -8px rgba(40,34,24,.18)`): every panel and inventory tag.
- **Lifted** (`--shadow-lift`; day `0 2px 2px rgba(40,34,24,.08), 0 18px 34px -14px rgba(40,34,24,.32)`): the NEXT STEP band only.
- The top bar uses a 94% panel tint with `backdrop-filter: saturate(1.2) blur(8px)` instead of a shadow.

### Named Rules
**The One Lifted Band Rule.** Exactly one element per page carries the lifted shadow: the next step.

## Shapes

Quietly rounded hardware. Panels, buttons, inputs, segmented controls and crew rows share a 6px radius; tags, avatars and the viewfinder use 4px; marks, code chips and level chips use 3px. Fully round shapes are limited to status dots, the scrollbar thumb and the disclaimer chip. Borders are always 1px solid; dashed 1px seams signal tear lines (tag header), empty states and the open registration form. Active nav is an inset 2px underline with square corners. The viewfinder reticle uses four open corner brackets.

## Components

### Buttons
- **Shape:** 6px, 44px tall (36px small), 600 weight 16px, 18px icon with 8px gap.
- **Default:** panel face, strong seam border, ink text; hover recesses to panel-2 with an ink-3 border; active nudges down 1px.
- **Primary:** accent fill and border, accent-ink text; hover to accent-hover.
- **Ghost:** transparent, ink-2 text; hover fills panel-2.
- **Busy:** label goes transparent, an 18px spinner ring in accent-ink turns at .8s.
- **Disabled:** 50% opacity, no motion.

### Segmented control
- Strong-seam outline, 6px, panels separated by 1px seams; 36px tall (44px "big").
- Pressed segment inverts: ink fill, panel text. Used for lighting (day/pre-sleep), language and figure view.

### Panel (signature)
- Panel plate, 1px seam, 6px, mounted shadow, four fastener dots (radius 2.6px, 14px tiles inset 6px from each corner, drawn with stacked radial gradients).
- Optional location code from `data-code`: mono 11px/600, .12em tracking, ink-3, set on a panel-coloured knockout at top 7px right 26px.
- Padding 28px (20px small).

### Inventory tag (signature)
- Tag stock, 1px seam, 4px, mounted shadow; padding 0 16px 14px.
- Header strip 30px tall, bottom dashed seam bleeding to the edges: mono code left, barcode right (16px tall, ink at 80%; generated deterministically from the code, decorative and `aria-hidden`). Live data appends " · LIVE" in ok.
- Body: label (15px ink-2) and state mark on one side, reading value on the other; then "your normal" line, mono why-line, and a full-width bullet chart.
- YELLOW / RED tags tint their border by mixing warn-fill 55% / crit-fill 60% into the seam. Tags enter with a .5s rise.
- Expandable "what does this mean" detail: accent summary with a chevron that rotates 90 degrees.

### State mark
- 13px/700 chip, 3px, a 15px icon + the state word, on the state's bg tint with its text colour. NONE uses panel-2 and ink-3.

### NEXT STEP band
- Three-column grid (level chip / text / action), 26px 30px padding, panel face, lifted shadow.
- Level chip: 92px square (64px small), 4px, 800 40px numeral with a mono caption, filled with the level's health bg and text colour. Levels 3-4 also tint the band border.
- Rule chips under the copy: mono 12px, strong seam outline, 3px.

### Crew row
- 60px min height, grid of 44px avatar / name + role / mono tagline chip, panel-2 face, seam border, 6px.
- Hover darkens the border to ink-3. Selected: accent border plus 1px inset accent ring, accent-soft fill, tagline chip turns accent.
- A separate 44px delete button sits beside it; hover turns it crit.

### Inputs / Fields
- 44px, tag-stock fill, strong-seam border, 6px, 12px side padding; label above at 14px ink-2.
- Focus: 3px solid accent outline flush to the box. Checkboxes and ranges use `accent-color`.

### Navigation
- Top bar: wordmark (800, 21px, .14em tracking) + module tagline, section links at 15px ink-2 with panel-2 hover, current section marked by a 2px accent inset underline. MET clock in mono. Hidden below 1100px.

### Bullet and trend charts
- **Bullet** (300x34, stretches to tag width): panel-2 track, warn-bg watch band, ok-bg normal band, ink-3 centre tick, dashed crit-fill absolute limits, today's value as a 6px bar in its state fill with an ink outline.
- **Trend** (300x120): warn-bg outer band at 70%, ok-bg inner band, 1.8px ink line, seam axis, dashed accent "today" rule, mono 10px ink-3 axis text; dots sized on a fixed |z| ramp and filled by state, the selected day ringed in ink.

### Body scan figures
- **2D figure:** skin, line, bone, muscle, label-halo and ground tokens (`--fig-*`) per theme. Zones fill with a translucent mix of their state fill and thicken their stroke with severity (2.2 / 2.8 / 3.4px); hover and selection stroke in `--sel` (the accent). A scan gradient and 2px scanline in `--scanline` ride head to feet; a 4px progress bar tracks it.
- **3D door-frame scanner:** the isometric kit's tone variables are re-pointed at Galley tokens: plates from panel, shading as black mixes into panel (2.5-15% day, 10-46% pre-sleep), lit faces as accent mixes. Scanned zones tint by mixing the state fill into every shade; matching console lamps light in the state fill; selected zone outlines in `--sel` at 1.4px.
- Both share the API, so the view toggle swaps them without layout change.

### Motion
- One easing for the whole system: `cubic-bezier(.16, 1, .3, 1)`. Theme change crossfades body colours over .5s.
- Scroll reveal (only when JS, IntersectionObserver and full motion are present): blocks rise 18px, fade and unclip from 12% over .7-.9s, the second sibling delayed 80ms. Chart lines draw in over 1.4s via dash offset. Content is visible without JS.
- During a scan the active zone lifts 3px and others dim to 45%.
- Heart glyphs beat at the measured heart rate.
- `prefers-reduced-motion`: smooth scroll off, animations and transitions cut to .01ms, reveals and line draws shown complete, heart beats stopped.

## Do's and Don'ts

### Do:
- **Do** build every surface as a fastened panel (seam, 6px, fastener dots, mounted shadow) and give it a mono location code when it is a distinct station location.
- **Do** present each reading as an inventory tag with a mono code and barcode strip, value large and label small.
- **Do** show state as icon + word + colour in a mark; never rely on colour alone.
- **Do** use only custom properties for colour so the component works in day and pre-sleep lighting unchanged.
- **Do** keep the accent for interaction and selection, and the health scale for measured state.
- **Do** set codes, units, clocks and chart text in Atkinson Mono; keep numerals tabular.
- **Do** keep touch targets at 44px (36px only for the small button and compact segmented control) and focus rings at 3px accent.
- **Do** honour reduced motion and keep content visible without JS.

### Don't:
- **Don't** add a second lifted element; the next-step band is the only one.
- **Don't** use green, amber or red for branding, emphasis or decoration.
- **Don't** let any blue into pre-sleep lighting.
- **Don't** introduce glows, colour-wash gradients on surfaces, or neon accents; depth is seams, plates and the warm ambient shadow. Gradients are reserved for the fastener dots and the scan beam.
- **Don't** set prose in mono or headings in anything other than Atkinson Next.
- **Don't** introduce new radii beyond 3 / 4 / 6px for hardware and full-round for dots and chips.
