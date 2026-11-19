// Runs one deploy step as check → do → verify. A step that is already there is not done again; a failure is saved
// on its step so the card can show the name, the message and the redacted tail, and "Try again" resumes there.
import { Redactor } from "./redact.mjs";

export class StepError extends Error {
  constructor(step, message, { code = null, tail = "" } = {}) {
    super(message);
    this.name = "StepError";
    this.step = step;
    this.code = code;
    this.tail = tail;
  }
}

export function makeRunner({ steps = {}, progress, redactor = new Redactor(), now = Date.now }) {
  if (!progress) throw new Error("progress is required");

  async function save(id, done) {
    const state = (await progress.get()) ?? {};
    state.steps = { ...(state.steps ?? {}), [id]: { done, at: now() } };
    if (done && state.failed?.step === id) state.failed = null;
    await progress.set(state);
    return state;
  }

  async function fail(id, error) {
    const message = redactor.text(error?.message || "The step failed");
    const tail = redactor.text(error?.tail ?? "");
    const state = (await progress.get()) ?? {};
    state.failed = { step: id, message, code: error?.code ?? null, tail, at: now() };
    state.steps = { ...(state.steps ?? {}), [id]: { done: false, at: now() } };
    await progress.set(state);
    return new StepError(id, message, { code: error?.code ?? null, tail });
  }

  async function run(id) {
    const step = steps[id];
    if (!step) throw new StepError(id, "This step is not built yet");
    try {
      // The cloud is the truth: a step counts as done only when its check says so. A step without a check
      // falls back to the saved flag.
      if (step.check) {
        if (await step.check()) { await save(id, true); return { id, done: true, skipped: true }; }
      } else if ((await progress.get())?.steps?.[id]?.done) {
        return { id, done: true, skipped: true };
      }
      await step.do();
      if (step.verify && !(await step.verify())) throw new Error("The step finished but its check does not agree");
      await save(id, true);
      return { id, done: true, skipped: false };
    } catch (error) {
      if (error instanceof StepError && error.step === id) throw error;
      throw await fail(id, error);
    }
  }

  /** In order, stopping at the first failure: nothing later runs on top of a broken step. */
  async function runAll(order) {
    const results = [];
    for (const id of order) results.push(await run(id));
    return results;
  }

  /** Where a re-run starts: the first step that is not done according to its check. */
  async function next(order) {
    for (const id of order) {
      const step = steps[id];
      if (!step) return id;
      if (step.check ? !(await step.check()) : !(await progress.get())?.steps?.[id]?.done) return id;
    }
    return null;
  }

  return { run, runAll, next };
}
