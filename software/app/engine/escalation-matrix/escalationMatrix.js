/**
 * 4 action levels (data/reference/rules.json -> escalation_levels):
 *  1 Self-care · 2 Tell the crew · 3 Flight surgeon · 4 Urgent
 * Colors: >= 2 YELLOW -> 2 · any RED -> 3 · >= 3 RED -> 4. Rules can raise the level.
 */
export function escalationLevel(indicators, rules) {
    const reds = indicators.filter(i => i.color === 'RED').length;
    const yellows = indicators.filter(i => i.color === 'YELLOW').length;
    let level = 1;
    if (yellows >= 2)
        level = 2;
    if (reds >= 1)
        level = 3;
    if (reds >= 3)
        level = 4;
    for (const r of rules)
        level = Math.max(level, r.level);
    return level;
}
