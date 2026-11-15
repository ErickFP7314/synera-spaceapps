import type { Baselines, Color, DailyRecord, IndicatorKey, IndicatorResult, RangesConfig } from '../models/types.ts';
import { robustZ } from '../baseline-engine/baselineCalculator.ts';

const RANK: Record<Color, number> = { NONE: -1, GREEN: 0, YELLOW: 1, RED: 2 };
export const worst = (a: Color, b: Color): Color => (RANK[b] > RANK[a] ? b : a);

/** Last n values of `key` (today included) all satisfy `pred`. */
function lastN(history: DailyRecord[], today: DailyRecord, key: IndicatorKey, n: number, pred: (v: number) => boolean): boolean {
  const seq = [...history, today].slice(-n).map(d => d[key]);
  return seq.length === n && seq.every(v => typeof v === 'number' && pred(v));
}

/**
 * Color of one indicator: personal-baseline deviation, then absolute safety limits,
 * then consecutive-day rules — all read from contracts/medical-ranges-config.json.
 */
export function evaluateIndicator(key: IndicatorKey, today: DailyRecord, history: DailyRecord[], baselines: Baselines, cfg: RangesConfig): IndicatorResult {
  const ind = cfg.indicators[key];
  const value = today[key] as number | undefined;
  const res: IndicatorResult = { key, value, color: 'NONE', z: null, reasons: [] };
  if (!ind || ind.alerts_enabled === false || typeof value !== 'number') return res;
  res.color = 'GREEN';
  const b = baselines[key];
  const raise = (c: Color, why: string) => { if (RANK[c] > RANK[res.color]) res.color = c; if (c !== 'GREEN') res.reasons.push(why); };

  if (b) {
    const z = robustZ(value, b);
    res.z = Math.round(z * 100) / 100;
    const delta = value - b.center;
    if (ind.delta_from_baseline) {
      const { yellow, red } = ind.delta_from_baseline;
      const beyond = (lim: number | undefined) => lim !== undefined && (lim >= 0 ? delta >= lim : delta <= lim);
      if (beyond(red)) raise('RED', `${delta.toFixed(2)} ${ind.unit} vs your baseline (red limit ${red})`);
      else if (beyond(yellow)) raise('YELLOW', `${delta.toFixed(2)} ${ind.unit} vs your baseline (yellow limit ${yellow})`);
    } else if (ind.use_z !== false) {
      const zDir = ind.direction === 'low' ? -z : ind.direction === 'high' ? z : Math.abs(z);
      if (zDir >= cfg.baseline.z_red) raise('RED', `z=${res.z} from your baseline`);
      else if (zDir >= cfg.baseline.z_yellow) raise('YELLOW', `z=${res.z} from your baseline`);
    }
  }

  const a = ind.absolute ?? {};
  if (a.red_low !== undefined && value < a.red_low) raise('RED', `below safety limit ${a.red_low}`);
  if (a.red_high !== undefined && value >= a.red_high) raise('RED', `at/above safety limit ${a.red_high}`);
  if (a.yellow_low !== undefined && value < a.yellow_low) raise('YELLOW', `below ${a.yellow_low}`);
  if (a.yellow_high !== undefined && value > a.yellow_high) raise('YELLOW', `above ${a.yellow_high}`);

  const c = ind.consecutive_rule ?? {};
  if (c.red_if_nights_below !== undefined && lastN(history, today, key, c.nights, v => v < c.red_if_nights_below))
    raise('RED', `${c.nights} nights below ${c.red_if_nights_below} ${ind.unit}`);
  if (c.red_if_below !== undefined && lastN(history, today, key, c.days, v => v < c.red_if_below))
    raise('RED', `${c.days} days below ${c.red_if_below} ${ind.unit}`);
  if (c.red_if_value_at_or_below !== undefined && lastN(history, today, key, c.days, v => v <= c.red_if_value_at_or_below))
    raise('RED', `${c.days} days at or below ${c.red_if_value_at_or_below}`);
  return res;
}
