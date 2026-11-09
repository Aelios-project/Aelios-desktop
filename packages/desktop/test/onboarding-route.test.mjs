import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { OnboardingError, createOnboarding, makeOnboardingRoute } from "../host/onboarding/route.mjs";
import { StepError, makeRunner } from "../host/onboarding/run.mjs";
import { Progress } from "../host/onboarding/state.mjs";
import { makeRoute } from "../host/route.mjs";
import { Supervisor } from "../host/supervisor.mjs";
import { MemoryCredentials } from "./onboarding-fake.mjs";

const ENTRY = path.join(path.dirname(fileURLToPath(import.meta.url)), "fake-runner.mjs");
const memoryStore = () => ({ value: null, async get() { return this.value; }, async set(value) { this.value = value; }, async clear() { this.value = null; } });
const post = (route, body) => route(new Request("http://x/api", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }));

test("route: starts on the resident card, then reports the path and its card count", async () => {
  const onboarding = createOnboarding({ credentials: new MemoryCredentials() });
  const status = await onboarding({ action: "onboarding.status" });
  assert.deepEqual([status.path, status.card, status.count], [null, "resident", null]);
  await assert.rejects(onboarding({ action: "onboarding.run" }), /has not started/);

  const existing = await onboarding({ action: "onboarding.start", path: "existing" });
  assert.deepEqual([existing.path, existing.count], ["existing", 2]);
  assert.deepEqual(existing.cards, ["resident", "helpers"]);

  const fresh = await onboarding({ action: "onboarding.start", path: "fresh" });
  assert.deepEqual([fresh.path, fresh.count], ["fresh", 4]);
  assert.equal(fresh.failed, null);
});

test("route: a bad path or action is refused with a plain message", async () => {
  const onboarding = createOnboarding({ credentials: new MemoryCredentials() });
  await assert.rejects(onboarding({ action: "onboarding.start", path: "elsewhere" }), OnboardingError);
  await assert.rejects(onboarding({ action: "onboarding.teleport" }), /no such action/);
});

test("route: run resumes at the first unfinished step and stops on failure; retry finishes", async () => {
  const credentials = new MemoryCredentials();
  const progress = new Progress(credentials);
  const flow = { fresh: { cards: ["resident", "aelios", "assistant", "helpers"], steps: ["one", "two"] } };
  const done = new Set();
  let broken = true;
  const steps = {
    one: { check: async () => done.has("one"), do: async () => { done.add("one"); } },
    two: {
      check: async () => done.has("two"),
      do: async () => { if (broken) throw new Error("boom"); done.add("two"); },
    },
  };
  const runner = makeRunner({ steps, progress });
  const onboarding = makeOnboardingRoute({ progress, runner, flow });

  await onboarding({ action: "onboarding.start", path: "fresh" });
  await assert.rejects(onboarding({ action: "onboarding.run" }), (error) => {
    assert.ok(error instanceof StepError);
    assert.equal(error.step, "two");
    return true;
  });
  const failed = await onboarding({ action: "onboarding.status" });
  assert.equal(failed.failed.step, "two");
  assert.equal(failed.steps.one.done, true);
  assert.equal(failed.steps.two.done, false);

  broken = false;
  const retried = await onboarding({ action: "onboarding.retry" });
  assert.equal(retried.failed, null);
  assert.deepEqual(retried.result.map((result) => result.id), ["two"]);
  assert.equal(retried.steps.two.done, true);
});

test("route: reset forgets the progress only", async () => {
  const credentials = new MemoryCredentials();
  credentials.records.set("aelios-desktop/onboarding-secret/web-key", { kind: "grant", payload: { value: "kept" } });
  const onboarding = createOnboarding({ credentials });
  await onboarding({ action: "onboarding.start", path: "existing" });
  const reset = await onboarding({ action: "onboarding.reset" });
  assert.equal(reset.path, null);
  assert.ok(credentials.records.has("aelios-desktop/onboarding-secret/web-key"), "the secret stays");
});

test("host route: onboarding actions reach the wizard, and its errors become 400", async () => {
  const route = makeRoute({
    entry: ENTRY, node: process.execPath, store: memoryStore(),
    supervisor: new Supervisor({ entry: ENTRY, node: process.execPath }),
    credentials: new MemoryCredentials(),
  });
  const status = await post(route, { action: "onboarding.status" });
  assert.equal(status.status, 200);
  assert.equal((await status.json()).card, "resident");

  const bad = await post(route, { action: "onboarding.start", path: "elsewhere" });
  assert.equal(bad.status, 400);
  assert.equal((await bad.json()).error, "The wizard has no such path");

  const bare = await post(makeRoute({ entry: ENTRY, node: process.execPath, store: memoryStore(), supervisor: new Supervisor({ entry: ENTRY, node: process.execPath }) }), { action: "onboarding.status" });
  assert.equal(bare.status, 503);
});
