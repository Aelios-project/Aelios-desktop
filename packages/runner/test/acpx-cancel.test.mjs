// A helper that never answers session/new must not hold the thread: cancel and stop both settle, and the process is gone.
import assert from "node:assert/strict";
import test from "node:test";
import { final, rig } from "./rig.mjs";

const alive = pid => { try { process.kill(pid, 0); return true; } catch { return false; } };
const until = async (check, what) => { for (let i = 0; i < 100; i++) { if (check()) return; await new Promise(r => setTimeout(r, 50)); } assert.fail(what); };
const hung = () => rig("kiro", { engine: "acpx", killAfterMs: 150, env: { FAKE_HANG_NEW: "1" } });
const started = r => { const logged = r.log(); return logged.some(e => e.event === "session/new") ? logged.find(e => e.event === "start").pid : 0; };

test("cancel ends a turn whose session/new never answers, and stops the helper", async () => {
  const r = await hung();
  try {
    r.config.env = { ...r.config.env, FAKE_STORE: r.store, FAKE_AGENTS: r.config.kiroAgentsDir };
    r.start();
    const work = r.cloud.push({ text: "first turn" });
    await until(() => started(r), "the helper was asked for a session");
    const pid = started(r);
    r.cloud.push({ kind: "cancel", text: undefined });
    assert.equal((await final(r, work)).status, "cancelled");
    await until(() => !alive(pid), "the helper process is still running");
    assert.equal(r.prompts().length, 0);
  } finally { await r.done(); }
});

test("stop settles while session/new never answers", async () => {
  const r = await hung();
  try {
    r.config.env = { ...r.config.env, FAKE_STORE: r.store, FAKE_AGENTS: r.config.kiroAgentsDir };
    r.start();
    r.cloud.push({ text: "first turn" });
    await until(() => started(r), "the helper was asked for a session");
    const pid = started(r);
    await Promise.race([r.stop(), new Promise((_, no) => setTimeout(() => no(new Error("stop did not settle")), 5000).unref())]);
    await until(() => !alive(pid), "the helper process is still running");
  } finally { await r.done(); }
});
