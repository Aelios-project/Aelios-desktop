// The resident's own alarms, as the Alarms panel shows them: soonest first, each with its day and time and whether
// it rings once (a dot) or repeats (a loop icon). The resident answers /web/alarms with
// { on, limit, alarms: [{ id, note, next, when, date, time, edit }] } (src/alarms.ts): `when` is the repeat in the
// resident's own words, `edit` is "date" for a one-time alarm, "time" for a daily or weekly one, null otherwise.

/** The next alarms, soonest first; an alarm without a next time is left out. */
export function soonAlarms(alarms = [], limit = 4) {
  return [...alarms]
    .filter((a) => a && a.next)
    .sort((a, b) => new Date(a.next) - new Date(b.next))
    .slice(0, limit)
    .map((a) => ({
      id: a.id, note: a.note || "", when: a.when || "", edit: a.edit || null, date: a.date || "", time: a.time || "",
      once: a.edit === "date" || (!a.edit && (!a.when || a.when === "一次")),
    }));
}

/** Which day a `YYYY-MM-DD` is, seen from `now`: today, tomorrow, a weekday this week, or a short date. */
export function dayOf(date, now = new Date()) {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date || "");
  if (!d) return { kind: "none", text: "" };
  const that = new Date(Number(d[1]), Number(d[2]) - 1, Number(d[3]));
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((that - today) / 864e5);
  if (days === 0) return { kind: "today", text: "" };
  if (days === 1) return { kind: "tomorrow", text: "" };
  if (days > 1 && days < 7) return { kind: "weekday", text: that.toLocaleDateString("en", { weekday: "short" }) };
  return { kind: "date", text: `${Number(d[2])}/${Number(d[3])}` };
}

/** What the edit box starts with: the whole date for a one-time alarm, the time of day for a repeating one. */
export const editValue = (alarm) => (alarm.edit === "date" ? `${alarm.date} ${alarm.time}`.trim() : alarm.time);
