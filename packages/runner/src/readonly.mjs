// Commands that only look at things, allowed without asking in the edit tier. Judged from the command itself (the
// helper's rawInput), never from its title. The rule is deliberately narrow: a short list of programs, each with the
// few arguments it may take, and no shell syntax at all except `;` between such commands. Anything else asks.
import path from "node:path";
import { inside } from "./inside.mjs";

// Letters, digits and a few punctuation marks that do nothing in a shell. No quotes, pipes, redirects, `$`, backticks,
// parentheses, braces, globs, backslashes or newlines; `;` is the only separator, and `~` is checked per word below.
const SAFE_LINE = /^[A-Za-z0-9_@%+=:,./~^ ;-]*$/;
const FLAG = /^-[A-Za-z0-9]+$/;
const LONG_FLAG = /^--[a-z][a-z-]*(=[A-Za-z0-9_.,:/^~%-]+)?$/;
const NAME = /^[A-Za-z0-9_.-]+$/;
const pathLike = word => word.startsWith("/") || word.startsWith("~") || word.split("/").includes("..");
/** Flags that make git write a file, run a program or read outside the folder. */
const GIT_NO = /^(--output|--ext-diff|--textconv|--no-index|--exec|--open-files-in-pager|-O)/;
const GIT_BRANCH_FLAGS = new Set(["-a", "-r", "-v", "-vv", "--list", "--show-current", "--all", "--remotes", "--verbose"]);

/** Every word is a path inside the workspace (or, for a git revision, not path-like at all). */
function paths(words, cwd, { need = false } = {}) {
  if (need && !words.length) return false;
  return words.every(word => word !== "-" && !word.startsWith("~") && inside(cwd, path.resolve(cwd, word)));
}

const exactly = (...lists) => args => lists.some(list => list.length === args.length && list.every((word, i) => word === args[i]));
const only = (re, max) => args => args.length <= max && args.every(word => re.test(word));

const RULES = {
  scutil: exactly(["--get", "ComputerName"], ["--get", "LocalHostName"], ["--get", "HostName"]),
  sw_vers: args => args.length <= 1 && args.every(word => ["-productName", "-productVersion", "-buildVersion"].includes(word)),
  uname: only(/^-[amnprsv]$/, 3),
  hostname: only(/^-[sf]$/, 1),
  whoami: args => args.length === 0,
  pwd: only(/^-[LP]$/, 1),
  node: exactly(["--version"], ["-v"]),
  npm: exactly(["--version"], ["-v"]),
  which: args => args.length > 0 && args.length <= 6 && args.every(word => word === "-a" || (NAME.test(word) && !word.startsWith("-"))),
  ls: (args, cwd) => args.every(word => (word.startsWith("-") ? FLAG.test(word) || LONG_FLAG.test(word) : paths([word], cwd))),
  cat: (args, cwd) => args.every(word => word === "-n" || !word.startsWith("-")) && paths(args.filter(word => word !== "-n"), cwd, { need: true }),
  wc: (args, cwd) => args.every(word => /^-[lwcm]$/.test(word) || !word.startsWith("-")) && paths(args.filter(word => !word.startsWith("-")), cwd, { need: true }),
  head: (args, cwd) => counted(args, cwd),
  tail: (args, cwd) => counted(args, cwd),
  git: (args, cwd) => git(args, cwd)
};

/** head / tail: `-n N`, `-c N`, `-N`, then files. Never `-f` (tail would wait forever). */
function counted(args, cwd) {
  const files = [];
  for (let i = 0; i < args.length; i++) {
    const word = args[i];
    if ((word === "-n" || word === "-c") && /^[0-9]{1,6}$/.test(args[i + 1] ?? "")) i++;
    else if (/^-[0-9]{1,6}$/.test(word)) continue;
    else if (word.startsWith("-")) return false;
    else files.push(word);
  }
  return paths(files, cwd, { need: true });
}

function git([sub, ...args], cwd) {
  if (!["status", "log", "diff", "show", "branch"].includes(sub)) return false;
  if (sub === "branch") return args.every(word => GIT_BRANCH_FLAGS.has(word)); // a name would create a branch
  let after = false;
  for (const word of args) {
    if (after) { if (!paths([word], cwd)) return false; continue; }
    if (word === "--") after = true;
    else if (word.startsWith("-")) { if (GIT_NO.test(word) || !(FLAG.test(word) || LONG_FLAG.test(word))) return false; }
    else if (pathLike(word) && !paths([word], cwd)) return false; // a revision is not path-like; a path must be inside
  }
  return true;
}

/** The commands of a request's rawInput as lists of words, or null when it is not a plain command line. */
function commandsOf(rawInput) {
  let line = null;
  if (typeof rawInput === "string") line = rawInput;
  else if (rawInput && typeof rawInput === "object" && !Array.isArray(rawInput)) {
    const command = rawInput.command ?? rawInput.cmd;
    const extra = rawInput.args;
    if (typeof command === "string" && extra === undefined) line = command;
    else if (typeof command === "string" && Array.isArray(extra) && [command, ...extra].every(word => typeof word === "string" && !/[\s;]/.test(word))) line = [command, ...extra].join(" ");
    else if (Array.isArray(command) && extra === undefined && command.every(word => typeof word === "string" && word && !/\s/.test(word))) line = command.join(" ");
  }
  if (typeof line !== "string" || line.length > 500 || !SAFE_LINE.test(line)) return null;
  const parts = line.split(";").map(part => part.trim().split(/ +/).filter(Boolean));
  while (parts.length && !parts.at(-1).length) parts.pop(); // `a;` is `a`
  return parts.length && parts.every(part => part.length) ? parts : null;
}

/** True when every command in the request is on the list with allowed arguments, in this workspace. */
export function readOnly(rawInput, cwd) {
  const commands = commandsOf(rawInput);
  if (!commands) return false;
  return commands.every(([name, ...args]) => Object.hasOwn(RULES, name) && RULES[name](args, cwd));
}
