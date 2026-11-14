import type { DailyHealthRecord, EscalationStatus } from '../../domain/models/types.ts';
import type { SensorInputPort } from '../ports/SensorInputPort.ts';
import { RulesEngine } from '../../domain/anomaly-rules/rulesEngine.ts';
import { EscalationMatrix } from '../../domain/escalation-matrix/escalationMatrix.ts';
import { TrafficLightEvaluator } from '../../domain/traffic-light/trafficLightEvaluator.ts';

export class RecordDailyHealth {
  constructor(private sensorPort: SensorInputPort) {}

  public async execute(record: DailyHealthRecord): Promise<EscalationStatus> {
    await this.sensorPort.ingest(record);

    const history = await this.sensorPort.getHistory(record.astronautId, 14);
    const vitalsHistory = history.map(h => h.vitals);

    const combinationAlerts = RulesEngine.evaluateCombinations(record.vitals);
    const trendAlerts = RulesEngine.evaluateTrends(vitalsHistory);
    const allAlerts = [...combinationAlerts, ...trendAlerts];

    const trafficLights = {
      heartRate: TrafficLightEvaluator.evaluateValue(record.vitals.heartRateBpm, { greenMin: 50, greenMax: 90, yellowLow: 45, yellowHigh: 105, redLow: 40, redHigh: 120 }),
      bloodPressure: TrafficLightEvaluator.evaluateValue(record.vitals.bloodPressureSystolic, { greenMin: 95, greenMax: 130, yellowLow: 90, yellowHigh: 140, redLow: 85, redHigh: 160 }),
      temperature: TrafficLightEvaluator.evaluateValue(record.vitals.bodyTemperatureCelsius, { greenMin: 36.1, greenMax: 37.3, yellowLow: 35.8, yellowHigh: 37.8, redLow: 35.0, redHigh: 38.5 }),
      glucose: TrafficLightEvaluator.evaluateValue(record.vitals.glucoseMgDl, { greenMin: 70, greenMax: 140, yellowLow: 60, yellowHigh: 180, redLow: 50, redHigh: 250 }),
      sleep: TrafficLightEvaluator.evaluateValue(record.vitals.sleepHours, { greenMin: 7.0, greenMax: 9.5, yellowLow: 5.5, yellowHigh: 7.0, redLow: 0.0, redHigh: 5.5 }),
      mood: TrafficLightEvaluator.evaluateValue(record.vitals.moodScore, { greenMin: 7, greenMax: 10, yellowLow: 5, yellowHigh: 6, redLow: 1, redHigh: 4 })
    };

    return EscalationMatrix.evaluate(trafficLights, allAlerts);
  }
}
