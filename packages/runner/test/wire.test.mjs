// What the runner sends depends on what the resident's heartbeat answer lists (wire.mjs): an old resident (no list)
// gets the first version of the protocol and refuses, with 400, anything else. Run once per engine (RUNNER_TEST_ENGINE).
import assert from "node:assert/strict";
import test from "node:test";
import { engineLabel } from "../src/engine-label.mjs";
import { outcomeOf } from "../src/outcome.mjs";
import { SUMMARY_MAX } from "../src/report.mjs";
import { Wire } from "../src/wire.mjs";
import { final, rig } from "./rig.mjs";

const NEW = ["heartbeat.engine", "receipt.ahead", "reason.refused", "reason.token_limit", "reason.no_result"];
const turn = (text = "", extra = {}) => ({ finished: [], current: text, denied: [], opened: "s1", tier: "read", timedOut: false, redact: (value, max = SUMMARY_MAX) => value.slice(0, max), ...extra });

test("Wire: no list means the first version; each name opens only its own field; the last answer wins", () => {
  const wire = new Wire(), refused = { kind: "refused", status: "needs_you", summary: "stopped", ask: { key: "k", question: "q" } };
  assert.deepEqual(wire.beat({ plugin: "kiro" }, "legacy"), { plugin: "kiro" });
  assert.deepEqual(wire.queued(2), {});
  assert.equal(wire.verdict(refused), refused);
  assert.equal(wire.summaryMax, SUMMARY_MAX);
  wire.learn({ ok: true, accepts: ["receipt.ahead", "reason.token_limit"], limits: { summary: 9000 } });
  assert.deepEqual(wire.beat({ plugin: "kiro" }, "legacy"), { plugin: "kiro" });
  assert.deepEqual([wire.queued(2), wire.queued(0), wire.queued(500)], [{ ahead: 2 }, {}, { ahead: 99 }]);
  assert.equal(wire.verdict(refused), refused, "refused is not listed");
  assert.deepEqual(wire.verdict({ ...refused, kind: "token_limit" }), { status: "failed", summary: "stopped", reason: "token_limit" });
  assert.equal(wire.summaryMax, 9000);
  wire.learn({ ok: true, accepts: "everything", limits: { summary: 3 } });
  assert.deepEqual([wire.accepts.size, wire.summaryMax], [0, SUMMARY_MAX], "a list that is not a list, and a limit that is not sane, count for nothing");
});

test("outcome: refusal, token limit and no result name their kind; a stop for too many requests does not", () => {
  const stop = reason => outcomeOf(turn("Partial."), reason, "new");
  assert.deepEqual(["refusal", "max_tokens", "max_turn_requests"].map(reason => stop(reason).kind), ["refused", "token_limit", undefined]);
  assert.equal(outcomeOf(turn(""), "end_turn", "new").kind, "no_result");
  assert.equal(outcomeOf(turn("Done."), "end_turn", "new").kind, undefined);
});

test("outcome: the report fits the resident's limit, not the built-in one", () => {
  const long = Array.from({ length: 30 }, (_, n) => `part ${n}\n` + "word ".repeat(190).trim());
  const out = outcomeOf(turn("the answer", { finished: long, summaryMax: 9000 }), "end_turn", "new");
  assert.ok(out.summary.length <= 9000 && out.summary.length > SUMMARY_MAX && out.summary.endsWith("\n\nthe answer"));
  assert.ok(outcomeOf(turn("the answer", { finished: long }), "end_turn", "new").summary.length <= SUMMARY_MAX, "no limit given: 4000");
});

for (const plugin of ["kiro", "dsh"]) {
  const t = (name, fn) => test(`[${plugin}] ${name}`, async () => { const r = await rig(plugin); try { await fn(r); } finally { await r.done(); } });
  const learned = r => r.cloud.until(() => r.cloud.beats >= 2, "two heartbeats"); // the second one carries what the first answer allowed

  t("an old resident: no engine, no ahead, today's mapping, and every receipt is accepted", async r => {
    r.start();
    await learned(r);
    assert.ok(r.cloud.beatBodies.every(body => !("engine" in body)), "an old resident would answer 400");
    const slow = r.cloud.push({ text: "SLEEP:300 first" });
    await r.cloud.until(() => r.cloud.got(slow.workId, "started")[0], "started");
    const mail = r.cloud.push({ kind: "mail", text: "second" });
    const queued = await r.cloud.until(() => r.cloud.got(mail.workId, "queued")[0], "queued receipt");
    assert.ok(!("ahead" in queued));
    await final(r, mail);
    for (const [text, stopped] of [["REFUSEME", /refusal/], ["MAXTOKME", /max_tokens/], ["SILENTME", /no text result/]]) {
      const done = await final(r, r.cloud.push({ text }));
      assert.equal(done.status, "needs_you", text);
      assert.equal(done.reason, undefined);
      assert.match(done.summary, stopped);
    }
  });

  t("a new resident: engine on the heartbeat, ahead on queued, the three reasons, its own summary limit", async r => {
    r.cloud.accepts = NEW; r.cloud.limits = { summary: 6000 }; r.cloud.summaryMax = 6000;
    r.start();
    await r.cloud.until(() => r.cloud.beatBodies?.some(body => body.engine), "a heartbeat with the engine");
    assert.equal(r.cloud.beatBodies.at(-1).engine, engineLabel(r.config));
    assert.match(r.cloud.beatBodies.at(-1).engine, process.env.RUNNER_TEST_ENGINE === "acpx" ? /^acpx@\d/ : /^legacy$/);
    assert.equal(r.cloud.beatBodies[0].engine, undefined, "the first beat is sent before anything is known");
    const slow = r.cloud.push({ text: "SLEEP:300 first" });
    await r.cloud.until(() => r.cloud.got(slow.workId, "started")[0], "started");
    const mail = r.cloud.push({ kind: "mail", text: "second" });
    assert.equal((await r.cloud.until(() => r.cloud.got(mail.workId, "queued")[0], "queued receipt")).ahead, 1, "the running turn is one");
    await final(r, mail);
    for (const [text, reason] of [["REFUSEME", "refused"], ["MAXTOKME", "token_limit"], ["SILENTME", "no_result"]]) {
      const done = await final(r, r.cloud.push({ text }));
      assert.deepEqual([done.status, done.reason, done.ask], ["failed", reason, undefined], text);
    }
    const long = await final(r, r.cloud.push({ text: "PARTS:20" }));
    assert.ok(long.summary.length > SUMMARY_MAX && long.summary.length <= 6000, "20 parts of about 1000 characters fit in 6000");
    assert.deepEqual(r.cloud.refused, []);
  });
}
