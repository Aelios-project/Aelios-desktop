// The left column's two groups: open threads above, the rest below, newest first, capped.
import assert from "node:assert/strict";
import { test } from "node:test";
import { railThreads } from "../client/rail-rows.mjs";

const at = (day) => `2026-11-0${day}T10:00:00Z`;

test("rail: working and waiting threads are open, done ones are recent", () => {
  const list = [
    { id: "a", status: "working", updatedAt: at(1), waiting: false },
    { id: "b", status: "done", updatedAt: at(2), waiting: false },
    { id: "c", status: "done", updatedAt: at(3), waiting: true },
    { id: "d", status: "sent", updatedAt: at(4), waiting: false },
  ];
  const { open, recent } = railThreads(list);
  assert.deepEqual(open.map((x) => x.id), ["d", "c", "a"]);
  assert.deepEqual(recent.map((x) => x.id), ["b"]);
});

test("rail: newest first inside each group, and the cap applies to each", () => {
  const list = Array.from({ length: 9 }, (_, i) => ({ id: `t${i}`, status: "done", updatedAt: `2026-11-01T0${i}:00:00Z` }));
  const { recent } = railThreads(list, 3);
  assert.deepEqual(recent.map((x) => x.id), ["t8", "t7", "t6"]);
});

test("rail: an empty or missing list is not an error", () => {
  assert.deepEqual(railThreads(), { open: [], recent: [] });
  assert.deepEqual(railThreads([]), { open: [], recent: [] });
});
