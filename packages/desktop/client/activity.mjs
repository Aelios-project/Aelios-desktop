// What the resident was busy with in one reply, and how its words split into bubbles.
// Follows Aelios-resident, public/app.js — busyOf(), bubbleTexts() and TOOL_WORDS (AGPL-3.0, same author; main at
// b118dfb, 2026-11-07). Changed: the words are English, and it holds no page state, so it can be tested.

/** The resident's tool names, in one line each. Unknown names fall back to the name itself. */
export const TOOL_WORDS = {
  memory_recall: "looked in its memory", memory_remember: "remembered this", memory_notebook: "read its notebook",
  memory_forget: "forgot something", memory_keep_moment: "kept a moment",
  web_search: "searched the web", web_fetch: "read a page", make_sticker: "drew a sticker",
  send_sticker: "sent a sticker", send_voice: "sent a voice note", cloud_task: "handed it to a thread",
  set_alarm: "set an alarm", list_alarms: "checked the alarms", cancel_alarm: "cancelled an alarm",
  mcp_connect: "connected a tool", edit_persona: "edited its persona", make_file: "made a file",
};

export function toolWord(name = "") {
  if (TOOL_WORDS[name]) return TOOL_WORDS[name];
  if (name.startsWith("mcp_")) return `used ${name.slice(4)}`;
  return name || "used a tool";
}

const STATE = { "output-available": "", "output-error": "failed", "output-denied": "not run", "input-streaming": "preparing" };

const parsed = (text) => { try { return JSON.parse(text); } catch { return null; } };

/** A tool's input, cut to something one line of the list can hold. */
function detailOf(item) {
  const input = parsed(item.input);
  if (input && typeof input === "object") {
    const pick = input.query || input.url || input.note || input.title || input.name || input.text || input.path || "";
    if (pick) return String(pick).replace(/\s+/g, " ").slice(0, 80);
  }
  return String(item.input ?? "").replace(/\s+/g, " ").slice(0, 80);
}

/** A blank line starts a new bubble, except inside a fenced code block (the same rule as Telegram). */
export function bubbleTexts(text) {
  const parts = [];
  let now = [];
  let fence = null;
  String(text || "").split("\n").forEach((line) => {
    const mark = /^\s{0,3}(`{3,}|~{3,})/.exec(line);
    if (mark && (!fence || (mark[1].charAt(0) === fence.charAt(0) && mark[1].length >= fence.length))) fence = fence ? null : mark[1];
    if (!fence && !line.trim()) {
      if (now.join("").trim()) parts.push(now.join("\n").trim());
      now = [];
    } else now.push(line);
  });
  if (now.join("").trim()) parts.push(now.join("\n").trim());
  return parts;
}

/**
 * The one dashed line under a reply: what it thought, which tools it used, and each of them openable.
 * @returns {null | {label: string, live: boolean, items: {key: string, what: string, detail: string, state: string, body: {label: string, text: string}[]}[]}}
 */
export function busyOf(line) {
  const activity = Array.isArray(line?.activity) ? line.activity : [];
  const thoughts = activity.filter((item) => item.type === "reasoning" && item.text);
  const tools = activity.filter((item) => item.type === "tool");
  if (!thoughts.length && !tools.length) return null;
  const bits = [];
  if (thoughts.length) bits.push(line.pending && !tools.length ? "thinking…" : "thought for a moment");
  if (tools.length) bits.push(`used ${tools.length} ${tools.length === 1 ? "tool" : "tools"}${line.pending ? " · still going" : ""}`);
  const items = [];
  thoughts.forEach((item, index) => items.push({
    key: `r${index}`, what: "thought", detail: String(item.text).replace(/\s+/g, " ").slice(0, 80),
    state: "", body: [{ label: "", text: item.text }],
  }));
  tools.forEach((item, index) => items.push({
    key: `t${index}`, what: toolWord(item.name), detail: detailOf(item),
    state: STATE[item.state] ?? "running",
    body: [{ label: "Input", text: item.input || "(none)" }].concat(item.output === undefined ? [] : [{ label: "Result", text: item.output }]),
  }));
  return { label: bits.join(" · "), live: Boolean(line.pending), items };
}