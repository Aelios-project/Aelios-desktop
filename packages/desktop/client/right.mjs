// The right column: a title bar with the panel's name and a collapse button, a tab row, then the panel itself.
// The waiting list is read here, so the tab can show how many wait while another panel is open.
import { createElement as h, useEffect } from "react";
import { Icon } from "./icons.mjs";
import { PANELS } from "./panels.mjs";
import { store, useStore } from "./store.mjs";
import { words } from "./strings.mjs";
import { loadWaiting } from "./threads-api.mjs";

const POLL_MS = 10000;

export function Right() {
  const t = words();
  const { status, waiting, right } = useStore(store);
  const resident = status?.resident || "default";

  useEffect(() => {
    const load = async () => { try { store.set({ waiting: await loadWaiting(resident) }); } catch { /* keep the last list */ } };
    void load();
    const timer = setInterval(() => { if (!document.hidden) void load(); }, POLL_MS);
    return () => clearInterval(timer);
  }, [resident]);

  if (!right.open) return null;
  const panel = PANELS.find((p) => p.id === right.panel) || PANELS[0];
  const pick = (id) => store.set({ right: { ...right, panel: id } });
  return h("aside", { className: `ad-right${right.overlay ? " overlay" : ""}`, "aria-label": t.panels[panel.id] },
    h("div", { className: "ad-right-head" },
      h("div", { className: "ad-right-line" },
        h("h2", { className: "ad-right-title" }, t.panels[panel.id]),
        h("button", { type: "button", className: "ad-icon-btn sm", title: t.collapse, "aria-label": t.collapse, onClick: () => store.set({ right: { ...right, open: false } }) }, h(Icon, { name: "close" }))),
      h("div", { className: "ad-tabs", role: "tablist" }, PANELS.map((p) => h("button", { key: p.id, type: "button", role: "tab", className: "ad-tab", "aria-selected": p.id === panel.id, onClick: () => pick(p.id) },
        t.panels[p.id], p.id === "waiting" && waiting.open > 0 && h("span", { className: "ad-badge" }, waiting.open))))),
    h(panel.render));
}