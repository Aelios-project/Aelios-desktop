// Reads a DeepSeek Harness session from disk, read-only: ~/.dsh/sessions/<workspace>/<session>/session.v4.jsonl.zstd.
// shortcut: DSH has no session API a plugin can call (checked in 0.2.2-rc.1), so the file is read as it is. The file
// is many zstd frames in a row, one per write; each is opened on its own. Look for an API when DSH ships one.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { zstdDecompressSync } from "node:zlib";
import { planItem, setResult, toolItem } from "./tool-items.mjs";

const MAGIC = 0xfd2fb528;
const MAX_BYTES = 64 * 1024 * 1024;
export const dshHome = () => process.env.AELIOS_DSH_SESSIONS || path.join(os.homedir(), ".dsh", "sessions");

/** The session's folder, found under any workspace folder; the id comes from the runner, so it is checked first. */
export function findDir(sessionId, root = dshHome()) {
  if (!/^[A-Za-z0-9_.-]{1,100}$/.test(String(sessionId))) return null;
  try {
    for (const workspace of readdirSync(root)) {
      for (const name of [sessionId, `session-${sessionId}`]) {
        const file = path.join(root, workspace, name, "session.v4.jsonl.zstd");
        if (existsSync(file)) return file;
      }
    }
  } catch { /* no DSH sessions on this machine */ }
  return null;
}

export function events(file) {
  if (statSync(file).size > MAX_BYTES) return [];
  const bytes = readFileSync(file);
  const starts = [];
  for (let i = 0; i + 4 <= bytes.length; i++) if (bytes.readUInt32LE(i) === MAGIC) starts.push(i);
  return starts.flatMap((start, n) => {
    try { return zstdDecompressSync(bytes.subarray(start, starts[n + 1] ?? bytes.length)).toString().split("\n").flatMap((line) => { try { return line ? [JSON.parse(line)] : []; } catch { return []; } }); } catch { return []; } // a false magic number inside a frame
  });
}

/** One list of items per helper turn, in order. */
export function groups(list) {
  const out = [];
  const tools = new Map();
  const into = (turn) => { const at = Number(turn) - 1; while (out.length <= at) out.push([]); return out[Math.max(0, at)]; };
  for (const event of list) {
    const d = event.data || {};
    if (event.type === "turn/start") into(d.turn);
    else if (event.type === "assistant/message" && d.message?.role === "assistant") {
      for (const part of d.message.content || []) {
        if (part.type === "text" && part.text?.trim()) into(d.turn).push({ type: "say", at: event.time, text: part.text });
        else if (part.type === "reasoning" && (part.text || part.reasoning)) into(d.turn).push({ type: "thought", at: event.time, text: String(part.text || part.reasoning) });
      }
    } else if (event.type === "tool/call" && d.name !== "todo_write") {
      const item = toolItem({ id: d.callId, name: d.name, args: d.arguments, at: event.time });
      tools.set(item.id, item);
      into(d.turn).push(item);
    } else if (event.type === "tool/result") {
      const item = tools.get(String(d.toolCallId));
      const text = (d.message?.content || []).map((part) => part.text || "").join("\n");
      if (item) setResult(item, text, d.message?.isError === true);
    } else if (event.type === "todo/write") {
      const last = out.length ? out.length : 1;
      into(last).push(planItem(d.todos, event.time));
    }
  }
  return out;
}

export const readDsh = (sessionId) => { const file = findDir(sessionId); return file ? groups(events(file)) : null; };
