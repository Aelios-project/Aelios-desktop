// The work column: a segmented row of tabs (an icon, a word, a count) and the panel under it. No title bar: the
// selected tab already names the panel, and the chat header's switch shows and hides the column (a close button
// appears only when the column lies over the chat in a narrow window). It widens with the button by the tabs, or by
// dragging its left edge, for a thread with long tool output. The counts are read here, so each tab shows its
// number while another panel is open.
import { createElement as h } from "react";
import { web } from "./api.mjs";
import { Icon } from "./icons.mjs";
import { tabCounts } from "./panel-ids.mjs";
import { PANELS } from "./panels.mjs";
import { usePoll } from "./poll.mjs";
import { store, useStore } from "./store.mjs";
import { words } from "./strings.mjs";
import { loadWaiting } from "./threads-api.mjs";

const WIDE = 580;
const clampWidth = (w, room) => Math.round(Math.max(300, Math.min(w, 860, room - 380)));

/** Dragging the left edge: the width follows the pointer until it is let go. */
function grab(event, right) {
  const aside = event.currentTarget.parentElement;
  const box = aside.getBoundingClientRect();
  const room = aside.parentElement?.clientWidth || window.innerWidth;
  const move = (e) => store.set({ right: { ...store.get().right, width: clampWidth(box.right - e.clientX, room) } });
  const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
  event.preventDefault();
}

export function Right() {
  const t = words();
  const state = useStore(store);
  const { status, right } = state;
  const resident = status?.resident || "default";

  usePoll(async () => { try { store.set({ waiting: await loadWaiting(resident) }); } catch { /* keep the last list */ } }, 10000, [resident]);
  // /web/tasks carries the count of open threads and the day's quota the Threads panel shows over its list.
  usePoll(async () => { try { store.set({ threads: (await web("/web/tasks", { resident })) || { open: 0 } }); } catch { /* keep the last */ } }, 15000, [resident]);
  usePoll(async () => {
    try { const a = await web("/web/alarms", { resident }); store.set({ alarms: { on: Boolean(a?.on), alarms: a?.alarms || [] } }); } catch { /* keep the last */ }
  }, 30000, [resident]);

  if (!right.open) return null;
  const panel = PANELS.find((p) => p.id === right.panel) || PANELS[0];
  const counts = tabCounts(state);
  const wide = right.width >= WIDE;
  const pick = (id) => store.set({ right: { ...right, panel: id } });
  const nudge = (e) => { if (e.key === "ArrowLeft" || e.key === "ArrowRight") store.set({ right: { ...right, width: clampWidth((right.width || 340) + (e.key === "ArrowLeft" ? 40 : -40), window.innerWidth) } }); };
  return h("aside", { className: `ad-right${right.overlay ? " overlay" : ""}`, "aria-label": t.panels[panel.id], style: right.width ? { "--panel-w": `${right.width}px` } : undefined },
    !right.overlay && h("div", { className: "ad-grip", role: "separator", "aria-orientation": "vertical", "aria-label": t.widen, tabIndex: 0, onPointerDown: (e) => grab(e, right), onKeyDown: nudge }),
    h("div", { className: "ad-right-head" },
      h("div", { className: "ad-tabs", role: "tablist" }, PANELS.map((p) => {
        const c = counts[p.id];
        return h("button", { key: p.id, type: "button", role: "tab", className: "ad-tab", "aria-selected": p.id === panel.id,
          title: c.n ? `${t.panels[p.id]} · ${c.n}` : t.panels[p.id], onClick: () => pick(p.id) },
          h(Icon, { name: p.icon }), h("span", { className: "w" }, t.panels[p.id]),
          c.n > 0 && h("span", { className: `ad-badge${c.hot ? " hot" : ""}` }, c.n));
      })),
      !right.overlay && h("button", { type: "button", className: "ad-icon-btn sm", title: wide ? t.narrow : t.widen, "aria-label": wide ? t.narrow : t.widen,
        onClick: () => store.set({ right: { ...right, width: wide ? 0 : WIDE } }) }, h(Icon, { name: wide ? "narrow" : "widen" })),
      right.overlay && h("button", { type: "button", className: "ad-icon-btn sm", title: t.collapse, "aria-label": t.collapse, onClick: () => store.set({ right: { ...right, open: false } }) }, h(Icon, { name: "close" }))),
    h(panel.render));
}
