// Which alarms the left column shows, in what order, and how many.
import assert from "node:assert/strict";
import { test } from "node:test";
import { soonAlarms } from "../client/alarms.mjs";

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
  assert.deepEqual(soonAlarms([{ id: "a", note: "", next: "2026-11-08T13:00:00Z" }]), [{ id: "a", note: "", when: "" }]);
});
