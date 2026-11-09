import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { EventEmitter } from "node:events";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { WRANGLER, makeCli } from "../host/onboarding/cli.mjs";
import { Redactor } from "../host/onboarding/redact.mjs";

const FAKE = path.join(path.dirname(fileURLToPath(import.meta.url)), "fake-cli.mjs");
const SECRET = "correct-horse-battery";
const sha = (text) => createHash("sha256").update(text).digest("hex");
const env = { PATH: process.env.PATH, HOME: process.env.HOME, HOST_ONLY: "must-not-leak" };
const redactor = new Redactor([SECRET]);
const cli = makeCli({ env, redactor, timeoutMs: 5000 });

const json = (text) => JSON.parse(text.trim().split("\n").pop());

test("cli: a secret goes on standard input, not in the arguments, and the child gets a clean environment", async () => {
  const out = await cli.run(process.execPath, [FAKE], { input: SECRET, extraEnv: { EXTRA: "1" } });
  assert.equal(out.code, 0);
  const seen = json(out.out);
  assert.equal(seen.input, sha(SECRET), "the child read it from stdin");
  assert.ok(!JSON.stringify(seen.args).includes(SECRET));
  // macOS adds __CF_USER_TEXT_ENCODING on its own, so the check is what must be absent, not an exact list.
  const keys = Object.keys(seen.env);
  for (const key of ["EXTRA", "HOME", "PATH"]) assert.ok(keys.includes(key), `${key} is passed`);
  assert.ok(!keys.includes("HOST_ONLY"), "the host environment is not");
});

test("cli: output that holds a secret is redacted before it is returned", async () => {
  const out = await cli.run(process.execPath, [FAKE, "--echo-input"], { input: SECRET });
  assert.ok(!`${out.err}${out.tail}`.includes(SECRET));
  assert.ok(out.err.includes("[redacted]"));
  assert.ok(out.tail.includes("[redacted]"));
});


test("cli: a failed command keeps its exit code and its redacted message", async () => {
  const out = await cli.run(process.execPath, [FAKE, "--fail"], { input: SECRET });
  assert.equal(out.code, 3);
  assert.ok(out.err.includes("the fake failed"));
});

test("cli: a missing command is a result, not a crash", async () => {
  const out = await cli.run("ad-no-such-command-xyz", []);
  assert.equal(out.code, null);
  assert.ok(/ENOENT|not found/i.test(out.err));
});

test("cli: a slow command is killed and says so", async () => {
  const out = await cli.run(process.execPath, [FAKE], { extraEnv: { FAKE_CLI_SLEEP: "2000" }, timeout: 50 });
  assert.equal(out.timedOut, true);
  assert.equal(out.code, null);
  assert.ok(out.err.includes("took too long"));
});

test("cli: a secret in the arguments is refused before anything runs", () => {
  assert.throws(() => cli.run(process.execPath, [FAKE, SECRET]), /argument/);
});

test("cli: wrangler is pinned and started through npx --yes", async () => {
  const calls = [];
  const spawn = (file, args) => {
    calls.push([file, args]);
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.stdin = { end() {} };
    child.kill = () => {};
    process.nextTick(() => child.emit("close", 0));
    return child;
  };
  const made = makeCli({ spawn, env, redactor });
  await made.wrangler(["deploy"], { input: SECRET });
  assert.deepEqual(calls[0], ["npx", ["--yes", WRANGLER, "deploy"]]);
  await made.cf(["whoami"], {});
  assert.deepEqual(calls[1], ["cf", ["whoami"]]);
});
