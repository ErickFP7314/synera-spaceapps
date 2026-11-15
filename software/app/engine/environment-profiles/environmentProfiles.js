export const ENVIRONMENTS = {
    ISS: { id: 'ISS', earthReplyMinutes: 5, autonomous: false },
    MOON: { id: 'MOON', earthReplyMinutes: 5, autonomous: false },
    MARS: { id: 'MARS', earthReplyMinutes: 44, autonomous: true },
};
/** Level >= 3: ISS/Moon send the S-B-A-R now; Mars queues it and guides the crew on board. */
export function transmissionFor(env, level) {
    const e = ENVIRONMENTS[env];
    if (level < 3)
        return { mode: 'QUEUED', eta_minutes: e.earthReplyMinutes };
    return e.autonomous ? { mode: 'QUEUED', eta_minutes: e.earthReplyMinutes } : { mode: 'SENT_NOW', eta_minutes: e.earthReplyMinutes };
}
