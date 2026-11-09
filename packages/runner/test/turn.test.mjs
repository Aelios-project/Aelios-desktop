// The engine switch: config.engine picks the legacy ACP client or acpx.
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { Turn } from "../src/helper.mjs";
import { readConfig } from "../src/state.mjs";
import { makeTurn } from "../src/turn.mjs";
import { AcpxTurn } from "../src/turn-acpx.mjs";

const options = { launch: { command: "x", args: [] }, cwd: "/w", prompt: "p", tier: "read", redact: text => text };

test("the default engine is legacy; \"acpx\" gives the acpx turn", () => {
  assert.ok(makeTurn(options, {}) instanceof Turn);
  assert.ok(makeTurn(options, { engine: "legacy" }) instanceof Turn);
  assert.ok(makeTurn({ ...options, thread: "t", engine: null }, { engine: "acpx", plugin: "dsh" }) instanceof AcpxTurn);
});

test("an unknown engine value fails when the config is read", async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "turn-"));
  try {
    const file = path.join(dir, "config.json");
    for (const engine of ["legacy", "acpx"]) { writeFileSync(file, JSON.stringify({ engine })); assert.equal((await readConfig(file)).engine, engine); }
    writeFileSync(file, JSON.stringify({})); assert.equal((await readConfig(file)).engine, undefined);
    writeFileSync(file, JSON.stringify({ engine: "acpx2" }));
    await assert.rejects(readConfig(file), /engine must be one of legacy, acpx/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
