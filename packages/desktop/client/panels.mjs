// What each panel of the right column draws (ids in panel-ids.mjs). Board and Tools are only places for now.
import { createElement as h } from "react";
import { Icon } from "./icons.mjs";
import { PANEL_IDS } from "./panel-ids.mjs";
import { MePanel } from "./panel-me.mjs";
import { WaitingPanel } from "./panel-waiting.mjs";
import { ThreadsPanel } from "./panel-threads.mjs";
import { words } from "./strings.mjs";

const MARK = { board: "grid", tools: "wrench" };

/** A panel that is only a place for a later slice: a dashed mark and one line saying so. */
function Empty({ id }) {
  return h("div", { className: "ad-panel" },
    h("div", { className: "ad-slot" },
      h("span", { className: "ad-slot-mark", "aria-hidden": true }, h(Icon, { name: MARK[id] || "grid" })),
      h("span", null, words().soon)));
}

const DRAW = { waiting: WaitingPanel, threads: ThreadsPanel, me: MePanel };

export const PANELS = PANEL_IDS.map((id) => ({ id, render: () => (DRAW[id] ? h(DRAW[id]) : h(Empty, { id })) }));