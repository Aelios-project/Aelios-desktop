// Steps by toolCallId, the middle ellipsis, thinking and usage on the acpx engine (task 10).
import assert from "node:assert/strict";
import test from "node:test";
import { describeInput } from "../src/detail.mjs";
import { middle } from "../src/ellipsis.mjs";
import { usageLine } from "../src/events.mjs";
import { answer } from "../src/permission.mjs";
import { KeyedSteps } from "../src/steps-keyed.mjs";
import { StepLog, TITLE_MAX } from "../src/steps.mjs";
import { final, rig } from "./rig.mjs";

const keyed = () => new KeyedSteps(new StepLog({ cwd: "/w", redact: text => text.split("/w").join("[workspace]") }));
const LONG = "npm run build -- " + "--flag ".repeat(60) + "--last-flag";

test("middle ellipsis keeps both ends and the length", () => {
  assert.equal(middle("short", 10), "short");
  const cut = middle("a".repeat(50) + "MIDDLE" + "z".repeat(50), 21);
  assert.equal(cut.length, 21);
  assert.ok(cut.startsWith("aaaaaaaaaa") && cut.endsWith("zzzzzzzzzz") && cut.includes("…"));
});

test("an update with the same toolCallId changes the step in place and adds none", () => {
  const steps = keyed();
  steps.take({ tag: "tool_call", toolCallId: "c1", kind: "execute", title: "Run", status: "pending", rawInput: { command: "npm test" } });
  assert.equal(steps.take({ tag: "tool_call_update", toolCallId: "c1", status: "in_progress" }), null, "a status change alone sends nothing");
  assert.equal(steps.of("c1").status, "in_progress");
  const after = steps.take({ tag: "tool_call_update", toolCallId: "c1", status: "completed", rawInput: { command: LONG } });
  assert.equal(after.length, 1);
  assert.equal(steps.of("c1").status, "completed");
  const title = after[0].title;
  assert.ok(title.length <= TITLE_MAX && title.startsWith("ran npm run build") && title.endsWith("--last-flag") && title.includes("…"), title);
  assert.equal(steps.of("c1").command, LONG, "the full command is kept locally");
  assert.deepEqual(Object.keys(after[0]).sort(), ["kind", "title"], "the wire step stays kind and title");
  steps.take({ tag: "tool_call", toolCallId: "c2", kind: "read", title: "Read", locations: [{ path: "/w/a.js" }] });
  assert.equal(steps.log.steps.length, 2, "a new id is a new step");
});

test("two ids with the same command are two steps with their own records; an update reaches only its own", () => {
  const steps = keyed();
  steps.take({ tag: "tool_call", toolCallId: "a", kind: "execute", title: "Run", status: "pending", rawInput: { command: "npm test" } });
  steps.take({ tag: "tool_call", toolCallId: "b", kind: "execute", title: "Run", status: "pending", rawInput: { command: "npm test" } });
  assert.equal(steps.log.steps.length, 2);
  steps.take({ tag: "tool_call_update", toolCallId: "b", status: "completed", rawInput: { command: "npm test -- --watch=false" } });
  assert.deepEqual([steps.of("a").status, steps.of("b").status], ["pending", "completed"]);
  assert.deepEqual(steps.log.steps.map(s => s.title), ["ran npm test", "ran npm test -- --watch=false"]);
  assert.equal(steps.of("a").command, "npm test");
});

test("the rewritten secret patterns hide what the old ones hid", () => {
  const cases = {
    "foo-token abc": "foo-token [hidden]", "-api_key=x": "-api_key=[hidden]", "x.token=abc d": "x.token=[hidden] d", "MY_API_KEY: v": "MY_API_KEY: [hidden]",
    '--password "a b c" z': "--password [hidden] z", "a--token z": "a--token [hidden]", "https://u:p@h": "https://u:[hidden]@h", "-http://u:p@h": "-http://u:[hidden]@h",
    "1http://u:p@h": "1http://u:p@h", "Authorization: Bearer abcdefghij": "Authorization: [hidden] [hidden]", "plain words only": "plain words only"
  };
  for (const [input, want] of Object.entries(cases)) assert.equal(describeInput(input, Infinity), want, input);
});

test("a command past 4000 characters keeps its real end, locally and in the title", () => {
  const steps = keyed(), long = "echo " + "x".repeat(4500) + " --last-argument";
  steps.take({ tag: "tool_call", toolCallId: "l", kind: "execute", title: "Run", rawInput: { command: long } });
  assert.equal(steps.of("l").command, long, "kept whole");
  assert.ok(steps.log.steps[0].title.endsWith("--last-argument"));
});

test("a quoted secret that starts deep in a long command stays hidden in the detail, the title and the local copy", () => {
  const command = "echo " + "word ".repeat(2400) + ' --password "' + "vv ".repeat(5000) + 'SYNTHETIC_PRIVATE_TAIL" --last';
  const { hold } = answer("read", { toolCall: { title: "Run", kind: "execute", rawInput: { command } }, options: [{ optionId: "a", kind: "allow_once" }] });
  const steps = keyed();
  steps.take({ tag: "tool_call", toolCallId: "p", kind: "execute", title: "Run", rawInput: { command } });
  for (const [where, shown] of [["detail", hold.detail], ["title", steps.log.steps[0].title], ["local", steps.of("p").command]]) {
    assert.ok(!shown.includes("SYNTHETIC_PRIVATE_TAIL") && !shown.includes("vv vv"), where);
    assert.ok(shown.endsWith("--last"), where);
  }
  assert.ok(steps.of("p").command.includes('--password [hidden] --last'), "the local copy is whole, with the secret replaced");
});

test("redaction stays fast on long runs that never match", () => {
  const started = Date.now();
  for (const line of ["a-".repeat(50_000), "key-".repeat(25_000), "a.".repeat(50_000) + "://u:p", "-a".repeat(50_000)]) describeInput(line, Infinity);
  assert.ok(Date.now() - started < 2000, `took ${Date.now() - started} ms`);
});

test("a permission request shows the command from its input, cut in the middle, never a step title", () => {
  const { hold } = answer("read", { toolCall: { title: "Run", kind: "execute", rawInput: { command: LONG } }, options: [{ optionId: "a", kind: "allow_once" }] });
  assert.ok(hold.detail.startsWith("npm run build") && hold.detail.endsWith("--last-flag"), hold.detail);
  assert.equal(describeInput(LONG, Infinity), LONG.replace(/\s+/g, " "));
});

test("usage: one line only when a cost was reported", () => {
  assert.equal(usageLine(undefined), "");
  assert.equal(usageLine({ used: 1, size: 2 }), "");
  assert.equal(usageLine({ used: 1200, size: 200000, cost: { amount: 0.25, currency: "USD" } }), "Helper usage so far in this session: 0.25 USD; context 1200 of 200000 tokens.");
});

test("end to end on acpx: patched steps, a thinking step, no thought text in the summary, usage as one fyi notice", async () => {
  const r = await rig("kiro", { engine: "acpx", progressMs: 20 });
  try {
    r.start();
    const done = await final(r, r.cloud.push({ text: "THINKME UPDATEME USAGEME go" }));
    assert.equal(done.status, "done");
    assert.ok(!done.summary.includes("SECRET THOUGHT"));
    assert.deepEqual(done.notice, { fyi: true, text: "Helper usage so far in this session: 0.25 USD; context 1200 of 200000 tokens." });
    await r.cloud.until(() => r.cloud.progresses?.some(p => p.steps.some(s => s.title.endsWith("--last-flag"))), "the patched step");
    const last = r.cloud.progresses.at(-1).steps;
    assert.equal(last.filter(s => s.kind === "run").length, 1, "the updates did not add steps");
    assert.ok(last.some(s => s.kind === "think" && s.title === "thinking"));
    assert.ok(!JSON.stringify(r.cloud.progresses).includes("SECRET THOUGHT"));
  } finally { await r.done(); }
});
