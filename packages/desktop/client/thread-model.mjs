// The thread detail's timeline, built the same way for every helper. Items are shaped after ACP session events:
// a brief (what was asked), the helper's messages and thoughts, tool calls (kind, title, input, result, the files
// and diffs), the plan as a checklist, permission requests, and each turn's result. A thread that ran on this
// machine is drawn from its local session (call("session"), see local-api.mjs); any other thread from the cloud's
// lines (/web/thread), its steps standing in for tool calls. Pure, so test/thread-model.test.mjs covers it.

export const KIND_ICON = { read: "eye", edit: "pencil", delete: "trash", move: "move", search: "search", execute: "terminal", think: "spark", fetch: "globe", other: "wrench" };
export const HELPER_ICON = { dsh: "dsh", kiro: "kiro", command: "plug", resident: "spark", actions: "cloud", machine: "laptop" };

/** The helper behind a thread: this machine's helper for a machine thread, else where the thread runs. */
export function helperOf(thread, local) {
  if (thread?.runs === "local") return "resident";
  if (thread?.runs === "linux") return "actions";
  const mine = (local?.sessions || []).find((s) => s.thread === thread?.id)?.plugin || local?.machine?.info?.plugin || "";
  return ["dsh", "kiro", "command"].includes(mine) ? mine : "machine";
}

/** The shell command a tool call ran, when its input names one. */
export function commandOf(item) {
  if (item?.kind !== "execute") return "";
  try {
    const input = typeof item.input === "string" ? JSON.parse(item.input) : item.input;
    const c = input?.command ?? input?.cmd;
    if (Array.isArray(c)) return c.join(" ");
    if (typeof c === "string") return c;
  } catch { /* not JSON */ }
  return item.title || "";
}

/** Tool calls, files changed and commands run, over the whole session. */
export function countsOf(session) {
  const tools = (session?.turns || []).flatMap((t) => t.items || []).filter((x) => x.type === "tool");
  return { tools: tools.length, files: new Set(tools.flatMap((x) => (x.diffs || []).map((d) => d.path))).size, commands: tools.filter((x) => x.kind === "execute").length };
}

/** The choices a waiting task offers, from the cloud thread. */
function waitingOf(cloud) {
  const task = (cloud?.tasks || []).find((x) => x.waiting && (x.choices || []).length);
  return task ? { task: task.id, choices: task.choices } : null;
}

function fromSession(session, cloud) {
  const items = [];
  for (const turn of session.turns || []) {
    if (turn.text) items.push({ type: "brief", who: turn.kind === "say" ? "mine" : "given", text: turn.text, at: turn.at });
    for (const item of turn.items || []) items.push(item);
    if (turn.end) items.push({ type: "result", status: turn.end.status, text: turn.end.summary, at: turn.end.at });
  }
  const results = (cloud?.lines || []).filter((l) => l.role === "result");
  const last = items.findLast?.((x) => x.type === "result") ?? [...items].reverse().find((x) => x.type === "result");
  if (last) Object.assign(last, { links: results.at(-1)?.links || [], sessionUrl: results.at(-1)?.sessionUrl || "", ...(waitingOf(cloud) || {}) });
  return items;
}

function fromCloud(cloud) {
  const items = [];
  const waiting = waitingOf(cloud);
  for (const line of cloud?.lines || []) {
    if (line.role === "user") items.push({ type: "brief", who: line.direct ? "mine" : "given", text: line.text || "" });
    else if (line.role === "result") {
      const own = waiting && waiting.task === line.task ? waiting : null;
      items.push({ type: "result", status: line.status || "", text: line.text || "", links: line.links || [], sessionUrl: line.sessionUrl || "", files: line.files || [], ...(own || {}) });
    } else {
      (line.steps || []).forEach((step, i) => items.push({ type: "tool", id: `${line.id}-${i}`, kind: "other", title: step, status: "completed", input: "", output: "", paths: [], diffs: [] }));
      if (line.text) items.push({ type: "say", text: line.text });
    }
  }
  return items;
}

/** @returns {object[]} the timeline items, oldest first. */
export function timeline(cloud, session) {
  return session?.turns?.length ? fromSession(session, cloud) : fromCloud(cloud);
}
