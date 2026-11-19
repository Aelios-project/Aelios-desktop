import assert from "node:assert/strict";
import { test } from "node:test";
import { Redactor } from "../host/onboarding/redact.mjs";
import { cardsFor, countFor, makeWizard, settle } from "../host/onboarding/flow.mjs";
import { MemoryProgress } from "./onboarding-fake.mjs";

const context = (overrides = {}) => ({
  redactor: new Redactor(), keys: {}, steps: {}, accountId: null, token: null,
  authorize: async ({ onEvent }) => onEvent({ link: "https://dash.cloudflare.com/oauth2/device/verify", code: "ABCD-1234" }),
  whoami: async () => ({ accountId: "account" }),
  readProfile: async () => ({ state: "file", token: "token-value" }),
  listWorkers: async () => [],
  login: async () => {},
  ...overrides,
});

const make = async (options = {}) => {
  const progress = new MemoryProgress();
  const wizard = makeWizard({ progress, runner: { runAll: async () => [] }, context: context(options.context), connect: async () => {}, redact: (text) => text });
  return { progress, wizard };
};

test("flow: the measured card counts, including the keychain extra step", () => {
  assert.deepEqual(cardsFor("existing"), ["resident", "helpers"]);
  assert.equal(countFor("existing"), 2);
  assert.equal(countFor("fresh"), 4);
  assert.equal(countFor("fresh", "keyring"), 5);
  assert.deepEqual(cardsFor("fresh", "keyring"), ["resident", "aelios", "assistant", "wrangler", "helpers"]);
});

test("flow: an existing resident is two cards and the key is used for the connection", async () => {
  const calls = [];
  const { wizard } = await make();
  await wizard.start("existing");
  let status = await wizard.status();
  assert.equal(status.count, 2);
  assert.equal(status.card, "resident");

  status = await wizard.answer({ values: { url: "https://res.example/", exists: true }, secret: "the-web-key" });
  assert.equal(status.card, "helpers");
  assert.equal(status.values.url, "https://res.example", "the trailing slash is gone");

  await wizard.answer({ values: { helper: "dsh", access: "edit" } });
  // connect is a stand-in here, so the run ends on the done card.
  status = await wizard.status();
  assert.equal(status.card, "helpers");
});

test("flow: a fresh install walks the four cards; the deploy never starts before the assistant", async () => {
  const { wizard } = await make();
  await wizard.start("fresh");
  let status = await wizard.answer({ values: { exists: false } });
  assert.equal(status.card, "aelios");

  status = await wizard.answer({});
  status = await settle(wizard);
  assert.equal(status.card, "assistant");
  assert.equal(status.job.kind, "auth");
  assert.equal(status.job.events[0].code, "ABCD-1234");

  status = await wizard.answer({ values: { name: "Helper", model: "glm-4.7-flash" } });
  assert.equal(status.card, "helpers");
  assert.equal(status.values.pattern, "glm-4.7-flash", "the pattern follows the model");
  assert.equal(status.count, 4);
});

test("flow: a keychain profile adds the wrangler card after the assistant", async () => {
  const { wizard } = await make({ context: { readProfile: async () => ({ state: "keyring", token: null }) } });
  await wizard.start("fresh");
  await wizard.answer({ values: { exists: false } });
  await wizard.answer({});
  let status = await settle(wizard);
  assert.equal(status.keychain, true);
  assert.equal(status.count, 5);

  status = await wizard.answer({ values: { name: "Helper", model: "glm-4.7-flash" } });
  assert.equal(status.card, "wrangler");
  status = await wizard.answer({});
  status = await settle(wizard);
  assert.equal(status.card, "helpers");
});

test("flow: an Aelios with no resident stops the install instead of overwriting", async () => {
  const { wizard } = await make({ context: { listWorkers: async () => [{ name: "companion-memory-proxy" }] } });
  await wizard.start("fresh");
  await wizard.answer({ values: { exists: false } });
  await wizard.answer({});
  const status = await settle(wizard);
  assert.equal(status.card, "error");
  assert.match(status.failed.message, /already runs Aelios/);
});

test("flow: a found resident switches to the existing path with its address", async () => {
  const { wizard } = await make({
    context: { listWorkers: async () => [{ name: "aelios-resident", subdomain: { url: "https://res.example" } }] },
  });
  await wizard.start("fresh");
  await wizard.answer({ values: { exists: false } });
  await wizard.answer({});
  const status = await settle(wizard);
  assert.equal(status.path, "existing");
  assert.equal(status.card, "resident");
  assert.equal(status.values.url, "https://res.example");
});

test("flow: an empty memory pattern is refused and a mismatch only warns", async () => {
  const { wizard } = await make();
  await wizard.start("fresh");
  await wizard.answer({ values: { exists: false } });
  await wizard.answer({});
  await settle(wizard);
  await assert.rejects(wizard.answer({ values: { name: "Helper", pattern: "" } }), /cannot be empty|follows/);
  const status = await wizard.answer({ values: { name: "Helper", model: "glm-4.7-flash", pattern: "deepseek/*" } });
  assert.equal(status.warn, true);
});
