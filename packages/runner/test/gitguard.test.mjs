import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync, existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { inGitDir } from "../src/gitguard.mjs";
import { judge } from "../src/permission.mjs";
import { readOnly } from "../src/readonly.mjs";

const dir = realpathSync(mkdtempSync(path.join(os.tmpdir(), "aelios-gg-")));
const w = (...parts) => path.join(dir, ...parts);
mkdirSync(w(".git", "hooks"), { recursive: true });
writeFileSync(w(".git", "config"), "[core]\n");
mkdirSync(w("src", ".git"), { recursive: true });
mkdirSync(w("my.git"));
mkdirSync(w("nested", "meta", "hooks"), { recursive: true });
writeFileSync(w("nested", ".git"), "gitdir: ./meta\n"); // a .git file pointing at a folder with another name
symlinkSync(w(".git"), w("src", "g"));
symlinkSync(w(".git", "config"), w("src", "cfg"));
test.after(() => rmSync(dir, { recursive: true, force: true }));

const ask = (kind, ...files) => ({ kind, title: "t", locations: files.map(file => ({ path: file })) });

test("an edit that touches a git directory is held, however the path is spelled", () => {
  for (const file of [w(".git", "config"), w(".git", "hooks", "pre-commit"), w(".GIT", "config"), w("nested", ".git"), w("src", ".git", "config"),
    w("src", "g", "config"), w("src", "cfg"), w("nested", "meta", "config"), w("nested", "meta", "hooks", "new")]) {
    const got = judge("edit", ask("edit", file), dir);
    assert.deepEqual([got.allow, got.hold], [false, true], file);
  }
  const both = judge("edit", ask("edit", w("a.txt"), w(".git", "config")), dir);
  assert.equal(both.allow, false, "one git path among the paths is enough");
  assert.equal(judge("edit", ask("move", w("a.txt"), w(".git", "config")), dir).allow, false);
});

test("normal workspace edits still pass, and the other tiers are unchanged", () => {
  for (const file of [w("a.txt"), w("src", "b.mjs"), w("src", "c.txt"), w(".gitignore"), w("nested", "other.txt"), w("my.git", "x")]) assert.equal(judge("edit", ask("edit", file), dir).allow, true, file);
  assert.equal(judge("read", ask("read", w(".git", "config")), dir).allow, true, "reading is fine");
  assert.equal(judge("full", ask("edit", w(".git", "config")), dir).allow, true, "full is the owner's own choice");
  assert.equal(inGitDir("relative/.git/config"), false);
});

test("the bypass: config written, then git status, never runs unasked", { skip: !existsSync("/usr/bin/git") && !existsSync("/usr/local/bin/git") }, () => {
  const repo = w("repo");
  mkdirSync(repo);
  execFileSync("git", ["init", "-q"], { cwd: repo });
  const marker = path.join(repo, "pwned");
  // step 1: the helper edits .git/config; the runner must not allow it
  assert.equal(judge("edit", ask("edit", path.join(repo, ".git", "config")), dir).allow, false);
  // step 2: even if the config were poisoned already, git is not auto-allowed, so nothing runs without the owner
  execFileSync("git", ["config", "core.fsmonitor", `touch ${marker}`], { cwd: repo });
  for (const command of ["git status", "git diff", "git show", "git log -p", "git branch"]) {
    const got = judge("edit", { kind: "execute", title: command, rawInput: { command } }, repo);
    assert.deepEqual([got.allow, got.hold, got.auto], [false, true, undefined], command);
    assert.equal(readOnly({ command }, repo), false);
  }
  assert.equal(existsSync(marker), false, "the runner itself never ran git");
});
