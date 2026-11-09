// What Kiro may do without asking, written as a Kiro agent config at every start (the runner has no say after that:
// whatever Kiro does not approve itself reaches the runner as a permission request, and is held for the owner).
// Kiro reads agent configs only from a folder by name, so this one lives in Kiro's own agents folder, outside the
// workspace, and is rewritten before each turn, so a thread cannot loosen it. `read`: reads inside the workspace.
// `edit`: also shell commands Kiro itself calls read-only. Writes and the network are never in it. `full`: every tool.
// The name has no tier (one name per thread and folder), so a change of tier never changes how Kiro is started.
// shortcut: Kiro's read-only shell classifier is Kiro's own and looser than ours (it runs `git branch NAME`, and `cat`
// of any path); the denied patterns below only cover the cases checked by hand. Upgrade if Kiro changes its list.
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const WORD_START = String.raw`(^|[\s"'=])`;
/** Shell commands Kiro would run unasked but that this runner never wants run without the owner: the network, and paths outside the workspace. */
export const DENIED = [
  String.raw`.*\bgit +(fetch|pull|push|clone|remote|ls-remote)\b.*`,
  String.raw`.*\bgit +(branch|tag)( +-[A-Za-z-]+)* +[^-\s].*`, // `git branch NAME` and `git tag NAME` create things; Kiro runs them unasked
  `.*${WORD_START}(/|~).*`,
  String.raw`.*(^|[\s"'=/])\.\.($|[\s"'/]).*`
];

export const agentName = (thread, cwd) => `aelios-runner-${createHash("sha256").update(`${thread}\0${cwd}`).digest("hex").slice(0, 12)}`;

export function agentConfig(tier, thread, cwd) {
  const inWorkspace = { allowedPaths: [cwd] };
  return {
    name: agentName(thread, cwd),
    description: "Written by aelios-runner before every turn. Changes are overwritten.",
    prompt: null,
    mcpServers: {},
    includeMcpJson: false,
    tools: ["*"],
    allowedTools: tier === "full" ? ["*"] : [], // a tool listed here is trusted for any path; the per-path settings below are what limit it
    toolsSettings: tier === "full" ? {} : {
      fs_read: inWorkspace,
      glob: inWorkspace,
      grep: inWorkspace,
      ...(tier === "edit" ? { execute_bash: { autoAllowReadonly: true, deniedCommands: DENIED } } : {})
    }
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
