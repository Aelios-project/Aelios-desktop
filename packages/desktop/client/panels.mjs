// What each panel of the right column draws (ids in panel-ids.mjs). Board and Tools are only places for now.
import { createElement as h } from "react";
import { PANEL_IDS } from "./panel-ids.mjs";
import { WaitingPanel } from "./panel-waiting.mjs";
import { ThreadsPanel } from "./panel-threads.mjs";
import { words } from "./strings.mjs";

const Empty = () => h("div", { className: "ad-panel" }, h("div", { className: "ad-slot" }, words().soon));
const DRAW = { waiting: WaitingPanel, threads: ThreadsPanel };

export const PANELS = PANEL_IDS.map((id) => ({ id, render: DRAW[id] || Empty }));
