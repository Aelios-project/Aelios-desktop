// The waiting list: what needs the person, or has news, in the resident's fixed format (GET /web/waiting).
// Layout follows the 线程 page of Aelios-resident, public/index.html (AGPL-3.0, same author; main at fb4593a).
import { createElement as h, useState } from "react";
import { Icon } from "./icons.mjs";
import { store, useStore } from "./store.mjs";
import { words } from "./strings.mjs";
import { choose, loadWaiting, markSeen, when } from "./threads-api.mjs";

export function WaitingPanel() {
  const t = words();
  const { status, waiting, right } = useStore(store);
  const resident = status?.resident || "default";
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const run = (key, job) => async () => {
    if (busy) return;
    setBusy(key);
    try { await job(); setError(""); } catch (e) { setError(e.message); } finally { setBusy(""); }
  };
  const answer = (item, option) => run(item.task, async () => {
    await choose(resident, item.task, option);
    store.set({ waiting: await loadWaiting(resident) });
  });
  const read = (item) => run(item.id, async () => store.set({ waiting: await markSeen(resident, item) }));
  const open = (item) => async () => {
    if (item.kind !== "ask") await read(item)();
    store.set({ focus: item.thread, right: { ...right, panel: "threads" } });
  };

  return h("div", { className: "ad-panel" },
    error && h("div", { className: "ad-error", role: "alert" }, error),
    waiting.items.length === 0 && h("div", { className: "ad-note" }, t.nothingWaiting),
    waiting.items.map((item) => h("div", { key: item.id, className: `ad-trow${item.kind === "ask" && !item.expired ? " ask" : ""}${item.expired ? " dim" : ""}` },
      h("span", { className: "top-line" }, h("span", { className: "t" }, item.title),
        h("span", { className: `ad-pill ${item.kind === "ask" && !item.expired ? "hot" : item.kind === "stuck" ? "bad" : item.kind === "done" ? "ok" : ""}` }, t.kind[item.kind] + (item.expired ? ` · ${t.expired}` : ""))),
      h("span", { className: "sub" }, h("span", null, item.line), h("span", null, when(item.at))),
      h("span", { className: "ad-links" },
        (item.options || []).map((option, i) => h("button", { key: option, type: "button", className: `ad-btn small${i ? " quiet" : ""}`, disabled: Boolean(busy), onClick: answer(item, option) }, option)),
        h("button", { type: "button", className: "ad-icon-btn sm", title: t.open, "aria-label": t.open, onClick: open(item) }, h(Icon, { name: "open" })),
        item.kind !== "ask" && h("button", { type: "button", className: "ad-icon-btn sm", title: t.markRead, "aria-label": t.markRead, onClick: read(item) }, h(Icon, { name: "close" }))))));
}
