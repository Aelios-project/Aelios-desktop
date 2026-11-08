// Splitting the tasks a resident handed out, and the words for where one runs.
import assert from "node:assert/strict";
import { test } from "node:test";
import { runsText, splitTasks, stateWord } from "../client/board.mjs";

test("board: working tasks come first, then the rest, each newest first", () => {
  const tasks = [
    { id: "done-old", status: "done", updatedAt: "2026-11-01T10:00:00Z" },
    { id: "work-old", status: "working", updatedAt: "2026-11-02T10:00:00Z" },
    { id: "work-new", status: "sent", updatedAt: "2026-11-03T10:00:00Z" },
    { id: "done-new", status: "failed", updatedAt: "2026-11-04T10:00:00Z" },
  ];
  const { working, done } = splitTasks(tasks);
  assert.deepEqual(working.map((t) => t.id), ["work-new", "work-old"]);
  assert.deepEqual(done.map((t) => t.id), ["done-new", "done-old"]);
  assert.deepEqual(splitTasks(), { working: [], done: [] });
});

test("board: where a task runs, and how it stands", () => {
  assert.equal(runsText("linux"), "Runs on GitHub Actions");
  assert.equal(runsText("nothing"), "");
  assert.equal(stateWord("needs_you"), "Needs you");
  assert.equal(stateWord("working"), "Working");
  assert.equal(stateWord(""), "");
});
