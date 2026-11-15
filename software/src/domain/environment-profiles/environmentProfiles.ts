import type { EnvironmentId, EscalationLevel } from '../models/types.ts';

/**
 * Behavior per environment. Full content (labels, radiation, sources) lives in
 * data/reference/environments.json — this module only holds the decision logic.
 */
export interface EnvironmentBehavior {
  id: EnvironmentId;
  earthReplyMinutes: number;
  autonomous: boolean;
}

export const ENVIRONMENTS: Record<EnvironmentId, EnvironmentBehavior> = {
  ISS: { id: 'ISS', earthReplyMinutes: 5, autonomous: false },
  MOON: { id: 'MOON', earthReplyMinutes: 5, autonomous: false },
  MARS: { id: 'MARS', earthReplyMinutes: 44, autonomous: true },
};

/** Level >= 3: ISS/Moon send the S-B-A-R now; Mars queues it and guides the crew on board. */
export function transmissionFor(env: EnvironmentId, level: EscalationLevel): { mode: 'SENT_NOW' | 'QUEUED'; eta_minutes: number } {
  const e = ENVIRONMENTS[env];
  if (level < 3) return { mode: 'QUEUED', eta_minutes: e.earthReplyMinutes };
  return e.autonomous ? { mode: 'QUEUED', eta_minutes: e.earthReplyMinutes } : { mode: 'SENT_NOW', eta_minutes: e.earthReplyMinutes };
}
