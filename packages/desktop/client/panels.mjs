// What each panel of the work column draws (ids, icons and counts in panel-ids.mjs).
import { createElement as h } from "react";
import { PANEL_ICONS, PANEL_IDS } from "./panel-ids.mjs";
import { AlarmsPanel } from "./panel-alarms.mjs";
import { ThreadsPanel } from "./panel-threads.mjs";
import { WaitingPanel } from "./panel-waiting.mjs";

const DRAW = { waiting: WaitingPanel, threads: ThreadsPanel, alarms: AlarmsPanel };

export const PANELS = PANEL_IDS.map((id) => ({ id, icon: PANEL_ICONS[id], render: () => h(DRAW[id]) }));
