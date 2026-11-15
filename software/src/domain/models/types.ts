/**
 * Galley v2 — domain types.
 * Indicator keys are IDENTICAL to the data files and contracts:
 *   contracts/medical-ranges-config.json, data/synthetic/galley-14day-scenarios.json
 * Only erasable TypeScript syntax is used (runs with `node --experimental-strip-types`).
 */

export type EnvironmentId = 'ISS' | 'MOON' | 'MARS';
export type Color = 'GREEN' | 'YELLOW' | 'RED' | 'NONE';
export type EscalationLevel = 1 | 2 | 3 | 4;
export type Zone = 'head' | 'chest' | 'abdomen' | 'legs';

export type IndicatorKey =
  | 'hr_rest_bpm' | 'spo2_pct' | 'skin_temp_c' | 'sleep_h' | 'mood_1_5'
  | 'pvt_lapses' | 'intake_pct' | 'exercise_pct' | 'glucose_mg_dl';

/** One day of data (dataset row, manual entry, or daily summary of sensor frames). */
export interface DailyRecord {
  day: number;
  hr_rest_bpm?: number;
  spo2_pct?: number;
  skin_temp_c?: number;
  sleep_h?: number;
  mood_1_5?: number;
  pvt_lapses?: number;
  intake_pct?: number;
  exercise_pct?: number;
  exercise_min?: number;
  glucose_mg_dl?: number;
  radiation_mgy_day?: number;
  sep_active?: boolean;
}

/** Hardware -> Software serial frame (contracts/telemetry-payload.schema.json#/definitions/SerialFrame). */
export interface SerialFrame {
  t: number;
  hr?: number;
  spo2?: number;
  temp?: number;
  q: 0 | 1;
  src?: 'sensor' | 'sim';
}

export interface IndicatorConfig {
  label: { en: string; es: string };
  unit: string;
  zone: Zone;
  ridge: string[];
  direction: 'low' | 'high' | 'both';
  sigma_floor: number;
  use_z?: boolean;
  optional?: boolean;
  alerts_enabled?: boolean;
  absolute?: { yellow_low?: number; yellow_high?: number; red_low?: number; red_high?: number };
  delta_from_baseline?: { yellow?: number; red?: number };
  consecutive_rule?: Record<string, number>;
  hrp_risk?: { name: string; url: string };
  sources?: string[];
}

export interface RangesConfig {
  version: string;
  baseline: { min_days_for_robust: number; window_days: number; exclude_recent_days?: number; z_yellow: number; z_red: number; trend: { k: number; h: number } };
  indicators: Record<string, IndicatorConfig>;
}

export interface Baseline {
  center: number;
  scale: number;
  n: number;
  method: 'usual+floor' | 'median+MAD';
}

export type Baselines = Partial<Record<IndicatorKey, Baseline>>;

export interface IndicatorResult {
  key: IndicatorKey;
  value: number | undefined;
  color: Color;
  z: number | null;
  reasons: string[];
}

export interface RuleHit {
  id: 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6' | 'R7';
  level: EscalationLevel;
  why: string;
}

export interface SpaceWeather {
  sepActive: boolean;
  protonFluxPfu?: number;
  source: string;
}

export interface SBARReport {
  situation: string;
  background: string;
  assessment: string;
  recommendation: string;
  transmission: { mode: 'SENT_NOW' | 'QUEUED'; eta_minutes: number };
}

export interface DayEvaluation {
  day: number;
  indicators: IndicatorResult[];
  zones: Record<Zone, Color>;
  rules: RuleHit[];
  level: EscalationLevel;
  bodyCheckIndex: number;
  sbar?: SBARReport;
}
