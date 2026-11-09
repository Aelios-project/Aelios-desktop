// Run by hand, not part of `npm test`:  node test/spike-acpx.mjs
// Checks, against the installed acpx and the fake helper (both faces), the names and behaviours the runner-acpx spec relies on.
// Each line it prints is one premise; it exits 1 if any is false.
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createAcpRuntime, createFileSessionStore } from "acpx/runtime";

const AGENT = path.join(path.dirname(fileURLToPath(import.meta.url)), "fake-agent.mjs");
const dir = mkdtempSync(path.join(os.tmpdir(), "spike-acpx-"));
const fake = path.join(dir, "agent.json");
process.env.FAKE_STORE = fake;
const store = createFileSessionStore({ stateDir: path.join(dir, "acpx") });
const sent = new Map(), modes = new Map(); // request id -> {method, sessionId}; ACP session id -> mode
const wire = [];
let argv;

const mk = () => createAcpRuntime({
  cwd: dir, sessionStore: store, agentRegistry: { resolve: () => argv, list: () => ["k"] }, permissionMode: "deny-all", nonInteractivePermissions: "deny",
  fs: false, terminal: false, elicitationModes: [], mcpServers: [],
  onAcpMessage: (direction, message) => {
    wire.push(`${direction[0]}:${message.method ?? "response"}`);
    if (direction === "outbound" && message.id != null) sent.set(message.id, { method: message.method, sessionId: message.params?.sessionId, caps: message.params?.clientCapabilities });
    const asked = direction === "inbound" && message.id != null ? sent.get(message.id) : null;
    if (asked && ["session/new", "session/load", "session/resume"].includes(asked.method)) modes.set(message.result?.sessionId ?? asked.sessionId, message.result?.modes?.currentModeId ?? null);
  }
});
const log = () => JSON.parse(readFileSync(fake, "utf8")).log.map(entry => entry.event);
const run = async (rt, handle, text, extra = {}) => {
  const turn = rt.startTurn({ handle, text, mode: "prompt", requestId: "r" + Math.random(), ...extra });
  let said = "";
  for await (const event of turn.events) if (event.type === "text_delta") said += event.text;
  return { result: await turn.result, said };
};
const ok = (name, detail = "") => console.log("TRUE  ", name, detail);

try {
  for (const face of [["acp", "--agent", "aelios-runner-abc"], ["--profile", "acp"]]) {
    const kiro = face[0] === "acp", key = kiro ? "kiro" : "dsh", label = kiro ? "[kiro face]" : "[dsh face]";
    writeFileSync(fake, JSON.stringify({ sessions: {}, log: [], n: 0 }));
    argv = [AGENT, ...face];
    let rt = mk();
    const handle = await rt.ensureSession({ sessionKey: key, agent: "k", mode: "persistent", cwd: dir });
    const sid = handle.backendSessionId;
    assert.ok(sid);
    ok(label + " session kept: ensureSession on a new key opens the session at once", sid);
    assert.equal((await run(rt, handle, "one")).result.status, "completed");

    // follow-up queueing: two turns started together run one after the other
    const [a, b] = await Promise.all([run(rt, handle, "SLEEP:150 first"), run(rt, handle, "second")]);
    assert.deepEqual([a.result.status, b.result.status], ["completed", "completed"]);
    ok(label + " follow-up queueing: both turns completed, in order");

    // runtime.close ends the helper, keeps the saved session
    await rt.close({ handle, reason: "tier change" });
    assert.equal((await store.load(handle.acpxRecordId)).closed, true);
    assert.equal((await store.load(handle.acpxRecordId)).acpSessionId, sid);
    ok(label + " runtime.close keeps the saved session id", "closed=true, id unchanged");
    const again = await rt.ensureSession({ sessionKey: key, agent: "k", mode: "persistent", cwd: dir, resumeSessionId: sid });
    assert.equal(again.backendSessionId, sid);
    assert.deepEqual(log().filter(e => e === "start").length, 1, "ensureSession after close is lazy: no process yet");
    await run(rt, again, "after close");
    assert.equal(log().filter(e => e === "start").length, 2);
    assert.ok(log().includes(kiro ? "session/load" : "session/resume"));
    ok(label + " after close, the next turn starts a new helper process that reloads the session", kiro ? "session/load" : "session/resume");

    // reattach after a runtime restart, from the same stateDir
    await rt.shutdown(); rt = mk();
    const reattached = await rt.ensureSession({ sessionKey: key, agent: "k", mode: "persistent", cwd: dir, resumeSessionId: sid });
    assert.equal((await run(rt, reattached, "after restart")).result.status, "completed");
    ok(label + " stateDir reattach after a runtime restart");

    // file modes
    const sessions = path.join(dir, "acpx", "sessions");
    assert.equal(statSync(path.join(dir, "acpx")).mode & 0o777, 0o700);
    assert.equal(statSync(path.join(sessions, key + ".json")).mode & 0o777, 0o600);
    ok(label + " acpx store modes", "dir 0700, record 0600");

    // image capability is readable from the saved record
    const caps = (await store.load(handle.acpxRecordId)).agentCapabilities;
    assert.equal(Boolean(caps?.promptCapabilities?.image), kiro);
    ok(label + " image capability readable after ensureSession", `agentCapabilities.promptCapabilities.image = ${caps?.promptCapabilities?.image}`);
    if (!kiro) {
      const refused = await run(rt, reattached, "see", { attachments: [{ mediaType: "image/png", data: "iVBORw0KGgo=" }] });
      assert.equal(refused.result.error?.detailCode, "UNSUPPORTED_PROMPT_CONTENT");
      ok(label + " acpx itself refuses an image for a helper without the capability (before the prompt)", "UNSUPPORTED_PROMPT_CONTENT");
    }

    // cancel
    const slow = rt.startTurn({ handle: reattached, text: "SLOW", mode: "prompt", requestId: "slow" });
    await slow.promptStarted; await new Promise(r => setTimeout(r, 150)); await slow.cancel();
    for await (const event of slow.events);
    assert.equal((await slow.result).status, "cancelled");
    ok(label + " cancel", "result.status = cancelled");

    // permission callback: sees the ACP request, one-time option; a throwing callback is a refusal
    let seen;
    const allowed = await run(rt, reattached, "PERM:execute", { onPermissionRequest: async request => { seen = request; return { outcome: "selected", optionId: "allow" }; } });
    assert.match(allowed.said, /perm=allow/);
    assert.ok(seen.raw.options.some(option => option.kind === "allow_once") && seen.raw.toolCall);
    const thrown = await run(rt, reattached, "PERM:execute", { onPermissionRequest: async () => { throw new Error("boom"); } });
    assert.match(thrown.said, /perm=reject/);
    ok(label + " permission callback: request.raw has options and toolCall; a throw is a refusal");

    // fs:false, terminal:false, elicitationModes:[] -> the helper is told so
    const init = [...sent.values()].find(item => item.caps);
    assert.deepEqual(init.caps, { fs: { readTextFile: false, writeTextFile: false }, terminal: false }, JSON.stringify(init.caps));
    ok(label + " clientCapabilities with fs:false, terminal:false", JSON.stringify(init.caps));

    // lost session: the helper no longer knows the session
    const data = JSON.parse(readFileSync(fake, "utf8")); delete data.sessions[sid]; writeFileSync(fake, JSON.stringify(data));
    await rt.close({ handle: reattached, reason: "lost" }); await rt.shutdown(); rt = mk();
    const lost = await rt.ensureSession({ sessionKey: key, agent: "k", mode: "persistent", cwd: dir, resumeSessionId: sid });
    let written = false;
    const turn = rt.startTurn({ handle: lost, text: "lost", mode: "prompt", requestId: "lost" });
    turn.promptStarted.then(() => { written = true; }, () => {});
    for await (const event of turn.events);
    const result = await turn.result;
    assert.equal(result.status, "failed");
    assert.equal(result.error.detailCode, "SESSION_RESUME_REQUIRED");
    assert.equal(written, false);
    assert.ok(!log().slice(-3).includes("session/prompt"));
    ok(label + " SESSION_RESUME_REQUIRED", `turn.result = failed, error.code ${result.error.code}, detailCode ${result.error.detailCode}; ensureSession did not throw; prompt not written`);
    const before = log().filter(e => e === "session/new").length;
    await rt.prepareFreshSession({ handle: lost });
    const fresh = await rt.ensureSession({ sessionKey: key, agent: "k", mode: "persistent", cwd: dir });
    assert.notEqual(fresh.backendSessionId, sid);
    assert.equal(log().filter(e => e === "session/new").length, before + 1);
    ok(label + " prepareFreshSession then ensureSession (no resume id) opens a new session", fresh.backendSessionId);
    await rt.shutdown();
  }

  // The mode: not in getStatus, not in the saved record; readable from the session/new|load reply in onAcpMessage,
  // and a throwing assertActive stops the turn after the load and before the prompt.
  writeFileSync(fake, JSON.stringify({ sessions: {}, log: [], n: 0 }));
  argv = [AGENT, "acp", "--agent", "aelios-runner-abc"];
  let rt = mk();
  const handle = await rt.ensureSession({ sessionKey: "mode", agent: "k", mode: "persistent", cwd: dir });
  assert.equal(modes.get(handle.backendSessionId), "aelios-runner-abc");
  assert.equal((await store.load(handle.acpxRecordId)).acpx?.current_mode_id, undefined);
  assert.doesNotMatch(JSON.stringify(await rt.getStatus({ handle })), /aelios-runner-abc/);
  await rt.close({ handle, reason: "t" });
  process.env.FAKE_MODE = "kiro_default";
  const reopened = await rt.ensureSession({ sessionKey: "mode", agent: "k", mode: "persistent", cwd: dir, resumeSessionId: handle.backendSessionId });
  assert.equal(log().filter(e => e === "start").length, 1, "reattach is lazy: the mode is not known until the first turn connects");
  const prompts = log().filter(e => e === "prompt").length;
  const turn = rt.startTurn({ handle: reopened, text: "must not run", mode: "prompt", requestId: "m", assertActive: () => { if (modes.get(reopened.backendSessionId) !== "aelios-runner-abc") throw new Error("mode mismatch"); } });
  for await (const event of turn.events);
  const result = await turn.result;
  assert.equal(result.status, "failed");
  assert.match(result.error.message, /mode mismatch/);
  assert.equal(log().filter(e => e === "prompt").length, prompts);
  ok("current mode is read from the session/new|load reply seen by onAcpMessage (not in getStatus or the record); assertActive runs after the load and before the prompt, so a mismatch stops the turn with no prompt sent");
  await rt.shutdown();
  console.log("\nAll premises hold for acpx", JSON.parse(readFileSync(new URL("../../../node_modules/acpx/package.json", import.meta.url), "utf8")).version);
} finally { rmSync(dir, { recursive: true, force: true }); }
