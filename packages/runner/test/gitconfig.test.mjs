// Read-only git commands run unasked only when the repository config names no program (src/gitconfig.mjs).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { appendFileSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { configRisky, gitConfigSafe } from "../src/gitconfig.mjs";
import { judge } from "../src/permission.mjs";
import { readOnly } from "../src/readonly.mjs";

const root = realpathSync(mkdtempSync(path.join(os.tmpdir(), "aelios-gc-")));
test.after(() => rmSync(root, { recursive: true, force: true }));
const git = (cwd, ...args) => execFileSync("git", args, { cwd, stdio: "pipe", env: { PATH: process.env.PATH, HOME: root } });
const fresh = name => { const repo = path.join(root, name); mkdirSync(repo); git(repo, "init", "-q"); return repo; };
const cfg = repo => path.join(repo, ".git", "config");
const COMMANDS = ["git status", "git diff", "git show", "git log -p", "git branch"];

test("a clean repo runs git status, diff, show, log and branch unasked", () => {
  const repo = fresh("clean");
  for (const command of COMMANDS) {
    assert.equal(readOnly({ command }, repo), true, command);
    assert.deepEqual(judge("edit", { kind: "execute", title: "t", rawInput: { command } }, repo), { allow: true, why: "", auto: true });
  }
  assert.equal(judge("read", { kind: "execute", title: "t", rawInput: { command: "git status" } }, repo).allow, false, "the read tier still asks");
});

test("each key that can make git run a program holds the command", () => {
  const lines = ["[core]\nfsmonitor = x", "[core]\npager = x", "[core]\nhooksPath = x", "[core]\nsshCommand = x", "[core]\neditor = x", "[diff]\nexternal = x",
    '[diff "a"]\ntextconv = x', '[diff "a"]\ncommand = x', '[filter "a"]\nclean = x', '[filter "a"]\nsmudge = x', '[filter "a"]\nprocess = x', "[alias]\nst = !x",
    "[pager]\nlog = x", "[interactive]\ndiffFilter = x", "[sequence]\neditor = x", "[gpg]\nprogram = x", '[gpg "ssh"]\nprogram = x', "[credential]\nhelper = x",
    '[credential "https://a"]\nhelper = x', "[include]\npath = ../x", '[includeIf "gitdir:/"]\npath = x', "[CORE]\nFsMonitor = x", "[core] fsmonitor = x", "[diff.a]\ntextconv = x", "[core\nbroken"];
  for (const text of lines) {
    assert.equal(configRisky(text), true, text);
    const repo = fresh(`k${Math.random().toString(36).slice(2)}`);
    appendFileSync(cfg(repo), `\n${text}\n`);
    for (const command of COMMANDS) assert.equal(readOnly({ command }, repo), false, `${command} with ${text}`);
  }
  for (const text of ["[core]\nbare = false", "[user]\nname = a", '[remote "o"]\nurl = u', '[diff "a"]\nbinary = true', "# [alias]\n; fsmonitor = x"]) assert.equal(configRisky(text), false, text);
});

test("a linked worktree reads the shared config; a submodule config and an existing hook hold too", () => {
  const repo = fresh("main");
  git(repo, "-c", "user.name=a", "-c", "user.email=a@b", "commit", "-q", "--allow-empty", "-m", "x");
  const tree = path.join(root, "tree");
  git(repo, "worktree", "add", "-q", tree);
  assert.equal(readOnly({ command: "git status" }, tree), true);
  appendFileSync(cfg(repo), "\n[core]\nfsmonitor = x\n");
  assert.equal(readOnly({ command: "git status" }, tree), false, "the poisoned config is in the common dir");
  const other = fresh("hooked");
  writeFileSync(path.join(other, ".git", "hooks", "post-index-change"), "#!/bin/sh\n");
  assert.equal(gitConfigSafe(other), false);
  const sub = fresh("subm");
  mkdirSync(path.join(sub, ".git", "modules", "m"), { recursive: true });
  writeFileSync(path.join(sub, ".git", "modules", "m", "config"), "[core]\nfsmonitor = x\n");
  assert.equal(gitConfigSafe(sub), false);
});

test("GIT_* in the command or the environment, an unreadable config, or no repo holds", () => {
  const repo = fresh("env");
  assert.equal(readOnly({ command: "GIT_DIR=x git status" }, repo), false);
  assert.equal(readOnly({ command: "GIT_CONFIG_GLOBAL=x; git status" }, repo), false);
  for (const name of ["GIT_DIR", "GIT_CONFIG_COUNT", "GIT_EXEC_PATH"]) assert.equal(gitConfigSafe(repo, { [name]: "x" }), false, name);
  assert.equal(gitConfigSafe(repo, { PATH: "/bin" }), true);
  assert.equal(gitConfigSafe(path.join(root, "nowhere")), false);
  const broken = fresh("broken");
  rmSync(cfg(broken));
  assert.equal(gitConfigSafe(broken), false, "no config to read");
  assert.equal(readOnly({ command: "git status --git-dir=x" }, repo), false);
});

test("the earlier bypass: poison the config, then git status, still never runs unasked", () => {
  const repo = fresh("bypass");
  const marker = path.join(repo, "pwned");
  assert.equal(judge("edit", { kind: "edit", title: "t", locations: [{ path: cfg(repo) }] }, repo).allow, false, "the edit is held");
  git(repo, "config", "core.fsmonitor", `touch ${marker}`);
  for (const command of COMMANDS) {
    const got = judge("edit", { kind: "execute", title: command, rawInput: { command } }, repo);
    assert.deepEqual([got.allow, got.hold, got.auto], [false, true, undefined], command);
  }
});
