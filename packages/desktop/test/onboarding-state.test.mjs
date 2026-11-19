import assert from "node:assert/strict";
import { test } from "node:test";
import { Secrets } from "../host/onboarding/secrets.mjs";
import { Progress } from "../host/onboarding/state.mjs";
import { MemoryCredentials } from "./onboarding-fake.mjs";

test("progress: a saved value is cloned, and clear forgets it", async () => {
  const progress = new Progress(new MemoryCredentials());
  assert.equal(await progress.get(), null);
  await progress.set({ path: "fresh", steps: { auth: { done: true } } });
  const copy = await progress.get();
  copy.path = "existing";
  assert.equal((await progress.get()).path, "fresh", "the caller cannot change the saved state");
  await progress.clear();
  assert.equal(await progress.get(), null);
});

test("progress: two quick writes land in order", async () => {
  const progress = new Progress(new MemoryCredentials());
  await Promise.all([progress.set({ path: "fresh" }), progress.set({ path: "existing" })]);
  assert.equal((await progress.get()).path, "existing");
});

test("secrets: stores, reads and deletes; bad names and empty values are refused", async () => {
  const credentials = new MemoryCredentials();
  const secrets = new Secrets(credentials);
  assert.equal(await secrets.get("web-key"), null);
  await secrets.set("web-key", "the-generated-value");
  assert.equal(await secrets.get("web-key"), "the-generated-value");
  assert.ok(credentials.records.has("aelios-desktop/onboarding-secret/web-key"));

  await assert.rejects(secrets.set("Bad Name", "value"), /not valid/);
  await assert.rejects(secrets.set("web-key", ""), /empty/);
  await assert.rejects(secrets.get("../escape"), /not valid/);

  await secrets.delete("web-key");
  assert.equal(await secrets.get("web-key"), null);
});
