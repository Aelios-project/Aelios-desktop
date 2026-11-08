import assert from "node:assert/strict";
import { test } from "node:test";
import { choose, loadThread, loadWaiting, markSeen, sayToThread, splitThreads, stateOf, stopThread } from "../client/threads-api.mjs";
import { PANEL_IDS, tabCounts } from "../client/panel-ids.mjs";
import { words } from "../client/strings.mjs";

// A fake fetch for the host route: it records each web call and answers with `reply`.
function fake(reply = {}) {
  const calls = [];
  const request = async (_route, init) => {
    const call = JSON.parse(init.body);
    calls.push({ path: call.path, method: call.method, body: call.body, resident: call.resident });
    return { ok: true, json: async () => ({ status: 200, data: reply }) };
  };
  return { calls, request };
}

test("threads: say and stop go to the thread routes with the thread id", async () => {
  const { calls, request } = fake({ id: "t1" });
  await sayToThread("default", "t1", "hello", {}, request);
  await sayToThread("default", "t1", "", { pictures: [{ data: "AA==" }], files: [{ name: "a.pdf", data: "AA==" }] }, request);
  await stopThread("default", "t1", request);
  assert.deepEqual(calls.map((c) => [c.method, c.path, c.body]), [
    ["POST", "/web/thread/say", { id: "t1", text: "hello" }],
    ["POST", "/web/thread/say", { id: "t1", text: "", pictures: [{ data: "AA==" }], files: [{ name: "a.pdf", data: "AA==" }] }],
    ["POST", "/web/thread/stop", { id: "t1" }],
  ]);
});

test("threads: the id is encoded in the path, and the resident is passed on", async () => {
  const { calls, request } = fake();
  await loadThread("ada", "a b&c", request);
  assert.equal(calls[0].path, "/web/thread?id=a%20b%26c");
  assert.equal(calls[0].resident, "ada");
});

test("waiting: list, read one, read all, and answer an option", async () => {
  const { calls, request } = fake({ items: [], open: 0 });
  await loadWaiting("default", request);
  await markSeen("default", "t1", request);
  await markSeen("default", undefined, request);
  await choose("default", "task1", "Yes", request);
  assert.deepEqual(calls.map((c) => [c.method, c.path, c.body]), [
    ["GET", "/web/waiting", undefined],
    ["POST", "/web/waiting/seen", { id: "t1" }],
    ["POST", "/web/waiting/seen", { all: true }],
    ["POST", "/web/task/choose", { id: "task1", text: "Yes" }],
  ]);
});

test("a task that waited and was dealt with is chosen or settled; open threads are split from done ones", () => {
  assert.equal(stateOf({ status: "needs_you", waiting: false, chosen: true }), "chosen");
  assert.equal(stateOf({ status: "needs_you", waiting: false }), "settled");
  assert.equal(stateOf({ status: "needs_you", waiting: true }), "needs_you");
  const { open, done } = splitThreads([{ id: 1, status: "working" }, { id: 2, status: "done" }, { id: 3, status: "done", waiting: true }]);
  assert.deepEqual([open.map((t) => t.id), done.map((t) => t.id)], [[1, 3], [2]]);
});

test("words: every panel has a name, both languages have the same keys, and English is the default", () => {
  const keys = (o) => Object.keys(o).sort().map((k) => (o[k] && typeof o[k] === "object" ? [k, keys(o[k])] : k));
  const en = words("en");
  const zh = words("zh");
  assert.deepEqual(keys(zh), keys(en));
  for (const id of PANEL_IDS) assert.ok(en.panels[id] && zh.panels[id]);
  const original = globalThis.navigator;
  Object.defineProperty(globalThis, "navigator", { value: { language: "zh-CN" }, configurable: true });
  assert.equal(words(), en, "a Chinese system still gets English until the reader picks 中文");
  Object.defineProperty(globalThis, "navigator", { value: original, configurable: true });
  assert.equal(words("xx"), en);
});

test("tabs: the waiting count is the accent badge; threads and alarms count plainly; zero is no badge", () => {
  const counts = tabCounts({ waiting: { items: [{ kind: "ask" }, { kind: "stuck" }] }, threads: { open: 1 }, alarms: { on: true, alarms: [{ next: "x" }, { next: null }, { next: "y" }] } });
  assert.deepEqual(counts, { waiting: { n: 2, hot: true }, threads: { n: 1, hot: false }, alarms: { n: 2, hot: false } });
  assert.deepEqual(tabCounts({ waiting: { items: [], unread: { a: 2, b: 1 } }, threads: { open: 1 } }).threads, { n: 3, hot: true }, "unread news comes before the plain count");
  assert.equal(tabCounts({ alarms: { on: false, alarms: [{ next: "x" }] } }).alarms.n, 0);
  assert.equal(tabCounts().waiting.n, 0);
  assert.deepEqual(PANEL_IDS, ["waiting", "threads", "alarms"]);
});

test("threads: a working thread on the machine shows its last step", async () => {
  const { stepNow } = await import("../client/panel-ids.mjs");
  assert.equal(stepNow({ steps: [{ kind: "read", title: "read a.js" }, { kind: "run", title: "ran npm test" }] }), "ran npm test");
  assert.equal(stepNow({}), "");
  assert.equal(stepNow({ steps: [] }), "");
});
