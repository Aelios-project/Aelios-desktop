import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { switchAccess } from "../host/access.mjs";
import { ConnectError, connect, validate } from "../host/connect.mjs";
import { makeRoute } from "../host/route.mjs";
import { Supervisor } from "../host/supervisor.mjs";

const ENTRY = path.join(path.dirname(fileURLToPath(import.meta.url)), "fake-runner.mjs");
const saved = { url: "https://res.example", key: "secret-key", resident: "ada", plugin: "kiro", access: "edit", workspace: "/tmp/work" };

function setup(extra = {}) {
  const dir = mkdtempSync(path.join(os.tmpdir(), "ad-"));
  const log = path.join(dir, "log");
  const env = { FAKE_LOG: log, FAKE_PAIRED: "1", FAKE_MODE: "run", ...extra };
  const store = { value: { ...saved }, async get() { return this.value && { ...this.value }; }, async set(v) { this.value = v; } };
  const supervisor = new Supervisor({ entry: ENTRY, node: process.execPath, env, killAfterMs: 2000 });
  const calls = () => readFileSync(log, "utf8").trim().split("\n").map((l) => JSON.parse(l));
  return { dir, store, supervisor, calls, deps: { entry: ENTRY, node: process.execPath, env, store, supervisor } };
}

test("access: edit to full writes the tier with the runner, saves it, and restarts the runner", async () => {
  const s = setup();
  try {
    await switchAccess({ access: "full", confirmFull: true }, s.deps);
    const calls = s.calls();
    assert.deepEqual(calls.find((c) => c.command === "access").args, ["full"]);
    assert.equal(calls.some((c) => c.command === "pair" || c.command === "unpair"), false, "no new pairing: the waiting work stays");
    assert.equal(s.store.value.access, "full");
    assert.deepEqual([s.store.value.plugin, s.store.value.resident, s.store.value.key], ["kiro", "ada", "secret-key"], "the rest of the connection stays");
    assert.ok(["starting", "running"].includes(s.supervisor.state));
    await switchAccess({ access: "edit" }, s.deps); // back to edit needs no confirmation
    assert.equal(s.store.value.access, "edit");
    assert.deepEqual(s.calls().filter((c) => c.command === "access").map((c) => c.args[0]), ["full", "edit"]);
    await s.supervisor.stop();
  } finally { rmSync(s.dir, { recursive: true, force: true }); }
});

test("access: full without the confirmation, or an unknown tier, changes nothing", async () => {
  const s = setup();
  try {
    await assert.rejects(switchAccess({ access: "full" }, s.deps), /confirmation/);
    await assert.rejects(switchAccess({ access: "full", confirmFull: "yes" }, s.deps), /confirmation/);
    await assert.rejects(switchAccess({ access: "read" }, s.deps), /edit or full/);
    await assert.rejects(switchAccess({ access: "root", confirmFull: true }, s.deps), ConnectError);
    assert.equal(s.store.value.access, "edit");
    assert.equal(s.supervisor.state, "unpaired", "the runner was not touched");
  } finally { rmSync(s.dir, { recursive: true, force: true }); }
});

test("access: the same tier does nothing; no saved connection is a 409", async () => {
  const s = setup();
  try {
    await switchAccess({ access: "edit" }, s.deps);
    s.store.value = null;
    await assert.rejects(switchAccess({ access: "edit" }, s.deps), /not connected/);
  } finally { rmSync(s.dir, { recursive: true, force: true }); }
  assert.equal(s.supervisor.state, "unpaired");
});

test("access: when the runner refuses, the old tier is kept and the runner starts again", async () => {
  const s = setup({ FAKE_ACCESS_FAIL: "1" });
  try {
    await assert.rejects(switchAccess({ access: "full", confirmFull: true }, s.deps), /no config/);
    assert.equal(s.store.value.access, "edit");
    assert.ok(["starting", "running"].includes(s.supervisor.state));
    await s.supervisor.stop();
  } finally { rmSync(s.dir, { recursive: true, force: true }); }
});

test("access: pairing again later keeps the switched tier", async () => {
  const s = setup();
  try {
    const route = makeRoute(s.deps);
    const post = (body) => route(new Request("http://x/api/aelios-desktop", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }));
    assert.equal((await post({ action: "access", access: "full" })).status, 400, "the route needs the confirmation too");
    assert.equal((await post({ action: "access", access: "full", confirmFull: true })).status, 200);
    assert.equal((await post({ action: "repair" })).status, 200);
    const pair = s.calls().filter((c) => c.command === "pair").pop();
    assert.equal(pair.args[pair.args.indexOf("--access") + 1], "full");
    await s.supervisor.stop();
  } finally { rmSync(s.dir, { recursive: true, force: true }); }
});

test("a connection saved with the removed read tier is paired as edit", async () => {
  assert.equal(validate({ url: "https://res.example", key: "k", access: "read" }).access, "edit");
  assert.throws(() => validate({ url: "https://res.example", key: "k", access: "root" }), /edit or full/);
  const s = setup();
  try {
    await connect({ ...saved, helper: "kiro", access: "read" }, s.deps);
    const pair = s.calls().find((c) => c.command === "pair");
    assert.equal(pair.args[pair.args.indexOf("--access") + 1], "edit");
    assert.equal(s.store.value.access, "edit");
    await s.supervisor.stop();
  } finally { rmSync(s.dir, { recursive: true, force: true }); }
});
