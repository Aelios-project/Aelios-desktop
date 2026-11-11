// `status` names the engine: "legacy", or "acpx@<installed version>".
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { engineLabel } from "../src/engine-label.mjs";

const BIN = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "bin", "aelios-runner.mjs");
const version = createRequire(import.meta.url)("acpx/package.json").version;

test("engineLabel: legacy by default, acpx with the installed version", () => {
  assert.equal(engineLabel({}), "legacy");
  assert.equal(engineLabel({ engine: "legacy" }), "legacy");
  assert.equal(engineLabel({ engine: "acpx" }), `acpx@${version}`);
});

test("status prints the engine for both engines", async () => {
  const home = mkdtempSync(path.join(os.tmpdir(), "runner-engine-"));
  const env = { ...process.env, AELIOS_RUNNER_HOME: home };
  const status = () => new Promise((resolve, reject) => execFile(process.execPath, [BIN, "status"], { env }, (e, out, err) => (e ? reject(new Error(err)) : resolve(JSON.parse(out)))));
  const config = { url: "http://127.0.0.1:1", resident: "r", workspace: home, access: "edit", plugin: "kiro" };
  try {
    writeFileSync(path.join(home, "config.json"), JSON.stringify(config));
    assert.equal((await status()).engine, "legacy");
    writeFileSync(path.join(home, "config.json"), JSON.stringify({ ...config, engine: "acpx" }));
    assert.equal((await status()).engine, `acpx@${version}`);
    assert.ok(readFileSync(BIN, "utf8").includes("engine ${engineLabel(config)}"), "start logs the engine");
  } finally { rmSync(home, { recursive: true, force: true }); }
});
