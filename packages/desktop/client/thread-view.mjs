// One thread, opened in place of the list in the right panel: a back arrow, the helper's icon, the title, and its
// timeline, the same for every helper (thread-model.mjs, thread-items.mjs). A thread that ran on this machine shows
// its local session, with a way to its folder and Allow/Deny on a request the helper is waiting on; any thread
// shows the cloud's lines. The box at the foot talks to the thread directly (POST /web/thread/say).
import { createElement as h, useEffect, useRef, useState } from "react";
import { Icon } from "./icons.mjs";
import { loadSession, openInFiles, permit } from "./local-api.mjs";
import { store, useStore } from "./store.mjs";
import { words } from "./strings.mjs";
import { Item } from "./thread-items.mjs";
import { HELPER_ICON, countsOf, helperOf, timeline } from "./thread-model.mjs";
import { choose, loadThread, loadWaiting, sayToThread, stateOf, stopThread } from "./threads-api.mjs";
import { taskTone } from "./tones.mjs";

const POLL_MS = 4000;

export function ThreadView({ resident, id, onBack }) {
  const t = words();
  const { local } = useStore(store);
  const [thread, setThread] = useState(null);
  const [session, setSession] = useState(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const end = useRef(null);

  const reload = async () => {
    try { setThread(await loadThread(resident, id)); setError(""); } catch (e) { setError(e.message); }
    if (local.wired !== false) setSession(await loadSession(id));
  };
  useEffect(() => {
    setThread(null);
    setSession(null);
    void reload();
    const timer = setInterval(() => { if (!document.hidden) void reload(); }, POLL_MS);
    return () => clearInterval(timer);
  }, [resident, id]);

  const act = async (job) => {
    if (busy) return;
    setBusy(true);
    try { await job(); setError(""); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const say = () => act(async () => {
    const text = draft.trim();
    if (!text) return;
    setThread(await sayToThread(resident, id, text));
    setDraft("");
  });
  const onChoose = (task, text) => act(async () => {
    await choose(resident, task, text);
    store.set({ waiting: await loadWaiting(resident) });
    await reload();
  });
  const onPermit = (item, allow) => act(async () => { await permit(item.id, allow); await reload(); });
  const onOpenPath = (path) => { void openInFiles(path).catch((e) => setError(e.message)); };
  const onKey = (e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent?.isComposing) { e.preventDefault(); void say(); } };

  const helper = helperOf({ id, runs: thread?.runs }, local);
  const state = thread ? stateOf(thread.tasks?.at(-1) || thread) : "";
  const tone = taskTone(state);
  const items = timeline(thread, session);
  const counts = countsOf(session);
  const working = thread && thread.runs === "machine" && thread.status === "working";

  return h("div", { className: "ad-panel ad-thread" },
    h("div", { className: "ad-tv-head" },
      h("button", { type: "button", className: "ad-icon-btn sm", title: t.back, "aria-label": t.back, onClick: onBack }, h(Icon, { name: "back" })),
      h("span", { className: "ad-helper", title: t.helpers[helper], "aria-label": t.helpers[helper] }, h(Icon, { name: HELPER_ICON[helper] })),
      h("h3", null, thread?.title || t.thread),
      session?.cwd && h("button", { type: "button", className: "ad-icon-btn sm", title: t.openFolder, "aria-label": t.openFolder, onClick: () => onOpenPath(session.cwd) }, h(Icon, { name: "folder" })),
      working && h("button", { type: "button", className: "ad-icon-btn sm danger", title: t.stop, "aria-label": t.stop, disabled: busy, onClick: () => act(() => stopThread(resident, id)) }, h(Icon, { name: "stop" }))),
    thread && h("div", { className: "ad-tv-meta" },
      state && h("span", { className: `ad-pill ${tone}` }, h("span", { className: `ad-dot ${tone}${state === "working" ? " live" : ""}`, "aria-hidden": true }), t.task[state] || state),
      h("span", { className: "sp" }),
      counts.tools > 0 && h("span", { className: "ad-mi", title: `${counts.tools} ${t.toolsN}` }, h(Icon, { name: "wrench" }), counts.tools),
      counts.files > 0 && h("span", { className: "ad-mi", title: `${counts.files} ${t.filesN}` }, h(Icon, { name: "file" }), counts.files),
      counts.commands > 0 && h("span", { className: "ad-mi", title: `${counts.commands} ${t.commandsN}` }, h(Icon, { name: "terminal" }), counts.commands)),
    h("div", { className: "ad-timeline" }, items.map((item, i) => h(Item, { key: item.id || `${item.type}-${i}`, item, t, busy, onPermit, onChoose, onOpenPath }))),
    (thread?.files || []).length > 0 && h("div", { className: "ad-tool-files" }, h("p", { className: "ad-label" }, t.files),
      thread.files.map((f) => h("span", { key: f.path, className: "ad-pathbtn", title: f.path }, h(Icon, { name: "file" }), h("span", null, f.path)))),
    error && h("div", { className: "ad-error", role: "alert" }, error),
    h("div", { ref: end }),
    thread?.canSay && h("div", { className: "ad-say" },
      h("textarea", { rows: 1, value: draft, placeholder: t.sayTo, "aria-label": t.sayTo, onChange: (e) => setDraft(e.target.value), onKeyDown: onKey }),
      h("button", { type: "button", className: "ad-round", disabled: busy || !draft.trim(), title: t.sendTo, "aria-label": t.sendTo, onClick: say }, h(Icon, { name: "send" }))));
}
