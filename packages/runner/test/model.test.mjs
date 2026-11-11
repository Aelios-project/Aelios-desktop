// A job's model and family (PROTOCOL.md, "job.model"): read only when the resident lists job.model; set by exact id
// before the prompt, with no fallback; dropped on Kiro with one fyi line. Run once per engine (RUNNER_TEST_ENGINE).
import assert from "node:assert/strict";
import test from "node:test";
import { idsOf, modelOption, refusal } from "../src/model.mjs";
import { readPick } from "../src/job-model.mjs";
import { Wire } from "../src/wire.mjs";
import { final, rig } from "./rig.mjs";

const LISTS = [{ id: "mode", type: "select", options: [] }, { id: "model", category: "model", type: "select", currentValue: "a", options: [{ group: "g", name: "G", options: [{ value: "a", name: "A" }, { value: "b", name: "B" }] }, { value: "c", name: "C" }] }];

test("model.mjs: finds the model option, flattens groups, matches exactly", () => {
  assert.deepEqual(idsOf(modelOption(LISTS)), ["a", "b", "c"]);
  assert.equal(modelOption([{ id: "mode", type: "select" }]), null);
  assert.equal(modelOption(undefined), null);
  assert.equal(refusal(["a", "b"], "b", "dsh"), null);
  for (const near of ["B", "b ", "", "a/b"]) assert.match(refusal(["a", "b"], near, "dsh"), /^model_selection_unsupported: .*offered: a, b/, near);
  assert.match(refusal(null, "a", "dsh"), /lists no model option/);
});

test("readPick: nothing unless the resident lists job.model; only well-formed values", () => {
  const raw = { model: "claude-sonnet-4-6", family: "anthropic" }, wire = new Wire();
  assert.deepEqual(readPick(raw, wire), {});
  wire.learn({ accepts: ["job.model"] });
  assert.deepEqual(readPick(raw, wire), raw);
  assert.deepEqual(readPick({ model: "two words", family: "Has Caps" }, wire), {});
  assert.deepEqual(readPick({ model: 5, family: ["x"] }, wire), {});
});

for (const plugin of ["dsh", "kiro"]) {
  const t = (name, fn) => test(`[${plugin}] ${name}`, async () => { const r = await rig(plugin); try { await fn(r); } finally { await r.done(); } });
  const go = (r, fields) => final(r, r.cloud.push({ text: "MODELME", ...fields }));
  const sets = r => r.log().filter(e => e.event === "session/set_config_option");
  const setup = (r, models = "alpha,beta") => { r.cloud.accepts = ["job.model"]; if (models) r.config.env.FAKE_MODELS = models; r.start(); };

  t("an old resident sends nothing, and a model that arrives anyway is not used", async r => {
    r.config.env.FAKE_MODELS = "alpha,beta"; r.start();
    const done = await go(r, { model: "beta", family: "openai" });
    assert.equal(done.status, "done");
    assert.deepEqual([sets(r).length, done.notice], [0, undefined]);
  });

  t("a job without a model sets nothing and leaves no notice", async r => {
    setup(r);
    const done = await go(r, {});
    assert.deepEqual([done.status, sets(r).length, done.notice], ["done", 0, undefined]);
  });

  if (plugin === "dsh") {
    t("the exact id is set before the prompt, and the helper answers on it", async r => {
      setup(r);
      const done = await go(r, { model: "beta", family: "openai" });
      assert.equal(done.status, "done");
      assert.match(done.summary, /model=beta/);
      assert.equal(done.notice, undefined);
      const events = r.log().map(e => e.event), set = events.indexOf("session/set_config_option");
      assert.ok(set > 0 && set < events.indexOf("prompt"));
      assert.deepEqual([sets(r).length, sets(r)[0].configId, sets(r)[0].value], [1, "model", "beta"]);
    });

    t("a thread that is resumed sets the model again", async r => {
      setup(r);
      await go(r, { model: "alpha" });
      const second = await final(r, r.cloud.push({ kind: "mail", text: "MODELME again", model: "beta" }));
      assert.match(second.summary, /model=beta/);
      assert.deepEqual(sets(r).map(e => e.value), ["alpha", "beta"]);
    });

    t("no model option: the turn fails before the prompt, and nothing falls back to the default", async r => {
      setup(r, "");
      const done = await go(r, { model: "beta" });
      assert.deepEqual([done.status, done.reason], ["failed", "error"]);
      assert.match(done.summary, /^model_selection_unsupported: dsh lists no model option/);
      assert.deepEqual([r.prompts().length, sets(r).length], [0, 0]);
    });

    t("an id that is not exactly offered fails, naming the offered ids; near matches too", async r => {
      setup(r);
      for (const wanted of ["gamma", "Beta", "bet"]) {
        const done = await go(r, { model: wanted });
        assert.equal(done.status, "failed", wanted);
        assert.match(done.summary, /^model_selection_unsupported: model ".*" is not offered by dsh; offered: alpha, beta/);
      }
      assert.deepEqual([r.prompts().length, sets(r).length], [0, 0]);
    });

    t("a reply that shows another value fails before the prompt", async r => {
      r.config.env.FAKE_MODEL_REPLY = "alpha";
      setup(r);
      const done = await go(r, { model: "beta" });
      assert.equal(done.status, "failed");
      assert.match(done.summary, /^model_selection_unsupported: dsh did not confirm model "beta" \(it reports "alpha"\)/);
      assert.equal(r.prompts().length, 0);
    });

    t("the same known family as the previous job runs, with one fyi line; an unknown one gets none", async r => {
      setup(r);
      const first = await go(r, { thread: "t_one", model: "alpha", family: "openai" });
      const second = await go(r, { thread: "t_two", model: "beta", family: "openai" });
      const other = await go(r, { thread: "t_three", model: "beta", family: "anthropic" });
      assert.equal(first.notice, undefined);
      assert.equal(second.status, "done");
      assert.equal(second.notice.fyi, true);
      assert.match(second.notice.text, /same model family \(openai\)/);
      assert.equal(other.notice, undefined);
      const unknown = [await go(r, { thread: "t_four", family: "zzz-lab" }), await go(r, { thread: "t_five", family: "zzz-lab" })];
      assert.deepEqual(unknown.map(done => [done.status, done.notice]), [["done", undefined], ["done", undefined]]);
    });
  } else {
    t("Kiro runs on auto: the model is dropped, the prompt runs, one fyi line says so", async r => {
      setup(r);
      const done = await go(r, { model: "beta", family: "anthropic" });
      assert.equal(done.status, "done");
      assert.match(done.summary, /model=default/);
      assert.equal(sets(r).length, 0);
      assert.deepEqual(done.notice, { text: "Kiro runs on auto; the model in the role pack was not used (beta).", fyi: true });
    });

    t("Kiro is its own family, whatever the card says", async r => {
      setup(r);
      await go(r, { thread: "t_one", family: "openai" });
      const second = await go(r, { thread: "t_two", family: "anthropic" });
      assert.match(second.notice.text, /same model family \(kiro-auto\)/);
    });
  }
}
