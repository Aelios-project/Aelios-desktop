// The pure rules behind the new look: status colors, the unread dots, the settings sections, the busy chip's counts.
import assert from "node:assert/strict";
import { test } from "node:test";
import { busyOf } from "../client/activity.mjs";
import { newsOf, readSeen } from "../client/seen.mjs";
import { sectionOf } from "../client/settings.mjs";
import { runnerDown, runnerTone, taskTone, waitTone } from "../client/tones.mjs";

test("tones: the runner is green running, amber on its way or paired elsewhere, red when down", () => {
  assert.deepEqual(["running", "starting", "unpaired", "locked", "stopped", "crashed", "revoked", "odd"].map(runnerTone), ["ok", "warn", "warn", "warn", "bad", "bad", "bad", "idle"]);
  assert.deepEqual(["stopped", "crashed", "revoked", "running", "unpaired"].map(runnerDown), [true, true, true, false, false]);
});

test("tones: an open question is hot, expired ones grey; tasks follow the resident's pill colors", () => {
  assert.equal(waitTone({ kind: "ask" }), "hot");
  assert.equal(waitTone({ kind: "ask", expired: true }), "idle");
  assert.deepEqual(["stuck", "done", "note"].map((kind) => waitTone({ kind })), ["bad", "ok", "info"]);
  assert.deepEqual(["working", "needs_you", "done", "failed"].map(taskTone), ["warn", "hot", "ok", "bad"]);
});

test("unread: a resident met for the first time starts seen; one who spoke since gets a dot; the open one never does", () => {
  const first = newsOf([{ id: "a", saidAt: 5 }, { id: "b", saidAt: 7 }], "a", {});
  assert.deepEqual([...first.news], []);
  assert.deepEqual(first.seen, { a: 5, b: 7 });
  const later = newsOf([{ id: "a", saidAt: 9 }, { id: "b", saidAt: 8 }], "a", first.seen);
  assert.deepEqual([...later.news], ["b"]);
  assert.equal(later.seen.a, 9);
  assert.deepEqual(readSeen({ getItem: () => "not json" }), {});
});

test("settings: each key has one section by its prefix, and an unknown key stays with the resident", () => {
  const cases = { TG_BOT_TOKEN: "channels", WEB_PUSH: "channels", WECOM_SECRET: "channels", WEB_SEARCH: "web", TAVILY_API_KEY: "web",
    CUSTOM_BASE_URL: "model", CLAUDE_BOX_URL: "model", AELIOS_URL: "memory", TIME_ZONE: "time", ALARMS: "time",
    VOICE_ID: "voice", STICKERS: "voice", CLOUD_TASKS: "work", CLOUD_TASK_MODEL: "work", PERSONA_EDIT: "resident", SOMETHING_NEW: "resident" };
  for (const [key, section] of Object.entries(cases)) assert.equal(sectionOf(key), section, key);
});

test("busy chip: it carries the counts it draws as icons", () => {
  const busy = busyOf({ activity: [{ type: "reasoning", text: "a" }, { type: "tool", name: "web_search" }, { type: "tool", name: "web_fetch" }] });
  assert.deepEqual([busy.thoughts, busy.tools], [1, 2]);
});

test("time: the clock today, then Yesterday, a weekday this week, else a short date", async () => {
  const { shortWhen } = await import("../client/time.mjs");
  const now = new Date(2026, 10, 8, 18, 0);
  assert.equal(shortWhen(new Date(2026, 10, 8, 9, 5), now), "09:05");
  assert.equal(shortWhen(new Date(2026, 10, 7, 9, 5), now), "Yesterday");
  assert.equal(shortWhen(new Date(2026, 10, 4, 9, 5), now), "Wed");
  assert.equal(shortWhen(new Date(2026, 9, 1, 9, 5), now), "Oct 1");
  assert.equal(shortWhen("", now), "");
});
