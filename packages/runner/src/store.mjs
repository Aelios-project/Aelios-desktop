// Where acpx keeps its sessions: <home>/acpx, directories 0700 and files 0600. It holds whole conversations, tool input
// and output included (see the README), so a wide mode is narrowed at start, and when that fails the engine does not start.
import { chmodSync, lstatSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";

function narrow(target) {
  const info = lstatSync(target);
  if (info.isSymbolicLink()) return; // never follow a link out of the store
  const want = info.isDirectory() ? 0o700 : 0o600;
  if ((info.mode & 0o777) !== want) chmodSync(target, want);
  if (info.isDirectory()) for (const name of readdirSync(target)) narrow(path.join(target, name));
}

/** Creates the store folder and checks its modes. Returns its path. */
export function openStore(home) {
  const dir = path.join(home, "acpx");
  try { mkdirSync(dir, { recursive: true, mode: 0o700 }); narrow(dir); }
  catch (error) { throw new Error(`Cannot use the acpx session store at ${dir} with safe permissions (${error.code ?? error.message}). Check that this user owns the folder and try again.`, { cause: error }); }
  return dir;
}
