/*
 * Web Serial reader for the Galley wearable (ESP32 + MAX30102 + skin temperature).
 * The firmware prints one JSON line per second at 115200 baud:
 *   {"t":12,"hr":61,"spo2":98,"temp":36.6,"q":1,"src":"sensor"}
 * Contract: contracts/telemetry-payload.schema.json#/definitions/SerialFrame.
 * Lines that are not JSON (ESP32 boot log) or break the contract are dropped, never shown.
 */

export const serialSupported = () => typeof navigator !== "undefined" && "serial" in navigator;

/** tolerant parser: returns a frame or null. `schema` = the SerialFrame JSON Schema. */
export function parseFrame(line, schema) {
  const s = String(line).trim();
  if (!s.startsWith("{")) return null;
  let f;
  try { f = JSON.parse(s); } catch (e) { return null; }
  if (!f || typeof f !== "object" || Array.isArray(f)) return null;
  const props = schema.properties || {};
  for (const k of schema.required || []) if (!(k in f)) return null;
  for (const [k, v] of Object.entries(f)) {
    const p = props[k];
    if (!p) return null;
    if (p.type === "integer" && !Number.isInteger(v)) return null;
    if (p.type === "number" && typeof v !== "number") return null;
    if (p.type === "string" && typeof v !== "string") return null;
    if (p.enum && !p.enum.includes(v)) return null;
    if (p.minimum !== undefined && v < p.minimum) return null;
    if (p.maximum !== undefined && v > p.maximum) return null;
  }
  return f;
}

/** rolling summary of the last good frames: median pulse/SpO2, latest temperature */
export function summarize(frames) {
  const good = frames.filter((f) => f.q === 1);
  const med = (xs) => { if (!xs.length) return undefined; const a = [...xs].sort((x, y) => x - y); return a[Math.floor(a.length / 2)]; };
  const last = frames[frames.length - 1];
  return {
    n: good.length,
    hr: med(good.map((f) => f.hr).filter(Number.isFinite)),
    spo2: med(good.map((f) => f.spo2).filter(Number.isFinite)),
    temp: [...frames].reverse().find((f) => Number.isFinite(f.temp))?.temp,
    q: last ? last.q : undefined,
    src: last ? last.src || "sensor" : undefined
  };
}

let port = null, reader = null, stopping = false;

/**
 * Ask the user for a port (needs a click), open it and stream frames.
 * @returns {Promise<void>} resolves when the stream ends (unplugged or disconnect()).
 */
export async function connectSerial({ schema, onFrame, onOpen }) {
  port = await navigator.serial.requestPort();
  await port.open({ baudRate: 115200 });
  stopping = false;
  if (onOpen) onOpen();
  const decoder = new TextDecoderStream();
  const closed = port.readable.pipeTo(decoder.writable).catch(() => {});
  reader = decoder.readable.getReader();
  let buf = "";
  try {
    while (!stopping) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += value;
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i); buf = buf.slice(i + 1);
        const f = parseFrame(line, schema);
        if (f) onFrame(f);
      }
      if (buf.length > 4096) buf = ""; /* garbage without newlines */
    }
  } catch (e) { /* device unplugged */ }
  finally {
    try { reader.releaseLock(); } catch (e) {}
    await closed;
    try { await port.close(); } catch (e) {}
    port = null; reader = null;
  }
}

export async function disconnectSerial() {
  stopping = true;
  try { if (reader) await reader.cancel(); } catch (e) {}
}
