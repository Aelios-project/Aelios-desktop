// How the thread's helper is described to acpx (src/launch.mjs) and the identity that decides "same helper".
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { identityOf, registryOf, resolve, sameLaunch } from "../src/launch.mjs";
import { launchOf } from "../src/plugins.mjs";

const dir = mkdtempSync(path.join(os.tmpdir(), "launch-"));
test.after(() => rmSync(dir, { recursive: true, force: true }));
const cwd = "/work/space";
const kiro = { plugin: "kiro", bin: "kiro-cli", kiroAgentsDir: dir };
const dsh = { plugin: "dsh", bin: "/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh" };

test("kiro starts as `kiro-cli acp --agent <name>` with no tier in the name; dsh as `dsh --profile acp`; both from our registry", () => {
  for (const tier of ["read", "edit", "full"]) {
    const { argv } = resolve(kiro, "t_a", launchOf(kiro, tier, cwd, "t_a"));
    assert.deepEqual(argv.slice(0, 3), ["kiro-cli", "acp", "--agent"]);
    assert.doesNotMatch(argv[3], /read|edit|full/);
    assert.ok(!argv.includes("kiro-cli-chat") && !argv.includes("--trust-all-tools"));
  }
  assert.deepEqual(resolve(dsh, "t_a", launchOf(dsh, "edit", cwd, "t_a")).argv, [dsh.bin, "--profile", "acp"]);
  const entries = registryOf(dsh, "t_a", launchOf(dsh, "edit", cwd, "t_a"));
  assert.deepEqual(Object.keys(entries), [resolve(dsh, "t_a", launchOf(dsh, "edit", cwd, "t_a")).name], "one entry: the helper of this thread only");
  assert.ok(Array.isArray(Object.values(entries)[0]), "an argv array, never a string to split");
});

test("a path with spaces stays one argv item; no item is npx; two threads get two names", () => {
  const argv = resolve(dsh, "t_a", launchOf(dsh, "edit", cwd, "t_a")).argv;
  assert.equal(argv[0], dsh.bin);
  assert.equal(argv.length, 3);
  for (const config of [kiro, dsh]) assert.ok(!resolve(config, "t_a", launchOf(config, "read", cwd, "t_a")).argv.some(item => /npx/.test(item)));
  const a = resolve(kiro, "t_a", launchOf(kiro, "read", cwd, "t_a")), b = resolve(kiro, "t_b", launchOf(kiro, "read", cwd, "t_b"));
  assert.notEqual(a.name, b.name);
  assert.match(a.name, /^kiro:[0-9a-f]{12}$/);
  assert.notEqual(a.argv[3], b.argv[3], "and two Kiro agent files");
});

test("the launch identity is equal across tiers and different when the binary, the arguments or the folder change", () => {
  const id = (config, tier, where = cwd) => identityOf(config, launchOf(config, tier, where, "t_a"), where);
  assert.equal(id(kiro, "read").id, id(kiro, "edit").id);
  assert.equal(id(kiro, "read").id, id(kiro, "full").id);
  assert.notEqual(id(kiro, "read").id, id({ ...kiro, bin: "/other/kiro-cli" }, "read").id, "binary moved");
  assert.notEqual(id(kiro, "read").id, id({ ...kiro, args: ["--verbose"] }, "read").id, "arguments changed");
  assert.notEqual(id(kiro, "read").id, id(kiro, "read", "/work/other").id, "folder changed");
  assert.ok(sameLaunch({ launch: id(kiro, "read") }, id(kiro, "edit")));
  assert.ok(!sameLaunch({ launch: id(kiro, "read") }, id({ ...kiro, bin: "/other" }, "read")));
  assert.ok(!sameLaunch({}, id(kiro, "read")), "no record yet is not the same");
});
