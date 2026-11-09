// The wizard's state machine: which card is open on each path, what an answer does, and the one job that runs
// behind a card (the browser approval, the wrangler login, the deploy). Draft state holds no secret.
import { DEFAULT_MODEL } from "./aelios.mjs";
import { findWorkers, workerUrl } from "./cloudflare.mjs";
import { matchesMainModel } from "./models.mjs";

export const PATHS = {
  existing: { cards: ["resident", "helpers"] },
  fresh: { cards: ["resident", "aelios", "assistant", "helpers"] },
};

/** A keychain-backed cf profile cannot hand its token to wrangler, so the owner approves wrangler once more. */
export function cardsFor(path, profile = "file") {
  const cards = [...(PATHS[path]?.cards ?? [])];
  if (path === "fresh" && profile === "keyring") cards.splice(cards.length - 1, 0, "wrangler");
  return cards;
}

export const countFor = (path, profile) => cardsFor(path, profile).length;

const PUBLIC = ["url", "name", "model", "pattern", "helper", "access", "workspace", "found"];
const trim = (value, max) => String(value ?? "").trim().slice(0, max);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function makeWizard(deps) {
  const { progress, runner, context, connect, redact = (value) => value } = deps;
  let job = null;
  let webKey = "";

  const state = async () => (await progress.get()) ?? {};
  const save = async (part) => { await progress.set({ ...(await state()), ...part }); };
  const publicValues = (values = {}) => Object.fromEntries(PUBLIC.filter((key) => values[key] !== undefined).map((key) => [key, values[key]]));

  async function status() {
    const current = await state();
    const path = current.path ?? null;
    const profile = current.profileState ?? "file";
    const cards = path ? cardsFor(path, profile) : null;
    const values = publicValues(current.values);
    return {
      path, card: current.card ?? "resident", cards, count: cards?.length ?? null,
      values, keychain: profile === "keyring", helpers: context.helpers ?? [],
      warn: Boolean(values.pattern && values.model && !matchesMainModel([values.pattern], values.model)),
      failed: current.failed ?? null,
      job: job ? { kind: job.kind, running: job.running, error: job.error ?? null, events: job.events } : null,
    };
  }

  async function fail(card, error) {
    await save({ card, failed: { card, message: redact(error.message || "The step failed"), tail: redact(error.tail ?? "") } });
    if (job) job.running = false;
  }

  async function start(path = "fresh") {
    if (!PATHS[path]) throw new Error("The wizard has no such path");
    webKey = "";
    await progress.set({ path, card: "resident", values: {}, steps: {}, failed: null, profileState: "file" });
    job = null;
    return status();
  }

  async function answer(input) {
    const current = await state();
    const card = current.card;
    const values = { ...(current.values ?? {}), ...(input.values ?? {}) };

    if (card === "resident") {
      if (input.values?.exists) {
        const url = trim(values.url, 300).replace(/\/+$/, "");
        const key = String(input.secret ?? "").trim();
        if (!url) throw new Error("The address is empty");
        if (!key) throw new Error("The web key is empty");
        webKey = key;
        const cards = cardsFor("existing", "file");
        await save({ path: "existing", values: { url }, cards, card: cards.at(-1) });
        return status();
      }
      await save({ card: "aelios", values: {} });
      return status();
    }

    if (card === "aelios") {
      if (!job?.running) void beginAuth();
      return status();
    }

    if (card === "assistant") {
      const name = trim(input.values?.name, 32);
      const model = trim(input.values?.model, 100) || DEFAULT_MODEL;
      if (!name) throw new Error("The assistant needs a name");
      if (input.values?.pattern !== undefined && !String(input.values.pattern).trim()) throw new Error("The memory pattern cannot be empty");
      const pattern = trim(input.values?.pattern, 100) || model;
      const next = current.profileState === "keyring" ? "wrangler" : cardsFor("fresh", "file").at(-1);
      await save({ values: { ...values, name, model, pattern }, card: next });
      if (next !== "wrangler") void beginDeploy();
      return status();
    }

    if (card === "wrangler") {
      void beginLogin();
      return status();
    }

    if (card === "helpers") {
      const helper = input.values?.helper === "kiro" ? "kiro" : "dsh";
      const access = ["read", "edit", "full"].includes(input.values?.access) ? input.values.access : "edit";
      if (access === "full" && input.values?.confirmFull !== true) throw new Error("Full permission needs your confirmation");
      await save({ values: { ...values, helper, access, workspace: trim(input.values?.workspace, 500) } });
      return status();
    }

    throw new Error("This card takes no answer");
  }

  async function beginAuth() {
    job = { kind: "auth", running: true, events: [] };
    try {
      await context.authorize({ onEvent: (event) => job.events.push(event) });
      const who = await context.whoami();
      context.accountId = who.accountId;
      const profile = await context.readProfile();
      context.token = profile.token;
      if (context.token) context.redactor.add(context.token);
      await save({ profileState: profile.state });
      const found = findWorkers(await context.listWorkers());
      if (found.resident) {
        await save({
          path: "existing", card: "resident", values: { url: workerUrl(found.resident) },
          cards: cardsFor("existing", "file"),
        });
      } else if (found.aelios) {
        await save({ card: "error", failed: { card: "error", message: "This account already runs Aelios. The wizard does not change or redeploy it, and connecting a new resident to an existing Aelios comes after the contest." } });
      } else {
        await save({ card: "assistant" });
      }
    } catch (error) {
      await fail("aelios", error);
    } finally {
      job.running = false;
    }
  }

  async function beginLogin() {
    job = { kind: "login", running: true, events: [] };
    try {
      await context.login();
      await save({ card: cardsFor("fresh", "file").at(-1) });
      void beginDeploy();
    } catch (error) {
      await fail("wrangler", error);
    } finally {
      job.running = false;
    }
  }

  async function beginDeploy() {
    job = { kind: "deploy", running: true, events: [] };
    try {
      const stored = (await state()).values ?? {};
      context.assistantName = stored.name ?? context.assistantName;
      context.model = stored.model ?? context.model;
      context.pattern = stored.pattern ?? context.pattern;
      // Deploy first, then write the secrets: wrangler puts a secret on an existing script, not on a name it has not seen.
      const order = ["d1", "migrations", "vectorize", "queue", "aelios-deploy", "aelios-secret", "aelios-health", "gateway", "resident-deploy", "resident-secret", "resident-health"];
      await runner.runAll(order.filter((id) => context.steps[id]));
    } catch (error) {
      await fail("assistant", error);
    } finally {
      job.running = false;
    }
  }

  /** Start on the helper card: connect an existing resident, or pair the one just deployed. */
  async function run() {
    const current = await state();
    if (job?.running) throw new Error("The wizard is still working. Wait for it to finish.");
    if (current.failed) throw new Error(current.failed.message);
    const values = current.values ?? {};
    const settings = {
      helper: values.helper, access: values.access, workspace: values.workspace || undefined,
      resident: "default", confirmFull: values.access === "full",
    };
    try {
      if (current.path === "fresh") {
        if (!context.residentUrl || !context.keys.web) throw new Error("The resident is not ready yet");
        await connect({ ...settings, url: context.residentUrl, key: context.keys.web }, deps.connect);
      } else {
        if (!webKey) throw new Error("The web key is not here any more. Enter it again on the resident card.");
        await connect({ ...settings, url: values.url, key: webKey }, deps.connect);
      }
      await save({ card: "done", failed: null });
    } catch (error) { await fail("helpers", error); }
    return status();
  }

  async function retry() {
    const current = await state();
    if (current.failed?.card === "assistant") { void beginDeploy(); return status(); }
    if (current.failed?.card === "aelios") { void beginAuth(); return status(); }
    if (current.failed?.card === "wrangler") { void beginLogin(); return status(); }
    return run();
  }

  return { status, start, answer, run, retry, state, save };
}

/** Waits for a background job the route started, so a test can read the end state without polling. */
export async function settle(wizard, { tries = 400, gap = 25 } = {}) {
  for (let index = 0; index < tries; index += 1) {
    const status = await wizard.status();
    if (!status.job?.running) return status;
    await sleep(gap);
  }
  return wizard.status();
}

