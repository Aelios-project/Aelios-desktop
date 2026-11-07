import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { ConnectError, connect, validate } from "../host/connect.mjs";
import { makeRoute } from "../host/route.mjs";
import { Supervisor } from "../host/supervisor.mjs";

const ENTRY = path.join(path.dirname(fileURLToPath(import.meta.url)), "fake-runner.mjs");
const good = { url: "https://res.example/", key: "secret-key", workspace: "/tmp/work" };

class MemoryStore {
  value = null;
  async get() { return this.value && structuredClone(this.value); }
  async set(v) { this.value = v; }
  async clear() { this.value = null; }
}

test("validate: defaults, address, helper, full permission", () => {
  const ok = validate(good);
  assert.deepEqual([ok.url, ok.plugin, ok.access], ["https://res.example", "dsh", "edit"]);
  assert.equal(validate({ ...good, url: "http://127.0.0.1:8787" }).url, "http://127.0.0.1:8787");
  assert.throws(() => validate({ ...good, url: "http://res.example" }), ConnectError);
  assert.throws(() => validate({ ...good, key: " " }), ConnectError);
  assert.throws(() => validate({ ...good, helper: "rm" }), ConnectError);
  assert.throws(() => validate({ ...good, workspace: "relative" }), ConnectError);
  assert.throws(() => validate({ ...good, access: "full" }), /confirmation/);
  assert.equal(validate({ ...good, access: "full", confirmFull: true }).access, "full");
});

test("connect: the key goes in the environment, never in the arguments, and the connection is saved", async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "ad-"));
  const log = path.join(dir, "log");
  const env = { FAKE_LOG: log, FAKE_PAIRED: "0", FAKE_MODE: "run" };
  const store = new MemoryStore();
  const supervisor = new Supervisor({ entry: ENTRY, node: process.execPath, env, killAfterMs: 2000 });
  try {
    await connect(good, { entry: ENTRY, node: process.execPath, env, store, supervisor });
    const calls = readFileSync(log, "utf8").trim().split("\n").map((l) => JSON.parse(l));
    const pair = calls.find((c) => c.command === "pair");
    assert.equal(pair.key, "secret-key");
    assert.ok(!JSON.stringify(pair.args).includes("secret-key"));
    assert.equal(store.value.key, "secret-key");
    await supervisor.stop();
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("connect: a failed pairing is a ConnectError with the runner's message, and nothing is saved", async () => {
  const env = { FAKE_PAIRED: "0", FAKE_PAIR_FAIL: "1" };
  const store = new MemoryStore();
  const supervisor = new Supervisor({ entry: ENTRY, node: process.execPath, env });
  await assert.rejects(connect(good, { entry: ENTRY, node: process.execPath, env, store, supervisor }), /did not accept the key/);
  assert.equal(store.value, null);
});

test("route: no answer holds the key, unknown actions and runner paths are refused", async () => {
  const store = new MemoryStore();
  store.value = { url: "https://res.example", key: "secret-key", resident: "default", plugin: "dsh" };
  const supervisor = new Supervisor({ entry: ENTRY, node: process.execPath });
  const route = makeRoute({ entry: ENTRY, node: process.execPath, store, supervisor });
  const post = (body) => route(new Request("http://x/api", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }));
  const status = await (await post({ action: "status" })).text();
  assert.ok(!status.includes("secret-key"));
  assert.equal((await post({ action: "nope" })).status, 400);
  assert.equal((await post({ action: "web", path: "/web/runner/code", method: "POST" })).status, 403);
  assert.equal((await route(new Request("http://x/api", { method: "POST", body: "{}" }))).status, 415);
});
