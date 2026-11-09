import assert from "node:assert/strict";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { test } from "node:test";
import path from "node:path";
import { DeployError, fillConfig, makeDeployer, tokenEnv } from "../host/onboarding/deploy.mjs";

const DIR = path.join("/tmp", "ad-bundle-test");
const bundle = {
  dir: DIR, worker: "companion-memory-proxy", configFile: "wrangler.toml",
  configText: 'main = "{{MAIN}}"\nmigrations_dir = "{{MIGRATIONS}}"\ndatabase_id = "{{D1_ID}}"\n',
};

test("deploy: the token reaches the child environment, never the arguments or a tracked file", async () => {
  mkdirSync(DIR, { recursive: true });
  const calls = [];
  let configSeen = "";
  let configPath = "";
  const wrangler = async (args, options) => {
    configPath = args[args.indexOf("--config") + 1];
    configSeen = (await import("node:fs")).readFileSync(configPath, "utf8");
    calls.push({ args, options });
    return { code: 0, tail: "deployed" };
  };
  try {
    const deployer = makeDeployer({ wrangler });
    await deployer.upload(bundle, { token: "token-value", accountId: "account", tag: "tag", vars: { AELIOS_URL: "https://a.example" }, d1Id: "db-id" });
    const [{ args, options }] = calls;
    assert.ok(!JSON.stringify(args).includes("token-value"));
    assert.equal(options.extraEnv.CLOUDFLARE_API_TOKEN, "token-value");
    assert.equal(options.extraEnv.CLOUDFLARE_ACCOUNT_ID, "account");
    assert.ok(configSeen.includes(path.join(DIR, "index.js")));
    assert.ok(configSeen.includes("db-id"));
    assert.ok(args.includes("--keep-vars"));
    assert.deepEqual(args.slice(-2), ["--var", "AELIOS_URL:https://a.example"]);
    assert.equal(existsSync(configPath), false, "the temporary config is deleted");
  } finally { rmSync(DIR, { recursive: true, force: true }); }
});

test("deploy: a secret goes on standard input and the keychain path sends no token", async () => {
  mkdirSync(DIR, { recursive: true });
  const calls = [];
  const wrangler = async (args, options) => { calls.push({ args, options }); return { code: 0, tail: "" }; };
  try {
    const deployer = makeDeployer({ wrangler });
    await deployer.secret(bundle, { token: null, accountId: "account", name: "WEB_KEY", value: "secret-value" });
    assert.equal(calls[0].options.input, "secret-value");
    assert.ok(!JSON.stringify(calls[0].args).includes("secret-value"));
    assert.ok(!("CLOUDFLARE_API_TOKEN" in calls[0].options.extraEnv));

    await deployer.migrate(bundle, { token: "t", accountId: "a", database: "companion_memory_proxy", d1Id: "id" });
    assert.deepEqual(calls[1].args.slice(0, 4), ["d1", "migrations", "apply", "companion_memory_proxy"]);
    assert.ok(calls[1].args.includes("--remote"));
  } finally { rmSync(DIR, { recursive: true, force: true }); }
});

test("deploy: a failed upload is a DeployError with the redacted tail", async () => {
  mkdirSync(DIR, { recursive: true });
  try {
    const deployer = makeDeployer({ wrangler: async () => ({ code: 1, tail: "boom" }) });
    await assert.rejects(deployer.upload(bundle, { token: "t", accountId: "a", tag: "tag" }), (error) => error instanceof DeployError && error.tail === "boom");
  } finally { rmSync(DIR, { recursive: true, force: true }); }
});

test("deploy: fillConfig and tokenEnv are the only places that know the placeholders", () => {
  const text = fillConfig(bundle, { d1Id: "db" });
  assert.ok(text.includes('main = "/tmp/ad-bundle-test/index.js"'));
  assert.ok(text.includes("/tmp/ad-bundle-test/migrations"));
  assert.deepEqual(Object.keys(tokenEnv(null, "a")).includes("CLOUDFLARE_API_TOKEN"), false);
  assert.equal(tokenEnv("t", "a").CLOUDFLARE_API_TOKEN, "t");
});
