// The waiting list: what needs the person, or has news, in the resident's fixed format (GET /web/waiting).
// A card is its title, its time, and one status word; an open question keeps its answers in sight. A press on the
// title opens the rest: the resident's line about it and the way to its thread. Updates can be dismissed one by
// one (on hover) or all at once. Layout follows the threads page of Aelios-resident (AGPL-3.0, same author).
import { createElement as h, useState } from "react";
import { web } from "./api.mjs";
import { Icon } from "./icons.mjs";
import { Empty } from "./info.mjs";
import { store, useStore } from "./store.mjs";
import { words } from "./strings.mjs";
import { choose, loadWaiting, markSeen, when } from "./threads-api.mjs";
import { waitTone } from "./tones.mjs";

function Card({ item, t, busy, open, onToggle, act }) {
  const asking = item.kind === "ask" && !item.expired;
  const tone = waitTone(item);
  const word = item.expired ? t.expired : t.kind[item.kind] || item.kind;
  return h("div", { className: `ad-card${asking ? " ask" : ""}${item.expired ? " dim" : ""}` },
    h("button", { type: "button", className: "ad-card-top", "aria-expanded": open, title: open ? "" : t.details, onClick: onToggle },
      h("span", { className: "ad-card-title" }, item.title),
      h("span", { className: "ad-card-time" }, when(item.at))),
    h("div", { className: "ad-card-row" },
      h("span", { className: `ad-pill ${tone}` }, h("span", { className: `ad-dot ${tone}`, "aria-hidden": true }), word),
      asking && (item.options || []).map((option, i) => h("button", { key: option, type: "button", className: `ad-btn small${i ? " quiet" : ""}`, disabled: Boolean(busy), onClick: act.answer(item, option) }, option)),
      asking
        ? h("button", { type: "button", className: "ad-icon-btn sm ad-hide", title: t.settle, "aria-label": t.settle, disabled: Boolean(busy), onClick: act.settle(item) }, h(Icon, { name: "close" }))
        : h("button", { type: "button", className: "ad-icon-btn sm ad-hide", title: t.markRead, "aria-label": t.markRead, disabled: Boolean(busy), onClick: act.read(item) }, h(Icon, { name: "check" }))),
    open && item.line && h("p", { className: "ad-card-more" }, item.line),
    open && item.thread && h("div", { className: "ad-card-row" },
      h("button", { type: "button", className: "ad-btn quiet small", onClick: act.open(item) }, h(Icon, { name: "open" }), t.open)));
}

export function WaitingPanel() {
  const t = words();
  const { status, waiting, right } = useStore(store);
  const resident = status?.resident || "default";
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [opened, setOpened] = useState("");

  const run = (key, job) => async () => {
    if (busy) return;
    setBusy(key);
    try { await job(); setError(""); } catch (e) { setError(e.message); } finally { setBusy(""); }
  };
  const act = {
    answer: (item, option) => run(item.task, async () => { await choose(resident, item.task, option); store.set({ waiting: await loadWaiting(resident) }); }),
    read: (item) => run(item.id, async () => store.set({ waiting: await markSeen(resident, item) })),
    // An ask put away without an answer (the web page's "dealt with"): /web/task/settle.
    settle: (item) => run(item.task, async () => { await web("/web/task/settle", { method: "POST", body: { id: item.task }, resident }); store.set({ waiting: await loadWaiting(resident) }); }),
    open: (item) => async () => {
      if (item.kind !== "ask") await act.read(item)();
      store.set({ focus: item.thread, right: { ...right, panel: "threads" } });
    },
  };
  const items = waiting.items || [];
  const updates = items.filter((item) => item.kind !== "ask" || item.expired).length;

  return h("div", { className: "ad-panel" },
    error && h("div", { className: "ad-error", role: "alert" }, error),
    updates > 1 && h("div", { className: "ad-panel-bar" }, h("span", { className: "sp" }),
      h("button", { type: "button", className: "ad-icon-btn sm", title: t.markAll, "aria-label": t.markAll, disabled: Boolean(busy),
        onClick: run("all", async () => store.set({ waiting: await markSeen(resident) })) }, h(Icon, { name: "checks" }))),
    items.length === 0 && h(Empty, { icon: "check", text: t.nothingWaiting }),
    items.map((item) => h(Card, { key: item.id, item, t, busy, act, open: opened === item.id, onToggle: () => setOpened((was) => (was === item.id ? "" : item.id)) })));
}
