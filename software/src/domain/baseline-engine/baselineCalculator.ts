import type { VitalsReading, BaselineProfile } from '../models/types.ts';

export class BaselineCalculator {
  public static calculateZScore(value: number, mean: number, stdDev: number): number {
    if (stdDev === 0) return 0;
    return (value - mean) / stdDev;
  }

  public static computeProfile(astronautId: string, history: VitalsReading[]): BaselineProfile {
    const count = history.length;
    if (count === 0) {
      return {
        astronautId,
        calculatedAt: new Date().toISOString(),
        sampleCount: 0,
        metrics: {}
      };
    }

    const calcStats = (values: number[]) => {
      const mean = values.reduce((acc, val) => acc + val, 0) / values.length;
      const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
      return { mean, standardDeviation: Math.sqrt(variance) };
    };

    return {
      astronautId,
      calculatedAt: new Date().toISOString(),
      sampleCount: count,
      metrics: {
        heartRateBpm: calcStats(history.map(h => h.heartRateBpm)),
        bloodPressureSystolic: calcStats(history.map(h => h.bloodPressureSystolic)),
        bloodPressureDiastolic: calcStats(history.map(h => h.bloodPressureDiastolic)),
        bodyTemperatureCelsius: calcStats(history.map(h => h.bodyTemperatureCelsius)),
        glucoseMgDl: calcStats(history.map(h => h.glucoseMgDl)),
        sleepHours: calcStats(history.map(h => h.sleepHours)),
        moodScore: calcStats(history.map(h => h.moodScore))
      }
    };
  }
}
