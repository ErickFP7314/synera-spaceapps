import type { DailyRecord } from '../../domain/models/types.ts';

/** Input port: Web Serial adapter, simulator, dataset loader or manual entry all implement it. */
export interface SensorInputPort {
  ingest(crewId: string, record: DailyRecord): Promise<void>;
  getHistory(crewId: string, limit?: number): Promise<DailyRecord[]>;
}
