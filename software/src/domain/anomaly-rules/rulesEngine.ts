import type { Baselines, DailyRecord, IndicatorResult, RuleHit, SpaceWeather } from '../models/types.ts';

/**
 * Rules R1-R7 exactly as written in data/reference/rules.json (texts/advice live there).
 * `history` = previous days (oldest first), `today` = day being evaluated.
 */
export function evaluateRules(
  today: DailyRecord,
  history: DailyRecord[],
  b: Baselines,
  colors: IndicatorResult[],
  space: SpaceWeather = { sepActive: false, source: 'none' }
): RuleHit[] {
  const hits: RuleHit[] = [];
  const days = [...history, today];
  const prev = (n: number) => days[days.length - 1 - n];
  const val = (d: DailyRecord | undefined, k: keyof DailyRecord) => (d ? (d[k] as number | undefined) : undefined);
  const base = (k: keyof Baselines) => b[k];
  const hrHigh = (d?: DailyRecord) => {
    const hr = val(d, 'hr_rest_bpm'), bl = base('hr_rest_bpm');
    return hr !== undefined && !!bl && hr >= bl.center + 2 * bl.scale;
  };

  // R1 — short sleep (tip)
  const sl = today.sleep_h, bSl = base('sleep_h');
  if (sl !== undefined && (sl < 7 || (bSl && sl < bSl.center - 1))) hits.push({ id: 'R1', level: 1, why: `sleep ${sl} h` });

  // R2 — acute fatigue (level 3 if the condition also held the previous 2 days = 48 h)
  const fatigue = (d?: DailyRecord, dPrev?: DailyRecord) => {
    if (!d) return false;
    const s = val(d, 'sleep_h'), sp = val(dPrev, 'sleep_h');
    const shortSleep = (s !== undefined && s < 6) ||
      (!!bSl && s !== undefined && sp !== undefined && s < bSl.center - 1.5 && sp < bSl.center - 1.5);
    const pvt = val(d, 'pvt_lapses'), bP = base('pvt_lapses'), mood = val(d, 'mood_1_5');
    const cognitive = (pvt !== undefined && !!bP && pvt >= bP.center + 3) || (mood !== undefined && mood <= 2);
    return shortSleep && cognitive && hrHigh(d);
  };
  if (fatigue(today, prev(1))) {
    const persists = fatigue(prev(1), prev(2)) && fatigue(prev(2), prev(3));
    hits.push({ id: 'R2', level: persists ? 3 : 2, why: persists ? 'fatigue pattern for 48 h' : 'short sleep + cognitive/mood drop + HR above baseline' });
  }

  // R3 — under-eating: intake < 80% for >= 2 consecutive days (+1 level if R2)
  const lowIntake = (d?: DailyRecord) => { const v = val(d, 'intake_pct'); return v !== undefined && v < 80; };
  if (lowIntake(today) && lowIntake(prev(1))) {
    const withFatigue = hits.some(h => h.id === 'R2');
    hits.push({ id: 'R3', level: withFatigue ? 3 : 2, why: 'intake < 80% for 2 days' + (withFatigue ? ' with fatigue' : '') });
  }

  // R4 — early infection: resting HR >= baseline + 2 sigma for 2 days AND skin temp >= baseline + 0.5 °C
  //      (a sleep drop is reported as supporting evidence only, so pure fatigue does not look like infection)
  const bT = base('skin_temp_c');
  const dT = today.skin_temp_c !== undefined && bT ? today.skin_temp_c - bT.center : 0;
  const sleepDrop = sl !== undefined && !!bSl && sl <= bSl.center - 1;
  if (hrHigh(today) && hrHigh(prev(1)) && dT >= 0.5) {
    hits.push({ id: 'R4', level: dT >= 1.0 ? 3 : 2, why: `resting HR up 2 days, temperature +${dT.toFixed(2)} °C${sleepDrop ? ', sleep down' : ''}` });
  }

  // R5 — deconditioning: exercise < 50% for 3 days
  const lowEx = (d?: DailyRecord) => { const v = val(d, 'exercise_pct'); return v !== undefined && v < 50; };
  if (lowEx(today) && lowEx(prev(1)) && lowEx(prev(2))) hits.push({ id: 'R5', level: 2, why: 'exercise < 50% for 3 days' });

  // R6 — solar radiation storm (DONKI SEP or GOES >= 10 pfu; >= 1000 pfu = S3 -> level 4)
  const pfu = space.protonFluxPfu ?? 0;
  if (space.sepActive || today.sep_active || pfu >= 10) {
    hits.push({ id: 'R6', level: pfu >= 1000 ? 4 : 2, why: `solar particle event (${space.source}${pfu ? `, ${pfu} pfu` : ''})` });
  }

  // R7 — S-B-A-R escalation: any RED or >= 2 rules of level >= 2
  const anyRed = colors.some(c => c.color === 'RED');
  const serious = hits.filter(h => h.level >= 2).length;
  if (anyRed || serious >= 2) hits.push({ id: 'R7', level: 3, why: anyRed ? 'RED indicator' : `${serious} active rules` });

  return hits;
}
