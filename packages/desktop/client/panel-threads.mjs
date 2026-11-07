// The threads panel: the list of work the resident handed out, and one thread opened below it.
// Rows follow the 线程 page of Aelios-resident, public/index.html (AGPL-3.0, same author; main at fb4593a).
import { createElement as h, useEffect, useState } from "react";
import { store, useStore } from "./store.mjs";
import { words } from "./strings.mjs";
import { ThreadView } from "./thread-view.mjs";
import { isWorking, loadThreads, pillOf, splitThreads, stateOf, when } from "./threads-api.mjs";

const POLL_MS = 10000;

function Row({ item, t, onOpen }) {
  const working = isWorking(item);
  return h("button", { type: "button", className: `ad-trow${working ? " working" : ""}${item.waiting ? " ask" : ""}`, title: t.open, onClick: () => onOpen(item.id) },
    h("span", { className: "top-line" }, h("span", { className: "t" }, item.title), h("span", { className: `ad-pill ${pillOf(stateOf(item))}` }, t.task[stateOf(item)] || item.status)),
    working && h("span", { className: "ad-track", "aria-hidden": true }, h("span")),
    h("span", { className: "sub" }, h("span", null, `${t.runs[item.runs] || ""} · ${item.tasks} ${t.tasksN}`), h("span", null, when(item.updatedAt))));
}

export function ThreadsPanel() {
  const t = words();
  const { status, focus } = useStore(store);
  const resident = status?.resident || "default";
  const [data, setData] = useState({ loaded: false, on: true, threads: [] });
  const [error, setError] = useState("");
  const [id, setId] = useState("");

  useEffect(() => { if (focus) { setId(focus); store.set({ focus: "" }); } }, [focus]);
  useEffect(() => {
    const load = async () => {
      try { const d = await loadThreads(resident); setData({ loaded: true, on: Boolean(d.on), threads: d.threads || [] }); setError(""); } catch (e) { setError(e.message); }
    };
    void load();
    const timer = setInterval(() => { if (!document.hidden) void load(); }, POLL_MS);
    return () => clearInterval(timer);
  }, [resident]);

  if (id) return h(ThreadView, { resident, id, onBack: () => setId("") });
  const { open, done } = splitThreads(data.threads);
  return h("div", { className: "ad-panel" },
    error && h("div", { className: "ad-error", role: "alert" }, error),
    data.loaded && !data.on && h("p", { className: "ad-hint" }, t.threadsOff),
    open.map((item) => h(Row, { key: item.id, item, t, onOpen: setId })),
    done.length > 0 && h("p", { className: "ad-group" }, t.done),
    done.map((item) => h(Row, { key: item.id, item, t, onOpen: setId })),
    data.loaded && data.threads.length === 0 && h("div", { className: "ad-note" }, t.noThreads));
}
