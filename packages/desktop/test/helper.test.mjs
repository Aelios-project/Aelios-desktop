import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { switchHelper } from "../host/helper.mjs";
import { Supervisor } from "../host/supervisor.mjs";

const ENTRY = path.join(path.dirname(fileURLToPath(import.meta.url)), "fake-runner.mjs");
const saved = { url: "https://res.example", key: "secret-key", resident: "default", plugin: "dsh", access: "edit", workspace: "/tmp/work" };

function setup(extra = {}) {
  const dir = mkdtempSync(path.join(os.tmpdir(), "ad-"));
  const log = path.join(dir, "log");
  const env = { FAKE_LOG: log, FAKE_PAIRED: "1", FAKE_MODE: "run", ...extra };
  const store = { value: { ...saved }, async get() { return this.value && { ...this.value }; }, async set(v) { this.value = v; } };
  const supervisor = new Supervisor({ entry: ENTRY, node: process.execPath, env, killAfterMs: 2000 });
  const calls = () => readFileSync(log, "utf8").trim().split("\n").map((l) => JSON.parse(l));
  return { dir, env, store, supervisor, calls, deps: { entry: ENTRY, node: process.execPath, env, store, supervisor } };
}

test("helper: re-pairs with the saved settings and the new helper, then starts the runner", async () => {
  const s = setup();
  try {
    const kiro = path.join(s.dir, "kiro-cli");
    writeFileSync(kiro, "");
    s.store.value.resident = "ada";
    await switchHelper({ helper: "kiro" }, { ...s.deps, dirs: [s.dir] });
    const pair = s.calls().find((c) => c.command === "pair");
    assert.deepEqual(pair.args.slice(-2), ["--plugin", "kiro"]);
    assert.equal(pair.args[pair.args.indexOf("--resident") + 1], "ada", "the selected resident is paired again");
    assert.equal(s.store.value.resident, "ada");
    assert.ok(pair.args.includes("/tmp/work") && !JSON.stringify(pair.args).includes("secret-key"));
    assert.equal(s.store.value.plugin, "kiro");
    assert.ok(["starting", "running"].includes(s.supervisor.state));
    await s.supervisor.stop();
  } finally { rmSync(s.dir, { recursive: true, force: true }); }
});

test("helper: Kiro without kiro-cli on PATH is one line and changes nothing", async () => {
  const s = setup();
  try {
    await assert.rejects(switchHelper({ helper: "kiro" }, { ...s.deps, dirs: [s.dir] }), /kiro-cli was not found/);
    assert.equal(s.store.value.plugin, "dsh");
    assert.equal(s.supervisor.state, "unpaired");
  } finally { rmSync(s.dir, { recursive: true, force: true }); }
});

test("helper: a failed pairing keeps the old helper and says why", async () => {
  const s = setup({ FAKE_PAIR_FAIL: "1" });
  try {
    writeFileSync(path.join(s.dir, "kiro-cli"), "");
    await assert.rejects(switchHelper({ helper: "kiro" }, { ...s.deps, dirs: [s.dir] }), /did not accept the key/);
    assert.equal(s.store.value.plugin, "dsh");
    await s.supervisor.stop();
  } finally { rmSync(s.dir, { recursive: true, force: true }); }
});

test("helper: an unknown helper is refused", async () => {
  const s = setup();
  try { await assert.rejects(switchHelper({ helper: "rm" }, s.deps), /dsh or kiro/); } finally { rmSync(s.dir, { recursive: true, force: true }); }
});
