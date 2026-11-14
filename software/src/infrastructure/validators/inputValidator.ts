/**
 * Paso 1: Validador de Rangos Absurdos / Errores de Captura Manual
 * Evita contaminar la línea base con errores de tipeo (ej. escribir 360 en vez de 36.0 °C)
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class InputValidator {
  public static validatePhysiologicalInput(input: {
    heartRateBpm?: number;
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    bodyTemperatureCelsius?: number;
    glucoseMgDl?: number;
    sleepHours?: number;
    moodScore?: number;
  }): ValidationResult {
    const errors: string[] = [];

    if (input.bodyTemperatureCelsius !== undefined) {
      if (input.bodyTemperatureCelsius < 30.0 || input.bodyTemperatureCelsius > 44.0) {
        errors.push(`Temperatura corporal biológicamente implausible (${input.bodyTemperatureCelsius} °C). Rango admitido: 30.0 a 44.0 °C.`);
      }
    }

    if (input.heartRateBpm !== undefined) {
      if (input.heartRateBpm < 25 || input.heartRateBpm > 240) {
        errors.push(`Frecuencia cardíaca fuera de rango fisiológico humano (${input.heartRateBpm} lpm). Rango admitido: 25 a 240 lpm.`);
      }
    }

    if (input.bloodPressureSystolic !== undefined) {
      if (input.bloodPressureSystolic < 50 || input.bloodPressureSystolic > 260) {
        errors.push(`Presión sistólica fuera de rango (${input.bloodPressureSystolic} mmHg). Rango: 50 a 260 mmHg.`);
      }
    }

    if (input.bloodPressureDiastolic !== undefined) {
      if (input.bloodPressureDiastolic < 30 || input.bloodPressureDiastolic > 160) {
        errors.push(`Presión diastólica fuera de rango (${input.bloodPressureDiastolic} mmHg). Rango: 30 a 160 mmHg.`);
      }
      if (input.bloodPressureSystolic !== undefined && input.bloodPressureDiastolic >= input.bloodPressureSystolic) {
        errors.push(`Incongruencia hemodinámica: La presión diastólica (${input.bloodPressureDiastolic}) no puede superar o igualar a la sistólica (${input.bloodPressureSystolic}).`);
      }
    }

    if (input.glucoseMgDl !== undefined) {
      if (input.glucoseMgDl < 20 || input.glucoseMgDl > 600) {
        errors.push(`Glucosa fuera de límites compatibles con vida (${input.glucoseMgDl} mg/dL). Rango: 20 a 600 mg/dL.`);
      }
    }

    if (input.sleepHours !== undefined) {
      if (input.sleepHours < 0 || input.sleepHours > 24) {
        errors.push(`Horas de sueño inválidas (${input.sleepHours} h). Rango diario: 0 a 24 h.`);
      }
    }

    if (input.moodScore !== undefined) {
      if (input.moodScore < 1 || input.moodScore > 10) {
        errors.push(`Puntaje de ánimo inválido (${input.moodScore}). Escala requerida: 1 a 10.`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
