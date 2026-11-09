// The host actions for the wizard. host/route.mjs hands every action that starts with `onboarding.` here.
// Answers hold state and redacted output only; a secret is never returned.
import { Progress } from "./state.mjs";
import { Redactor } from "./redact.mjs";
import { makeRunner } from "./run.mjs";
import { PATHS, isPath } from "./steps.mjs";

export class OnboardingError extends Error {}

export function makeOnboardingRoute({ progress, runner, flow = PATHS }) {
  const status = async () => {
    const state = (await progress.get()) ?? {};
    const path = isPath(state.path) ? state.path : null;
    return {
      path,
      card: state.card ?? "resident",
      steps: state.steps ?? {},
      failed: state.failed ?? null,
      cards: path ? flow[path].cards : null,
      count: path ? flow[path].cards.length : null,
    };
  };

  const order = async () => {
    const state = (await progress.get()) ?? {};
    if (!isPath(state.path)) throw new OnboardingError("The wizard has not started");
    return flow[state.path].steps;
  };

  async function resume() {
    const ids = await order();
    const id = await runner.next(ids);
    if (!id) return [];
    return runner.runAll(ids.slice(ids.indexOf(id)));
  }

  return async function onboarding(input) {
    const action = String(input?.action ?? "").replace(/^onboarding\./, "");
    if (action === "status") return status();
    if (action === "reset") { await progress.clear(); return status(); }
    if (action === "start") {
      const path = input.path;
      if (!isPath(path)) throw new OnboardingError("The wizard has no such path");
      const state = (await progress.get()) ?? {};
      // A different path is a different set of resources: its old step flags would be a lie.
      const kept = state.path === path ? state : {};
      await progress.set({ ...kept, path, card: input.card ?? "resident", failed: null });
      return status();
    }
    if (action === "run" || action === "retry") {
      const result = await resume(); // first, so the status below reports what the run left behind
      return { ...(await status()), result };
    }
    throw new OnboardingError("The wizard has no such action");
  };
}

/** Built once per host: the saved progress, the step handlers and the redactor that both share. */
export function createOnboarding({ credentials, steps = {}, redactor = new Redactor() }) {
  const progress = new Progress(credentials);
  const runner = makeRunner({ steps, progress, redactor });
  return makeOnboardingRoute({ progress, runner });
}

