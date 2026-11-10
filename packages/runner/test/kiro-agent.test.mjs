// The Kiro agent config the runner writes (src/kiro-agent.mjs) and how the tier maps to Kiro's start-up (src/plugins.mjs).
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { homeDir } from "../src/state.mjs";
import { agentConfig, agentName, writeAgent } from "../src/kiro-agent.mjs";
import { launchOf } from "../src/plugins.mjs";
import { ASK_WORDS, allowAllBut } from "../src/shell-allow.mjs";

const dir = mkdtempSync(path.join(os.tmpdir(), "ka-"));
test.after(() => rmSync(dir, { recursive: true, force: true }));
const cwd = "/work/space", thread = "t_main";

test("read: Kiro approves reads inside the workspace only; neither tier trusts the write tool", () => {
  const read = agentConfig("read", thread, cwd);
  assert.deepEqual(read.allowedTools, [], "a tool in allowedTools is trusted for every path");
  for (const tool of ["fs_read", "glob", "grep"]) assert.deepEqual(read.toolsSettings[tool], { allowedPaths: [cwd] });
  assert.equal(read.toolsSettings.execute_bash, undefined, "the read tier: every command is held");
  for (const tier of ["read", "edit"]) {
    const config = agentConfig(tier, thread, cwd);
    assert.ok(!config.allowedTools.includes("fs_write"), "the write tool is never trusted for any path");
    assert.deepEqual(config.toolsSettings.fs_write, tier === "edit" ? { allowedPaths: [cwd] } : undefined, "only edit writes unasked, and only inside the workspace");
    assert.ok(!config.allowedTools.some(tool => /write|bash|shell/.test(tool)));
    assert.equal(config.includeMcpJson, false);
    assert.equal(config.name, agentName(thread, cwd));
  }
  assert.notEqual(agentName(thread, cwd), agentName(thread, "/work/other"));
  assert.notEqual(agentName(thread, cwd), agentName("t_other", cwd), "one name per thread");
});

test("edit: reads anywhere, any shell command except the ask words, nothing refused outright", () => {
  const { allowedTools, toolsSettings } = agentConfig("edit", thread, cwd);
  assert.deepEqual(allowedTools, ["fs_read", "glob", "grep"]);
  assert.deepEqual(Object.keys(toolsSettings).sort(), ["execute_bash", "fs_read", "fs_write", "glob", "grep"]);
  const home = homeDir();
  for (const tool of ["fs_read", "glob", "grep"]) assert.deepEqual(toolsSettings[tool], { deniedPaths: [home, `${home}/**`] }, "no path limit on reads except the runner's home");
  assert.deepEqual(toolsSettings.execute_bash, { allowedCommands: [allowAllBut()] });
});

test("the shell filter lets everything through except commands holding an ask word", () => {
  const allowed = command => new RegExp(`^(?:${allowAllBut()})$`).test(command);
  for (const command of ["for i in 1 2 3; do echo $i; done", "sleep 1; echo done", "gh pr list --limit 2", "npm ls -g --depth=0", "grep -rl x ~/Desktop", "cat /etc/hosts", "git status -sb",
    "git fetch origin", "git branch newb", "npm run format", "echo firmware", "pushd .", "rms a", "x_rm y", "cat ../a", "ls /", "echo ok > a.txt", "cat vite.config.ts", "npx eslint --config eslint.config.js .", "git config --get remote.origin.url", "ls ~/.config", "node -e 'process.exit(0)'"]) assert.ok(allowed(command), command);
  for (const command of ["git push origin main", "git push --dry-run", "git -C a push", "rm a", "rm -rf a", "RM a", "/bin/rm a", "echo a; rm a", "bash -c 'rm a'", "cd a && sudo ls", "find . -delete",
    "git clean -fd", "npm publish", "npx wrangler deploy", "npm run deploy", "gh pr merge 32", "gh release create v1", "rmdir a", "unlink a", "shred a", "trash a", "doas ls", "echo a\nrm a", "if true; then rm a; fi"]) assert.ok(!allowed(command), command);
  for (const word of ASK_WORDS) assert.ok(!allowed(`x ${word}`) && !allowed(word.toUpperCase()), word);
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
  assert.deepEqual(JSON.parse(readFileSync(file, "utf8")).allowedTools, agentConfig("edit", thread, cwd).allowedTools);
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
