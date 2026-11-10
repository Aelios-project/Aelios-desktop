// A finished turn's report: every text part in order, notes taken out, ASK:/BLOCKED: from the last line, redacted and then fitted.
import assert from "node:assert/strict";
import test from "node:test";
import { outcomeOf } from "../src/outcome.mjs";
import { SUMMARY_MAX, fitReport } from "../src/report.mjs";
import { final, rig } from "./rig.mjs";

const turn = (finished, current = "", redact = (text, max = SUMMARY_MAX) => text.slice(0, max)) => ({ finished, current, denied: [], opened: "s1", tier: "read", timedOut: false, redact });
const MARK = /\[\.\.\. (\d+) characters left out \.\.\.\]/;

test("three parts and two tool calls: all three are in the summary, in order; a NOTE: is in the notice only", () => {
  const out = outcomeOf(turn(["NOTE: saw a lock file\nFirst part.", "Second part."], "Third part."), "end_turn", "new");
  assert.equal(out.status, "done");
  assert.equal(out.summary, "First part.\n\nSecond part.\n\nThird part.");
  assert.deepEqual(out.notice, { text: "saw a lock file", fyi: true });
});

test("a turn of 20000 characters: within the limit, starts with the start, has the mark, ends with the last part whole", () => {
  const early = Array.from({ length: 20 }, (_, n) => `part ${n}\n` + "word ".repeat(190).trim());
  const out = outcomeOf(turn(early, "The answer is 42.\nSecond line of the answer."), "end_turn", "new");
  assert.ok(out.summary.length <= SUMMARY_MAX && out.summary.length > 3000);
  assert.ok(out.summary.startsWith("part 0\nword word"));
  assert.ok(out.summary.endsWith("\n\nThe answer is 42.\nSecond line of the answer."));
  const [, count] = MARK.exec(out.summary);
  const head = out.summary.slice(0, out.summary.indexOf("\n\n[..."));
  assert.equal(Number(count), early.join("\n\n").length - head.length, "the count is what was dropped");
  assert.match(head, /word$/, "the cut is at the end of a line, not in the middle of one");
});

test("the cut falls at a paragraph end when there is one, and never in the middle of a character", () => {
  assert.match(fitReport(["a".repeat(2500), "b".repeat(2500), "end"], 4000), /^a+\n\n\[\.\.\. 2502 characters left out \.\.\.\]\n\nend$/);
  const emoji = fitReport(["😀".repeat(3000), "end"], 4000);
  assert.ok(emoji.length <= 4000 && !/[\ud800-\udbff]\n/.test(emoji));
  assert.equal(fitReport(["short", "text"]), "short\n\ntext", "nothing is cut when it fits");
});

test("a last part over the limit alone: the mark first, then the end of the turn from a line start", () => {
  const body = Array.from({ length: 600 }, (_, n) => `line ${n}`).join("\n");
  const out = fitReport(["first", body]);
  const tail = out.slice(out.indexOf("\n\n") + 2);
  assert.ok(out.length <= SUMMARY_MAX && MARK.test(out) && out.startsWith("[... ") && out.endsWith("line 599") && tail.startsWith("line "));
  assert.equal(Number(MARK.exec(out)[1]), `first\n\n${body}`.length - tail.length, "the count is what was dropped");
  assert.ok(!/^line \d+\n.*first/s.test(out) && !out.includes("first"), "the start is gone");
  const emoji = fitReport(["😀".repeat(9000)]);
  assert.ok(emoji.length <= SUMMARY_MAX && !/\n\n[\udc00-\udfff]/.test(emoji));
});

test("redaction comes before the cut: a secret across the cut leaves no piece of itself", () => {
  const secret = "SECRETTOKEN1234567890";
  const redact = (text, max = SUMMARY_MAX) => text.split(secret).join("[token]").slice(0, max);
  const out = outcomeOf(turn(["x".repeat(3990) + secret + "y".repeat(3000)], "last", redact), "end_turn", "new");
  assert.ok(!/SECRET|TOKEN1/.test(out.summary));
  assert.ok(out.summary.length <= SUMMARY_MAX);
});

test("ASK: on the last line of a turn with earlier parts: needs_you, and the earlier text is the summary", () => {
  const out = outcomeOf(turn(["Looked at the code.", "Two ways exist."], "I need you to decide.\nASK: Which one first?"), "end_turn", "new");
  assert.equal(out.status, "needs_you");
  assert.equal(out.ask.question, "Which one first?");
  assert.equal(out.summary, "Looked at the code.\n\nTwo ways exist.\n\nI need you to decide.");
  assert.equal(outcomeOf(turn(["Looked."], "ASK: Which one?"), "end_turn", "new").summary, "Looked.");
});

test("BLOCKED: keeps the earlier parts after the reason; a long ask is fitted too", () => {
  const out = outcomeOf(turn(["Tried one way."], "Tried two.\nBLOCKED: no network"), "end_turn", "new");
  assert.equal(out.summary, "Blocked: no network\n\nTried one way.\n\nTried two.");
  const long = outcomeOf(turn(["m ".repeat(3000)], "last\nASK: ok?"), "end_turn", "new");
  assert.ok(long.summary.length <= SUMMARY_MAX && long.summary.endsWith("\n\nlast") && MARK.test(long.summary));
});

for (const plugin of ["kiro", "dsh"]) {
  const t = (name, fn) => test(`[${plugin}] ${name}`, async () => { const r = await rig(plugin); try { await fn(r); } finally { await r.done(); } });

  t("mid-turn text reaches the receipt, and the notes go to the notice", async r => {
    r.start();
    const done = await final(r, r.cloud.push({ text: "PARTSME" }));
    assert.equal(done.summary, "starting.\n\nFirst part.\n\nSecond part.\n\ndone: PARTSME");
    assert.deepEqual(done.notice, { text: "saw it", fyi: true });
  });

  t("a 20000-character turn is cut by the runner, so the resident takes the receipt", async r => {
    r.start();
    const done = await final(r, r.cloud.push({ text: "PARTS:20" }));
    assert.deepEqual(r.cloud.refused, [], "the resident refused a summary over its limit");
    assert.ok(done.summary.length <= SUMMARY_MAX && done.summary.startsWith("starting.\n\npart 1 y") && MARK.test(done.summary) && done.summary.endsWith("\n\ndone: PARTS:20"));
  });
}

test("the fake resident refuses a summary over its limit with 400, as the real one does", async () => {
  const r = await rig("kiro");
  try {
    const work = r.cloud.push({ text: "x" });
    const send = summary => fetch(`${r.cloud.url}/v1/receipt`, { method: "POST", headers: { authorization: "Bearer " + r.cloud.deviceToken }, body: JSON.stringify({ receiptId: `${work.workId}:final`, workId: work.workId, token: work.token, type: "final", status: "done", summary }) });
    assert.equal((await send("x".repeat(SUMMARY_MAX + 1))).status, 400);
    assert.equal(r.cloud.refused.length, 1);
    assert.equal((await send("x".repeat(SUMMARY_MAX))).status, 200);
  } finally { await r.done(); }
});

test("BLOCKED: after a long narrative keeps its reason, and the narrative gives way", () => {
  const out = outcomeOf(turn([], "Earlier detail.\n".repeat(500) + "BLOCKED: NEEDS_NETWORK_SENTINEL"), "end_turn", "new");
  assert.equal(out.status, "failed");
  assert.ok(out.summary.startsWith("Blocked: NEEDS_NETWORK_SENTINEL\n\n") && out.summary.length <= SUMMARY_MAX && MARK.test(out.summary));
});

test("a question-only ASK: is the summary, not '(no content)'", () => {
  const out = outcomeOf(turn([], "ASK: Which one?"), "end_turn", "new");
  assert.equal(out.status, "needs_you");
  assert.equal(out.summary, "Which one?");
});

test("a BLOCKED: line alone is the summary", () => {
  assert.equal(outcomeOf(turn([], "BLOCKED: no network"), "end_turn", "new").summary, "Blocked: no network");
});
