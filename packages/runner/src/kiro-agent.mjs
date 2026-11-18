// What Kiro may do without asking, written as a Kiro agent config at every start (the runner has no say after that:
// whatever Kiro does not approve itself reaches the runner as a permission request, and is held for the owner).
// Kiro reads agent configs only from a folder by name, so this one lives in Kiro's own agents folder, outside the
// workspace, and is rewritten before each turn, so a thread cannot loosen it.
// `edit`: reads anywhere, writes with Kiro's write tool inside the workspace, and
// every shell command except the ask words in shell-allow.mjs, which are held. A write outside the workspace is held.
// `edit` refuses outright any read, search or glob of the runner's own home (the shell stays open: not a sandbox).
// `full`: every tool.
// The name has no tier (one name per thread and folder), so a change of tier never changes how Kiro is started.
// shortcut: the shell filter looks at the words as typed, so it is a guard against accidents, not a sandbox.
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { allowAllBut } from "./shell-allow.mjs";
import { homeDir } from "./state.mjs";

export const agentName = (thread, cwd) => `aelios-runner-${createHash("sha256").update(`${thread}\0${cwd}`).digest("hex").slice(0, 12)}`;

const READS = ["fs_read", "glob", "grep"];

export function agentConfig(tier, thread, cwd) {
  const inWorkspace = { allowedPaths: [cwd] };
  const noRunnerHome = { deniedPaths: [homeDir(), `${homeDir()}/**`] }; // the pairing token lives there; no job needs it
  return {
    name: agentName(thread, cwd),
    description: "Written by aelios-runner before every turn. Changes are overwritten.",
    prompt: null,
    mcpServers: {},
    includeMcpJson: false,
    tools: ["*"],
    allowedTools: tier === "full" ? ["*"] : READS, // a tool listed here is trusted for any path; the per-path settings below are what limit it
    toolsSettings: tier === "full" ? {} : { execute_bash: { allowedCommands: [allowAllBut()] }, fs_write: inWorkspace, fs_read: noRunnerHome, glob: noRunnerHome, grep: noRunnerHome }
  };
}

/** Writes the restricted config and returns its agent name; throws if it cannot be written. */
export function writeAgent(tier, thread, cwd, dir = path.join(os.homedir(), ".kiro", "agents")) {
  const config = agentConfig(tier, thread, cwd);
  const file = path.join(dir, `${config.name}.json`);
  const text = JSON.stringify(config, null, 2) + "\n";
  try {
    try { if (readFileSync(file, "utf8") === text) return config.name; } catch { /* not there yet */ }
    mkdirSync(dir, { recursive: true });
    const temp = `${file}.${process.pid}.tmp`;
    writeFileSync(temp, text, { mode: 0o600 });
    renameSync(temp, file);
    return config.name;
  } catch (error) {
    throw new Error(`Cannot write the restricted Kiro agent config in ${dir}. Check that the directory is writable and try again.`, { cause: error });
  }
}
