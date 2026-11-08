// The resident's own alarms, as the left column shows them: the ones still to ring, soonest first. The resident
// answers /web/alarms with { on, limit, alarms: [{ id, note, next, when, ... }] } (src/alarms.ts).

/** The next few alarms, soonest first; an alarm without a next time is left out. */
export function soonAlarms(alarms = [], limit = 4) {
  return [...alarms]
    .filter((a) => a && a.next)
    .sort((a, b) => new Date(a.next) - new Date(b.next))
    .slice(0, limit)
    .map((a) => ({ id: a.id, note: a.note || "", when: a.when || "", edit: a.edit || null }));
}
