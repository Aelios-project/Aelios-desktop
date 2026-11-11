// How a finished turn becomes a receipt outcome. Shared by both engines (helper.mjs and turn-acpx.mjs): `t` is the turn,
// which holds `finished`, `current`, `denied`, `opened`, `tier`, `timedOut` and `redact`.
import { createHash } from "node:crypto";
import { lastMarker, noticeOf, takeNotes } from "./markers.mjs";
import { fitReport, SUMMARY_MAX } from "./report.mjs";

const short = text => createHash("sha1").update(text).digest("hex").slice(0, 12);

const KIND = { refusal: "refused", max_tokens: "token_limit" };

export const lastText = t => (t.current.trim() || t.finished.at(-1)?.trim() || "");

// Redact first (the whole text, no silent cut), then fit to the summary limit with a visible mark.
const whole = (t, text) => t.redact(text, Infinity);
const limit = t => t.summaryMax ?? SUMMARY_MAX; // the resident's own limit when its heartbeat named one (wire.mjs)
const report = (t, parts, max = limit(t)) => fitReport(parts.map(part => whole(t, part)).filter(Boolean), max);
const dropLastLine = text => text.trimEnd().split("\n").slice(0, -1).join("\n").trim();

export function cancelled(t, how) {
  const last = lastText(t);
  return { status: "cancelled", summary: report(t, [last ? `Stopped. The last part before stopping: ${last}` : "Stopped."]), sessionId: t.opened, how };
}

export function stuck(t, how, why) {
  const key = "stuck:" + short(why + (t.opened ?? ""));
  return { status: "needs_you", summary: t.redact(why, limit(t)), sessionId: t.opened, how, ask: { key, question: t.redact(why + " Carry on?") } };
}

/** Every text part of the turn in order, `NOTE:` lines taken out. */
function partsOf(t) {
  const notes = [], parts = [];
  for (const text of [...t.finished, t.current]) {
    const taken = takeNotes(text);
    notes.push(...taken.notes);
    if (taken.rest) parts.push(taken.rest);
  }
  return { notes, parts };
}

export function outcomeOf(t, stopReason, how) {
  const { notes, parts } = partsOf(t);
  const final = parts.at(-1) ?? "", text = parts.join("\n\n");
  const notice = noticeOf(notes.map(note => t.redact(note)));
  const base = { sessionId: t.opened, how, ...(notice ? { notice } : {}) };
  if (t.timedOut) return stuck(t, how, "The helper did not finish within the time limit and was stopped.");
  if (stopReason === "cancelled") return cancelled(t, how);
  if (stopReason === "refusal" || stopReason === "max_tokens" || stopReason === "max_turn_requests") {
    const why = report(t, [`The helper stopped in the middle (${stopReason}).${final ? " Last part: " + final : ""}`]);
    // `kind`: what wire.mjs turns into a failure with its own reason, once the resident takes it
    return { ...base, ...(KIND[stopReason] ? { kind: KIND[stopReason] } : {}), status: "needs_you", summary: why, ask: { key: "stop:" + short(stopReason + final), question: why } };
  }
  if (t.denied.length) {
    const list = t.denied.map(item => "- " + item).join("\n");
    const summary = report(t, [...(parts.length ? parts : ["(the helper left no text)"]), `Some actions were refused by this machine's permission tier (${t.tier}):\n${list}`]);
    return { ...base, status: "needs_you", summary, ask: { key: "perm:" + short(list), kind: "permission", question: t.redact(`The helper wanted to do the following, but this machine's tier is ${t.tier}, so it was refused:\n${list}`) } };
  }
  if (!parts.length && notes.length) return { ...base, status: "done", summary: t.redact(notes.join("\n")) };
  if (!parts.length) return { ...base, kind: "no_result", status: "needs_you", summary: "The turn ended, but the helper left no text result.", ask: { key: "silent:" + short(String(t.opened) + Date.now()), question: "The turn ended, but the helper left no text result. Ask again?" } };
  const said = lastMarker(text);
  const earlier = said ? [...parts.slice(0, -1), dropLastLine(final)].filter(Boolean) : parts; // the text before the marker line, last part kept apart
  if (said?.kind === "blocked") {
    const reason = t.redact(said.text || "(no reason given)");
    const head = `Blocked: ${reason}`; // the reason is never cut: the earlier text gets the room that is left
    const rest = earlier.map(part => whole(t, part)).filter(Boolean);
    const room = limit(t) - head.length - 2;
    return { ...base, status: "failed", reason: "error", summary: rest.length && room > 100 ? `${head}\n\n${fitReport(rest, room)}` : fitReport([head], limit(t)) };
  }
  if (said?.kind === "ask") {
    const question = t.redact(said.text || "(the helper wants you to decide, but wrote no question)");
    return { ...base, status: "needs_you", summary: report(t, earlier.length ? earlier : [question]), ask: { key: "q:" + short(final), kind: "question", question } };
  }
  return { ...base, status: "done", summary: report(t, parts) };
}
