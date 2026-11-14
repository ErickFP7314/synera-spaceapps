import type { DailyHealthRecord } from '../../domain/models/types.ts';

export interface SensorInputPort {
  ingest(record: DailyHealthRecord): Promise<void>;
  getHistory(astronautId: string, limit?: number): Promise<DailyHealthRecord[]>;
}
