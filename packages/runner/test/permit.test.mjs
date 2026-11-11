// The acpx permission callback: tier `full` allows once, any other tier holds the request, nothing is ever "always".
import assert from "node:assert/strict";
import test from "node:test";
import { makePermit } from "../src/permit.mjs";

const request = { raw: {
  toolCall: { title: "Run tests", kind: "execute", locations: [], rawInput: { command: "npm test --token=abc123456789" } },
  options: [{ optionId: "always", kind: "allow_always" }, { optionId: "allow", kind: "allow_once" }, { optionId: "reject", kind: "reject_once" }, { optionId: "never", kind: "reject_always" }]
} };
const make = (tier, extra = {}) => { const denied = []; return { denied, permit: makePermit({ tier, redact: text => text.replace(/abc123456789/g, "[token]"), denied, ...extra }) }; };

test("full allows once, with the one-time option id, and holds nothing", async () => {
  let held = 0;
  const { permit, denied } = make("full", { hold: async () => { held++; return false; } });
  assert.deepEqual(await permit(request), { outcome: "selected", optionId: "allow" });
  assert.deepEqual([held, denied], [0, []]);
});

test("edit holds the request, show the redacted command, and refuse when there is no owner to ask", async () => {
  for (const tier of ["edit"]) {
    let info;
    const { permit, denied } = make(tier, { hold: async held => { info = held; return false; } });
    assert.deepEqual(await permit(request), { outcome: "selected", optionId: "reject" });
    assert.doesNotMatch(info.detail, /abc123456789/);
    assert.equal(denied.length, 1);
    const alone = make(tier); // no hold at all: nobody to ask
    assert.deepEqual(await alone.permit(request), { outcome: "selected", optionId: "reject" });
  }
});

test("when the owner allows, only this request is allowed, once", async () => {
  const { permit, denied } = make("edit", { hold: async () => true });
  assert.deepEqual(await permit(request), { outcome: "selected", optionId: "allow" });
  assert.deepEqual(denied, []);
});

test("no answer is ever an `always` option; a helper with no one-time option is refused", async () => {
  const onlyAlways = { raw: { ...request.raw, options: [{ optionId: "always", kind: "allow_always" }, { optionId: "never", kind: "reject_always" }] } };
  for (const tier of ["edit", "full"]) assert.deepEqual(await make(tier).permit(onlyAlways), { outcome: "reject_once" });
  for (const tier of ["edit", "full"]) assert.ok(!["always", "never"].includes((await make(tier).permit(request)).optionId));
});

test("an exception in the hold reaches acpx, which then refuses (fail closed)", async () => {
  const { permit } = make("edit", { hold: async () => { throw new Error("journal down"); } });
  await assert.rejects(permit(request), /journal down/);
});
