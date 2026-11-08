// Pictures and files sent to a thread, and the machine name sent on the heartbeat.
// Run: node --test --test-concurrency=1 test/inbox.test.mjs
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { safeFileName } from "../src/inbox.mjs";
import { computerName } from "../src/machine-name.mjs";
import { final, rig } from "./rig.mjs";

const KEY = n => String(n).repeat(32);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

test("names from the cloud are cleaned", () => {
  assert.equal(safeFileName("../../etc/passwd"), "passwd");
  assert.equal(safeFileName(".ssh"), "ssh");
  assert.equal(safeFileName("a/b\\c.txt"), "c.txt");
  assert.equal(safeFileName(""), "file");
});

test("the heartbeat carries the computer's name", async () => {
  const r = await rig("kiro");
  try {
    r.start();
    await r.cloud.until(() => r.cloud.beatBodies?.length, "a heartbeat");
    assert.equal(r.cloud.beatBodies[0].label, computerName());
    assert.ok(computerName().length > 0 && computerName().length <= 60);
  } finally { await r.done(); }
});

test("pictures and files are saved inside the thread's folder and handed to the helper", async () => {
  const r = await rig("kiro");
  try {
    r.cloud.files = { [KEY(1)]: { name: "x", type: "image/png", bytes: PNG }, [KEY(2)]: { name: "x", type: "application/pdf", bytes: Buffer.from("%PDF-1.4") } };
    r.start();
    const work = r.cloud.push({ kind: "say", text: "look at these", attachments: [
      { key: KEY(1), name: "picture-1.png", type: "image/png" },
      { key: KEY(2), name: "../../escape.pdf", type: "application/pdf" },
      { key: KEY(3), name: "gone.txt", type: "text/plain" }
    ] });
    assert.equal((await final(r, work)).status, "done");
    const [prompt] = r.prompts();
    const dir = path.join(r.workspace, ".aelios-inbox", work.workId);
    assert.ok(existsSync(path.join(dir, "1-picture-1.png")));
    assert.deepEqual(readFileSync(path.join(dir, "2-escape.pdf")), Buffer.from("%PDF-1.4"));
    assert.ok(!existsSync(path.join(r.workspace, "..", "escape.pdf")), "nothing written outside the folder");
    assert.deepEqual(prompt.blocks.map(b => b.type), ["text", "image", "resource_link"]);
    assert.equal(prompt.blocks[1].data, PNG.toString("base64"));
    assert.match(prompt.blocks[0].text, /2-escape\.pdf/);
    assert.match(prompt.blocks[0].text, /Could not be fetched: gone\.txt/);
  } finally { await r.done(); }
});

test("a work with a malformed attachment list is refused, not run", async () => {
  const r = await rig("kiro");
  try {
    r.start();
    const work = r.cloud.push({ kind: "say", text: "hi", attachments: [{ key: "../x", name: "a", type: "t" }] });
    assert.equal((await final(r, work)).status, "failed");
    assert.equal(r.prompts().length, 0);
  } finally { await r.done(); }
});
