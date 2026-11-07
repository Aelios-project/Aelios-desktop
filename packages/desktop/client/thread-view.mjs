// One thread opened in the right panel: its lines, a choice on a waiting report, a stop button while it works on
// a machine, and a box that talks to the thread directly (POST /web/thread/say), not through the resident.
// Lines follow the thread page of Aelios-resident, public/index.html (AGPL-3.0, same author; main at b118dfb).
import { createElement as h, useEffect, useState } from "react";
import { Icon } from "./icons.mjs";
import { Md } from "./md.mjs";
import { store } from "./store.mjs";
import { words } from "./strings.mjs";
import { choose, loadThread, loadWaiting, pillOf, safeLink, sayToThread, stateOf, stopThread } from "./threads-api.mjs";

const POLL_MS = 5000;

function Line({ line, thread, t, onChoose, busy }) {
  const task = line.role === "result" ? (thread.tasks || []).find((x) => x.id === line.task && x.waiting) : null;
  const shown = (thread.tasks || []).find((x) => x.id === line.task);
  const state = shown && shown.status === line.status ? stateOf(shown) : line.status;
  const who = line.role === "user" ? (line.direct ? t.mine : t.given) : line.role === "result" ? t.result : t.thread;
  const links = (line.links || []).filter(safeLink);
  return h("div", { className: `ad-tline r-${line.role}` },
    h("div", { className: "who-l" }, h("span", null, who), line.role === "result" && h("span", { className: `ad-pill ${pillOf(state)}` }, t.task[state] || state)),
    (line.steps || []).map((step, i) => h("div", { key: i, className: "step-l" }, step)),
    line.text && (line.direct ? h("div", { className: "text" }, line.text) : h("div", { className: "text" }, h(Md, { text: line.text }))),
    (line.files?.length > 0 || links.length > 0 || task) && h("div", { className: "ad-links" },
      (line.files || []).map((f) => h("span", { key: f.path, className: "ad-pill", title: f.path }, f.path.split("/").pop())),
      links.map((l) => h("a", { key: l, className: "ad-btn quiet small", href: l, target: "_blank", rel: "noopener noreferrer" }, new URL(l).host)),
      task && (task.choices || []).map((c, i) => h("button", { key: c, type: "button", className: `ad-btn small${i ? " quiet" : ""}`, disabled: busy, onClick: () => onChoose(task, c) }, c))));
}

export function ThreadView({ resident, id, onBack }) {
  const t = words();
  const [thread, setThread] = useState(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const reload = async () => { try { setThread(await loadThread(resident, id)); setError(""); } catch (e) { setError(e.message); } };
  useEffect(() => {
    setThread(null);
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
    await choose(resident, task.id, text);
    store.set({ waiting: await loadWaiting(resident) });
    await reload();
  });
  const onKey = (e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent?.isComposing) { e.preventDefault(); void say(); } };

  return h("div", { className: "ad-panel" },
    h("div", { className: "ad-links" },
      h("button", { type: "button", className: "ad-icon-btn sm", title: t.back, "aria-label": t.back, onClick: onBack }, h(Icon, { name: "back" })),
      h("strong", { style: { flex: 1, minWidth: 0, overflowWrap: "anywhere" } }, thread?.title || t.thread),
      thread && thread.runs === "machine" && thread.status === "working" && h("button", { type: "button", className: "ad-icon-btn sm", title: t.stop, "aria-label": t.stop, disabled: busy, onClick: () => act(() => stopThread(resident, id)) }, h(Icon, { name: "stop" }))),
    thread && h("span", { className: "ad-hint" }, t.runs[thread.runs] || ""),
    (thread?.lines || []).map((line) => h(Line, { key: line.id, line, thread, t, onChoose, busy })),
    (thread?.files || []).length > 0 && h("div", { className: "ad-tline" }, h("div", { className: "who-l" }, t.files), thread.files.map((f) => h("div", { key: f.path, className: "step-l" }, f.path))),
    error && h("div", { className: "ad-error", role: "alert" }, error),
    thread?.canSay && h("div", { className: "ad-say" },
      h("textarea", { rows: 2, value: draft, placeholder: t.sayTo, "aria-label": t.sayTo, onChange: (e) => setDraft(e.target.value), onKeyDown: onKey }),
      h("button", { type: "button", className: "ad-round", disabled: busy || !draft.trim(), title: t.sendTo, "aria-label": t.sendTo, onClick: say }, h(Icon, { name: "send" }))));
}
