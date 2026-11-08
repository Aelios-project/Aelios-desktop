// Which alarms the left column shows, in what order, and how many.
import assert from "node:assert/strict";
import { test } from "node:test";
import { dayOf, editValue, soonAlarms } from "../client/alarms.mjs";

test("alarms: soonest first, and no more than the limit", () => {
  const list = [
    { id: "c", note: "later", next: "2026-11-09T10:00:00Z", when: "tomorrow" },
    { id: "a", note: "soon", next: "2026-11-08T13:00:00Z", when: "in an hour" },
    { id: "b", note: "middle", next: "2026-11-08T18:00:00Z", when: "tonight" },
  ];
  assert.deepEqual(soonAlarms(list, 2).map((a) => a.id), ["a", "b"]);
});

test("alarms: an alarm with no next time is left out, and an empty answer is fine", () => {
  assert.deepEqual(soonAlarms([{ id: "x", note: "gone", next: null }]), []);
  assert.deepEqual(soonAlarms(), []);
  assert.deepEqual(soonAlarms([{ id: "a", note: "", next: "2026-11-08T13:00:00Z" }]), [{ id: "a", note: "", when: "", edit: null, date: "", time: "", once: true }]);
});

test("alarms: a one-time alarm is a dot, a repeating one is not; the edit box starts from what can change", () => {
  const [once, daily, hourly] = soonAlarms([
    { id: "o", next: "2026-11-08T10:00:00Z", when: "一次", edit: "date", date: "2026-11-08", time: "10:00" },
    { id: "d", next: "2026-11-08T11:00:00Z", when: "每天 21:30", edit: "time", date: "2026-11-08", time: "21:30" },
    { id: "h", next: "2026-11-08T12:00:00Z", when: "every 3 hours", edit: null, date: "2026-11-08", time: "12:00" },
  ]);
  assert.deepEqual([once.once, daily.once, hourly.once], [true, false, false]);
  assert.equal(editValue(once), "2026-11-08 10:00");
  assert.equal(editValue(daily), "21:30");
});

test("alarms: the day reads today, tomorrow, a weekday this week, or a short date", () => {
  const now = new Date(2026, 10, 8, 9, 0);
  assert.equal(dayOf("2026-11-08", now).kind, "today");
  assert.equal(dayOf("2026-11-09", now).kind, "tomorrow");
  assert.deepEqual(dayOf("2026-11-11", now), { kind: "weekday", text: "Wed" });
  assert.deepEqual(dayOf("2026-12-01", now), { kind: "date", text: "12/1" });
  assert.equal(dayOf("", now).kind, "none");
});
