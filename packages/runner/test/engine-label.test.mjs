// `status` names the engine ("acpx@<installed version>"). An old config that names an engine still runs acpx, with one notice.
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { engineLabel } from "../src/engine-label.mjs";
import { readConfig } from "../src/state.mjs";

const BIN = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "bin", "aelios-runner.mjs");
const version = createRequire(import.meta.url)("acpx/package.json").version;

test("engineLabel is acpx with the installed version", () => {
  assert.equal(engineLabel(), `acpx@${version}`);
});

test("status shows acpx with or without an old engine key; readConfig ignores the key and says so once", async () => {
  const home = mkdtempSync(path.join(os.tmpdir(), "runner-engine-"));
  const env = { ...process.env, AELIOS_RUNNER_HOME: home };
  const status = () => new Promise((resolve, reject) => execFile(process.execPath, [BIN, "status"], { env }, (e, out, err) => (e ? reject(new Error(err)) : resolve(JSON.parse(out)))));
  const file = path.join(home, "config.json");
  const config = { url: "http://127.0.0.1:1", resident: "r", workspace: home, access: "edit", plugin: "kiro" };
  try {
    for (const engine of [undefined, "legacy", "acpx", "acpx2"]) {
      writeFileSync(file, JSON.stringify({ ...config, engine }));
      assert.equal((await status()).engine, `acpx@${version}`);
      const lines = [], read = await readConfig(file, line => lines.push(line));
      assert.equal(read.engine, undefined);
      assert.equal(lines.length, engine === "legacy" || engine === "acpx2" ? 1 : 0, "one notice for an old value, none otherwise");
    }
    assert.ok(readFileSync(BIN, "utf8").includes("engine ${engineLabel()}"), "start logs the engine");
  } finally { rmSync(home, { recursive: true, force: true }); }
});
