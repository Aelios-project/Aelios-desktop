// The busy line under a reply, and how its words split into bubbles: the rules the resident's page uses.
import assert from "node:assert/strict";
import { test } from "node:test";
import { busyOf, bubbleTexts, toolWord } from "../client/activity.mjs";

test("activity: a reply with nothing behind it has no busy line", () => {
  assert.equal(busyOf({ text: "hello" }), null);
  assert.equal(busyOf({ text: "hello", activity: [] }), null);
  assert.equal(busyOf({}), null);
});

test("activity: thoughts and tools become one line with one row each", () => {
  const line = {
    id: "m1",
    pending: false,
    activity: [
      { type: "reasoning", text: "let me look at the ledger" },
      { type: "tool", id: "t1", name: "web_search", input: '{"query":"july ledger"}', output: "forty entries", state: "output-available" },
      { type: "tool", id: "t2", name: "made_up_tool", input: "raw", state: "output-error" },
    ],
  };
  const busy = busyOf(line);
  assert.equal(busy.label, "thought for a moment · used 2 tools");
  assert.equal(busy.live, false);
  assert.deepEqual(busy.items.map((x) => [x.key, x.what, x.detail, x.state]), [
    ["r0", "thought", "let me look at the ledger", ""],
    ["t0", "searched the web", "july ledger", ""],
    ["t1", "made_up_tool", "raw", "failed"],
  ]);
  assert.deepEqual(busy.items[1].body.map((b) => b.label), ["Input", "Result"]);
  assert.deepEqual(busy.items[0].body.map((b) => b.label), [""]);
});

test("activity: while it is still going the line says so", () => {
  const busy = busyOf({ pending: true, activity: [{ type: "reasoning", text: "hm" }] });
  assert.equal(busy.label, "thinking…");
  assert.equal(busy.live, true);
  assert.equal(busyOf({ pending: true, activity: [{ type: "tool", name: "web_fetch" }] }).label, "used 1 tool · still going");
});

test("activity: tool names the page does not know are said as they are", () => {
  assert.equal(toolWord("web_fetch"), "read a page");
  assert.equal(toolWord("mcp_playwright"), "used playwright");
  assert.equal(toolWord(""), "used a tool");
});

test("bubbles: a blank line splits, a fenced block does not", () => {
  assert.deepEqual(bubbleTexts("one\n\ntwo"), ["one", "two"]);
  assert.deepEqual(bubbleTexts("one\n```\na\n\nb\n```\n\ntwo"), ["one\n```\na\n\nb\n```", "two"]);
  assert.deepEqual(bubbleTexts("   \n\n"), []);
  assert.deepEqual(bubbleTexts("only"), ["only"]);
});
