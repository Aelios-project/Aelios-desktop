// The small card under a reply that handed work to a thread (Aelios-resident shows a bigger one in its chat): the
// helper's icon, the thread's title and one status dot. A press opens that thread in the right panel.
import { createElement as h } from "react";
import { Icon } from "./icons.mjs";
import { store, useStore } from "./store.mjs";
import { words } from "./strings.mjs";
import { HELPER_ICON, helperOf } from "./thread-model.mjs";
import { isWorking, stateOf } from "./threads-api.mjs";
import { taskTone } from "./tones.mjs";

export const openThread = (thread) => store.set({ focus: thread, right: { ...store.get().right, open: true, panel: "threads" } });

export function ThreadChips({ tasks }) {
  const t = words();
  const { local } = useStore(store);
  return h("div", { className: "ad-chips" }, tasks.map((task) => {
    const state = stateOf(task);
    const tone = taskTone(state);
    const helper = helperOf({ id: task.thread, runs: task.runs }, local);
    const label = t.task[state] || state;
    return h("button", { key: task.id, type: "button", className: "ad-chip", title: `${task.title} · ${label}`, onClick: () => openThread(task.thread || task.id) },
      h("span", { className: "ad-helper", "aria-hidden": true }, h(Icon, { name: HELPER_ICON[helper] || "plug" })),
      h("span", { className: "n" }, task.title),
      h("span", { className: `ad-dot ${tone}${isWorking(task) ? " live" : ""}`, role: "img", "aria-label": label }));
  }));
}
