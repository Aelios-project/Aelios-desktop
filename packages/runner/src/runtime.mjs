// The one acpx runtime of the runner process, with what the turns need to know about it: the registry of helpers it may
// start, the tier each open session was started with, and the mode each session reported when it was opened.
// The mode is not in getStatus and not in the saved record; it is only in the reply to session/new or session/load, which
// onAcpMessage lets us see. shortcut: onAcpMessage is documented as best effort; an unseen mode fails the Kiro check closed.
import { createAcpRuntime, createFileSessionStore } from "acpx/runtime";
import { envFor } from "./env-allow.mjs";
import { openStore } from "./store.mjs";

const OPENING = new Set(["session/new", "session/load", "session/resume"]);

export function createEngine(config, home) {
  let self; // the engine object below; the hooks run only after it exists
  const registry = new Map(); // registry name -> argv
  const asked = new Map(); // JSON-RPC request id -> {method, sessionId}
  const modes = new Map(); // ACP session id -> current mode id (null when the helper did not say)
  const pids = new Map(); // session key -> pid of its helper process, so a stuck open can still be stopped
  const helperEnv = envFor(config.plugin, config, process.env);
  const sessionStore = createFileSessionStore({ stateDir: openStore(home) });
  const runtime = createAcpRuntime({
    cwd: config.workspace, sessionStore, mcpServers: [],
    agentRegistry: {
      resolve: name => { const argv = registry.get(name); if (!argv) throw new Error(`unknown helper "${name}"`); return argv; },
      list: () => [...registry.keys()]
    },
    permissionMode: "deny-all", nonInteractivePermissions: "deny", // fail closed: anything our callback does not answer is refused
    fs: false, terminal: false, elicitationModes: [],
    processLifecycle: {
      onBeforeSpawn: p => { if (p.scope.kind === "runtime-session") self.watch?.("spawning"); },
      onSpawned: p => { if (p.scope.kind === "runtime-session") { pids.set(p.scope.sessionKey, p.pid); self.watch?.("spawned"); } },
      onExit: p => { if (p.scope.kind === "runtime-session" && pids.get(p.scope.sessionKey) === p.pid) pids.delete(p.scope.sessionKey); }
    },
    agentProcessEnvAllow: helperEnv.allow, agentProcessEnv: helperEnv.env, // an allowlist, not the runner's whole environment
    onAcpMessage: (direction, message) => {
      if (direction === "outbound" && message.id != null) asked.set(message.id, { method: message.method, sessionId: message.params?.sessionId });
      const request = direction === "inbound" && message.id != null && message.method === undefined ? asked.get(message.id) : null;
      if (request) asked.delete(message.id);
      if (request?.method === "initialize") self.watch?.("initialized");
      // acpx may load a saved session lazily, inside startTurn: the request and its answer bound the session stage there too.
      if (direction === "outbound" && OPENING.has(message.method)) self.watch?.("opening");
      if (request && OPENING.has(request.method)) self.watch?.("opened");
      if (request && OPENING.has(request.method) && message.result) modes.set(message.result.sessionId ?? request.sessionId, message.result.modes?.currentModeId ?? null);
    }
  });
  return (self = {
    runtime, sessionStore, modes, pids,
    watch: null, // set by the running turn for its stage timers: "spawning", "spawned", "initialized" (one turn runs at a time)
    tiers: new Map(), // session key -> the tier its open helper process was started with
    register: entries => { for (const [name, argv] of Object.entries(entries)) registry.set(name, argv); },
    shutdown: () => runtime.shutdown()
  });
}
