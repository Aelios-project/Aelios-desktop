// Which helpers this machine has. The wizard shows what it found; it never installs one.
import { accessSync, constants } from "node:fs";
import path from "node:path";

export const HELPERS = ["dsh", "kiro-cli", "claude"];

export function detectHelpers({ env = process.env, executable = (file) => {
  try { accessSync(file, constants.X_OK); return true; } catch { return false; }
} } = {}) {
  const dirs = String(env.PATH ?? "").split(path.delimiter).filter(Boolean);
  return HELPERS.map((name) => ({ name, path: dirs.map((dir) => path.join(dir, name)).find(executable) ?? null }));
}
