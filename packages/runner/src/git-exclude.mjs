// Keeps the upload folder out of a git workspace without touching any tracked file: one line in the repository's own
// .git/info/exclude (local to this clone, never committed or pushed). Does nothing when the folder is not in a repository.
import { execFile } from "node:child_process";
import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

/** Adds `pattern` to the repository's info/exclude if `cwd` is in a git work tree and it is not there yet. Never throws. */
export async function excludeFromGit(cwd, pattern) {
  try {
    const { stdout } = await run("git", ["rev-parse", "--git-path", "info/exclude"], { cwd, timeout: 5000 });
    const file = path.resolve(cwd, stdout.trim());
    const has = (await readFile(file, "utf8").catch(() => "")).split("\n").some(line => line.trim() === pattern);
    if (has) return;
    await mkdir(path.dirname(file), { recursive: true });
    await appendFile(file, `${pattern}\n`);
  } catch { /* no git, or not a repository: nothing to keep out */ }
}
