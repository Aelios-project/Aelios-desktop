// `ask.kind` goes out only when the resident's heartbeat lists "ask.kind", and only as permission or question.
// Run once per engine (RUNNER_TEST_ENGINE).
import assert from "node:assert/strict";
import test from "node:test";
import { Wire } from "../src/wire.mjs";
import { final, rig } from "./rig.mjs";

const ask = kind => ({ status: "needs_you", summary: "s", ask: { key: "k", question: "q", ...(kind === undefined ? {} : { kind }) } });

test("Wire: the kind stays only when listed and valid; other asks and outcomes pass untouched", () => {
  const wire = new Wire();
  assert.deepEqual(wire.verdict(ask("question")), ask(), "an old resident gets the first version");
  wire.learn({ accepts: ["ask.kind"] });
  assert.deepEqual(wire.verdict(ask("permission")), ask("permission"));
  assert.deepEqual(wire.verdict(ask("question")), ask("question"));
  for (const bad of ["problem", "", null, 3]) assert.deepEqual(wire.verdict(ask(bad)), ask(), `${bad} is never sent`);
  assert.deepEqual(wire.verdict(ask()), ask());
  const done = { status: "done", summary: "s" };
  assert.equal(wire.verdict(done), done);
});

for (const plugin of ["kiro", "dsh"]) {
  const t = (name, fn) => test(`[${plugin}] ${name}`, async () => { const r = await rig(plugin); try { await fn(r); } finally { await r.done(); } });
  const learned = r => r.cloud.until(() => r.cloud.beats >= 2, "two heartbeats");
  const asks = async r => {
    r.start();
    await learned(r);
    const question = (await final(r, r.cloud.push({ text: "ASKME which one" }))).ask;
    const permission = (await final(r, r.cloud.push({ text: "PERM:execute" }))).ask;
    assert.deepEqual(r.cloud.refused, []);
    return [question, permission];
  };

  t("an old resident gets no kind on either ask, and takes both receipts", async r => {
    const [question, permission] = await asks(r);
    assert.ok(!("kind" in question) && !("kind" in permission));
  });

  t("a resident that lists ask.kind: ASK: is a question, a refused permission is a permission", async r => {
    r.cloud.accepts = ["ask.kind"];
    const [question, permission] = await asks(r);
    assert.equal(question.kind, "question");
    assert.equal(permission.kind, "permission");
  });
}
