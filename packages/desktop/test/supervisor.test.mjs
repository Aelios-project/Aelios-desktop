import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { Supervisor } from "../host/supervisor.mjs";

const ENTRY = path.join(path.dirname(fileURLToPath(import.meta.url)), "fake-runner.mjs");
const until = async (check, ms = 5000) => {
  const end = Date.now() + ms;
  while (!check()) { if (Date.now() > end) throw new Error("timed out"); await new Promise((r) => setTimeout(r, 20)); }
};
const make = (env, extra = {}) => new Supervisor({ entry: ENTRY, node: process.execPath, env, killAfterMs: 2000, ...extra });

test("starts, reports running, and stops on SIGTERM", async () => {
  const s = make({ FAKE_MODE: "run" });
  s.start();
  await until(() => s.state === "running");
  await s.stop();
  await until(() => s.state === "stopped");
  assert.equal(s.child, null);
});

test("a second runner holding the lock gives 'locked', not a restart", async () => {
  const s = make({ FAKE_MODE: "locked" });
  s.start();
  await until(() => s.state === "locked");
  assert.match(s.error, /already using/);
});

test("a revoked pairing gives 'revoked'", async () => {
  const s = make({ FAKE_MODE: "crash", FAKE_REVOKED: "1" });
  s.start();
  await until(() => s.state === "revoked");
});

test("a crash restarts once, then waits for the owner within a minute", async () => {
  let starts = 0;
  const s = make({ FAKE_MODE: "crash" }, { now: () => 1_000_000 });
  const start = s.start.bind(s);
  s.start = (opts) => { starts += 1; start(opts); };
  s.start();
  await until(() => starts === 2 && s.state === "crashed" && s.child === null, 8000);
  await new Promise((r) => setTimeout(r, 300));
  assert.equal(starts, 2);
  assert.equal(s.state, "crashed");
});

test("an unpaired runner gives 'unpaired'", async () => {
  const s = make({ FAKE_MODE: "crash", FAKE_PAIRED: "0" });
  s.start();
  await until(() => s.state === "unpaired");
});
