import type { DailyRecord, DayEvaluation, EnvironmentId, IndicatorKey, RangesConfig } from '../../domain/models/types.ts';
import type { SensorInputPort } from '../ports/SensorInputPort.ts';
import { evaluateDay } from '../../domain/index.ts';
import { validateDailyRecord } from '../../infrastructure/validators/inputValidator.ts';

/** Stores today's record and evaluates it against the astronaut's own 14-day baseline. */
export class RecordDailyHealth {
  sensorPort: SensorInputPort;
  cfg: RangesConfig;

  constructor(sensorPort: SensorInputPort, cfg: RangesConfig) {
    this.sensorPort = sensorPort;
    this.cfg = cfg;
  }

  async execute(crewId: string, record: DailyRecord, usual: Partial<Record<IndicatorKey, number>>, environment: EnvironmentId): Promise<DayEvaluation> {
    const check = validateDailyRecord(record);
    if (!check.isValid) throw new Error(`Invalid record: ${check.errors.join('; ')}`);
    await this.sensorPort.ingest(crewId, record);
    const days = await this.sensorPort.getHistory(crewId, 15);
    return evaluateDay({ days, index: days.length - 1, usual, cfg: this.cfg, environment, crewId });
  }
}
