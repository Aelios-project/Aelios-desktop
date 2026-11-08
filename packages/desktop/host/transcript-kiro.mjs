// Reads a Kiro CLI session from disk, read-only: ~/.kiro/sessions/cli/<id>.jsonl, one { version, kind, data } event per
// line: Prompt (the user's words), AssistantMessage (text and tool uses) and ToolResults.
// shortcut: written from Kiro's documented shape; no ACP session was on this machine to check it against. Lines
// carry no clock, so items take their turn's time. Re-check it against a real file when one exists.
import { existsSync, readFileSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { planItem, setResult, toolItem } from "./tool-items.mjs";

const MAX_BYTES = 64 * 1024 * 1024;
export const kiroHome = () => process.env.AELIOS_KIRO_SESSIONS || path.join(os.homedir(), ".kiro", "sessions", "cli");
const text = (content) => (Array.isArray(content) ? content : []).filter((part) => part?.kind === "text").map((part) => String(part.data ?? "")).join("\n");

/** One list of items per prompt, in order. */
export function groups(list) {
  const out = [];
  const tools = new Map();
  for (const line of list) {
    const content = line?.data?.content;
    if (line?.kind === "Prompt") out.push([]);
    else if (line?.kind === "AssistantMessage") {
      const group = out.at(-1) ?? out[out.push([]) - 1];
      if (text(content).trim()) group.push({ type: "say", at: null, text: text(content) });
      for (const part of Array.isArray(content) ? content : []) {
        if (part?.kind !== "toolUse") continue;
        if (part.data?.name === "todo_list") { group.push(planItem(part.data?.input?.todos ?? part.data?.input?.tasks, null)); continue; }
        const item = toolItem({ id: part.data?.toolUseId, name: part.data?.name, args: part.data?.input, at: null });
        tools.set(item.id, item);
        group.push(item);
      }
    } else if (line?.kind === "ToolResults") {
      for (const part of Array.isArray(content) ? content : []) {
        const item = part?.kind === "toolResult" ? tools.get(String(part.data?.toolUseId)) : null;
        if (item) setResult(item, (part.data?.content || []).map((x) => x?.data ?? x?.text ?? "").join("\n"), part.data?.status === "error");
      }
    }
  }
  return out;
}

export function readKiro(sessionId) {
  if (!/^[A-Za-z0-9_.-]{1,100}$/.test(String(sessionId))) return null;
  const file = path.join(kiroHome(), `${sessionId}.jsonl`);
  if (!existsSync(file) || statSync(file).size > MAX_BYTES) return null;
  return groups(readFileSync(file, "utf8").split("\n").flatMap((line) => { try { return line ? [JSON.parse(line)] : []; } catch { return []; } }));
}
