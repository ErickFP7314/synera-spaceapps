/**
 * Web Serial parser used by the app (software/app/serial.js) against the frozen contract.
 * Run: cd software && npm test
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
// @ts-ignore — plain JS browser module (no DOM needed for these functions)
import { parseFrame, summarize } from '../app/serial.js';

const root = new URL('../../', import.meta.url);
const schema = JSON.parse(readFileSync(new URL('contracts/telemetry-payload.schema.json', root), 'utf8')).definitions.SerialFrame;

test('valid firmware line parses; boot log, garbage and out-of-contract frames are dropped', () => {
  assert.deepEqual(parseFrame('{"t":12,"hr":61,"spo2":98,"temp":36.6,"q":1,"src":"sensor"}', schema), { t: 12, hr: 61, spo2: 98, temp: 36.6, q: 1, src: 'sensor' });
  assert.equal(parseFrame('ets Jun  8 2016 00:22:57', schema), null);
  assert.equal(parseFrame('{"t":1,"hr":', schema), null);
  assert.equal(parseFrame('{"t":1,"hr":300,"q":1}', schema), null);
  assert.equal(parseFrame('{"t":1,"q":1,"bp":120}', schema), null);
  assert.equal(parseFrame('{"hr":60,"q":1}', schema), null);
});

test('summary uses only good-signal frames (q=1) for pulse and SpO2', () => {
  const s = summarize([
    { t: 1, hr: 60, spo2: 97, q: 1 }, { t: 2, hr: 62, spo2: 98, temp: 36.5, q: 1 },
    { t: 3, q: 0 }, { t: 4, hr: 61, spo2: 98, q: 1, src: 'sim' }
  ]);
  assert.equal(s.n, 3);
  assert.equal(s.hr, 61);
  assert.equal(s.spo2, 98);
  assert.equal(s.temp, 36.5);
  assert.equal(s.src, 'sim');
});
