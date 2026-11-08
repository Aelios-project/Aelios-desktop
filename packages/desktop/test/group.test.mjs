// Naming a line in a group, which lines draw, and the order of the group list.
import assert from "node:assert/strict";
import { test } from "node:test";
import { authorOf, groupList, groupRows } from "../client/group.mjs";

const names = { you: "You" };
const group = { members: [{ id: "ada", name: "Ada" }] };

test("group: a line is said by the member, the owner, or the group itself", () => {
  assert.equal(authorOf({ author: "ada" }, group, names), "Ada");
  assert.equal(authorOf({ author: "" }, group, names), "You");
  assert.equal(authorOf({ author: "you" }, group, names), "You");
  assert.equal(authorOf({ author: "ghost" }, group, names), "ghost");
});

test("group: notes are marked, and empty lines are dropped", () => {
  const rows = groupRows([{ seq: 1, author: "ada", text: "hi", kind: "say" }, { seq: 2, author: "", text: "a note", kind: "note" }, { seq: 3, author: "ada", text: "" }]);
  assert.deepEqual(rows.map((r) => [r.seq, r.note]), [[1, false], [2, true]]);
  assert.deepEqual(groupRows(), []);
});

test("group: a group still answering comes first, then the newest", () => {
  const list = [
    { id: "a", running: false, last: { at: "2026-11-02T10:00:00Z" } },
    { id: "b", running: true, last: { at: "2026-11-01T10:00:00Z" } },
    { id: "c", running: false, last: { at: "2026-11-03T10:00:00Z" } },
  ];
  assert.deepEqual(groupList(list).map((g) => g.id), ["b", "c", "a"]);
  assert.deepEqual(groupList(), []);
});
