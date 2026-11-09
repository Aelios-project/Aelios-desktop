// The helper environment on the acpx engine (src/env-allow.mjs): an allowlist with prefixes expanded, plus config `env`.
import assert from "node:assert/strict";
import test from "node:test";
import { envFor } from "../src/env-allow.mjs";
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

test("config env keys are passed as written", () => {
  assert.deepEqual(envFor("dsh", { env: { GH_TOKEN: "x" } }, RUNNER_ENV).env, { GH_TOKEN: "x" });
  assert.deepEqual(envFor("dsh", {}, RUNNER_ENV).env, {});
});

for (const plugin of ["kiro", "dsh"]) {
  test(`[${plugin}] end to end: the helper sees the allowlist and config env, not the rest`, async () => {
    const saved = { ...process.env };
    Object.assign(process.env, RUNNER_ENV, { PATH: saved.PATH });
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
    } finally {
      await r.done();
      for (const name of Object.keys(process.env)) if (!(name in saved)) delete process.env[name];
      Object.assign(process.env, saved);
    }
  });
}
