import type { DailyRecord, SerialFrame } from '../../domain/models/types.ts';

/** Plausibility limits (reject impossible values before they reach the domain). Mood is 1-5 everywhere. */
const LIMITS: Record<string, [number, number]> = {
  hr_rest_bpm: [25, 240],
  spo2_pct: [60, 100],
  skin_temp_c: [30, 44],
  sleep_h: [0, 24],
  mood_1_5: [1, 5],
  pvt_lapses: [0, 100],
  intake_pct: [0, 200],
  exercise_pct: [0, 300],
  glucose_mg_dl: [20, 600],
};

export function validateDailyRecord(r: Partial<DailyRecord>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const [key, [lo, hi]] of Object.entries(LIMITS)) {
    const v = (r as Record<string, unknown>)[key];
    if (v === undefined) continue;
    if (typeof v !== 'number' || !Number.isFinite(v) || v < lo || v > hi) errors.push(`${key}=${String(v)} outside ${lo}-${hi}`);
  }
  return { isValid: errors.length === 0, errors };
}

/** Parses one serial line (contracts/telemetry-payload.schema.json#/definitions/SerialFrame). Returns null if invalid. */
export function parseSerialLine(line: string): SerialFrame | null {
  let f: unknown;
  try { f = JSON.parse(line.trim()); } catch { return null; }
  if (!f || typeof f !== 'object') return null;
  const o = f as Record<string, unknown>;
  if (typeof o.t !== 'number' || (o.q !== 0 && o.q !== 1)) return null;
  const inRange = (v: unknown, lo: number, hi: number) => v === undefined || (typeof v === 'number' && v >= lo && v <= hi);
  if (!inRange(o.hr, 25, 240) || !inRange(o.spo2, 60, 100) || !inRange(o.temp, 30, 44)) return null;
  return o as unknown as SerialFrame;
}
