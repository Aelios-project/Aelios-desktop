// git runs whatever its config names (core.fsmonitor, diff.external, aliases, hooks ...), so a read-only git command is
// only safe to run unasked when the repository's own config names no program. Anything unreadable or odd means hold.
// shortcut: only the repository's local config files are read (not ~/.gitconfig or /etc), and any include is held
// rather than followed; upgrade if global config must be judged too.
import { lstatSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const CORE = new Set(["fsmonitor", "pager", "hookspath", "sshcommand", "editor", "askpass", "gitproxy"]);
const PER_SUB = { diff: ["textconv", "command"], filter: ["clean", "smudge", "process"], gpg: ["program"], credential: ["helper"] };

/** True when this config key can make git run a program, or pull in another file (held, not followed). */
function risky(section, sub, key) {
  if (section === "core") return CORE.has(key);
  if (["alias", "pager", "include", "includeif"].includes(section)) return true;
  if (section === "interactive") return key === "difffilter";
  if (section === "sequence") return key === "editor";
  if (sub === undefined) return (section === "diff" && key === "external") || (section === "gpg" && key === "program") || (section === "credential" && key === "helper");
  return Boolean(PER_SUB[section]?.includes(key));
}

/** True when the config text sets a risky key. A line that cannot be parsed counts as risky. */
export function configRisky(text) {
  let section = "", sub;
  for (let line of text.split(/\r?\n/)) {
    line = line.trim();
    if (!line || line[0] === "#" || line[0] === ";") continue;
    if (line[0] === "[") {
      const head = /^\[\s*([A-Za-z0-9.-]+)(?:\s+"((?:[^"\\]|\\.)*)")?\s*\]\s*(.*)$/.exec(line);
      if (!head) return true;
      [section, sub] = [head[1].toLowerCase(), head[2]];
      if (sub === undefined && section.includes(".")) { const dot = section.indexOf("."); sub = section.slice(dot + 1); section = section.slice(0, dot); }
      line = head[3].trim();
      if (!line || line[0] === "#" || line[0] === ";") continue;
    }
    const key = /^([A-Za-z][A-Za-z0-9-]*)\s*(=|$)/.exec(line);
    if (!key || !section) return true;
    if (risky(section, sub, key[1].toLowerCase())) return true;
  }
  return false;
}

const exists = file => { try { lstatSync(file); return true; } catch { return false; } };

/** Where git, run in cwd, keeps its repo (`git`) and its shared config (`config`), found like git does; null when unclear. */
function repoDirs(cwd) {
  for (let dir = path.resolve(cwd); ; dir = path.dirname(dir)) {
    const link = path.join(dir, ".git");
    let stat = null;
    try { stat = lstatSync(link); } catch { /* none here */ }
    if (stat?.isDirectory()) return { git: link, config: link };
    if (stat?.isFile()) {
      const match = /^gitdir:\s*(.+)$/m.exec(readFileSync(link, "utf8").slice(0, 4096));
      if (!match) return null;
      const git = path.resolve(dir, match[1].trim());
      let common = git;
      try { common = path.resolve(git, readFileSync(path.join(git, "commondir"), "utf8").trim()); } catch { /* not a linked worktree */ }
      return { git, config: common };
    }
    // a folder that is itself a bare git directory is what git would use here; not worth following
    if (exists(path.join(dir, "HEAD")) && exists(path.join(dir, "objects"))) return null;
    if (path.dirname(dir) === dir) return null;
  }
}

/** Every `config` file of submodules, which `git status` also runs git in. */
function moduleConfigs(dir, depth = 0) {
  if (depth > 4) throw new Error("too deep");
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name === "config") found.push(path.join(dir, entry.name));
    else if (entry.isDirectory()) found.push(...moduleConfigs(path.join(dir, entry.name), depth + 1));
  }
  return found;
}

const optional = fn => { try { return fn(); } catch (error) { if (error.code === "ENOENT") return null; throw error; } };

/** True when git, run in cwd, would run no program named by the repository config, hooks or environment. False means ask the owner. */
export function gitConfigSafe(cwd, env = process.env) {
  try {
    if (Object.keys(env).some(name => /^GIT_(?!TERMINAL_PROMPT$)/i.test(name))) return false; // GIT_DIR, GIT_CONFIG*, GIT_EXEC_PATH, ...
    const dirs = repoDirs(cwd);
    if (!dirs) return false;
    if (configRisky(readFileSync(path.join(dirs.config, "config"), "utf8"))) return false; // must be readable
    const more = [path.join(dirs.config, "config.worktree"), path.join(dirs.git, "config.worktree"), ...(optional(() => moduleConfigs(path.join(dirs.config, "modules"))) ?? [])];
    for (const file of more) {
      const text = optional(() => readFileSync(file, "utf8"));
      if (text !== null && configRisky(text)) return false;
    }
    // a hook already in place runs on index writes (post-index-change); only the stock .sample files are fine
    return (optional(() => readdirSync(path.join(dirs.config, "hooks"))) ?? []).every(name => name.endsWith(".sample"));
  } catch { return false; }
}
