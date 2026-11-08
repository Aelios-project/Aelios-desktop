// Turns a helper's tool call into the ACP-shaped item the thread view draws:
// { type: "tool", id, kind, title, status, input, output, paths, diffs }. Pure.
const KINDS = [
  [/^(bash|shell|exec|execute|run|terminal|command)/i, "execute"],
  [/(edit|write|patch|create|replace)/i, "edit"],
  [/(delete|remove)/i, "delete"],
  [/(move|rename)/i, "move"],
  [/(grep|glob|search|find|list|inspect)/i, "search"],
  [/(fetch|web|http|browser)/i, "fetch"],
  [/(read|view|cat|open)/i, "read"],
  [/(think|plan|todo|goal)/i, "think"],
];
const CLIP = 2000;

export const kindOf = (name) => KINDS.find(([re]) => re.test(String(name)))?.[1] || "other";
const lines = (text) => (typeof text === "string" && text ? text.split("\n").length : 0);

export function parseArgs(args) {
  if (args && typeof args === "object") return args;
  try { const value = JSON.parse(args); return value && typeof value === "object" ? value : {}; } catch { return {}; }
}

/** A tool call that has no result yet; setResult finishes it. */
export function toolItem({ id, name, args, at }) {
  const input = parseArgs(args);
  const file = [input.file_path, input.filePath, input.path].find((value) => typeof value === "string") || "";
  const kind = kindOf(name);
  const detail = input.command || input.pattern || input.query || file || "";
  const added = lines(input.new_string ?? input.newString ?? input.content), removed = lines(input.old_string ?? input.oldString);
  return {
    type: "tool", id: String(id), at, kind, status: "in_progress", output: "",
    title: `${name}${detail ? " " + String(Array.isArray(detail) ? detail.join(" ") : detail).slice(0, 100) : ""}`,
    input: typeof args === "string" ? args.slice(0, CLIP) : JSON.stringify(input).slice(0, CLIP),
    paths: file ? [file] : [], diffs: kind === "edit" && file ? [{ path: file, added, removed }] : [],
  };
}

export function setResult(item, text, failed) {
  item.output = String(text ?? "").slice(0, CLIP);
  item.status = failed ? "failed" : "completed";
}

const PLAN = { completed: "completed", done: "completed", in_progress: "in_progress", pending: "pending" };
export const planItem = (todos, at) => ({ type: "plan", at, steps: (Array.isArray(todos) ? todos : []).map((todo) => ({ text: String(todo?.content ?? todo?.text ?? "").slice(0, 200), status: PLAN[todo?.status] || "pending" })) });
