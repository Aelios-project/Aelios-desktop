import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { zstdCompressSync } from "node:zlib";
import { ensurePaired } from "../host/connect.mjs";
import { makeLocal } from "../host/local.mjs";
import { Supervisor } from "../host/supervisor.mjs";
import { sessionOf, summaryOf } from "../host/timeline.mjs";
import { events, findDir, groups } from "../host/transcript-dsh.mjs";
import { groups as kiroGroups } from "../host/transcript-kiro.mjs";

const ENTRY = path.join(path.dirname(fileURLToPath(import.meta.url)), "fake-runner.mjs");
const tmp = () => mkdtempSync(path.join(os.tmpdir(), "ad-local-"));
const ev = (type, time, data) => JSON.stringify({ type, time, data });

test("DSH: frames written one after another are all read, and tool calls pair with their results", () => {
  const dir = tmp();
  try {
    const file = path.join(dir, "ws", "session-abc", "session.v4.jsonl.zstd");
    mkdirSync(path.dirname(file), { recursive: true });
    const first = [ev("turn/start", 1, { turn: 1 }), ev("tool/call", 2, { turn: 1, callId: "c1", name: "bash", arguments: '{"command":"npm test"}' })].join("\n") + "\n";
    const second = [ev("tool/result", 3, { toolCallId: "c1", message: { content: [{ type: "text", text: "3 passing" }], isError: false } }),
      ev("assistant/message", 4, { turn: 1, message: { role: "assistant", content: [{ type: "text", text: "Done." }, { type: "reasoning", text: "hm" }] } }),
      ev("todo/write", 5, { todos: [{ content: "Run", status: "completed" }] })].join("\n") + "\n";
    writeFileSync(file, Buffer.concat([zstdCompressSync(first), zstdCompressSync(second)]));
    assert.equal(findDir("abc", dir), file);
    assert.equal(findDir("../x", dir), null);
    const [turn] = groups(events(file));
    assert.deepEqual(turn.map((x) => x.type), ["tool", "say", "thought", "plan"]);
    assert.deepEqual([turn[0].kind, turn[0].status, turn[0].output], ["execute", "completed", "3 passing"]);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("Kiro: prompts split the turns; tool uses take their results", () => {
  const list = [
    { kind: "Prompt", data: { content: [{ kind: "text", data: "go" }] } },
    { kind: "AssistantMessage", data: { content: [{ kind: "text", data: "Looking." }, { kind: "toolUse", data: { toolUseId: "u1", name: "fs_read", input: { path: "/w/a.js" } } }] } },
    { kind: "ToolResults", data: { content: [{ kind: "toolResult", data: { toolUseId: "u1", status: "success", content: [{ kind: "text", data: "code" }] } }] } },
    { kind: "Prompt", data: { content: [{ kind: "text", data: "again" }] } },
  ];
  const out = kiroGroups(list);
  assert.equal(out.length, 2);
  assert.deepEqual([out[0][1].kind, out[0][1].output, out[0][1].paths], ["read", "code", ["/w/a.js"]]);
});

const ov = {
  threads: { t1: { sessionId: "s", cwd: "/w", plugin: "kiro" } },
  turns: { t1: [{ workId: "w1", kind: "job", at: 100, text: "do it", end: { status: "needs_you", summary: "?", at: 300 } }] },
  perms: [{ id: "p_0123456789", thread: "t1", at: 200, title: "git push", kind: "execute", paths: [], decided: null, by: "" }],
};

test("timeline: items and permission requests share one clock; the list counts what waits", () => {
  const items = [{ type: "tool", id: "x", at: null, kind: "execute", status: "completed", diffs: [] }, { type: "say", at: null, text: "hi" }];
  const session = sessionOf(ov, "t1", [items]);
  assert.deepEqual(session.turns[0].items.map((x) => x.type), ["tool", "say", "perm"]);
  assert.equal(sessionOf(ov, "nope", []), null);
  const row = summaryOf(ov, "t1", session);
  assert.deepEqual([row.status, row.commands, row.pending], ["needs_you", 1, 1]);
});

test("open: only a path inside the workspace is opened", async () => {
  const dir = tmp();
  try {
    mkdirSync(path.join(dir, "sub"));
    const opened = [];
    const local = makeLocal({ entry: ENTRY, node: process.execPath, env: { FAKE_WORKSPACE: dir }, supervisor: {}, launch: (...args) => { opened.push(args[1][0]); return {}; } });
    await assert.rejects(local.open({ path: "../x" }), /outside the workspace|ENOENT/);
    await assert.rejects(local.open({ path: "/etc" }), /outside the workspace/);
    await local.open({ path: "sub" });
    await local.open({});
    assert.deepEqual(opened, [path.join(realpathSync(dir), "sub"), realpathSync(dir)]);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("permit: only a real request id reaches the runner", async () => {
  const local = makeLocal({ entry: ENTRY, node: process.execPath, supervisor: {} });
  await assert.rejects(local.permit({ id: "p_1; rm -rf", allow: true }), /not a permission request/);
});

test("start with a saved connection pairs an unpaired runner, then starts it; the key stays out of the arguments", async () => {
  const dir = tmp();
  const log = path.join(dir, "log");
  const env = { FAKE_LOG: log, FAKE_PAIRED: "0", FAKE_MODE: "run" };
  const store = { get: async () => ({ url: "https://res.example", key: "secret-key", workspace: "/tmp/w", access: "edit", plugin: "dsh" }) };
  const supervisor = new Supervisor({ entry: ENTRY, node: process.execPath, env, killAfterMs: 2000 });
  try {
    await ensurePaired({ entry: ENTRY, node: process.execPath, env, store, supervisor });
    for (let i = 0; i < 200 && supervisor.state !== "running"; i++) await new Promise((r) => setTimeout(r, 20));
    const calls = readFileSync(log, "utf8").trim().split("\n").map((l) => JSON.parse(l));
    const pair = calls.find((c) => c.command === "pair");
    assert.equal(pair.key, "secret-key");
    assert.ok(!JSON.stringify(pair.args).includes("secret-key"));
    assert.ok(calls.some((c) => c.command === "start"));
    await supervisor.stop();
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("a pairing error becomes the runner's one-line error and the runner is not started", async () => {
  const env = { FAKE_PAIRED: "0", FAKE_PAIR_FAIL: "1" };
  const store = { get: async () => ({ url: "https://res.example", key: "k", workspace: "/tmp/w", access: "edit", plugin: "dsh" }) };
  const supervisor = new Supervisor({ entry: ENTRY, node: process.execPath, env });
  await ensurePaired({ entry: ENTRY, node: process.execPath, env, store, supervisor });
  assert.deepEqual(supervisor.snapshot(), { state: "unpaired", error: "the resident did not accept the key" });
  assert.equal(supervisor.child, null);
});
