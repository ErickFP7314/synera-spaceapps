import type { EscalationStatus, DailyHealthRecord } from '../../domain/models/types.ts';
import type { EarthSyncPort } from '../ports/EarthSyncPort.ts';

export class GenerateEarthReport {
  constructor(private earthSyncPort: EarthSyncPort) {}

  public async execute(
    astronautId: string,
    missionDay: number,
    latestRecord: DailyHealthRecord,
    status: EscalationStatus
  ): Promise<string> {
    const reportId = `REP-${astronautId}-MD${missionDay}-${Date.now()}`;
    const priority = status.level >= 4 ? 'CRITICAL' : status.level === 3 ? 'ELEVATED' : 'ROUTINE';

    const reportContent = {
      report_id: reportId,
      astronaut_id: astronautId,
      mission_day: missionDay,
      generated_at: new Date().toISOString(),
      escalation_level: status.level,
      status_title: status.title,
      explanation_statement: status.explanation,
      active_alerts: status.activeAlerts,
      actionable_recommendations: status.recommendations,
      vitals_snapshot: latestRecord.vitals
    };

    await this.earthSyncPort.enqueueReport({
      reportId,
      astronautId,
      missionDay,
      payloadJson: JSON.stringify(reportContent, null, 2),
      priority
    });

    return reportId;
  }
}
