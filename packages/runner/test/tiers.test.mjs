// Two tiers, edit and full. The old `read` tier is gone: old configs and jobs run as edit, `access` switches the tier,
// and pairing again keeps the config keys it does not own.
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { TIERS, lowest, tierOf } from "../src/permission.mjs";
import { readConfig } from "../src/state.mjs";
import { FakeCloud } from "./fake-cloud.mjs";

const BIN = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "bin", "aelios-runner.mjs");

test("only edit and full exist; a stale read means edit and never raises a tier", () => {
  assert.deepEqual(TIERS, ["edit", "full"]);
  assert.deepEqual(["read", "edit", "full", "root", undefined].map(tierOf), ["edit", "edit", "full", null, null]);
  assert.equal(lowest("full", "read"), "edit");
  assert.equal(lowest("edit", "full"), "edit");
  assert.equal(lowest("full", "full"), "full");
});

test("a config that still says read runs as edit and says so once", async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "tiers-"));
  try {
    const file = path.join(dir, "config.json");
    writeFileSync(file, JSON.stringify({ url: "https://x.example", access: "read" }));
    const lines = [];
    assert.equal((await readConfig(file, line => lines.push(line))).access, "edit");
    assert.equal(lines.length, 1);
    assert.match(lines[0], /"read" no longer exists.*"edit"/);
    await readConfig(file); // no listener: still fine
    writeFileSync(file, JSON.stringify({ url: "https://x.example", access: "full" }));
    assert.equal((await readConfig(file, line => lines.push(line))).access, "full");
    assert.equal(lines.length, 1, "nothing is said for a current tier");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("pair defaults to edit and keeps engine and timeouts; access switches the tier and keeps every other key", async () => {
  const cloud = await new FakeCloud().listen();
  const base = realpathSync(mkdtempSync(path.join(os.tmpdir(), "tiers-cli-")));
  const home = path.join(base, "h");
  const env = { ...process.env, AELIOS_RUNNER_HOME: home, AELIOS_WEB_KEY: "web-key" };
  const run = (...args) => new Promise((resolve, reject) => execFile(process.execPath, [BIN, ...args], { env }, (error, out, err) => (error ? reject(new Error(err)) : resolve(out))));
  const config = () => JSON.parse(readFileSync(path.join(home, "config.json"), "utf8"));
  const pair = (...extra) => run("pair", "--url", cloud.url, "--workspace", path.join(base, "w"), "--plugin", "command", "--command", JSON.stringify([process.execPath, "-e", ""]), ...extra);
  try {
    await assert.rejects(pair("--access", "root"), /--access is edit or full/);
    mkdirSync(home, { recursive: true });
    writeFileSync(path.join(home, "config.json"), JSON.stringify({ engine: "acpx", timeouts: { turn: 99 }, url: "https://old.example", access: "full" }));
    await pair();
    assert.deepEqual([config().access, config().engine, config().timeouts], ["edit", "acpx", { turn: 99 }], "default is edit; the keys pair does not own stay");
    assert.notEqual(config().url, "https://old.example");

    assert.match(await run("access", "full"), /Access is full/);
    assert.deepEqual([config().access, config().engine, config().plugin, config().timeouts], ["full", "acpx", "command", { turn: 99 }]);
    assert.equal(JSON.parse(await run("status")).access, "full");
    await assert.rejects(run("access", "read"), /usage: aelios-runner access edit\|full/);
    await assert.rejects(run("access"), /usage/);
    assert.equal(config().access, "full", "a refused switch changes nothing");
    await run("access", "edit");
    assert.equal(config().access, "edit");
  } finally { await cloud.close(); rmSync(base, { recursive: true, force: true }); }
});

test("switching the helper by pairing again keeps engine and timeouts, and drops the old helper's bin and args", async () => {
  const cloud = await new FakeCloud().listen();
  const base = realpathSync(mkdtempSync(path.join(os.tmpdir(), "switch-cli-")));
  const home = path.join(base, "h");
  const env = { ...process.env, AELIOS_RUNNER_HOME: home, AELIOS_WEB_KEY: "web-key" };
  const run = (...args) => new Promise((resolve, reject) => execFile(process.execPath, [BIN, ...args], { env }, (error, out, err) => (error ? reject(new Error(err)) : resolve(out))));
  const config = () => JSON.parse(readFileSync(path.join(home, "config.json"), "utf8"));
  const pair = (...extra) => run("pair", "--url", cloud.url, "--workspace", path.join(base, "w"), ...extra);
  try {
    mkdirSync(home, { recursive: true });
    const fake = process.execPath;
    writeFileSync(path.join(home, "config.json"), JSON.stringify({ engine: "acpx", timeouts: { turn: 99 }, plugin: "kiro", bin: "/old/kiro-cli", args: ["--x"], url: "https://old.example", access: "edit" }));
    await pair("--plugin", "command", "--command", JSON.stringify([fake, "-e", ""]));
    assert.deepEqual([config().engine, config().timeouts, config().bin, config().args], ["acpx", { turn: 99 }, undefined, undefined], "a helper switch keeps engine, drops bin and args");
    await run("unpair");
    writeFileSync(path.join(home, "config.json"), JSON.stringify({ ...config(), bin: fake, args: ["-e", ""] }));
    await pair("--plugin", "command", "--command", JSON.stringify([fake, "-e", ""]));
    assert.deepEqual([config().bin, config().args], [fake, ["-e", ""]], "the same helper keeps its own keys");
  } finally { await cloud.close(); rmSync(base, { recursive: true, force: true }); }
});
