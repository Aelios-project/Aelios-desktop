import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { Journal } from "../src/journal.mjs";
import { answer } from "../src/permission.mjs";

const make = opts => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "jr-"));
  return { journal: new Journal(path.join(dir, "journal.jsonl"), { pollMs: 10, ...opts }), done: () => rmSync(dir, { recursive: true, force: true }) };
};
const ask = { toolCall: { kind: "execute", title: "git push" }, options: [{ kind: "allow_once", optionId: "a" }, { kind: "reject_once", optionId: "r" }] };

test("only a refusal made by the tier is held; a path outside the folder is not", () => {
  assert.deepEqual(answer("edit", ask, "/tmp").hold, { title: "git push", kind: "execute", paths: [] });
  assert.equal(answer("edit", { ...ask, toolCall: { kind: "edit", locations: [{ path: "/etc/hosts" }] } }, "/tmp").hold, null);
  assert.equal(answer("full", ask, "/tmp").hold, null);
});

test("a held request shows the real command, shortened, with secrets hidden, and the journal keeps it", async () => {
  const rawInput = { command: "curl", args: ["-H", "Authorization: Bearer abcdefgh12345678", "https://u:pw@x.example", "--token", "s3cret"], env: "API_KEY=zzz" };
  const { hold } = answer("edit", { ...ask, toolCall: { ...ask.toolCall, title: "Read file", rawInput } }, "/tmp");
  assert.match(hold.detail, /^curl -H Authorization: \[hidden\]/);
  for (const secret of ["abcdefgh12345678", "pw@", "s3cret"]) assert.ok(!hold.detail.includes(secret), secret);
  assert.ok(answer("edit", { ...ask, toolCall: { ...ask.toolCall, rawInput: "x".repeat(2000) } }, "/tmp").hold.detail.length <= 300);
  const { journal, done } = make({ holdMs: 30 });
  try {
    await journal.hold("t1", hold);
    assert.equal(journal.fold().perms[0].detail, hold.detail);
  } finally { done(); }
});

test("a held request waits for the owner's answer, once", async () => {
  const { journal, done } = make();
  try {
    const waiting = journal.hold("t1", { title: "git push", kind: "execute", paths: [] });
    await new Promise(resolve => setTimeout(resolve, 30));
    const [request] = journal.fold().perms;
    assert.equal(request.decided, null);
    assert.equal(journal.decide(request.id, true), true);
    assert.equal(journal.decide(request.id, false), false); // the first answer stands
    assert.equal(await waiting, true);
    assert.equal(journal.fold().perms[0].decided, "allowed");
  } finally { done(); }
});

test("no answer in time, or a stopped turn, is a no", async () => {
  const { journal, done } = make({ holdMs: 40 });
  try {
    assert.equal(await journal.hold("t1", { title: "x", kind: "execute", paths: [] }), false);
    assert.equal(await journal.hold("t1", { title: "y", kind: "execute", paths: [] }, () => true), false);
    assert.deepEqual(journal.fold().perms.map(p => [p.decided, p.by]), [["denied", "timeout"], ["denied", "stopped"]]);
  } finally { done(); }
});

test("turns fold with how they ended", () => {
  const { journal, done } = make();
  try {
    journal.turn({ thread: "t1", workId: "w1", kind: "job", text: "do it" });
    journal.end({ thread: "t1", workId: "w1" }, "done", "ok");
    journal.turn({ thread: "t1", workId: "w2", kind: "say", text: "again" });
    const turns = journal.fold().turns.t1;
    assert.deepEqual(turns.map(t => [t.kind, t.end?.status ?? null]), [["job", "done"], ["say", null]]);
  } finally { done(); }
});
