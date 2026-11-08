// The reason code on a failed final receipt (src/reason.mjs, PROTOCOL.md). Run: node --test --test-concurrency=1 test/reason.test.mjs
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { reasonOf, reasonOfStart } from "../src/reason.mjs";
import { final, rig } from "./rig.mjs";

test("what the helper's error says decides the code; the key comes before the login", () => {
  assert.equal(reasonOf(-32000, "Authentication required"), "needs_login");
  assert.equal(reasonOf(undefined, "Please sign in first"), "needs_login");
  assert.equal(reasonOf(undefined, "401 Unauthorized"), "needs_login");
  assert.equal(reasonOf(undefined, "Invalid API key (401)"), "missing_key");
  assert.equal(reasonOf(undefined, "403 Forbidden"), "permission_denied");
  assert.equal(reasonOf(-32603, "something broke"), "error");
  assert.equal(reasonOfStart(new Error("helper did not start: ENOENT")), "helper_missing");
  assert.equal(reasonOfStart(new Error("helper exited (1)"), "please log in"), "needs_login");
  assert.equal(reasonOfStart(new Error("helper exited (1)")), "error");
});

test("a helper that cannot be started fails with helper_missing", async () => {
  const r = await rig("kiro", { bin: "/nonexistent/aelios-helper" });
  try {
    r.start();
    const done = await final(r, r.cloud.push({ text: "go" }));
    assert.equal(done.status, "failed");
    assert.equal(done.reason, "helper_missing");
  } finally { await r.done(); }
});

test("a workspace that cannot be made fails with workspace_denied", async () => {
  const r = await rig("kiro");
  try {
    const blocker = path.join(r.dir, "blocker");
    writeFileSync(blocker, "a file, not a folder");
    r.config.workspace = path.join(blocker, "work");
    r.start();
    const done = await final(r, r.cloud.push({ text: "go" }));
    assert.equal(done.status, "failed");
    assert.equal(done.reason, "workspace_denied");
  } finally { await r.done(); }
});

test("a blocked turn and an unreadable message say error; a normal result carries no reason", async () => {
  const r = await rig("kiro");
  try {
    r.start();
    const blocked = await final(r, r.cloud.push({ text: "BLOCKME fetch it" }));
    assert.equal(blocked.status, "failed");
    assert.equal(blocked.reason, "error");
    const fine = await final(r, r.cloud.push({ text: "hello" }));
    assert.equal(fine.status, "done");
    assert.ok(!("reason" in fine));
  } finally { await r.done(); }
});
