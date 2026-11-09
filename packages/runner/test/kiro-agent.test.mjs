// The Kiro agent config the runner writes (src/kiro-agent.mjs) and how the tier maps to Kiro's start-up (src/plugins.mjs).
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { DENIED, agentConfig, agentName, writeAgent } from "../src/kiro-agent.mjs";
import { launchOf } from "../src/plugins.mjs";

const dir = mkdtempSync(path.join(os.tmpdir(), "ka-"));
test.after(() => rmSync(dir, { recursive: true, force: true }));
const cwd = "/work/space", thread = "t_main";

test("read: Kiro approves reads inside the workspace only; edit adds Kiro's read-only shell; neither trusts a whole tool", () => {
  for (const tier of ["read", "edit"]) {
    const config = agentConfig(tier, thread, cwd);
    assert.deepEqual(config.allowedTools, [], "a tool in allowedTools is trusted for every path");
    for (const tool of ["fs_read", "glob", "grep"]) assert.deepEqual(config.toolsSettings[tool], { allowedPaths: [cwd] });
    assert.equal(config.toolsSettings.fs_write, undefined, "writes are never approved by Kiro");
    assert.equal(config.includeMcpJson, false);
    assert.equal(config.name, agentName(thread, cwd));
  }
  assert.equal(agentConfig("read", thread, cwd).toolsSettings.execute_bash, undefined, "the read tier: every command is held");
  assert.equal(agentConfig("edit", thread, cwd).toolsSettings.execute_bash.autoAllowReadonly, true);
  assert.deepEqual(agentConfig("edit", thread, cwd).toolsSettings.execute_bash.deniedCommands, DENIED);
  assert.notEqual(agentName(thread, cwd), agentName(thread, "/work/other"));
  assert.notEqual(agentName(thread, cwd), agentName("t_other", cwd), "one name per thread");
});

test("the denied patterns stop network git, branch / tag creation and paths outside the workspace, not plain reads", () => {
  const denied = command => DENIED.some(pattern => new RegExp(`^(?:${pattern})$`).test(command));
  for (const command of ["git fetch origin", "git pull", "git push origin main", "git clone x", "git remote -v", "cd x && git fetch", "git branch newb", "git branch -D newb", "git tag v1", "git tag -a v1",
    "cat /etc/hosts", "cat ~/.zshrc", 'cat "/etc/hosts"', "ls /", "cat ../x", "cat a/../../x", "cat ..", "head --file=/etc/hosts", "cat a.md | grep x /etc/hosts"]) assert.ok(denied(command), command);
  for (const command of ["git status -sb", "git log --oneline -5 2>&1 | tail -3", "git diff", "git branch", "git branch -a", "git branch --show-current", "git tag", "cat *.md", "cat a.md b.md", "ls -la", "ls src/lib", "wc -l a.md",
    "cat .gitignore", "cat ..a", "git log --format=%H"]) assert.ok(!denied(command), command);
});

test("the agent name has no tier; the tier only changes the file: full approves every tool, read and edit do not", () => {
  const names = ["read", "edit", "full"].map(tier => agentConfig(tier, thread, cwd).name);
  assert.equal(new Set(names).size, 1);
  assert.doesNotMatch(names[0], /read|edit|full/);
  const full = agentConfig("full", thread, cwd);
  assert.deepEqual([full.allowedTools, full.toolsSettings, full.tools], [["*"], {}, ["*"]]);
  assert.notDeepEqual(agentConfig("read", thread, cwd), agentConfig("edit", thread, cwd));
});

test("writeAgent: written outside the workspace, mode 0600, rewritten when changed on disk, also for full", () => {
  const name = writeAgent("edit", thread, cwd, dir);
  const file = path.join(dir, `${name}.json`);
  assert.deepEqual(JSON.parse(readFileSync(file, "utf8")), agentConfig("edit", thread, cwd));
  assert.equal(statSync(file).mode & 0o777, 0o600);
  writeFileSync(file, JSON.stringify({ ...agentConfig("edit", thread, cwd), allowedTools: ["*"] })); // a thread loosening it
  assert.equal(writeAgent("edit", thread, cwd, dir), name);
  assert.deepEqual(JSON.parse(readFileSync(file, "utf8")).allowedTools, []);
  assert.deepEqual(readdirSync(dir).filter(item => item.endsWith(".tmp")), [], "no temp file left");
  assert.equal(JSON.parse(readFileSync(path.join(dir, `${writeAgent("full", thread, cwd, dir)}.json`), "utf8")).allowedTools[0], "*", "full rewrites the same file with all tools");
  assert.throws(() => writeAgent("edit", thread, cwd, path.join(file, "no")), /Cannot write the restricted Kiro agent config/);
});

test("tier mapping in the kiro plug: every tier names the same generated agent and none uses a trust flag", () => {
  const config = { plugin: "kiro", bin: "kiro-cli", kiroAgentsDir: dir };
  for (const tier of ["read", "edit", "full"]) {
    const { args, expectedAgent } = launchOf(config, tier, cwd, thread);
    assert.deepEqual(args, ["acp", "--agent", agentName(thread, cwd)]);
    assert.equal(expectedAgent, agentName(thread, cwd));
    assert.ok(!args.includes("--trust-all-tools"));
  }
  assert.throws(() => launchOf(config, "edit"), /requires a workspace/);
  const blocked = path.join(dir, "blocked");
  writeFileSync(blocked, "not a directory");
  for (const tier of ["read", "edit", "full"]) {
    assert.throws(() => launchOf({ ...config, kiroAgentsDir: blocked }, tier, cwd, thread), /Cannot write the restricted Kiro agent config/);
  }
  for (const arg of ["--agent=other", "--agent", "--trust-all-tools", "--trust-tools=fs_write", "-a", "-av"]) {
    assert.throws(() => launchOf({ ...config, args: [arg] }, "read", cwd, thread), /cannot override/);
  }
  assert.deepEqual(launchOf({ plugin: "dsh", bin: "dsh" }, "edit", cwd, thread).args, ["--profile", "acp"]);
});
