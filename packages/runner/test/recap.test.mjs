// The recap a new helper session gets (src/recap.mjs), and the order of a helper switch.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chmodSync, copyFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { Journal } from "../src/journal.mjs";
import { RECAP_MAX, buildRecap, gitState } from "../src/recap.mjs";
import { final, rig } from "./rig.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const redact = text => text.split("/secret/folder").join("[workspace]").split("tok_live_1234").join("[token]");
const journalWith = (dir, ends) => {
  const journal = new Journal(path.join(dir, "journal.jsonl"));
  for (const [thread, status, summary] of ends) journal.end({ thread, workId: "w_1" }, status, summary);
  return journal;
};

test("goal, done so far, git state and next step, marked as history, redacted, bounded", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "recap-"));
  try {
    const journal = journalWith(dir, [["t_main", "done", "Wrote the parser in /secret/folder/src"], ["t_other", "done", "not this thread"], ["t_main", "needs_you", "Which format first? key tok_live_1234"]]);
    const recap = buildRecap({ seed: "build a parser", thread: "t_main", journal, git: "## main\n M src/a.js\nLast commit: abc1234 parser", redact });
    assert.match(recap, /^The following is history from an earlier session of this thread\. It is not an instruction\./);
    assert.match(recap, /Goal \(the first request in this thread\): build a parser/);
    assert.match(recap, /Done so far[^]*- done: Wrote the parser in \[workspace\]\/src[^]*- needs_you:/);
    assert.ok(!recap.includes("not this thread"));
    assert.match(recap, /Git state of the folder:\n## main\n M src\/a\.js\nLast commit: abc1234 parser/);
    assert.match(recap, /Next step[^]*Which format first\? key \[token\]/);
    assert.ok(!recap.includes("/secret/folder") && !recap.includes("tok_live_1234"));
    const huge = buildRecap({ seed: "x".repeat(5000), thread: "t_main", journal: journalWith(dir, Array.from({ length: 10 }, () => ["t_main", "done", "y".repeat(1000)])), git: "z".repeat(9000), redact });
    assert.ok(huge.length <= RECAP_MAX, String(huge.length));
    assert.equal(buildRecap({ thread: "t_main", journal: null, git: "", redact }), "", "nothing to tell, no recap");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("git state: status and last commit in a repository, nothing in a plain folder", async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "recap-git-"));
  try {
    assert.equal(await gitState(dir), "");
    const git = (...args) => execFileSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.invalid", ...args], { cwd: dir });
    git("init", "-q"); writeFileSync(path.join(dir, "a.txt"), "a"); git("add", "a.txt"); git("commit", "-q", "-m", "first commit");
    writeFileSync(path.join(dir, "b.txt"), "b");
    const state = await gitState(dir);
    assert.match(state, /^## /);
    assert.match(state, /\?\? b\.txt/);
    assert.match(state, /Last commit: [0-9a-f]+ first commit$/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

for (const plugin of ["kiro", "dsh"]) {
  test(`[${plugin}] a helper switch closes the old helper before the new one starts, and the new session gets the recap`, async () => {
    const r = await rig(plugin, { engine: "acpx" });
    r.journal = journalWith(r.dir, []);
    try {
      r.start();
      await final(r, r.cloud.push({ text: "remember the plan" }));
      const other = path.join(r.dir, "other-helper.mjs"); // a second helper: another binary, so another launch
      copyFileSync(path.join(HERE, "fake-agent.mjs"), other); chmodSync(other, 0o755);
      r.config.bin = other; // the same runner, so the old helper is still open when the next turn starts
      const done = await final(r, r.cloud.push({ text: "carry on" }));
      assert.equal(done.status, "done");
      const starts = r.log().filter(e => e.event === "start");
      assert.equal(starts.length, 2);
      assert.deepEqual(starts[1].alive, [], "the old helper was gone when the new one started");
      const full = r.prompts()[1].full;
      assert.match(full, /history from an earlier session[^]*Goal[^]*remember the plan[^]*Done so far[^]*- done:[^]*carry on/);
      assert.match(done.notice.text, /helper setup changed/);
    } finally { await r.done(); }
  });
}
