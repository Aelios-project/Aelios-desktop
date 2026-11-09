#!/usr/bin/env node
// A pretend ACP helper for the tests. It speaks the protocol on stdio and acts out what the prompt text says:
//   SLOW       waits until session/cancel, then ends the turn "cancelled"
//   SLEEP:n    works for n ms, then finishes
//   ASKME      ends with the ASK: line
//   QUESTION   ends with a plain question (no marker)
//   CRASH      dies mid-turn
//   PERM:kind[:path]   asks permission first and says what it was told; with RAW=<url-encoded command> the request carries it as rawInput
//   CWD        says the folder it was started in
// Env: FAKE_MODE (the mode Kiro reports), FAKE_NOMODE=1 (report no mode at all), FAKE_IMAGE=0|1 (take pictures or not; default: Kiro face yes, DSH face no),
//      FAKE_AGENTS (the folder of Kiro agent files; the start is logged with the file it was started with),
//      FAKE_PROBE (comma-separated names whose values the start log records)
// It wears two faces, picked by how it is started: `acp` (Kiro: session/load) or `--profile acp` (DSH: session/resume + close).
// Everything it is asked is appended to the file in FAKE_STORE, which also keeps its sessions between runs.
import fs from "node:fs";
import readline from "node:readline";

const args = process.argv.slice(2);
const dsh = args.join(" ") === "--profile acp";
const mode = () => dsh || !args.includes("--agent") || process.env.FAKE_NOMODE ? {} : { modes: { currentModeId: process.env.FAKE_MODE ?? args[args.indexOf("--agent") + 1] } };
if (!dsh && args[0] !== "acp") process.exit(64);
const file = process.env.FAKE_STORE;
const load = () => { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return { sessions: {}, log: [], n: 0 }; } };
const store = patch => { const data = load(); patch(data); fs.writeFileSync(file, JSON.stringify(data)); return data; };
const send = message => process.stdout.write(JSON.stringify(message) + "\n");
const chunk = (sessionId, text) => send({ jsonrpc: "2.0", method: "session/update", params: { sessionId, update: { sessionUpdate: "agent_message_chunk", content: { type: "text", text } } } });
const sleep = ms => new Promise(r => setTimeout(r, ms));

const waiting = new Map(); // requests we sent to the client
let nextId = 1000;
const cancelled = new Set(); const cancelWaiters = new Map();
const ask = (method, params) => new Promise(resolve => { const id = nextId++; waiting.set(id, resolve); send({ jsonrpc: "2.0", id, method, params }); });

const agentFile = () => { try { const c = JSON.parse(fs.readFileSync(`${process.env.FAKE_AGENTS}/${args[args.indexOf("--agent") + 1]}.json`, "utf8")); return { allowedTools: c.allowedTools, bash: Boolean(c.toolsSettings?.execute_bash) }; } catch { return null; } };
store(data => data.log.push({ event: "start", pid: process.pid, envNames: Object.keys(process.env), probe: Object.fromEntries((process.env.FAKE_PROBE ?? "").split(",").filter(Boolean).map(n => [n, process.env[n]])), args, ...(args.includes("--agent") && process.env.FAKE_AGENTS ? { agentFile: agentFile() } : {}) }));
const image = process.env.FAKE_IMAGE ? process.env.FAKE_IMAGE === "1" : !dsh;
process.stdout.write("this line is not JSON, a client must skip it\n");

async function prompt(id, params) {
  const { sessionId } = params, full = params.prompt.map(part => part.text).join(""), text = full.split("\n\nHow to talk to the user.")[0];
  const session = load().sessions[sessionId];
  store(data => data.log.push({ event: "prompt", sessionId, text, full, cwd: session?.cwd, blocks: params.prompt }));
  chunk(sessionId, "starting. ");
  send({ jsonrpc: "2.0", method: "session/update", params: { sessionId, update: { sessionUpdate: "tool_call", toolCallId: "t1", title: "look around", kind: "read" } } });
  if (text.includes("STEPSME")) { // several tool calls: a command with a secret and file contents in its input, two edits, a read
    const call = (n, update) => send({ jsonrpc: "2.0", method: "session/update", params: { sessionId, update: { sessionUpdate: "tool_call", toolCallId: "s" + n, ...update } } });
    call(1, { title: "Run tests", kind: "execute", rawInput: { command: "npm test --token=abc123456789", stdin: "FILE BODY SECRET" } });
    call(2, { title: "Edit a", kind: "edit", locations: [{ path: (session?.cwd ?? "") + "/src/a.js" }], rawInput: { new_string: "FILE BODY SECRET" } });
    call(3, { title: "Edit b", kind: "edit", locations: [{ path: (session?.cwd ?? "") + "/src/b.js" }] });
    call(4, { title: "Read c", kind: "read", locations: [{ path: (session?.cwd ?? "") + "/c.md" }] });
    await sleep(100);
  }
  if (text.includes("CRASH")) process.exit(3);
  if (text.includes("SLOW")) {
    chunk(sessionId, "partial work");
    if (!cancelled.has(sessionId)) await new Promise(resolve => { cancelWaiters.set(sessionId, resolve); setTimeout(resolve, 30_000); });
    cancelled.delete(sessionId);
    return send({ jsonrpc: "2.0", id, result: { stopReason: "cancelled" } });
  }
  const sleeping = /SLEEP:(\d+)/.exec(text);
  if (sleeping) await sleep(Number(sleeping[1]));
  let said = "";
  const perm = /PERM:(\w+)(?::(\S+))?/.exec(text);
  if (perm) {
    const outcome = await ask("session/request_permission", { sessionId,
      toolCall: { toolCallId: "t2", title: `do ${perm[1]} ${perm[2] ?? ""}`.trim(), kind: perm[1], status: "pending", locations: perm[2] ? [{ path: perm[2] }] : [], ...(/RAW=(\S+)/.test(text) ? { rawInput: { command: decodeURIComponent(/RAW=(\S+)/.exec(text)[1]) } } : {}) },
      options: [{ optionId: "always", name: "Always", kind: "allow_always" }, { optionId: "allow", name: "Allow", kind: "allow_once" }, { optionId: "reject", name: "Reject", kind: "reject_once" }] });
    said = ` perm=${outcome.outcome?.optionId ?? outcome.outcome?.outcome}`;
  }
  const long = /LONG:(\d+)/.exec(text);
  if (long) said += " " + "x".repeat(Number(long[1]));
  if (text.includes("CWD")) said += ` cwd=${session?.cwd}`;
  if (text.includes("NOTEME")) chunk(sessionId, "NOTE: found two config files\nWorking on it.\n");
  chunk(sessionId, text.includes("BLOCKME") ? "Tried two ways.\nBLOCKED: no network from this machine" : text.includes("ASKME") ? "I need you to decide.\nASK: Which one first?" : text.includes("QUESTION") ? "Done. Shall I carry on?" : `done: ${text}${said}`);
  send({ jsonrpc: "2.0", id, result: { stopReason: "end_turn" } });
}

readline.createInterface({ input: process.stdin }).on("line", async line => {
  const message = JSON.parse(line);
  if (message.method === undefined) return waiting.get(message.id)?.(message.result ?? {}), waiting.delete(message.id);
  const { id, method, params } = message;
  const reply = result => send({ jsonrpc: "2.0", id, result });
  if (method === "session/cancel") { store(data => data.log.push({ event: method, sessionId: params.sessionId })); cancelled.add(params.sessionId); cancelWaiters.get(params.sessionId)?.(); return; }
  store(data => data.log.push({ event: method, sessionId: params?.sessionId, cwd: params?.cwd, caps: params?.clientCapabilities }));
  if (method === "initialize") return reply({ protocolVersion: 1, agentCapabilities: { ...(dsh ? { sessionCapabilities: { resume: {}, close: {} } } : { loadSession: true }), ...(image ? { promptCapabilities: { image: true } } : {}) }, authMethods: [] });
  if (method === "session/new" && process.env.FAKE_HANG_NEW) return; // never answers: a stuck open
  if (method === "session/new") {
    const data = store(d => { d.n += 1; d.sessions[`sess-${d.n}`] = { cwd: params.cwd }; });
    return reply({ sessionId: `sess-${data.n}`, ...mode() });
  }
  if (method === "session/load" || method === "session/resume") {
    if (!load().sessions[params.sessionId]) return send({ jsonrpc: "2.0", id, error: { code: -32002, message: "session not found" } });
    if (method === "session/load") chunk(params.sessionId, "OLD HISTORY replayed on load");
    return reply(mode());
  }
  if (method === "session/close") return reply({});
  if (method === "session/prompt") return prompt(id, params);
  send({ jsonrpc: "2.0", id, error: { code: -32601, message: "method not found" } });
});
