/**
 * Puerto de Sincronización y Enlace con Tierra (Store-and-Forward)
 * Maneja la cola persistente offline y el despacho al detectar ventana satelital
 */

export interface EarthReportPayload {
  reportId: string;
  astronautId: string;
  missionDay: number;
  payloadJson: string;
  priority: 'ROUTINE' | 'ELEVATED' | 'CRITICAL';
}

export interface EarthSyncPort {
  /**
   * Encola un reporte médico en el almacenamiento local persistente
   */
  enqueueReport(report: EarthReportPayload): Promise<void>;

  /**
   * Intenta sincronizar los reportes pendientes con el Control de Misión en Tierra
   */
  syncPendingReports(): Promise<{ syncedCount: number; remainingCount: number }>;
}
