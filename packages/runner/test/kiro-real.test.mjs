// Proves the real `kiro-cli acp` can be started and answers initialize. It sends no prompt, so it uses no quota.
// Off by default. Run: AELIOS_REAL_KIRO=1 node --test test/kiro-real.test.mjs
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import test from "node:test";
import { launchOf } from "../src/plugins.mjs";

test("real kiro-cli acp answers initialize", { skip: !process.env.AELIOS_REAL_KIRO }, async () => {
  const launch = launchOf({ plugin: "kiro" }, "edit", process.cwd(), "real-check");
  const child = spawn(launch.command, launch.args, { cwd: process.cwd(), env: { ...process.env, ...launch.env }, stdio: ["pipe", "pipe", "ignore"] });
  try {
    const reply = new Promise((resolve, reject) => {
      let buffer = "";
      child.on("error", reject);
      child.stdout.on("data", chunk => {
        buffer += chunk;
        for (const line of buffer.split("\n").slice(0, -1)) { try { const message = JSON.parse(line); if (message.id === 1) resolve(message); } catch { /* not JSON */ } }
      });
      setTimeout(() => reject(new Error("no answer to initialize in 30 s")), 30_000).unref();
    });
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: 1, clientCapabilities: {}, clientInfo: { name: "aelios-runner-test", version: "0" } } }) + "\n");
    const { result } = await reply;
    assert.equal(result.protocolVersion, 1);
  } finally { child.kill(); }
});
