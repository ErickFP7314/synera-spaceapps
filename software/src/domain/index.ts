/**
 * Galley v2 — public domain API (pure: no DOM, no network, no storage).
 *   evaluateDay(...) -> colors per indicator, zone colors, rules R1-R7, escalation level, S-B-A-R
 * Inputs come from: contracts/medical-ranges-config.json (cfg) and a day series
 * (data/synthetic/galley-14day-scenarios.json, manual entries or summarized sensor frames).
 */
import type { Color, DailyRecord, DayEvaluation, EnvironmentId, IndicatorKey, RangesConfig, SBARReport, SpaceWeather, Zone } from './models/types.ts';
import { computeBaselines } from './baseline-engine/baselineCalculator.ts';
import { evaluateIndicator, worst } from './traffic-light/trafficLightEvaluator.ts';
import { evaluateRules } from './anomaly-rules/rulesEngine.ts';
import { escalationLevel } from './escalation-matrix/escalationMatrix.ts';
import { transmissionFor } from './environment-profiles/environmentProfiles.ts';

export const INDICATORS: IndicatorKey[] = ['hr_rest_bpm', 'spo2_pct', 'skin_temp_c', 'sleep_h', 'mood_1_5', 'pvt_lapses', 'intake_pct', 'exercise_pct'];

export interface EvaluateInput {
  days: DailyRecord[];
  index: number;
  usual: Partial<Record<IndicatorKey, number>>;
  cfg: RangesConfig;
  environment: EnvironmentId;
  crewId?: string;
  space?: SpaceWeather;
}

export function evaluateDay(input: EvaluateInput): DayEvaluation {
  const { days, index, usual, cfg, environment } = input;
  const today = days[index];
  const history = days.slice(0, index);
  const baselines = computeBaselines(history, usual, cfg);
  const indicators = INDICATORS.map(k => evaluateIndicator(k, today, history, baselines, cfg));

  const zones: Record<Zone, Color> = { head: 'GREEN', chest: 'GREEN', abdomen: 'GREEN', legs: 'GREEN' };
  for (const r of indicators) {
    const zone = cfg.indicators[r.key]?.zone;
    if (zone && r.color !== 'NONE') zones[zone] = worst(zones[zone], r.color);
  }

  const rules = evaluateRules(today, history, baselines, indicators, input.space);
  const level = escalationLevel(indicators, rules);
  const scored = indicators.filter(i => i.color !== 'NONE');
  const bodyCheckIndex = scored.length
    ? Math.round(100 * scored.reduce((s, i) => s + (i.color === 'GREEN' ? 1 : i.color === 'YELLOW' ? 0.5 : 0), 0) / scored.length)
    : 100;

  let sbar: SBARReport | undefined;
  if (level >= 3) {
    const worstInd = [...indicators].sort((a, b) => Math.abs(b.z ?? 0) - Math.abs(a.z ?? 0))[0];
    const bl = baselines[worstInd.key];
    sbar = {
      situation: `${input.crewId ?? 'CREW'} — ${worstInd.key}: ${worstInd.value} (usual ${bl ? bl.center.toFixed(1) : 'n/a'}). Level ${level}.`,
      background: `Personal baseline from ${history.length} previous days (${bl?.method ?? 'n/a'}). Environment: ${environment}.`,
      assessment: `Zones: ${Object.entries(zones).map(([z, c]) => `${z}=${c}`).join(', ')}. Rules: ${rules.map(r => r.id).join(', ') || 'none'}. Deterministic rules, not a diagnosis.`,
      recommendation: `Crew actions per rules ${rules.map(r => r.id).join(', ')}. Request flight surgeon review.`,
      transmission: transmissionFor(environment, level),
    };
  }
  return { day: today.day, indicators, zones, rules, level, bodyCheckIndex, sbar };
}
