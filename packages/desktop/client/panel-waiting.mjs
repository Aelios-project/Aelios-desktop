// The waiting list: only what needs the person's decision or action, in the resident's fixed format (GET /web/waiting).
// When it is empty, nothing needs them. A card is its title, its time, the question or problem in one line, and its
// answers or one action in sight. News (a thread finished) is not here: it is a dot on its thread and a count on the Threads tab. Layout follows the threads page of Aelios-resident (AGPL-3.0, same author).
import { createElement as h, useState } from "react";
import { web } from "./api.mjs";
import { Icon } from "./icons.mjs";
import { Empty } from "./info.mjs";
import { store, useStore } from "./store.mjs";
import { words } from "./strings.mjs";
import { choose, loadWaiting, when } from "./threads-api.mjs";
import { waitTone } from "./tones.mjs";

function Card({ item, t, busy, open, onToggle, act }) {
  const tone = waitTone(item);
  const options = item.options || [];
  return h("div", { className: `ad-card${item.kind === "ask" ? " ask" : ""}` },
    h("button", { type: "button", className: "ad-card-top", "aria-expanded": open, title: open ? "" : t.details, onClick: onToggle },
      h("span", { className: "ad-card-title" }, item.title),
      h("span", { className: "ad-card-time" }, when(item.at))),
    h("p", { className: "ad-card-more" }, item.line),
    h("div", { className: "ad-card-row" },
      h("span", { className: `ad-pill ${tone}` }, h("span", { className: `ad-dot ${tone}`, "aria-hidden": true }), t.kind[item.kind] || item.kind),
      item.kind === "ask" && options.map((option, i) => h("button", { key: option, type: "button", className: `ad-btn small${i ? " quiet" : ""}`, disabled: Boolean(busy), onClick: act.answer(item, option) }, option)),
      // One action on a stuck item (it never carries choices): the settings, or the thread where a permission is given.
      item.kind === "stuck" && h("button", { type: "button", className: "ad-btn small", onClick: act.fix(item) }, item.action === "settings" ? t.openSettings : t.open),
      item.kind === "ask" && h("button", { type: "button", className: "ad-icon-btn sm ad-hide", title: t.settle, "aria-label": t.settle, disabled: Boolean(busy), onClick: act.settle(item) }, h(Icon, { name: "close" })),
      item.kind === "stuck" && h("button", { type: "button", className: "ad-icon-btn sm ad-hide", title: t.putAside, "aria-label": t.putAside, disabled: Boolean(busy), onClick: act.putAside(item) }, h(Icon, { name: "close" }))),
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
    // An ask put away without an answer (the web page's "dealt with"): /web/task/settle.
    settle: (item) => run(item.task, async () => { await web("/web/task/settle", { method: "POST", body: { id: item.task }, resident }); store.set({ waiting: await loadWaiting(resident) }); }),
    // A stuck item put away: it comes back only when the thread fails again (/web/waiting/seen {item}).
    putAside: (item) => run(item.id, async () => { store.set({ waiting: await web("/web/waiting/seen", { method: "POST", body: { item: item.id }, resident }) }); }),
    open: (item) => async () => store.set({ focus: item.thread, right: { ...right, panel: "threads" } }),
    fix: (item) => async () => (item.action === "settings" ? store.set({ sheet: "resident" }) : act.open(item)()),
  };
  const items = waiting.items || [];
  return h("div", { className: "ad-panel" },
    error && h("div", { className: "ad-error", role: "alert" }, error),
    items.length === 0 && h(Empty, { icon: "check", text: t.nothingWaiting }),
    items.map((item) => h(Card, { key: item.id, item, t, busy, act, open: opened === item.id, onToggle: () => setOpened((was) => (was === item.id ? "" : item.id)) })));
}
