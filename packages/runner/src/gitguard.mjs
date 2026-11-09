// git runs whatever its own config says (core.fsmonitor, diff.external, core.pager, aliases, core.hooksPath), so a
// helper that may write to a git directory can run any command later through a harmless-looking `git status`.
// This tells whether a path is part of a git directory, so the edit tier holds it for the owner instead of allowing it.
import { existsSync, lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";

const hasGit = file => file.split(path.sep).some(part => part.toLowerCase() === ".git"); // macOS and Windows ignore case

/** The path with links followed as far as it exists; the part that does not exist yet is kept as written. */
function resolved(file) {
  const rest = [];
  let here = file;
  while (!existsSync(here) && path.dirname(here) !== here) { rest.unshift(path.basename(here)); here = path.dirname(here); }
  try { return path.join(realpathSync(here), ...rest); } catch { return file; }
}

/** Where a `.git` file (a worktree, a submodule, a nested checkout) points, plus the shared dir it names, if any. */
function pointedAt(dir) {
  const link = path.join(dir, ".git");
  try {
    if (!lstatSync(link).isFile()) return [];
    const match = /^gitdir:\s*(.+)$/m.exec(readFileSync(link, "utf8").slice(0, 4096));
    if (!match) return [];
    const gitdir = path.resolve(dir, match[1].trim());
    const found = [gitdir];
    try {
      const common = readFileSync(path.join(gitdir, "commondir"), "utf8").trim();
      if (common) found.push(path.resolve(gitdir, common));
    } catch { /* no shared dir */ }
    return found.map(resolved);
  } catch { return []; }
}

/** True when the file is, or is inside, a git directory: a `.git` segment, as written or after links, or a gitdir a `.git` file points to. */
export function inGitDir(file) {
  if (typeof file !== "string" || !path.isAbsolute(file)) return false;
  const real = resolved(path.normalize(file));
  if (hasGit(path.normalize(file)) || hasGit(real)) return true;
  for (let dir = path.dirname(real); ; dir = path.dirname(dir)) {
    if (pointedAt(dir).some(target => real === target || real.startsWith(target + path.sep))) return true;
    if (path.dirname(dir) === dir) return false;
  }
}
