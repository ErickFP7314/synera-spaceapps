/**
 * Galley v2 engine tests — run on the REAL repo data files:
 *   contracts/medical-ranges-config.json + data/synthetic/galley-14day-scenarios.json
 * Run: cd software && npm test
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { evaluateDay } from '../src/domain/index.ts';
import { computeBaselines, robustZ } from '../src/domain/baseline-engine/baselineCalculator.ts';
import { parseSerialLine, validateDailyRecord } from '../src/infrastructure/validators/inputValidator.ts';

const root = new URL('../../', import.meta.url);
const cfg = JSON.parse(readFileSync(new URL('contracts/medical-ranges-config.json', root), 'utf8'));
const ds = JSON.parse(readFileSync(new URL('data/synthetic/galley-14day-scenarios.json', root), 'utf8'));
const usual = ds.baseline_profile;
const run = (scenario: string, day: number, environment: 'ISS' | 'MOON' | 'MARS' = 'ISS') =>
  evaluateDay({ days: ds.scenarios[scenario].days, index: day - 1, usual, cfg, environment, crewId: 'CREW-A' });

test('baseline never has zero scale (old z = 0 bug)', () => {
  const b = computeBaselines([], { hr_rest_bpm: 62 }, cfg);
  assert.equal(b.hr_rest_bpm?.scale, cfg.indicators.hr_rest_bpm.sigma_floor);
  assert.ok(Math.abs(robustZ(46, b.hr_rest_bpm!)) >= 3);
});

test('nominal scenario never reaches flight-surgeon level', () => {
  for (let d = 1; d <= 14; d++) assert.ok(run('nominal', d).level <= 2, `day ${d}`);
});

test('bradycardia: 46 bpm is RED by personal baseline -> S-B-A-R', () => {
  const ev = run('bradycardia', 13);
  const hr = ev.indicators.find(i => i.key === 'hr_rest_bpm')!;
  assert.equal(hr.color, 'RED');
  assert.ok(ev.level >= 3);
  assert.ok(ev.rules.some(r => r.id === 'R7'));
  assert.equal(ev.zones.chest, 'RED');
});

test('Mars queues the S-B-A-R, ISS sends it now', () => {
  assert.equal(run('bradycardia', 13, 'MARS').sbar?.transmission.mode, 'QUEUED');
  assert.equal(run('bradycardia', 13, 'MARS').sbar?.transmission.eta_minutes, 44);
  assert.equal(run('bradycardia', 13, 'ISS').sbar?.transmission.mode, 'SENT_NOW');
});

test('fatigue scenario triggers R2 acute fatigue by day 14', () => {
  assert.ok(run('fatigue', 14).rules.some(r => r.id === 'R2'));
});

test('infection scenario triggers R4 and escalates to level >= 3', () => {
  const ev = run('infection', 14);
  assert.ok(ev.rules.some(r => r.id === 'R4'));
  assert.ok(ev.level >= 3);
});

test('solar storm scenario triggers R6 from the DONKI replay', () => {
  assert.ok(run('solar_storm', 12).rules.some(r => r.id === 'R6'));
  assert.ok(!run('solar_storm', 11).rules.some(r => r.id === 'R6'));
});

test('validator uses mood 1-5 and rejects impossible values', () => {
  assert.equal(validateDailyRecord({ mood_1_5: 8 }).isValid, false);
  assert.equal(validateDailyRecord({ skin_temp_c: 360 }).isValid, false);
  assert.equal(validateDailyRecord({ hr_rest_bpm: 62, mood_1_5: 4 }).isValid, true);
});

test('serial frame contract: valid line parses, garbage is rejected', () => {
  assert.deepEqual(parseSerialLine('{"t":1731600000,"hr":62,"spo2":97,"temp":36.6,"q":1}'), { t: 1731600000, hr: 62, spo2: 97, temp: 36.6, q: 1 });
  assert.equal(parseSerialLine('[SYNERA] boot'), null);
  assert.equal(parseSerialLine('{"t":1,"hr":900,"q":1}'), null);
});
