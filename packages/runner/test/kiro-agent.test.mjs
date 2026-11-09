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
const cwd = "/work/space";

test("read: Kiro approves reads inside the workspace only; edit adds Kiro's read-only shell; neither trusts a whole tool", () => {
  for (const tier of ["read", "edit"]) {
    const config = agentConfig(tier, cwd);
    assert.deepEqual(config.allowedTools, [], "a tool in allowedTools is trusted for every path");
    for (const tool of ["fs_read", "glob", "grep"]) assert.deepEqual(config.toolsSettings[tool], { allowedPaths: [cwd] });
    assert.equal(config.toolsSettings.fs_write, undefined, "writes are never approved by Kiro");
    assert.equal(config.includeMcpJson, false);
    assert.equal(config.name, agentName(tier, cwd));
  }
  assert.equal(agentConfig("read", cwd).toolsSettings.execute_bash, undefined, "the read tier: every command is held");
  assert.equal(agentConfig("edit", cwd).toolsSettings.execute_bash.autoAllowReadonly, true);
  assert.deepEqual(agentConfig("edit", cwd).toolsSettings.execute_bash.deniedCommands, DENIED);
  assert.notEqual(agentName("edit", cwd), agentName("edit", "/work/other"));
  assert.notEqual(agentName("edit", cwd), agentName("read", cwd));
});

test("the denied patterns stop network git, branch / tag creation and paths outside the workspace, not plain reads", () => {
  const denied = command => DENIED.some(pattern => new RegExp(`^(?:${pattern})$`).test(command));
  for (const command of ["git fetch origin", "git pull", "git push origin main", "git clone x", "git remote -v", "cd x && git fetch", "git branch newb", "git branch -D newb", "git tag v1", "git tag -a v1",
    "cat /etc/hosts", "cat ~/.zshrc", 'cat "/etc/hosts"', "ls /", "cat ../x", "cat a/../../x", "cat ..", "head --file=/etc/hosts", "cat a.md | grep x /etc/hosts"]) assert.ok(denied(command), command);
  for (const command of ["git status -sb", "git log --oneline -5 2>&1 | tail -3", "git diff", "git branch", "git branch -a", "git branch --show-current", "git tag", "cat *.md", "cat a.md b.md", "ls -la", "ls src/lib", "wc -l a.md",
    "cat .gitignore", "cat ..a", "git log --format=%H"]) assert.ok(!denied(command), command);
});

test("writeAgent: written outside the workspace, mode 0600, rewritten when changed on disk, none for full", () => {
  assert.equal(writeAgent("full", cwd, dir), null);
  const name = writeAgent("edit", cwd, dir);
  const file = path.join(dir, `${name}.json`);
  assert.deepEqual(JSON.parse(readFileSync(file, "utf8")), agentConfig("edit", cwd));
  assert.equal(statSync(file).mode & 0o777, 0o600);
  writeFileSync(file, JSON.stringify({ ...agentConfig("edit", cwd), allowedTools: ["*"] })); // a thread loosening it
  assert.equal(writeAgent("edit", cwd, dir), name);
  assert.deepEqual(JSON.parse(readFileSync(file, "utf8")).allowedTools, []);
  assert.deepEqual(readdirSync(dir).filter(item => item.endsWith(".tmp")), [], "no temp file left");
  assert.equal(writeAgent("edit", cwd, path.join(file, "no")), null, "a folder that cannot be written: Kiro's own default, everything else is held");
});

test("tier mapping in the kiro plug: full trusts all, read and edit name the generated agent", () => {
  const config = { plugin: "kiro", bin: "kiro-cli", kiroAgentsDir: dir };
  assert.deepEqual(launchOf(config, "full", cwd).args, ["acp", "--trust-all-tools"]);
  for (const tier of ["read", "edit"]) {
    const { args } = launchOf(config, tier, cwd);
    assert.deepEqual(args, ["acp", "--agent", agentName(tier, cwd)]);
    assert.ok(!args.includes("--trust-all-tools"));
  }
  assert.deepEqual(launchOf(config, "edit").args, ["acp"], "no folder yet (the start-up check): nothing is written");
  assert.deepEqual(launchOf({ plugin: "dsh", bin: "dsh" }, "edit", cwd).args, ["--profile", "acp"]);
});
