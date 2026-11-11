// A plug is only "how to start the helper". Everything else (sessions, cancel, permissions) is shared in helper.mjs.
// The helper is chosen by this machine's config, never by a job.
import { accessSync, constants } from "node:fs";
import path from "node:path";
import { ADAPTERS, adapterLaunch } from "./adapters.mjs";
import { writeAgent } from "./kiro-agent.mjs";
import { agentsDirOf, kiroHomeOf } from "./kiro-home.mjs";
import { TIERS } from "./permission.mjs";
import { homeDir } from "./state.mjs";

const DSH_APP = "/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh";

export function onPath(name) {
  for (const dir of (process.env.PATH ?? "").split(path.delimiter)) {
    if (!dir) continue;
    try { accessSync(path.join(dir, name), constants.X_OK); return path.join(dir, name); } catch { /* next */ }
  }
  return null;
}

export const PLUGINS = {
  // kiro-cli acp. Kiro decides for itself what it approves, from a generated agent config (kiro-agent.mjs; "full" approves
  // every tool). The agent name has no tier. Everything Kiro asks about is held by the runner.
  kiro: {
    bin: () => onPath("kiro-cli") ?? "kiro-cli",
    args: (tier, cwd, config, thread) => {
      if (!cwd || !thread || !TIERS.includes(tier)) throw new Error("Kiro requires a workspace, a thread and a valid access tier to start with restricted permissions.");
      const agent = writeAgent(tier, thread, cwd, agentsDirOf(config));
      return ["acp", "--agent", agent];
    }
  },
  // dsh --profile acp (DeepSeek Harness's automation-only ACP server). It resumes with session/resume, not session/load.
  dsh: {
    bin: () => onPath("dsh") ?? (process.platform === "darwin" && available(DSH_APP) ? DSH_APP : "dsh"),
    args: () => ["--profile", "acp"]
  },
  // Claude Code and Codex through a pinned ACP adapter (experimental, adapters.mjs): node <home>/adapters/<name>-<version>/...
  claude: adapterPlug("claude"),
  codex: adapterPlug("codex"),
  // Any other ACP helper (experimental): config.command = ["bin", "arg", ...].
  command: { bin: () => null, args: () => [] }
};

function adapterPlug(name) {
  const home = config => config.home ?? homeDir();
  return { adapter: name, bin: config => adapterLaunch(home(config), name).command, args: (tier, cwd, config) => adapterLaunch(home(config), name).args };
}

/** The program a config starts, without preparing anything (used to check that it exists). */
export function binOf(config) {
  const plug = PLUGINS[config.plugin];
  if (!plug) throw new Error(`unknown plugin "${config.plugin}"; use one of ${Object.keys(PLUGINS).join(", ")}`);
  if (config.plugin === "command") {
    if (!Array.isArray(config.command) || !config.command.length || config.command.some(part => typeof part !== "string")) throw new Error('plugin "command" needs config.command: ["bin", "arg", ...]');
    return config.command[0];
  }
  return config.bin ?? process.env[`AELIOS_RUNNER_${config.plugin.toUpperCase()}_BIN`] ?? plug.bin(config);
}

/** @returns {{command: string, args: string[], env: Record<string,string>}} */
export function launchOf(config, tier, cwd, thread) {
  const plug = PLUGINS[config.plugin];
  if (!plug) throw new Error(`unknown plugin "${config.plugin}"; use one of ${Object.keys(PLUGINS).join(", ")}`);
  if (config.plugin === "command") {
    binOf(config);
    return { command: config.command[0], args: config.command.slice(1), env: config.env ?? {} };
  }
  const bin = binOf(config);
  const args = plug.args(tier, cwd, config, thread);
  if (config.plugin === "kiro" && (config.args ?? []).some(arg => /^(--agent(?:=|$)|--trust-all-tools(?:=|$)|--trust-tools(?:=|$)|-[^-]*a)/.test(arg))) {
    throw new Error("Extra Kiro arguments cannot override the restricted agent or trust tools.");
  }
  const env = { ...(config.env ?? {}), ...(config.plugin === "kiro" ? { KIRO_HOME: kiroHomeOf(config) } : {}) };
  return { command: bin, args: [...args, ...(config.args ?? [])], env,
    ...(config.plugin === "kiro" ? { expectedAgent: args[2] } : {}), ...(plug.adapter ? { adapterVersion: ADAPTERS[plug.adapter].version } : {}) };
}

/** Can this command be started at all? Looked for on PATH, or at its path when it has one. */
export function available(command) {
  if (!command.includes("/")) return Boolean(onPath(command));
  try { accessSync(command, constants.X_OK); return true; } catch { return false; }
}
