/**
 * Entidades y tipos de dominio para el Copiloto de Salud de Astronautas (Synera - Galley)
 */

export type EnvironmentType = 'ISS' | 'DeepSpaceTransit' | 'LunarBase' | 'MarsMission';

export type TrafficLightColor = 'GREEN' | 'YELLOW' | 'RED';

export type EscalationLevel = 1 | 2 | 3 | 4;

export interface VitalsReading {
  heartRateBpm: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  bodyTemperatureCelsius: number;
  glucoseMgDl?: number;
  sleepHours: number;
  moodScore: number; // 1-10
  mealIntakePercentage?: number; // 0-100% de la ingesta de menú
  exerciseMinutes?: number; // minutos de contramedida física
  radiationDoseRateUSvH?: number;
  cumulativeRadiationMSv?: number;
}

export interface DailyHealthRecord {
  id: string;
  astronautId: string;
  timestamp: string;
  vitals: VitalsReading;
  captureSource: 'web_serial_usb' | 'wearable_ble' | 'manual_entry' | 'simulator';
  environment: EnvironmentType;
}

export interface BaselineProfile {
  astronautId: string;
  calculatedAt: string;
  sampleCount: number;
  metrics: {
    [key in keyof VitalsReading]?: {
      mean: number;
      standardDeviation: number;
    };
  };
}

export interface HealthAlert {
  id: string;
  type: 'COMBINATION' | 'TREND' | 'THRESHOLD' | 'BASELINE_DEVIATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  triggerFactors: string[];
}

export interface SBARReport {
  situation: string;
  background: string;
  assessment: {
    trafficLightSummary: Record<string, TrafficLightColor>;
    activeAlerts: string[];
    clinicalInference: string;
  };
  recommendation: {
    immediateCrewActions: string[];
    flightSurgeonConsultRequest?: string;
  };
}

export interface EscalationStatus {
  level: EscalationLevel;
  title: string;
  recommendations: string[];
  explanation: string;
  activeAlerts: HealthAlert[];
  sbar?: SBARReport;
}
