import test from 'node:test';
import assert from 'node:assert/strict';
import { InputValidator } from '../src/infrastructure/validators/inputValidator.ts';
import { RulesEngine } from '../src/domain/anomaly-rules/rulesEngine.ts';
import { EscalationMatrix } from '../src/domain/escalation-matrix/escalationMatrix.ts';

test('InputValidator rechaza temperatura biológicamente imposible', () => {
  const result = InputValidator.validatePhysiologicalInput({ bodyTemperatureCelsius: 360.0 });
  assert.equal(result.isValid, false);
  assert.match(result.errors[0], /360/);
});

test('InputValidator aprueba valores normales de astronauta', () => {
  const result = InputValidator.validatePhysiologicalInput({
    heartRateBpm: 70,
    bloodPressureSystolic: 120,
    bloodPressureDiastolic: 80,
    bodyTemperatureCelsius: 36.6,
    glucoseMgDl: 95,
    sleepHours: 7.5,
    moodScore: 8
  });
  assert.equal(result.isValid, true);
  assert.equal(result.errors.length, 0);
});

test('RulesEngine detecta combinación de fatiga operativa', () => {
  const alerts = RulesEngine.evaluateCombinations({
    heartRateBpm: 88,
    bloodPressureSystolic: 120,
    bloodPressureDiastolic: 80,
    bodyTemperatureCelsius: 36.6,
    glucoseMgDl: 95,
    sleepHours: 5.2,
    moodScore: 4
  });

  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].id, 'ALERT-FATIGUE-01');
});

test('EscalationMatrix eleva a Nivel 3 ante alerta de combinación', () => {
  const status = EscalationMatrix.evaluate(
    {
      heartRate: 'YELLOW',
      bloodPressure: 'GREEN',
      temperature: 'GREEN',
      glucose: 'GREEN',
      sleep: 'YELLOW',
      mood: 'YELLOW'
    },
    [{
      id: 'ALERT-FATIGUE-01',
      type: 'COMBINATION',
      severity: 'MEDIUM',
      message: 'Alerta de fatiga',
      triggerFactors: ['sleep < 6']
    }]
  );

  assert.equal(status.level, 3);
  assert.match(status.title, /Nivel 3/);
});
