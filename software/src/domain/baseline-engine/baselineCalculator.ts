import type { Baseline, Baselines, DailyRecord, IndicatorKey, RangesConfig } from '../models/types.ts';

export function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/**
 * Personal baseline (contracts/medical-ranges-config.json -> baseline):
 *  - < min_days_for_robust days: registered "usual" value + sigma_floor (fixes the old z = 0 bug when sigma = 0)
 *  - otherwise: median and MAD of the last `window_days`, scale = max(1.4826 * MAD, sigma_floor)
 * `history` must NOT include the day being evaluated.
 */
export function computeBaselines(history: DailyRecord[], usual: Partial<Record<IndicatorKey, number>>, cfg: RangesConfig): Baselines {
  const out: Baselines = {};
  for (const [key, ind] of Object.entries(cfg.indicators)) {
    if (typeof ind.sigma_floor !== 'number') continue;
    const k = key as IndicatorKey;
    const lag = cfg.baseline.exclude_recent_days ?? 0;
    const eligible = history.length - lag >= cfg.baseline.min_days_for_robust ? history.slice(0, history.length - lag) : [];
    const values = eligible.slice(-cfg.baseline.window_days)
      .map(d => d[k])
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    let b: Baseline | undefined;
    if (values.length >= cfg.baseline.min_days_for_robust) {
      const center = median(values);
      const mad = median(values.map(v => Math.abs(v - center)));
      b = { center, scale: Math.max(1.4826 * mad, ind.sigma_floor), n: values.length, method: 'median+MAD' };
    } else if (typeof usual[k] === 'number') {
      b = { center: usual[k] as number, scale: ind.sigma_floor, n: values.length, method: 'usual+floor' };
    }
    if (b) out[k] = b;
  }
  return out;
}

export function robustZ(value: number, b: Baseline): number {
  return (value - b.center) / b.scale;
}

/** One-sided CUSUM on z-scores (Page 1954). Returns the last S value. */
export function cusum(zs: number[], k: number): number {
  let s = 0;
  for (const z of zs) s = Math.max(0, s + z - k);
  return s;
}
