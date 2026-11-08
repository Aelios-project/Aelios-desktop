// The progress lines of a working thread: what they say, what they never say, and that they reach the resident.
// Run: node --test --test-concurrency=1 test/steps.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { Progress, StepLog } from "../src/steps.mjs";
import { final, rig } from "./rig.mjs";

const log = () => new StepLog({ cwd: "/w", redact: text => text.split("/w").join("[workspace]") });

test("steps: a kind and a short title; edits in a row are one step; secrets and contents stay out", () => {
  const steps = log();
  steps.add({ kind: "read", title: "Read file", locations: [{ path: "/w/src/parser.js" }], rawInput: { content: "FILE BODY" } });
  assert.deepEqual(steps.add({ kind: "execute", title: "Run", rawInput: { command: "npm test --token=abc123456789", stdin: "FILE BODY" } }).at(-1), { kind: "run", title: "ran npm test --token=[hidden]" });
  steps.add({ kind: "edit", locations: [{ path: "/w/a.js" }], rawInput: { new_string: "FILE BODY" } });
  assert.equal(steps.add({ kind: "edit", locations: [{ path: "/w/b.js" }] }).at(-1).title, "edited 2 files");
  assert.equal(steps.add({ kind: "edit", locations: [{ path: "/w/b.js" }] }), null, "nothing new");
  assert.equal(steps.steps.length, 3);
  assert.ok(!JSON.stringify(steps.steps).includes("FILE BODY") && !JSON.stringify(steps.steps).includes("abc123456789"));
  assert.equal(steps.steps[0].title, "read src/parser.js");
  assert.equal(log().add({ kind: "execute", rawInput: { command: "x".repeat(500) } }).at(-1).title.length, 80);
});

test("steps: only the last ten are kept", () => {
  const steps = log();
  for (let n = 0; n < 15; n++) steps.add({ kind: "search", title: `look ${n}` });
  assert.equal(steps.steps.length, 10);
  assert.equal(steps.steps.at(-1).title, "searched look 14");
});

test("progress: at most one send per interval, the newest list wins, nothing after close", async () => {
  const sent = [];
  const progress = new Progress({ send: async steps => { sent.push(steps); }, ms: 40 });
  progress.push([1]); progress.push([2]); progress.push([3]);
  await new Promise(resolve => setTimeout(resolve, 15));
  assert.deepEqual(sent, [[3]]);
  progress.push([4]);
  progress.close();
  await new Promise(resolve => setTimeout(resolve, 80));
  assert.deepEqual(sent, [[3]]);
});

test("a working thread's steps reach the resident, without the token, contents or secrets", async () => {
  const r = await rig("kiro", { progressMs: 20 });
  try {
    r.start();
    const work = r.cloud.push({ kind: "job", text: "STEPSME go" });
    assert.equal((await final(r, work)).status, "done");
    await r.cloud.until(() => r.cloud.progresses?.length, "a progress");
    const last = r.cloud.progresses.at(-1);
    assert.deepEqual(Object.keys(last).sort(), ["steps", "token", "workId"]);
    assert.equal(last.workId, work.workId);
    assert.ok(last.steps.length >= 1 && last.steps.every(step => Object.keys(step).sort().join() === "kind,title" && step.title.length <= 80));
    const all = JSON.stringify(r.cloud.progresses.map(item => item.steps));
    assert.ok(!all.includes("FILE BODY") && !all.includes("abc123456789"));
  } finally { await r.done(); }
});
