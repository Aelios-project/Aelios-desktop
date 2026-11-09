// The host actions for the wizard. host/route.mjs hands every action that starts with `onboarding.` here.
// Answers hold state and redacted output only; a secret is never returned.
import { Progress } from "./state.mjs";
import { Redactor } from "./redact.mjs";
import { Secrets } from "./secrets.mjs";
import { StepError, makeRunner } from "./run.mjs";
import { PROFILE, authorize, getWorker, listWorkers, readProfile, whoami, workerUrl } from "./cloudflare.mjs";
import { aeliosSteps, generateKey } from "./aelios.mjs";
import { detectHelpers } from "./helpers.mjs";
import { residentSteps } from "./resident.mjs";
import { PATHS, cardsFor, countFor, makeWizard } from "./flow.mjs";

export const BUNDLE_TAG = "aelios-desktop-bundle-0.1.0";
export class OnboardingError extends Error {}

export function createOnboarding(deps) {
  const { credentials, cli, deployer, connect, bundles } = deps;
  if (!credentials || !cli || !deployer || !bundles) throw new OnboardingError("The wizard is not configured");
  const redactor = deps.redactor ?? new Redactor();
  const progress = new Progress(credentials);
  const secrets = new Secrets(credentials);
  const context = {
    cli, profile: PROFILE, redactor, secrets, deployer,
    bundle: bundles.bundles.aelios, residentBundle: bundles.bundles.resident,
    tag: BUNDLE_TAG, keys: {}, d1Id: null, accountId: null, token: null,
    aeliosUrl: null, residentUrl: null, assistantName: "", model: "glm-4.7-flash", pattern: "",
    generate: generateKey, fetch: deps.fetch ?? globalThis.fetch, helpers: detectHelpers(),
    authorize: (options) => authorize(cli, { profile: PROFILE, ...options }),
    whoami: () => whoami(cli, PROFILE),
    listWorkers: () => listWorkers(cli, PROFILE),
    readProfile: () => readProfile(PROFILE),
    getWorker: (name) => getWorker(cli, name, PROFILE),
    workerUrl: async (name) => workerUrl(await getWorker(cli, name, PROFILE)),
    login: () => deployer.login(),
  };
  context.steps = { ...aeliosSteps(context), ...residentSteps(context) };
  const runner = makeRunner({ steps: context.steps, progress, redactor });
  const wizard = makeWizard({ progress, runner, context, connect, redact: (text) => redactor.text(text) });

  // The assistant card's values are needed by the deploy steps that run while it is open.
  const answer = async (input) => {
    const next = await wizard.answer(input);
    const values = (await wizard.state()).values ?? {};
    context.assistantName = values.name ?? "";
    context.model = values.model ?? context.model;
    context.pattern = values.pattern ?? "";
    return next;
  };

  return async function onboarding(input) {
    const action = String(input?.action ?? "").replace(/^onboarding\./, "");
    if (action === "status") return wizard.status();
    if (action === "start") {
      if (!PATHS[input.path]) throw new OnboardingError("The wizard has no such path");
      return wizard.start(input.path);
    }
    if (action === "answer") return answer(input);
    if (action === "run" || action === "retry") return action === "run" ? wizard.run() : wizard.retry();
    if (action === "reset") { await progress.clear(); return wizard.status(); }
    throw new OnboardingError("The wizard has no such action");
  };
}

export { PATHS, cardsFor, countFor, StepError };
