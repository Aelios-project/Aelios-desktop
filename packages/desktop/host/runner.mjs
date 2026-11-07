// Finds the runner and runs its one-shot commands (pair, status, unpair).
// shortcut: the runner is not on npm yet, so it is found by AELIOS_RUNNER_ENTRY or beside this package in
// the repository. Use the npm package once it is published.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

export function runnerEntry(env = process.env) {
  const sibling = fileURLToPath(new URL("../../runner/bin/aelios-runner.mjs", import.meta.url));
  const entry = env.AELIOS_RUNNER_ENTRY || sibling;
  if (!existsSync(entry)) throw new Error("cannot find the aelios-runner program; set AELIOS_RUNNER_ENTRY");
  return entry;
}

// shortcut: Node comes from PATH (or AELIOS_NODE). DSH's own process may be Electron, and starting that
// binary would open another window. Check which Node runs plugin code before changing this.
export const nodeBin = (env = process.env) => env.AELIOS_NODE || "node";

/** Runs one command to its end. The web key goes in the environment, never in the arguments. */
export function runOnce(entry, args, { env = {}, node = nodeBin() } = {}) {
  return new Promise((resolve) => {
    const child = spawn(node, [entry, ...args], { env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => { out += d; });
    child.stderr.on("data", (d) => { err += d; });
    child.on("error", (e) => resolve({ code: 1, out, err: String(e.message) }));
    child.on("close", (code) => resolve({ code, out, err }));
  });
}

export async function runnerStatus(entry, opts) {
  const { code, out } = await runOnce(entry, ["status"], opts);
  if (code !== 0) return null;
  try { return JSON.parse(out); } catch { return null; }
}
