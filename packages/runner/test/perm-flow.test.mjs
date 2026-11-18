// A held permission reaches the resident, the owner's answer from there (or from this machine) settles it, and a
// full tier never asks. Runner + journal + fake resident + fake helper.
import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { Journal } from "../src/journal.mjs";
import { final, rig } from "./rig.mjs";

const RAW = command => `PERM:other RAW=${encodeURIComponent(command)}`;
async function held(extra = {}, holdMs = 5000) {
  const r = await rig("kiro", extra);
  r.journal = new Journal(path.join(r.dir, "journal.jsonl"), { holdMs, pollMs: 20 });
  return r;
}
const reports = (r, state) => (r.cloud.permissions ?? []).filter(item => item.state === state);

test("a held permission is reported, and the owner's Allow on the resident resolves it", async () => {
  const r = await held();
  try {
    r.start();
    const work = r.cloud.push({ text: RAW("git push origin main") });
    const sent = await r.cloud.until(() => reports(r, "held")[0], "the held report");
    assert.deepEqual(Object.keys(sent).sort(), ["detail", "id", "kind", "state", "title", "token", "workId"]);
    assert.equal(sent.workId, work.workId);
    assert.equal(sent.token, work.token);
    assert.match(sent.id, /^p_[0-9a-f]{10}$/);
    assert.equal(sent.detail, "git push origin main");
    assert.equal(sent.kind, "other");
    assert.ok(!JSON.stringify(sent).includes(r.cloud.deviceToken));
    r.cloud.answers = [{ id: sent.id, allow: true }]; // the owner's button
    const done = await final(r, work);
    assert.equal(done.status, "done");
    assert.match(done.summary, /perm=allow/);
    assert.deepEqual(r.journal.fold().perms.map(p => [p.id, p.decided, p.by]), [[sent.id, "allowed", "web"]]);
    assert.equal((await r.cloud.until(() => reports(r, "closed")[0], "the closed report")).id, sent.id);
  } finally { await r.done(); }
});

test("Deny on the resident turns it down", async () => {
  const r = await held();
  try {
    r.start();
    const work = r.cloud.push({ text: RAW("git push origin main") });
    const sent = await r.cloud.until(() => reports(r, "held")[0], "the held report");
    r.cloud.answers = [{ id: sent.id, allow: false }];
    const done = await final(r, work);
    assert.equal(done.status, "needs_you");
    assert.match(done.summary, /perm=reject/);
    assert.equal(r.journal.fold().perms[0].decided, "denied");
  } finally { await r.done(); }
});

test("a decision on this machine clears the resident's item (closed), and a late web answer changes nothing", async () => {
  const r = await held();
  try {
    r.start();
    const work = r.cloud.push({ text: RAW("git push origin main") });
    const sent = await r.cloud.until(() => reports(r, "held")[0], "the held report");
    assert.equal(r.journal.decide(sent.id, true, "you"), true);
    await final(r, work);
    await r.cloud.until(() => reports(r, "closed")[0], "the closed report");
    r.cloud.answers = [{ id: sent.id, allow: false }, { id: "x", allow: true }, null, { id: sent.id, allow: "no" }];
    await new Promise(resolve => setTimeout(resolve, 150));
    assert.deepEqual(r.journal.fold().perms.map(p => [p.decided, p.by]), [["allowed", "you"]]);
  } finally { await r.done(); }
});

test("no answer in time counts as deny and is closed on the resident too", async () => {
  const r = await held({}, 150);
  try {
    r.start();
    const work = r.cloud.push({ text: RAW("git push origin main") });
    const done = await final(r, work);
    assert.equal(done.status, "needs_you");
    assert.equal(r.journal.fold().perms[0].by, "timeout");
    await r.cloud.until(() => reports(r, "closed")[0], "the closed report");
  } finally { await r.done(); }
});

test("a resident that is down does not stop the turn from waiting for the owner here", async () => {
  const r = await held();
  try {
    r.start();
    r.cloud.push({ text: RAW("git push origin main") });
    const { id } = await r.cloud.until(() => r.journal.fold().perms[0], "the request in the journal");
    r.cloud.down = true;
    r.journal.decide(id, true, "you");
    r.cloud.down = false;
    await r.cloud.until(() => r.cloud.accepted.some(item => item.type === "final"), "the final");
  } finally { await r.done(); }
});

test("the runner judges nothing: even a read-only looking command is held in the edit tier, and full allows it unasked", async () => {
  const r = await held();
  try {
    r.start();
    const work = r.cloud.push({ text: RAW("uname -m") });
    const sent = await r.cloud.until(() => reports(r, "held")[0], "held in the edit tier");
    r.cloud.answers = [{ id: sent.id, allow: false }];
    assert.equal((await final(r, work)).status, "needs_you");
  } finally { await r.done(); }
  const full = await held({ access: "full" });
  try {
    full.start();
    const done = await final(full, full.cloud.push({ text: RAW("uname -m") }));
    assert.equal(done.status, "done");
    assert.equal(reports(full, "held").length, 0);
  } finally { await full.done(); }
});
