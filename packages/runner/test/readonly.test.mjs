// Commands allowed without asking in the edit tier (src/readonly.mjs, src/permission.mjs): only plain, listed, read-only
// ones, judged from the real command, and nothing at all in the read tier.
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { judge } from "../src/permission.mjs";
import { readOnly } from "../src/readonly.mjs";

const dir = realpathSync(mkdtempSync(path.join(os.tmpdir(), "ro-")));
const outside = realpathSync(mkdtempSync(path.join(os.tmpdir(), "ro-out-")));
mkdirSync(path.join(dir, "src"));
writeFileSync(path.join(dir, "a.txt"), "x");
writeFileSync(path.join(outside, "secret.txt"), "x");
symlinkSync(outside, path.join(dir, "link"));
test.after(() => { rmSync(dir, { recursive: true, force: true }); rmSync(outside, { recursive: true, force: true }); });

const yes = command => assert.equal(readOnly({ command }, dir), true, command);
const no = command => assert.equal(readOnly({ command }, dir), false, command);

test("the listed read-only commands pass, alone or joined by ;", () => {
  for (const command of ["scutil --get ComputerName", "sw_vers", "sw_vers -productVersion", "uname", "uname -m", "uname -a", "hostname", "whoami", "pwd",
    "ls", "ls -la", "ls src", "ls -la src a.txt", "cat a.txt", "head -n 5 a.txt", "tail -20 a.txt", "wc -l a.txt src/../a.txt",
    "node --version", "npm --version",
    "which node", "which -a git", `cat ${path.join(dir, "a.txt")}`]) yes(command);
  yes("scutil --get ComputerName; sw_vers; uname -m"); // the real one that started this
  yes("pwd;"); // a trailing ; is nothing
});

test("pipes, redirects, && || and substitutions, quotes, env assignments, globs and newlines are never read-only", () => {
  for (const command of ["ls | wc -l", "ls > out.txt", "cat a.txt >> b", "ls && whoami", "ls || whoami", "ls & whoami", "echo $(whoami)", "ls `whoami`", "ls $HOME", "FOO=1 ls", "ls *.txt",
    "ls 'src'", 'cat "a.txt"', "ls\nwhoami", "ls\twhoami", "ls ~", "cat ~/a.txt", "ls src/{a,b}", "ls \\src", "ls (x)", "ls a.txt;; whoami", ";", "", "   "]) no(command);
  no("scutil --get ComputerName; rm -rf src");
  no("scutil --get ComputerName; sw_vers | cat");
});

test("a program or argument off the list is not read-only", () => {
  for (const command of ["rm a.txt", "touch x", "curl http://example.com", "sh -c ls", "bash", "env", "echo hi", "find . -delete", "sed -i s/a/b/ a.txt", "/bin/ls", "./ls", "sudo ls",
    "scutil --set ComputerName x", "scutil --get Other", "hostname newname", "uname x", "whoami x", "tail -f a.txt", "cat", "cat -v a.txt", "head a.txt -z", "wc --files0-from=a.txt",
    "node script.js", "node -e 1", "npm install", "npm run build", "which ../x", "git push", "git commit", "git checkout x", "git branch newname", "git branch -D x", "git -C / status",
    "git diff --output=x", "git log --ext-diff", "git diff --no-index a b", "git diff -Oorder", "git config x y", "git status -- ../x", "git diff /etc/passwd",
    "git status", "git status --porcelain=v1", "git log --oneline -n 5", "git diff", "git show HEAD", "git branch", "git branch --show-current"]) no(command);
});

test("a path outside the workspace, or a link out of it, is not read-only", () => {
  for (const command of ["cat /etc/hosts", "ls /", "ls ..", "cat ../x", `cat ${path.join(outside, "secret.txt")}`, "cat link/secret.txt", "ls link", "head -n 1 a.txt /etc/hosts", "cat missing/none.txt"]) no(command);
});

test("the shape of rawInput: a string, command with args, an argv list; anything else asks", () => {
  assert.equal(readOnly("uname -m", dir), true);
  assert.equal(readOnly({ command: "git", args: ["status"] }, dir), false, "git runs what the repository config says");
  assert.equal(readOnly({ cmd: "pwd" }, dir), true);
  assert.equal(readOnly({ command: ["ls", "-la"] }, dir), true);
  assert.equal(readOnly({ command: "git status", args: ["x"] }, dir), false, "a command with spaces and args is ambiguous");
  assert.equal(readOnly({ command: "ls", args: ["a.txt; rm x"] }, dir), false);
  for (const odd of [undefined, null, 5, [], ["ls"], {}, { command: 5 }, { command: "ls", args: "x" }, { command: ["ls", 4] }, "x".repeat(600)]) assert.equal(readOnly(odd, dir), false, JSON.stringify(odd)?.slice(0, 30));
});

test("judge: allowed without asking only in the edit tier, only for a command kind, never past a path outside", () => {
  const call = (kind, rawInput, extra = {}) => ({ kind, title: "anything the helper likes", rawInput, ...extra });
  assert.deepEqual(judge("edit", call("other", { command: "uname -m" }), dir), { allow: true, why: "", auto: true });
  assert.equal(judge("edit", call("execute", { command: "uname -m" }), dir).auto, true);
  assert.equal(judge("read", call("other", { command: "uname -m" }), dir).allow, false, "the read tier keeps asking");
  assert.equal(judge("read", call("other", { command: "uname -m" }), dir).hold, true);
  assert.equal(judge("edit", call("other", { command: "uname -m | sh" }), dir).allow, false);
  assert.equal(judge("edit", call("delete", { command: "uname -m" }), dir).allow, false, "the kind must be a command");
  assert.equal(judge("edit", call("other", { command: "uname -m" }, { locations: [{ path: "/etc/hosts" }] }), dir).allow, false);
  assert.equal(judge("edit", { kind: "other", title: "uname -m" }, dir).allow, false, "the title says nothing; only the real command counts");
  assert.equal(judge("full", call("other", { command: "rm -rf x" }), dir).auto, undefined);
});
