import type { TrafficLightColor } from '../models/types.ts';

export interface ThresholdRange {
  greenMin: number;
  greenMax: number;
  yellowLow: number;
  yellowHigh: number;
  redLow: number;
  redHigh: number;
}

export class TrafficLightEvaluator {
  public static evaluateValue(value: number, range: ThresholdRange, zScore?: number): TrafficLightColor {
    if (zScore !== undefined && Math.abs(zScore) >= 2.5) {
      return 'RED';
    }

    if (value < range.redLow || value > range.redHigh) {
      return 'RED';
    }
    if (value < range.greenMin || value > range.greenMax) {
      return 'YELLOW';
    }
    return 'GREEN';
  }
}
