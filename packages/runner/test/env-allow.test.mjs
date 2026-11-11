// The helper environment on the acpx engine (src/env-allow.mjs): an allowlist with prefixes expanded, plus config `env`.
import assert from "node:assert/strict";
import test from "node:test";
import { authConflicts, envFor } from "../src/env-allow.mjs";
import { final, rig } from "./rig.mjs";

const PROXIES = ["HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "NO_PROXY", "http_proxy", "https_proxy", "all_proxy", "no_proxy"];
const RUNNER_ENV = {
  PATH: "/bin", ...Object.fromEntries(PROXIES.map(name => [name, "http://proxy.invalid:1"])),
  LC_ALL: "C", XDG_CONFIG_HOME: "/x", SSH_AUTH_SOCK: "/s", KIRO_LOG: "1", AWS_PROFILE: "p", DEEPSEEK_API_KEY: "k", DSH_HOME: "/d",
  SOME_SECRET: "s", AELIOS_WEB_KEY: "w", AELIOS_RUNNER_TOKEN: "t"
};

test("every proxy name in both cases, locale, XDG and SSH_AUTH_SOCK pass; secrets do not", () => {
  const { allow } = envFor("kiro", {}, RUNNER_ENV);
  for (const name of [...PROXIES, "LC_ALL", "XDG_CONFIG_HOME", "SSH_AUTH_SOCK", "PATH"]) assert.ok(allow.includes(name), name);
  for (const name of ["SOME_SECRET", "AELIOS_WEB_KEY", "AELIOS_RUNNER_TOKEN"]) assert.ok(!allow.includes(name), name);
});

test("a plug's prefixes pass for that plug only", () => {
  const kiro = envFor("kiro", {}, RUNNER_ENV).allow, dsh = envFor("dsh", {}, RUNNER_ENV).allow, command = envFor("command", {}, RUNNER_ENV).allow;
  assert.ok(kiro.includes("KIRO_LOG") && kiro.includes("AWS_PROFILE") && !kiro.includes("DEEPSEEK_API_KEY") && !kiro.includes("DSH_HOME"));
  assert.ok(dsh.includes("DEEPSEEK_API_KEY") && dsh.includes("DSH_HOME") && !dsh.includes("KIRO_LOG") && !dsh.includes("AWS_PROFILE"));
  assert.ok(!command.some(name => /^(KIRO_|AWS_|DEEPSEEK_|DSH_)/.test(name)));
});

test("Kiro gets its own KIRO_HOME, so the owner's global steering is not loaded; other helpers get none", () => {
  const config = { home: "/runner/home", env: { KIRO_HOME: "/elsewhere" } };
  assert.equal(envFor("kiro", config, RUNNER_ENV).env.KIRO_HOME, "/runner/home/kiro-home", "a config env key cannot point it back");
  assert.equal(envFor("dsh", config, RUNNER_ENV).env.KIRO_HOME, "/elsewhere");
});

test("config env keys are passed as written", () => {
  assert.deepEqual(envFor("dsh", { env: { GH_TOKEN: "x" } }, RUNNER_ENV).env, { GH_TOKEN: "x" });
  assert.deepEqual(envFor("dsh", {}, RUNNER_ENV).env, {});
});

test("a config env key claimed by an inherited ACPX_AUTH_ grant is refused, by either name", () => {
  const parent = { ...RUNNER_ENV, ACPX_AUTH_SENTINEL_ONE: "parent", "ACPX_AUTH_my-key": "parent", ACPX_AUTH_EMPTY: " " };
  assert.deepEqual(authConflicts({ SENTINEL_ONE: "c", MY_KEY: "c", ACPX_AUTH_SENTINEL_ONE: "c", EMPTY: "c", OTHER: "c" }, parent), ["SENTINEL_ONE", "MY_KEY", "ACPX_AUTH_SENTINEL_ONE"]);
  assert.throws(() => envFor("command", { env: { SENTINEL_ONE: "c" } }, parent), /SENTINEL_ONE.*ACPX_AUTH_/);
  assert.doesNotThrow(() => envFor("command", { env: { OTHER: "c" } }, parent));
});

const withEnv = async (extra, fn) => {
  const saved = { ...process.env };
  Object.assign(process.env, extra);
  try { await fn(); } finally {
    for (const name of Object.keys(process.env)) if (!(name in saved)) delete process.env[name];
    Object.assign(process.env, saved);
  }
};

test("end to end: a config env value reaches the helper as written; a conflicting ACPX_AUTH_ grant fails the turn before any start", () =>
  withEnv({ ACPX_AUTH_SENTINEL_TWO: "parent-test-value" }, async () => {
    const r = await rig("kiro", { engine: "acpx" });
    try {
      Object.assign(r.config.env, { FAKE_PROBE: "PLAIN_ONE", PLAIN_ONE: "configured-test-value" });
      r.start();
      assert.equal((await final(r, r.cloud.push({ text: "hello" }))).status, "done");
      assert.deepEqual(r.log().find(e => e.event === "start").probe, { PLAIN_ONE: "configured-test-value" });
      await r.stop(); r.stopped = false;
      r.config.env.SENTINEL_TWO = "configured-test-value";
      r.start();
      const refused = await final(r, r.cloud.push({ text: "must not run", thread: "t_other" }));
      assert.equal(refused.status, "failed");
      assert.match(refused.summary, /SENTINEL_TWO.*ACPX_AUTH_/);
      assert.ok(!refused.summary.includes("parent-test-value"), "no value in the message");
      assert.equal(r.log().filter(e => e.event === "start").length, 1, "no helper started for the refused turn");
    } finally { await r.done(); }
  }));

for (const plugin of ["kiro", "dsh"]) {
  test(`[${plugin}] end to end: the helper sees the allowlist and config env, not the rest`, () => withEnv({ ...RUNNER_ENV, PATH: process.env.PATH }, async () => {
    const r = await rig(plugin, { engine: "acpx" });
    try {
      r.config.env.MY_EXTRA = "1";
      r.start();
      assert.equal((await final(r, r.cloud.push({ text: "hello" }))).status, "done");
      const names = r.log().find(e => e.event === "start").envNames;
      for (const name of ["ALL_PROXY", "all_proxy", "LC_ALL", "XDG_CONFIG_HOME", "SSH_AUTH_SOCK", "MY_EXTRA", "FAKE_STORE"]) assert.ok(names.includes(name), name);
      for (const name of ["SOME_SECRET", "AELIOS_WEB_KEY", "AELIOS_RUNNER_TOKEN"]) assert.ok(!names.includes(name), name);
      assert.equal(names.includes("KIRO_LOG"), plugin === "kiro");
      assert.equal(names.includes("DEEPSEEK_API_KEY"), plugin === "dsh");
    } finally { await r.done(); }
  }));
}
