// What the left column shows under "At work" and "Recent": open threads first, then the rest, each newest first.
// Pure, so the split can be tested without a browser (test/rail.test.mjs).
import { isWorking } from "./threads-api.mjs";

/** @returns {{ open: object[], recent: object[] }} at most `limit` rows each, newest first. */
export function railThreads(threads = [], limit = 6) {
  const isOpen = (x) => isWorking(x) || Boolean(x.waiting);
  const byTime = (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
  const all = [...threads].sort(byTime);
  return { open: all.filter(isOpen).slice(0, limit), recent: all.filter((x) => !isOpen(x)).slice(0, limit) };
}
