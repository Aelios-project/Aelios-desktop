// A dot beside a resident who said something since the reader last had it open. The resident list carries saidAt
// (src/index.ts residentList); what the reader has seen is kept in localStorage. A resident met for the first
// time starts as seen, so a fresh install does not light every dot.
const KEY = "aelios-desktop.seen";

/** @returns {{ news: Set<string>, seen: Record<string, number> }} the ids to dot, and the seen map to keep. */
export function newsOf(list = [], current = "", seen = {}) {
  const next = { ...seen };
  const news = new Set();
  for (const r of list) {
    if (!r?.id) continue;
    const said = Number(r.saidAt) || 0;
    if (r.id === current || next[r.id] === undefined) next[r.id] = Math.max(said, next[r.id] || 0);
    else if (said > next[r.id]) news.add(r.id);
  }
  return { news, seen: next };
}

export function readSeen(storage = globalThis.localStorage) {
  try { return JSON.parse(storage?.getItem(KEY) || "{}") || {}; } catch { return {}; }
}

export function keepSeen(seen, storage = globalThis.localStorage) {
  try { storage?.setItem(KEY, JSON.stringify(seen)); } catch { /* the dots come back on the next visit */ }
}
