// What the acpx store keeps and for how long (src/retention.mjs), and the command line for it (bin/forget.mjs).
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, realpathSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { checkRetention, forget, forgetAll, storeInfo, sweep, threadHash } from "../src/retention.mjs";
import { FakeCloud } from "./fake-cloud.mjs";
import { final, rig } from "./rig.mjs";

const BIN = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "bin", "aelios-runner.mjs");
const DAY = 24 * 60 * 60_000, NOW = Date.UTC(2026, 10, 10);
const sessions = home => path.join(home, "acpx", "sessions");
const names = home => (existsSync(sessions(home)) ? readdirSync(sessions(home)).sort() : []);
/** One session file for `thread`, `bytes` long, last used `daysAgo` before NOW. */
function put(home, thread, launch, bytes, daysAgo) {
  mkdirSync(sessions(home), { recursive: true });
  const file = path.join(sessions(home), `${encodeURIComponent(`${threadHash(thread)}:${launch}`)}.json`);
  writeFileSync(file, "x".repeat(bytes));
  utimesSync(file, new Date(NOW - daysAgo * DAY), new Date(NOW - daysAgo * DAY));
  return path.basename(file);
}
const withHome = fn => { const home = mkdtempSync(path.join(os.tmpdir(), "retention-")); try { return fn(home); } finally { rmSync(home, { recursive: true, force: true }); } };

test("the age limit deletes idle threads whole and keeps the rest", () => withHome(home => {
  const old1 = put(home, "t_old", "aaaa1111", 10, 40), old2 = put(home, "t_old", "bbbb2222", 10, 35), fresh = put(home, "t_new", "cccc3333", 10, 1);
  assert.equal(sweep(home, { days: 30 }, NOW), 2);
  assert.deepEqual(names(home), [fresh]);
  assert.ok(![old1, old2].some(name => names(home).includes(name)));
}));

test("a thread used recently keeps all its files, even an old one", () => withHome(home => {
  put(home, "t_mixed", "aaaa1111", 10, 60); put(home, "t_mixed", "bbbb2222", 10, 2);
  assert.equal(sweep(home, { days: 30 }, NOW), 0);
  assert.equal(names(home).length, 2);
}));

test("the size cap deletes the thread used longest ago first, until the store fits", () => withHome(home => {
  const mb = 1024 * 1024;
  put(home, "t_a", "aaaa1111", mb, 3); put(home, "t_b", "bbbb2222", mb, 2); const c = put(home, "t_c", "cccc3333", mb, 1);
  assert.equal(sweep(home, { days: 30, maxMb: 1.5 }, NOW), 2);
  assert.deepEqual(names(home), [c]);
  assert.equal(storeInfo(home).bytes, mb);
}));

test("forget removes one thread; forget all removes the store; a missing store is fine", () => withHome(home => {
  assert.equal(forget(home, "t_none"), 0);
  assert.equal(sweep(home, {}, NOW), 0);
  put(home, "t_a", "aaaa1111", 5, 0); put(home, "t_a", "bbbb2222", 5, 0); const b = put(home, "t_b", "cccc3333", 5, 0);
  assert.equal(forget(home, "t_a"), 2);
  assert.deepEqual(names(home), [b]);
  forgetAll(home);
  assert.equal(existsSync(path.join(home, "acpx")), false);
}));

test("retention config: days and maxMb above 0 only", () => {
  assert.doesNotThrow(() => checkRetention(undefined));
  assert.doesNotThrow(() => checkRetention({ days: 7, maxMb: 100 }));
  for (const bad of [[], { days: 0 }, { maxMb: -1 }, { days: "30" }, { keep: 1 }]) assert.throws(() => checkRetention(bad), /retention/);
});

test("forget finds the files acpx really wrote for a thread", async () => {
  const r = await rig("kiro", { engine: "acpx" });
  try {
    r.start();
    await final(r, r.cloud.push({ text: "one" }));
    await final(r, r.cloud.push({ text: "two", thread: "t_two" }));
    await r.stop();
    assert.equal(names(r.dir).length, 2);
    assert.equal(forget(r.dir, "t_two"), 1);
    assert.equal(names(r.dir).length, 1);
    assert.ok(names(r.dir)[0].startsWith(threadHash("t_main")));
  } finally { await r.done(); }
});

test("command line: status shows the store; forget; unpair deletes the store unless --keep-store", async () => {
  const cloud = await new FakeCloud().listen();
  const home = realpathSync(mkdtempSync(path.join(os.tmpdir(), "runner-forget-")));
  const runnerHome = path.join(home, "h");
  const env = { ...process.env, AELIOS_RUNNER_HOME: runnerHome, AELIOS_WEB_KEY: "web-key" };
  const run = (...args) => new Promise((resolve, reject) => execFile(process.execPath, [BIN, ...args], { env }, (error, out, err) => (error ? reject(new Error(err)) : resolve(out))));
  const pair = () => run("pair", "--url", cloud.url, "--workspace", path.join(home, "w"), "--plugin", "command", "--command", JSON.stringify([process.execPath, "-e", ""]));
  try {
    await pair();
    put(runnerHome, "t_a", "aaaa1111", 7, 0); put(runnerHome, "t_b", "bbbb2222", 5, 0);
    const status = JSON.parse(await run("status"));
    assert.equal(status.store.path, path.join(runnerHome, "acpx"));
    assert.equal(status.store.bytes, 12);
    assert.match(status.store.note, /secrets/);
    assert.match(await run("forget", "t_a"), /Deleted 1/);
    await assert.rejects(run("forget"), /usage/);
    assert.match(await run("unpair", "--keep-store"), /kept/);
    assert.equal(names(runnerHome).length, 1);
    await pair();
    assert.match(await run("unpair"), /deleted/);
    assert.equal(existsSync(path.join(runnerHome, "acpx")), false);
    assert.match(await run("forget", "--all"), /Deleted every/);
  } finally { await cloud.close(); rmSync(home, { recursive: true, force: true }); }
});
