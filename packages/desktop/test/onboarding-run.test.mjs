import assert from "node:assert/strict";
import { test } from "node:test";
import { Redactor } from "../host/onboarding/redact.mjs";
import { StepError, makeRunner } from "../host/onboarding/run.mjs";
import { MemoryProgress } from "./onboarding-fake.mjs";

test("run: a step runs once and a re-run skips it", async () => {
  const progress = new MemoryProgress();
  let built = 0;
  let there = false;
  const steps = { build: { check: async () => there, do: async () => { built += 1; there = true; } } };
  const runner = makeRunner({ steps, progress });
  assert.deepEqual(await runner.run("build"), { id: "build", done: true, skipped: false });
  const again = await runner.run("build");
  assert.equal(again.skipped, true);
  assert.equal(built, 1);
  assert.equal(progress.value.steps.build.done, true);
});

test("run: a failure keeps the step, a redacted message and the tail; a retry finishes", async () => {
  const progress = new MemoryProgress();
  const redactor = new Redactor(["swordfish"]);
  let broken = true;
  const steps = {
    deploy: {
      do: async () => {
        if (!broken) return;
        const error = new Error("upload failed: swordfish");
        error.tail = "line with swordfish";
        error.code = "E_UPLOAD";
        throw error;
      },
    },
  };
  const runner = makeRunner({ steps, progress, redactor });
  await assert.rejects(runner.run("deploy"), (error) => {
    assert.ok(error instanceof StepError);
    assert.equal(error.step, "deploy");
    assert.equal(error.message, "upload failed: [redacted]");
    assert.equal(error.tail, "line with [redacted]");
    assert.equal(error.code, "E_UPLOAD");
    return true;
  });
  assert.equal(progress.value.failed.step, "deploy");
  assert.equal(progress.value.failed.message, "upload failed: [redacted]");
  assert.equal(progress.value.steps.deploy.done, false);

  broken = false;
  await runner.run("deploy");
  assert.equal(progress.value.failed, null);
  assert.equal(progress.value.steps.deploy.done, true);
});

test("run: a verify that disagrees with the do is a failure", async () => {
  const progress = new MemoryProgress();
  const steps = { deploy: { do: async () => {}, verify: async () => false } };
  await assert.rejects(makeRunner({ steps, progress }).run("deploy"), /does not agree/);
  assert.equal(progress.value.steps.deploy.done, false);
});

test("run: an unknown step is refused by name", async () => {
  const runner = makeRunner({ steps: {}, progress: new MemoryProgress() });
  await assert.rejects(runner.run("nope"), (error) => error instanceof StepError && error.message === "This step is not built yet");
});

test("run: next finds the first step whose check is not done, in order", async () => {
  const progress = new MemoryProgress();
  const here = new Set();
  const steps = {
    one: { check: async () => here.has("one"), do: async () => { here.add("one"); } },
    two: { check: async () => here.has("two"), do: async () => { here.add("two"); } },
  };
  const runner = makeRunner({ steps, progress });
  assert.equal(await runner.next(["one", "two"]), "one");
  await runner.run("one");
  assert.equal(await runner.next(["one", "two"]), "two");
  await runner.run("two");
  assert.equal(await runner.next(["one", "two"]), null);
});
