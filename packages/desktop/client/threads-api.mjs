// What the right panels know about threads and the waiting list: how a task stands, and the calls to the
// resident's /web/ routes. No React here, so the tests can run it. The rules for stateOf, the pill colors and the
// open/done split follow Aelios-resident, public/app.js (AGPL-3.0, same author; main at b118dfb, 2026-11-07).
import { web } from "./api.mjs";

/** A task that waited for the person and was dealt with asks no more. */
export function stateOf(task) {
  if (!task) return "";
  if (task.status !== "needs_you" || task.waiting !== false) return task.status;
  return task.chosen ? "chosen" : "settled";
}

export const pillOf = (state) => ({ working: "warn", sent: "warn", needs_you: "hot", done: "ok", failed: "bad", quiet: "bad", chosen: "ok" })[state] || "";

export const isWorking = (thread) => thread?.status === "sent" || thread?.status === "working";

/** Open threads are at work or ask for the person; the rest are done. */
export function splitThreads(list = []) {
  const open = (t) => isWorking(t) || t.waiting;
  return { open: list.filter(open), done: list.filter((t) => !open(t)) };
}

const post = (path, resident, body, request) => web(path, { method: "POST", body, resident }, request);

export const loadThreads = (resident, request) => web("/web/threads", { resident }, request);
export const loadThread = (resident, id, request) => web(`/web/thread?id=${encodeURIComponent(id)}`, { resident }, request);
export const sayToThread = (resident, id, text, request) => post("/web/thread/say", resident, { id, text }, request);
export const stopThread = (resident, id, request) => post("/web/thread/stop", resident, { id }, request);

export const loadWaiting = (resident, request) => web("/web/waiting", { resident }, request);
/** One item, or every item when none is given. Gives the list as it stands after. */
export const markSeen = (resident, item, request) => post("/web/waiting/seen", resident, item ? { id: item.id } : { all: true }, request);
/** A choice on a task: the same call from the waiting list and from a card in a thread. */
export const choose = (resident, task, text, request) => post("/web/task/choose", resident, { id: task, text }, request);

export const when = (at) => (at ? new Date(at).toLocaleString([], { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "");
// A link in a thread line is drawn only when it is an http(s) address.
export const safeLink = (url) => /^https?:\/\/[^\s<>"'`]+$/i.test(url || "");
