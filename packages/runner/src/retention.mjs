// What the acpx session store (<home>/acpx, store.mjs) keeps, and for how long. acpx writes one file per session key in
// <home>/acpx/sessions/, and a key starts with the hash of its thread (turn-acpx.mjs), so a thread's files are found by
// that prefix. The runner's own thread record in state.json stays (requirement 5.6): a thread whose files are gone opens
// a new session with a recap.
// shortcut: age is the file's modified time, which acpx updates on every turn of that session; a thread quiet for longer
// than the limit loses its saved conversation. Upgrade by reading `last_used_at` if that ever differs.
import { createHash } from "node:crypto";
import { readdirSync, rmSync, statSync } from "node:fs";
import path from "node:path";

export const RETENTION_DEFAULTS = { days: 30, maxMb: 500 };
const DAY = 24 * 60 * 60_000;

/** The part of a session key that names the thread. */
export const threadHash = thread => createHash("sha256").update(thread).digest("hex").slice(0, 12);

const sessionsOf = home => path.join(home, "acpx", "sessions");
const prefixOf = thread => encodeURIComponent(`${threadHash(thread)}:`);

/** Every session file with its thread prefix, size and age, oldest first. A missing store is empty. */
function files(home) {
  const dir = sessionsOf(home);
  let names;
  try { names = readdirSync(dir); } catch { return []; }
  return names.filter(name => name.endsWith(".json")).flatMap(name => {
    try {
      const info = statSync(path.join(dir, name));
      return info.isFile() ? [{ file: path.join(dir, name), group: name.split("%3A")[0], size: info.size, at: info.mtimeMs }] : [];
    } catch { return []; }
  }).sort((a, b) => a.at - b.at);
}

/** The store's path and size, for `status`. */
export function storeInfo(home) {
  return { path: path.join(home, "acpx"), bytes: files(home).reduce((sum, item) => sum + item.size, 0) };
}

/** Deletes one thread's saved sessions. Returns how many files went. */
export function forget(home, thread) {
  const prefix = prefixOf(thread), gone = files(home).filter(item => path.basename(item.file).startsWith(prefix));
  for (const item of gone) rmSync(item.file, { force: true });
  return gone.length;
}

/** Deletes the whole store. */
export function forgetAll(home) { rmSync(path.join(home, "acpx"), { recursive: true, force: true }); }

/**
 * Deletes threads idle for more than `days`, then, while the store is over `maxMb`, the thread used longest ago.
 * A thread goes whole: all its session files at once. Returns the number of files deleted and the hashes of those threads.
 */
export function sweep(home, { days = RETENTION_DEFAULTS.days, maxMb = RETENTION_DEFAULTS.maxMb } = {}, now = Date.now()) {
  const all = files(home), groups = new Map();
  for (const item of all) groups.set(item.group, [...(groups.get(item.group) ?? []), item]);
  const ordered = [...groups.values()].map(items => ({ items, at: Math.max(...items.map(i => i.at)), size: items.reduce((s, i) => s + i.size, 0) })).sort((a, b) => a.at - b.at);
  let total = all.reduce((sum, item) => sum + item.size, 0), deleted = 0;
  const threads = [];
  for (const group of ordered) {
    if (!(now - group.at > days * DAY || total > maxMb * 1024 * 1024)) continue;
    for (const item of group.items) { rmSync(item.file, { force: true }); deleted++; }
    total -= group.size;
    threads.push(group.items[0].group);
  }
  return { deleted, threads };
}

/**
 * Marks threads whose saved sessions were deleted, so their next turn starts a new session with a recap instead of
 * reloading the old one from the helper. The record itself stays (folder, seed, launch). `which`: thread hashes, or "all".
 */
export function markForgotten(state, which) {
  return state.update(s => {
    for (const [thread, record] of Object.entries(s.threads)) {
      if (!record.sessionId || (which !== "all" && !which.includes(threadHash(thread)))) continue;
      delete record.sessionId;
      record.forgotten = true;
    }
  });
}

/** Throws when config `retention` is not `{days?, maxMb?}` with positive numbers. */
export function checkRetention(retention) {
  if (retention === undefined) return;
  if (!retention || typeof retention !== "object" || Array.isArray(retention)) throw new Error("config retention must be an object");
  for (const [name, value] of Object.entries(retention)) {
    if (!(name in RETENTION_DEFAULTS)) throw new Error(`config retention.${name} is not known; use days, maxMb`);
    if (typeof value !== "number" || !(value > 0)) throw new Error(`config retention.${name} must be a number above 0`);
  }
}
