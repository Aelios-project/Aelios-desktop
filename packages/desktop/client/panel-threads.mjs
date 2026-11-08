// The threads panel: the work the resident handed out, and one thread opened in its place. The old Board panel is
// folded in here: it listed the same work task by task, so all that is kept of it is the line over the list (where
// threads run and how many of the day's quota are used). Rows follow the 线程 page of Aelios-resident (AGPL-3.0).
import { createElement as h, useEffect, useState } from "react";
import { Icon } from "./icons.mjs";
import { Empty, Explained } from "./info.mjs";
import { usePoll } from "./poll.mjs";
import { store, useStore } from "./store.mjs";
import { words } from "./strings.mjs";
import { ThreadView } from "./thread-view.mjs";
import { isWorking, loadThreads, splitThreads, stateOf, when } from "./threads-api.mjs";
import { taskTone } from "./tones.mjs";
import { HELPER_ICON, helperOf } from "./thread-model.mjs";

export const RUN_ICON = { local: "spark", linux: "cloud", machine: "laptop", retired: "exit" };

/** A thread card: its helper's icon, title and time; one status word; how many tasks; a bar while it works. */
function Row({ item, t, local, onOpen }) {
  const state = stateOf(item);
  const tone = taskTone(state);
  const helper = helperOf(item, local);
  const pending = (local?.sessions || []).find((s) => s.thread === item.id)?.pending || 0;
  return h("button", { type: "button", className: `ad-card${item.waiting || pending ? " ask" : ""}`, title: t.open, onClick: () => onOpen(item.id) },
    h("span", { className: "ad-card-top" },
      h("span", { className: "ad-helper", title: t.helpers[helper], "aria-label": t.helpers[helper] }, h(Icon, { name: HELPER_ICON[helper] })),
      h("span", { className: "ad-card-title" }, item.title), h("span", { className: "ad-card-time" }, when(item.updatedAt))),
    h("span", { className: "ad-card-row" },
      h("span", { className: `ad-pill ${tone}` }, h("span", { className: `ad-dot ${tone}${isWorking(item) ? " live" : ""}`, "aria-hidden": true }), t.task[state] || item.status),
      pending > 0 && h("span", { className: "ad-mi", title: t.allow, style: { color: "var(--accent-text)" } }, h(Icon, { name: "shield" }), pending),
      h("span", { className: "sp" }),
      h("span", { className: "ad-mi", title: `${item.tasks} ${t.tasksN}`, "aria-label": `${item.tasks} ${t.tasksN}` }, h(Icon, { name: "stack" }), item.tasks)),
    isWorking(item) && h("span", { className: "ad-track", "aria-hidden": true }, h("span")));
}

/** Where threads run, and the day's quota as a short bar and two numbers. */
function Quota({ q, t }) {
  if (!q?.configured) return null;
  const share = q.limit ? Math.min(100, Math.round(((q.today || 0) / q.limit) * 100)) : 0;
  return h(Explained, { className: "ad-panel-bar", text: t.quotaInfo, head: [
    h("span", { key: "w", className: "ad-mi", title: t.runs[q.mode] || q.mode }, h(Icon, { name: RUN_ICON[q.mode] || "cloud" }), t.runs[q.mode] || q.mode),
    h("span", { key: "s", className: "sp" }),
    h("span", { key: "m", className: "ad-meter", title: `${q.today ?? 0}/${q.limit ?? 0} ${t.today}` }, h("i", null, h("b", { style: { width: `${share}%` } })), `${q.today ?? 0}/${q.limit ?? 0}`),
  ] });
}

export function ThreadsPanel() {
  const t = words();
  const { status, focus, threads: quota, local } = useStore(store);
  const resident = status?.resident || "default";
  const [data, setData] = useState({ loaded: false, on: true, threads: [] });
  const [error, setError] = useState("");
  const [id, setId] = useState("");
  const [showDone, setShowDone] = useState(true);

  useEffect(() => { if (focus) { setId(focus); store.set({ focus: "" }); } }, [focus]);
  usePoll(async () => {
    try { const d = await loadThreads(resident); setData({ loaded: true, on: Boolean(d.on), threads: d.threads || [] }); setError(""); } catch (e) { setError(e.message); }
  }, 10000, [resident]);

  if (id) return h(ThreadView, { resident, id, onBack: () => setId("") });
  const { open, done } = splitThreads(data.threads);
  return h("div", { className: "ad-panel" },
    error && h("div", { className: "ad-error", role: "alert" }, error),
    h(Quota, { q: quota, t }),
    data.loaded && !data.on && data.threads.length === 0 && h(Empty, { icon: "threads", text: t.threadsOff }),
    data.loaded && data.on && data.threads.length === 0 && h(Empty, { icon: "threads", text: t.noThreads, why: t.threadsInfo }),
    open.map((item) => h(Row, { key: item.id, item, t, local, onOpen: setId })),
    done.length > 0 && h("button", { type: "button", className: "ad-fold ad-label", "aria-expanded": showDone, onClick: () => setShowDone((v) => !v) },
      h(Icon, { name: "down" }), t.done, h("span", { className: "ad-badge" }, done.length)),
    showDone && done.map((item) => h(Row, { key: item.id, item, t, local, onOpen: setId })));
}
