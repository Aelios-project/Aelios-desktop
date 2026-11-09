// Stage time limits (src/stages.mjs), with fake timers, and end to end on the acpx engine.
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test, { mock } from "node:test";
import { STAGE_DEFAULTS, Stages, checkTimeouts, limitsOf, stageMessage } from "../src/stages.mjs";
import { readConfig } from "../src/state.mjs";
import { final, rig } from "./rig.mjs";

const clock = () => mock.timers.enable({ apis: ["setTimeout"] });
const make = limits => { const fired = []; return { fired, stages: new Stages({ ...STAGE_DEFAULTS, ...limits }, name => fired.push(name)) }; };

test("each stage fires once and names itself; a stage that ends clears its timer", () => {
  clock();
  try {
    for (const name of ["spawn", "initialize", "session", "firstUpdate", "turn"]) {
      const { fired, stages } = make({});
      stages.start(name);
      mock.timers.tick(STAGE_DEFAULTS[name] - 1);
      assert.deepEqual(fired, []);
      mock.timers.tick(1);
      assert.deepEqual(fired, [name]);
      assert.equal(stages.fired, name);
    }
    const { fired, stages } = make({});
    stages.start("session"); stages.stop("session");
    mock.timers.tick(STAGE_DEFAULTS.session * 2);
    assert.deepEqual(fired, []);
  } finally { mock.timers.reset(); }
});

test("a turn cap of 0 means no timer; the first stage to fire stops the others", () => {
  clock();
  try {
    const off = make({ turn: 0 });
    off.stages.start("turn");
    assert.equal(off.stages.running("turn"), false);
    const both = make({ firstUpdate: 100, turn: 200 });
    both.stages.start("firstUpdate"); both.stages.start("turn");
    mock.timers.tick(1000);
    assert.deepEqual(both.fired, ["firstUpdate"]);
  } finally { mock.timers.reset(); }
});

test("inactivity is off by default; when on it pauses for a running tool call and a held permission, and restarts after", () => {
  clock();
  try {
    const quiet = make({});
    quiet.stages.watch(); quiet.stages.update({ type: "text_delta" });
    mock.timers.tick(10 * 60_000);
    assert.deepEqual(quiet.fired, []);

    const { fired, stages } = make({ inactivity: 1000 });
    stages.watch();
    stages.update({ type: "tool_call", toolCallId: "t1", status: "in_progress" });
    mock.timers.tick(5000);
    assert.deepEqual(fired, [], "a tool call in progress is not a hang");
    stages.update({ type: "tool_call", toolCallId: "t1", status: "completed" });
    mock.timers.tick(999);
    stages.pause(); // a permission request waits for the owner
    mock.timers.tick(5000);
    assert.deepEqual(fired, []);
    stages.resume();
    mock.timers.tick(999);
    assert.deepEqual(fired, [], "restarted from zero after the answer");
    mock.timers.tick(1);
    assert.deepEqual(fired, ["inactivity"]);
  } finally { mock.timers.reset(); }
});

test("limits: defaults, then turnTimeoutMs / killAfterMs, then timeouts; bad timeouts are refused at config load", async () => {
  assert.deepEqual(limitsOf({}), STAGE_DEFAULTS);
  assert.equal(STAGE_DEFAULTS.inactivity, 0);
  assert.deepEqual([limitsOf({ turnTimeoutMs: 5, killAfterMs: 6 }).turn, limitsOf({ turnTimeoutMs: 5, killAfterMs: 6 }).cancel], [5, 6]);
  assert.equal(limitsOf({ turnTimeoutMs: 5, timeouts: { turn: 7 } }).turn, 7);
  assert.match(stageMessage("initialize", 60_000), /initialize in 60 s/);
  for (const bad of [[], { initialise: 1 }, { spawn: -1 }, { spawn: 1.5 }, { spawn: "10" }]) assert.throws(() => checkTimeouts(bad), /timeouts/);
  assert.doesNotThrow(() => checkTimeouts({ inactivity: 300_000, turn: 0 }));
  const dir = mkdtempSync(path.join(os.tmpdir(), "stages-config-"));
  try {
    const file = path.join(dir, "config.json");
    writeFileSync(file, JSON.stringify({ timeouts: { session: "soon" } }));
    await assert.rejects(readConfig(file), /timeouts\.session/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

const hung = (env, timeouts) => rig("kiro", { engine: "acpx", killAfterMs: 5000, timeouts, env: { ...env } });
const fixEnv = r => { r.config.env = { ...r.config.env, FAKE_STORE: r.store, FAKE_AGENTS: r.config.kiroAgentsDir }; };

for (const [stage, env] of [["initialize", { FAKE_HANG_INIT: "1" }], ["session", { FAKE_HANG_NEW: "1" }]]) {
  test(`end to end: a helper that never answers ${stage} ends the turn with the stage name, before any prompt`, async () => {
    const r = await hung(env, { [stage]: 300 });
    try {
      fixEnv(r);
      r.start();
      const started = Date.now();
      const done = await final(r, r.cloud.push({ text: "hello" }));
      assert.equal(done.status, "failed");
      assert.match(done.summary, new RegExp(`did not get past ${stage === "session" ? "opening the session" : "initialize"} in 300 ms`));
      assert.ok(Date.now() - started < 4000, "stopped by the stage limit, not the cancel limit");
      assert.equal(r.prompts().length, 0);
      const pid = r.log().find(e => e.event === "start").pid;
      await r.cloud.until(() => { try { process.kill(pid, 0); return false; } catch { return true; } }, "the helper process exits");
    } finally { await r.done(); }
  });
}

test("end to end: inactivity, when on, stops a silent turn and asks the owner; the prompt is not sent again", async () => {
  const r = await rig("kiro", { engine: "acpx", timeouts: { inactivity: 300 } });
  try {
    r.start();
    const done = await final(r, r.cloud.push({ text: "SLOW work" }));
    assert.equal(done.status, "needs_you");
    assert.match(done.summary, /the next update \(inactivity\)/);
    assert.equal(r.prompts().length, 1);
  } finally { await r.done(); }
});
