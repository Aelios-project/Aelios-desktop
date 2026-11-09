// A plug is only "how to start the helper". Everything else (sessions, cancel, permissions) is shared in helper.mjs.
// The helper is chosen by this machine's config, never by a job.
import { accessSync, constants } from "node:fs";
import path from "node:path";
import { writeAgent } from "./kiro-agent.mjs";

const DSH_APP = "/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh";

export function onPath(name) {
  for (const dir of (process.env.PATH ?? "").split(path.delimiter)) {
    if (!dir) continue;
    try { accessSync(path.join(dir, name), constants.X_OK); return path.join(dir, name); } catch { /* next */ }
  }
  return null;
}

export const PLUGINS = {
  // kiro-cli acp. Kiro decides for itself what it approves: "full" opens it on the command line, "read" and "edit" give it
  // a generated agent config (kiro-agent.mjs). Everything else it asks about is held by the runner.
  kiro: {
    bin: () => onPath("kiro-cli") ?? "kiro-cli",
    args: (tier, cwd, config) => {
      if (tier === "full") return ["acp", "--trust-all-tools"];
      if (!cwd || (tier !== "read" && tier !== "edit")) throw new Error("Kiro requires a workspace and a valid access tier to start with restricted permissions.");
      const agent = writeAgent(tier, cwd, config.kiroAgentsDir);
      return ["acp", "--agent", agent];
    }
  },
  // dsh --profile acp (DeepSeek Harness's automation-only ACP server). It resumes with session/resume, not session/load.
  dsh: {
    bin: () => onPath("dsh") ?? (process.platform === "darwin" && available(DSH_APP) ? DSH_APP : "dsh"),
    args: () => ["--profile", "acp"]
  },
  // Any other ACP helper (e.g. Claude Code's adapter, experimental): config.command = ["bin", "arg", ...].
  command: { bin: () => null, args: () => [] }
};

/** @returns {{command: string, args: string[], env: Record<string,string>}} */
export function launchOf(config, tier, cwd) {
  const plug = PLUGINS[config.plugin];
  if (!plug) throw new Error(`unknown plugin "${config.plugin}"; use one of ${Object.keys(PLUGINS).join(", ")}`);
  if (config.plugin === "command") {
    if (!Array.isArray(config.command) || !config.command.length || config.command.some(part => typeof part !== "string")) throw new Error('plugin "command" needs config.command: ["bin", "arg", ...]');
    return { command: config.command[0], args: config.command.slice(1), env: config.env ?? {} };
  }
  const bin = config.bin ?? process.env[`AELIOS_RUNNER_${config.plugin.toUpperCase()}_BIN`] ?? plug.bin();
  const args = plug.args(tier, cwd, config);
  if (config.plugin === "kiro" && tier !== "full" && (config.args ?? []).some(arg => /^(--agent(?:=|$)|--trust-all-tools(?:=|$)|--trust-tools(?:=|$)|-[^-]*a)/.test(arg))) {
    throw new Error("Extra Kiro arguments cannot override the restricted agent or trust tools.");
  }
  return { command: bin, args: [...args, ...(config.args ?? [])], env: config.env ?? {},
    ...(config.plugin === "kiro" && tier !== "full" ? { expectedAgent: args[2] } : {}) };
}

/** Can this command be started at all? Looked for on PATH, or at its path when it has one. */
export function available(command) {
  if (!command.includes("/")) return Boolean(onPath(command));
  try { accessSync(command, constants.X_OK); return true; } catch { return false; }
}
