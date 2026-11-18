// Review findings on the wizard (PR 22). Each test starts from what the browser really calls: status, then answer.
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { Redactor } from "../host/onboarding/redact.mjs";
import { makeWizard, settle } from "../host/onboarding/flow.mjs";
import { makeRoute } from "../host/route.mjs";
import { Supervisor } from "../host/supervisor.mjs";
import { MemoryCredentials, MemoryProgress } from "./onboarding-fake.mjs";

const ENTRY = path.join(path.dirname(fileURLToPath(import.meta.url)), "fake-runner.mjs");
const context = (overrides = {}) => ({
  redactor: new Redactor(), keys: { web: "web-key" }, steps: {}, residentUrl: "https://res.example",
  authorize: async () => {}, whoami: async () => ({ accountId: "account" }),
  readProfile: async () => ({ state: "file", token: "token-value" }), listWorkers: async () => [],
  login: async () => {}, ...overrides,
});
const make = (options = {}) => {
  const progress = new MemoryProgress();
  const calls = [];
  const runner = options.runner ?? { runAll: async () => [] };
  const wizard = makeWizard({ progress, runner, context: context(options.context), connect: async (...args) => { calls.push(args); }, redact: (text) => text });
  return { progress, wizard, calls };
};
const deferred = () => { let resolve; const promise = new Promise((done) => { resolve = done; }); return { promise, resolve }; };
const tick = () => new Promise((resolve) => setTimeout(resolve, 20));

test("review: the first card takes an answer with no start call (new store)", async () => {
  const yes = make();
  assert.equal((await yes.wizard.status()).card, "resident");
  const existing = await yes.wizard.answer({ values: { exists: true, url: "https://res.example" }, secret: "key" });
  assert.equal(existing.card, "helpers");

  const no = make();
  await no.wizard.status();
  const fresh = await no.wizard.answer({ values: { exists: false } });
  assert.deepEqual([fresh.card, fresh.path, fresh.count], ["aelios", "fresh", 4]);
});

test("review: a fresh path from the first card connects with the new resident's address and key", async () => {
  const { wizard, calls } = make();
  await wizard.answer({ values: { exists: false } });
  await wizard.answer({});
  await settle(wizard);
  await wizard.answer({ values: { name: "Helper" } });
  await settle(wizard);
  await wizard.answer({ values: { helper: "dsh", access: "edit" } });
  const status = await wizard.run();
  assert.equal(status.card, "done");
  assert.equal(calls[0][0].url, "https://res.example");
});

test("review: the helpers card takes edit and full only; an old read means edit", async () => {
  const { wizard } = make();
  await wizard.start("existing");
  await wizard.answer({ values: { exists: true, url: "https://res.example" }, secret: "key" });
  const status = await wizard.answer({ values: { helper: "dsh", access: "read" } });
  assert.equal(status.values.access, "edit");
  assert.equal((await wizard.answer({ values: { access: "nonsense" } })).values.access, "edit");
});

test("review: the real route connects an existing resident through the saved connection and the supervisor", async () => {
  const store = { value: null, async get() { return this.value; }, async set(value) { this.value = value; }, async clear() { this.value = null; } };
  const env = { FAKE_LOG: path.join(mkdtempSync(path.join(os.tmpdir(), "ad-")), "log"), FAKE_PAIRED: "0", FAKE_MODE: "run" };
  const supervisor = new Supervisor({ entry: ENTRY, node: process.execPath, env });
  const bundles = { manifest: {}, bundles: { aelios: { dir: "/tmp/a", configFile: "c", configText: "" }, resident: { dir: "/tmp/r", configFile: "c", configText: "" } } };
  const route = makeRoute({ entry: ENTRY, node: process.execPath, env, store, supervisor, credentials: new MemoryCredentials(), cli: {}, deployer: {}, bundles });
  const post = async (body) => (await route(new Request("http://x/api", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }))).json();
  try {
    await post({ action: "onboarding.answer", values: { exists: true, url: "https://res.example" }, secret: "the-web-key" });
    await post({ action: "onboarding.answer", values: { helper: "dsh", access: "edit", workspace: "/tmp/work" } });
    const done = await post({ action: "onboarding.run" });
    assert.equal(done.error, undefined);
    assert.equal(done.card, "done");
    assert.equal(done.failed, null);
    assert.equal(store.value.url, "https://res.example");
  } finally { await supervisor.stop(); }
});

test("review: a failed deploy that succeeds on retry clears the failure and pairing runs", async () => {
  let attempt = 0;
  const runner = { runAll: async () => { attempt += 1; if (attempt === 1) throw new Error("d1 broke"); } };
  const { wizard, calls } = make({ runner });
  await wizard.answer({ values: { exists: false } });
  await wizard.answer({});
  await settle(wizard);
  await wizard.answer({ values: { name: "Helper" } });
  let status = await settle(wizard);
  assert.equal(status.failed.message, "d1 broke");

  await wizard.retry();
  status = await settle(wizard);
  assert.equal(status.failed, null);
  assert.equal(status.card, "helpers");
  await wizard.answer({ values: { helper: "dsh", access: "edit" } });
  assert.equal((await wizard.run()).card, "done");
  assert.equal(calls.length, 1);
});

test("review: a failed sign-in that succeeds on retry clears the failure", async () => {
  let attempt = 0;
  const { wizard } = make({ context: { authorize: async () => { attempt += 1; if (attempt === 1) throw new Error("not approved"); } } });
  await wizard.answer({ values: { exists: false } });
  await wizard.answer({});
  assert.equal((await settle(wizard)).failed.message, "not approved");
  await wizard.retry();
  const status = await settle(wizard);
  assert.equal(status.failed, null);
  assert.equal(status.card, "assistant");
});

test("review: the login job ending does not finish the slow deploy that replaced it", async () => {
  const gate = deferred();
  const runner = { runAll: async () => { await gate.promise; } };
  const { wizard } = make({ runner, context: { readProfile: async () => ({ state: "keyring", token: null }) } });
  await wizard.answer({ values: { exists: false } });
  await wizard.answer({});
  await settle(wizard);
  await wizard.answer({ values: { name: "Helper" } });
  assert.equal((await wizard.status()).card, "wrangler");
  await wizard.answer({});
  await tick();
  let status = await wizard.status();
  assert.deepEqual([status.job.kind, status.job.running], ["deploy", true]);
  await assert.rejects(wizard.run(), /still working/);
  gate.resolve();
  status = await settle(wizard);
  assert.equal(status.job.running, false);
  assert.equal(status.failed, null);
});
