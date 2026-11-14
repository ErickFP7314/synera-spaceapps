import type { VitalsReading, HealthAlert } from '../models/types.ts';

export class RulesEngine {
  public static evaluateCombinations(current: VitalsReading): HealthAlert[] {
    const alerts: HealthAlert[] = [];

    if (current.sleepHours < 6.0 && current.heartRateBpm > 85 && current.moodScore <= 5) {
      alerts.push({
        id: 'ALERT-FATIGUE-01',
        type: 'COMBINATION',
        severity: 'MEDIUM',
        message: 'Alerta de Fatiga Operacional: Horas de sueño reducidas combinadas con taquicardia compensatoria y decremento anímico.',
        triggerFactors: ['sleepHours < 6.0', 'heartRateBpm > 85', 'moodScore <= 5']
      });
    }

    if (current.bloodPressureSystolic > 135 && current.heartRateBpm > 95 && current.moodScore <= 4) {
      alerts.push({
        id: 'ALERT-STRESS-CARDIO-02',
        type: 'COMBINATION',
        severity: 'HIGH',
        message: 'Sobrecarga Cardiovascular por Estrés: Elevación concomitante de presión y pulso con reporte de estrés agudo.',
        triggerFactors: ['bloodPressureSystolic > 135', 'heartRateBpm > 95', 'moodScore <= 4']
      });
    }

    if (current.bodyTemperatureCelsius > 37.6 && current.heartRateBpm > 90) {
      alerts.push({
        id: 'ALERT-FEVER-03',
        type: 'COMBINATION',
        severity: 'HIGH',
        message: 'Respuesta Inflamatoria / Febril Temprana: Termometría en ascenso correlacionada con taquicardia sinusal.',
        triggerFactors: ['bodyTemperatureCelsius > 37.6', 'heartRateBpm > 90']
      });
    }

    return alerts;
  }

  public static evaluateTrends(history: VitalsReading[]): HealthAlert[] {
    const alerts: HealthAlert[] = [];
    if (history.length < 3) return alerts;

    const recent = history.slice(-3);
    const sleepDecreasing = recent[0].sleepHours > recent[1].sleepHours && recent[1].sleepHours > recent[2].sleepHours;
    
    if (sleepDecreasing) {
      alerts.push({
        id: 'ALERT-TREND-SLEEP-01',
        type: 'TREND',
        severity: 'MEDIUM',
        message: 'Tendencia Degenerativa de Sueño: Caída consecutiva en las horas de descanso durante las últimas 72 horas.',
        triggerFactors: ['sleepHours trend slope < 0 for 3 consecutive cycles']
      });
    }

    return alerts;
  }
}
