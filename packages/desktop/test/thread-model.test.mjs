// The thread detail's timeline: the same items for every helper, from a local session or from the cloud's lines.
import assert from "node:assert/strict";
import { test } from "node:test";
import { commandOf, countsOf, helperOf, timeline } from "../client/thread-model.mjs";

const session = { plugin: "kiro", cwd: "/work", turns: [{ kind: "job", text: "tidy the notes", at: 1, end: { status: "needs_you", summary: "Which title?", at: 9 }, items: [
  { type: "say", text: "Looking." },
  { type: "plan", steps: [{ text: "read", status: "completed" }, { text: "write", status: "in_progress" }] },
  { type: "tool", id: "c1", kind: "execute", title: "Run tests", input: '{"command":["npm","test"]}', status: "completed", paths: [], diffs: [] },
  { type: "tool", id: "c2", kind: "edit", title: "Edit", input: "", status: "completed", paths: ["/work/a.md"], diffs: [{ path: "/work/a.md", added: 3, removed: 1 }] },
  { type: "perm", id: "p_1", title: "Push", kind: "execute", paths: [], decided: null, by: "" },
] }] };
const cloud = { runs: "machine", tasks: [{ id: "k1", waiting: true, choices: ["Plain", "Number"] }], lines: [
  { id: "task_k1", role: "user", text: "tidy the notes" }, { id: "result_k1", role: "result", task: "k1", status: "needs_you", text: "Which title?", sessionUrl: "https://example.com/s" },
] };

test("thread: a local session becomes brief, its ACP items, and the result with the cloud's choices", () => {
  const items = timeline(cloud, session);
  assert.deepEqual(items.map((x) => x.type), ["brief", "say", "plan", "tool", "tool", "perm", "result"]);
  assert.deepEqual(items.at(-1).choices, ["Plain", "Number"]);
  assert.equal(items.at(-1).task, "k1");
  assert.equal(items.at(-1).sessionUrl, "https://example.com/s");
  assert.deepEqual(countsOf(session), { tools: 2, files: 1, commands: 1 });
  assert.equal(commandOf(items[3]), "npm test");
});

test("thread: without a local session the cloud's lines stand in, steps as tool calls", () => {
  const items = timeline({ lines: [{ id: "a", role: "user", text: "go", direct: true }, { id: "b", role: "thread", steps: ["read x"], text: "ok" }, { id: "c", role: "result", status: "done", text: "done" }] }, null);
  assert.deepEqual(items.map((x) => x.type), ["brief", "tool", "say", "result"]);
  assert.equal(items[0].who, "mine");
  assert.equal(items[1].title, "read x");
  assert.deepEqual(timeline(null, null), []);
});

test("thread: the card's helper is this machine's helper, the resident itself, or GitHub Actions", () => {
  const local = { sessions: [{ thread: "t1", plugin: "dsh" }], machine: { info: { plugin: "kiro" } } };
  assert.equal(helperOf({ id: "t1", runs: "machine" }, local), "dsh");
  assert.equal(helperOf({ id: "t2", runs: "machine" }, local), "kiro");
  assert.equal(helperOf({ id: "t3", runs: "machine" }, {}), "machine");
  assert.equal(helperOf({ id: "t4", runs: "local" }, local), "resident");
  assert.equal(helperOf({ id: "t5", runs: "linux" }, local), "actions");
});
