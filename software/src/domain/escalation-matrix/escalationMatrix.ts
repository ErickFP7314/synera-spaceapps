import type { EscalationStatus, EscalationLevel, HealthAlert, TrafficLightColor } from '../models/types.ts';

export class EscalationMatrix {
  public static evaluate(
    trafficLights: { [metric: string]: TrafficLightColor },
    alerts: HealthAlert[]
  ): EscalationStatus {
    const colors = Object.values(trafficLights);
    const redCount = colors.filter(c => c === 'RED').length;
    const yellowCount = colors.filter(c => c === 'YELLOW').length;
    const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH').length;
    const combinationAlerts = alerts.filter(a => a.type === 'COMBINATION').length;

    let level: EscalationLevel = 1;
    let title = 'Nivel 1: Autocuidado y Monitoreo Rutinario';
    let recommendations = [
      'Mantener protocolo estándar de hidratación y descanso programado.',
      'Repetir medición de confirmación en el siguiente ciclo diario.'
    ];
    let explanation = 'Todos los indicadores se encuentran dentro de límites nominales o con desviaciones mínimas autolimitadas.';

    if (redCount >= 2 || (redCount >= 1 && criticalAlerts > 0)) {
      level = 4;
      title = 'Nivel 4: Consulta Médica Urgente con Control de Misión';
      recommendations = [
        'Establecer enlace de audio/telemetría de prioridad con el Cirujano de Vuelo (Flight Surgeon).',
        'Notificar al Comandante de Misión para relevo inmediato de tareas críticas de EVA o pilotaje.',
        'Alistar equipo médico de soporte vital / botiquín de emergencia de abordo.'
      ];
      explanation = `Se han detectado múltiples parámetros en nivel CRÍTICO (${redCount} indicadores en ROJO) que comprometen la seguridad de la misión.`;
    } else if (redCount === 1 || combinationAlerts > 0 || criticalAlerts > 0) {
      level = 3;
      title = 'Nivel 3: Consultar a Médicos de Vuelo (Transmitir Parte a Tierra)';
      recommendations = [
        'Generar y transmitir el "Parte para Tierra" en la próxima ventana de enlace.',
        'Restringir actividades físicas extenuantes hasta recibir retroalimentación médica.',
        'Revisar inventario de contramedidas farmacológicas y soporte ergogénico.'
      ];
      explanation = `Presencia de un indicador en ROJO o alertas multivariables activas (${alerts.map(a => a.id).join(', ')}).`;
    } else if (yellowCount >= 2 || alerts.some(a => a.type === 'TREND')) {
      level = 2;
      title = 'Nivel 2: Avisar a la Tripulación y Seguimiento Compartido';
      recommendations = [
        'Informar a un compañero de tripulación para supervisión cruzada.',
        'Revisar botiquín a bordo y verificar suministros de rehidratación.',
        'Aumentar descanso pasivo y reducir carga cognitiva en las próximas 12 horas.'
      ];
      explanation = `Múltiples advertencias moderadas (${yellowCount} indicadores en AMARILLO o tendencia negativa detectada).`;
    }

    return {
      level,
      title,
      recommendations,
      explanation,
      activeAlerts: alerts
    };
  }
}
