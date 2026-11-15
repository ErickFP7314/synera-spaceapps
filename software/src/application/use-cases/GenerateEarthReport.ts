import type { DayEvaluation, EnvironmentId } from '../../domain/models/types.ts';
import type { EarthSyncPort } from '../ports/EarthSyncPort.ts';

/** Builds the contracts/earth-report.schema.json payload and queues it (store-and-forward). */
export class GenerateEarthReport {
  earthSyncPort: EarthSyncPort;

  constructor(earthSyncPort: EarthSyncPort) {
    this.earthSyncPort = earthSyncPort;
  }

  async execute(crewId: string, missionDay: number, environment: EnvironmentId, ev: DayEvaluation): Promise<string | null> {
    if (!ev.sbar) return null;
    const reportId = `REP-${crewId}-MD${missionDay}-${Date.now()}`;
    const report = {
      report_id: reportId,
      crew_id: crewId,
      mission_day: missionDay,
      generated_at: new Date().toISOString(),
      environment,
      escalation_level: ev.level,
      active_rules: ev.rules.map(r => r.id),
      zones: ev.zones,
      sbar: {
        situation: ev.sbar.situation,
        background: ev.sbar.background,
        assessment: ev.sbar.assessment,
        recommendation: ev.sbar.recommendation,
      },
      transmission: ev.sbar.transmission,
    };
    await this.earthSyncPort.enqueueReport({
      reportId,
      crewId,
      missionDay,
      payloadJson: JSON.stringify(report),
      priority: ev.level >= 4 ? 'CRITICAL' : ev.level === 3 ? 'ELEVATED' : 'ROUTINE',
    });
    return reportId;
  }
}
