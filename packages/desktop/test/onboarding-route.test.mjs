import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { createOnboarding } from "../host/onboarding/route.mjs";
import { makeRoute } from "../host/route.mjs";
import { Supervisor } from "../host/supervisor.mjs";
import { MemoryCredentials } from "./onboarding-fake.mjs";

const ENTRY = path.join(path.dirname(fileURLToPath(import.meta.url)), "fake-runner.mjs");
const memoryStore = () => ({ value: null, async get() { return this.value; }, async set(value) { this.value = value; }, async clear() { this.value = null; } });
const post = (route, body) => route(new Request("http://x/api", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }));
const fakeCli = { cf: async () => ({ code: 1, out: "", err: "", tail: "not needed" }) };
const fakeDeployer = { login: async () => {}, upload: async () => {}, secret: async () => {}, migrate: async () => {}, pendingMigrations: async () => [] };
const fakeBundles = { manifest: {}, bundles: { aelios: { dir: "/tmp/a", configFile: "wrangler.toml", configText: "" }, resident: { dir: "/tmp/r", configFile: "wrangler.jsonc", configText: "" } } };

const make = () => createOnboarding({
  credentials: new MemoryCredentials(), cli: fakeCli, deployer: fakeDeployer,
  bundles: fakeBundles, connect: {}, redactor: undefined,
});

test("route: before a path is chosen the count is unknown; then it is 2 or 4", async () => {
  const onboarding = make();
  const start = await onboarding({ action: "onboarding.status" });
  assert.deepEqual([start.path, start.card, start.count], [null, "resident", null]);

  const existing = await onboarding({ action: "onboarding.start", path: "existing" });
  assert.deepEqual([existing.path, existing.count], ["existing", 2]);

  const fresh = await onboarding({ action: "onboarding.start", path: "fresh" });
  assert.deepEqual([fresh.path, fresh.count], ["fresh", 4]);

  const reset = await onboarding({ action: "onboarding.reset" });
  assert.equal(reset.path, null);
});

test("route: a bad path and an unknown action are refused", async () => {
  const onboarding = make();
  await assert.rejects(onboarding({ action: "onboarding.start", path: "elsewhere" }), /no such path/);
  await assert.rejects(onboarding({ action: "onboarding.teleport" }), /no such action/);
});

test("route: the resident card saves only public values, never the key", async () => {
  const onboarding = make();
  await onboarding({ action: "onboarding.start", path: "existing" });
  const status = await onboarding({ action: "onboarding.answer", values: { url: "https://res.example", exists: true }, secret: "the-web-key" });
  assert.equal(status.card, "helpers");
  assert.ok(!JSON.stringify(status).includes("the-web-key"));
});

test("host route: onboarding is reachable, errors become 400, and without bundles it is 503", async () => {
  const base = { entry: ENTRY, node: process.execPath, store: memoryStore(), supervisor: new Supervisor({ entry: ENTRY, node: process.execPath }) };
  const route = makeRoute({ ...base, credentials: new MemoryCredentials(), cli: fakeCli, deployer: fakeDeployer, bundles: fakeBundles });
  assert.equal((await post(route, { action: "onboarding.status" })).status, 200);
  const bad = await post(route, { action: "onboarding.start", path: "elsewhere" });
  assert.equal(bad.status, 400);

  const bare = makeRoute({ ...base, credentials: new MemoryCredentials() });
  assert.equal((await post(bare, { action: "onboarding.status" })).status, 503);
});
