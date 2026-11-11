// The acpx engine, end to end against the fake resident and the fake helper (both faces). These are the cases the spec
// names for the swap: tier change, launch change, a written prompt, a lost session, the Kiro mode check, pictures.
// The ordinary runner cases run through acpx too: RUNNER_TEST_ENGINE=acpx (see package.json).
import assert from "node:assert/strict";
import { chmodSync, copyFileSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { agentName } from "../src/kiro-agent.mjs";
import { final, rig } from "./rig.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const KEY = n => String(n).repeat(32);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const REOPEN = { kiro: "session/load", dsh: "session/resume" };
const count = (r, event) => r.log().filter(e => e.event === event).length;
const open = (plugin, extra) => rig(plugin, { engine: "acpx", ...extra });
const restart = async r => { await r.stop(); r.stopped = false; r.start(); };
const forgetSessions = r => writeFileSync(r.store, JSON.stringify({ ...JSON.parse(readFileSync(r.store, "utf8")), sessions: {} }));

for (const plugin of ["kiro", "dsh"]) {
  const t = (name, fn, extra) => test(`[${plugin}] ${name}`, async () => { const r = await open(plugin, extra); try { await fn(r); } finally { await r.done(); } });

  t("tier change keeps the session", async r => {
    r.start();
    assert.equal((await final(r, r.cloud.push({ text: "first", access: "edit" }))).status, "done");
    assert.equal((await final(r, r.cloud.push({ text: "second" }))).status, "done");
    const starts = r.log().filter(e => e.event === "start");
    assert.equal(starts.length, 2, "the helper process was restarted");
    assert.deepEqual(starts[0].args, starts[1].args, "the launch arguments do not change with the tier");
    assert.equal(count(r, "session/new"), 1);
    assert.equal(count(r, REOPEN[plugin]), 1);
    assert.deepEqual(r.prompts().map(p => [p.sessionId, p.text]), [["sess-1", "first"], ["sess-1", "second"]]);
    if (plugin === "kiro") {
      assert.deepEqual(starts.map(s => s.agentFile.bash), [true, false], "the second process read the full agent file");
      assert.equal(starts[0].args[2], agentName("t_main", r.workspace));
    }
    await final(r, r.cloud.push({ text: "third" }));
    assert.equal(count(r, "start"), 2, "the same tier does not restart the helper");
  }, { access: "full" });

  t("launch change is a visible handoff, never silent", async r => {
    r.start();
    await final(r, r.cloud.push({ text: "remember the plan" }));
    const before = (await r.state.read()).threads.t_main.launch.id;
    const moved = path.join(r.dir, "moved-agent.mjs"); // the helper binary is somewhere else now
    copyFileSync(path.join(HERE, "fake-agent.mjs"), moved); chmodSync(moved, 0o755);
    r.config.bin = moved;
    const done = await final(r, r.cloud.push({ text: "carry on" }));
    assert.equal(done.status, "done");
    assert.equal(count(r, "session/new"), 2, "a new session, not the old one reloaded under new arguments");
    assert.equal(count(r, REOPEN[plugin]), 0);
    const second = r.prompts()[1];
    assert.match(second.full, /history from an earlier session[^]*remember the plan[^]*carry on/, "the recap is first, marked as history");
    assert.match(done.notice.text, /helper setup changed/);
    const after = (await r.state.read()).threads.t_main;
    assert.notEqual(after.launch.id, before);
    assert.equal(after.sessionId, "sess-2");
  });

  t("a prompt that was written is never sent again", async r => {
    r.start();
    const done = await final(r, r.cloud.push({ text: "CRASH now" }));
    assert.equal(done.status, "needs_you"); // the outcome mapping of the legacy engine is reused as it is
    assert.match(done.summary, /died in the middle of the turn/);
    await restart(r);
    await new Promise(resolve => setTimeout(resolve, 300));
    assert.equal(r.prompts().length, 1, "exactly one prompt reached the helper, also after a restart");
  });

  t("a session acpx cannot reload gives one new session, a notice and a prompt that ran; the next turn resumes the new id", async r => {
    r.start();
    await final(r, r.cloud.push({ text: "first" }));
    await restart(r); // a new runner means a new helper process, which has to reload the saved session
    forgetSessions(r);
    const done = await final(r, r.cloud.push({ text: "second" }));
    assert.equal(done.status, "done");
    assert.match(done.summary, /second/);
    assert.match(done.notice.text, /could not reload the session/);
    assert.equal(count(r, "session/new"), 2);
    assert.equal(r.prompts().length, 2, "the lost-session prompt was written once");
    assert.match(r.prompts()[1].full, /history from an earlier session[^]*first request in this thread\): first/);
    assert.equal((await r.state.read()).threads.t_main.sessionId, "sess-2");
    assert.equal(done.sessionId, "sess-2");
    await restart(r);
    assert.equal((await final(r, r.cloud.push({ text: "third" }))).status, "done");
    assert.equal(count(r, "session/new"), 2, "no third session");
    assert.ok(r.log().some(e => e.event === REOPEN[plugin] && e.sessionId === "sess-2"));
  });

  t("a picture goes as a block only when the helper declares it; a refused picture fails the turn and names the helper", async r => {
    r.cloud.files = { [KEY(1)]: { type: "image/png", bytes: PNG }, [KEY(2)]: { type: "application/pdf", bytes: Buffer.from("%PDF-1.4") } };
    r.start();
    const both = [{ key: KEY(1), name: "a.png", type: "image/png" }, { key: KEY(2), name: "b.pdf", type: "application/pdf" }];
    const done = await final(r, r.cloud.push({ text: "look", attachments: both }));
    if (plugin === "kiro") { // the Kiro face declares promptCapabilities.image
      assert.equal(done.status, "done");
      const [prompt] = r.prompts();
      assert.deepEqual(prompt.blocks.map(b => b.type), ["text", "image"]);
      assert.equal(prompt.blocks[1].data, PNG.toString("base64"));
      assert.match(prompt.blocks[0].text, /b\.pdf/, "the file stays a path in the text");
    } else { // the DSH face does not
      assert.equal(done.status, "failed");
      assert.match(done.summary, /^dsh does not accept pictures/);
      assert.equal(r.prompts().length, 0, "nothing was sent");
    }
  });

  t("a file that is not a picture is a path in the text, never a block, on either face", async r => {
    r.cloud.files = { [KEY(2)]: { type: "application/pdf", bytes: Buffer.from("%PDF-1.4") } };
    r.start();
    const done = await final(r, r.cloud.push({ text: "read it", attachments: [{ key: KEY(2), name: "b.pdf", type: "application/pdf" }] }));
    assert.equal(done.status, "done");
    const [prompt] = r.prompts();
    assert.deepEqual(prompt.blocks.map(b => b.type), ["text"]);
    assert.match(prompt.blocks[0].text, /1-b\.pdf/);
  });
}

test("a Kiro picture is refused when the helper turns pictures off (FAKE_IMAGE=0)", async () => {
  const r = await open("kiro");
  try {
    r.config.env.FAKE_IMAGE = "0";
    r.cloud.files = { [KEY(1)]: { type: "image/png", bytes: PNG } };
    r.start();
    const done = await final(r, r.cloud.push({ text: "look", attachments: [{ key: KEY(1), name: "a.png", type: "image/png" }] }));
    assert.equal(done.status, "failed");
    assert.match(done.summary, /^kiro does not accept pictures/);
    assert.equal(r.prompts().length, 0);
  } finally { await r.done(); }
});

for (const tier of ["edit", "full"]) {
  test(`Kiro mode check, tier ${tier}: a wrong or unreadable mode fails before the prompt; the right mode runs`, async () => {
    const r = await open("kiro", { access: tier });
    try {
      r.start();
      r.config.env.FAKE_MODE = "kiro_default"; // new session, wrong mode
      const wrong = await final(r, r.cloud.push({ text: "must not run" }));
      assert.equal(wrong.status, "failed");
      assert.match(wrong.summary, /did not confirm the restricted agent/);
      assert.equal(r.prompts().length, 0);
      delete r.config.env.FAKE_MODE; // the reloaded session, right mode
      assert.equal((await final(r, r.cloud.push({ text: "runs" }))).status, "done");
      assert.equal(r.prompts().length, 1);
      assert.ok(r.log().some(e => e.event === "session/load"));
      r.config.env.FAKE_MODE = "kiro_default"; // reloaded session, wrong mode
      assert.match((await final(r, r.cloud.push({ text: "must not run on load" }))).summary, /did not confirm/);
      delete r.config.env.FAKE_MODE; r.config.env.FAKE_NOMODE = "1"; // the helper says no mode at all
      const unreadable = await final(r, r.cloud.push({ text: "must not run unreadable" }));
      assert.equal(unreadable.status, "failed");
      assert.match(unreadable.summary, /did not confirm/);
      assert.equal(r.prompts().length, 1, "no prompt reached the helper in any failing case");
    } finally { await r.done(); }
  });
}

test("a DSH face that reports no mode still runs", async () => {
  const r = await open("dsh");
  try {
    r.start();
    assert.equal((await final(r, r.cloud.push({ text: "hello" }))).status, "done");
  } finally { await r.done(); }
});

test("a session store that cannot be made safe refuses the turn with a message", async () => {
  const r = await open("kiro");
  try {
    writeFileSync(path.join(r.dir, "acpx"), "a file where the store folder should be");
    r.start();
    const done = await final(r, r.cloud.push({ text: "must not run" }));
    assert.equal(done.status, "failed");
    assert.match(done.summary, /Cannot use the acpx session store/);
    assert.equal(count(r, "start"), 0);
  } finally { await r.done(); }
});
