// What only this machine knows, asked of the host half (host/route.mjs answers all of these). These are the calls the
// desktop's local views draw from. With an older host half that answers "unknown action", local.wired is false and the
// views say so instead of guessing. The preview answers them with made-up data (preview/fake-host.mjs).
//
//   call("machine")                 → { runner: { state, error, since, pid, log: [{ at, text }] },
//                                       info: { plugin, access, workspace, paired, queued, unsent, running: { thread } | null },
//                                       cloud: { online, lastSeenAt } | null }
//   call("sessions")                → { sessions: [{ thread, plugin, at, status, turns, tools, files, commands, pending }] }
//   call("session", { thread })     → { session: { plugin, cwd, turns: [{ text, at, end: { status, summary } | null, items }] } | null }
//                                       items: say | thought | tool { id, kind, title, status, input, output, paths, diffs }
//                                              | plan { steps: [{ text, status }] } | perm { id, title, kind, paths, detail, decided, by }
//   call("permit", { id, allow })   → the owner's answer to a held permission request
//   call("open", { path })          → the workspace (or a folder in it; for a file, its folder) in the system's file manager
//   call("present")                 → the window is open and looked at
import { call } from "./api.mjs";
import { store } from "./store.mjs";

const unwired = (e) => /unknown action/i.test(e?.message || "");

/** Reads the machine and its sessions into the store; marks the store unwired when the host has no such calls. */
export async function loadLocal() {
  try {
    const [machine, sessions] = await Promise.all([call("machine"), call("sessions")]);
    store.set({ local: { wired: true, machine, sessions: sessions?.sessions || [] } });
  } catch (e) {
    if (unwired(e)) store.set({ local: { wired: false, machine: null, sessions: [] } });
  }
}

export async function loadSession(thread) {
  try { return (await call("session", { thread }))?.session || null; } catch { return null; }
}

export const permit = (id, allow) => call("permit", { id, allow });
export const openInFiles = (path) => call("open", path ? { path } : {});
export const present = () => call("present").catch(() => {});
