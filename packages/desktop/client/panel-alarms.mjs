// The resident's alarms, soonest first: a dot for one that rings once, a loop for one that repeats (its rule as the
// tooltip), the time and day, and what it is for. A press on the time edits it in place (a one-time alarm's date and
// time, a repeating one's time of day); the bin deletes it. The list itself is read by right.mjs for the tab count.
import { createElement as h, useState } from "react";
import { web } from "./api.mjs";
import { dayOf, editValue, soonAlarms } from "./alarms.mjs";
import { Icon } from "./icons.mjs";
import { Empty, Explained } from "./info.mjs";
import { store, useStore } from "./store.mjs";
import { words } from "./strings.mjs";

function dayWord(date, t) {
  const day = dayOf(date);
  return day.kind === "today" ? t.dayToday : day.kind === "tomorrow" ? t.dayTomorrow : day.text;
}

function Row({ alarm, t, busy, onSave, onDrop }) {
  const [draft, setDraft] = useState(null);
  const save = async (e) => { e.preventDefault(); if (await onSave(alarm, draft)) setDraft(null); };
  return h("div", { className: "ad-alarm" },
    h("span", { className: "mark", title: alarm.once ? t.once : `${t.repeats}: ${alarm.when}`, "aria-label": alarm.once ? t.once : t.repeats },
      alarm.once ? h("span", { className: "ad-dot" }) : h(Icon, { name: "repeat" })),
    draft !== null
      ? h("form", { className: "ad-alarm-edit", onSubmit: save, onKeyDown: (e) => { if (e.key === "Escape") setDraft(null); } },
        h("input", { value: draft, autoFocus: true, "aria-label": t.moveAlarm, placeholder: alarm.edit === "date" ? "2026-11-09 08:00" : "07:30", onChange: (e) => setDraft(e.target.value) }),
        h("button", { type: "submit", className: "ad-icon-btn sm", title: t.save, "aria-label": t.save, disabled: busy }, h(Icon, { name: "check" })),
        h("button", { type: "button", className: "ad-icon-btn sm", title: t.cancel, "aria-label": t.cancel, onClick: () => setDraft(null) }, h(Icon, { name: "close" })))
      : [
        h(alarm.edit ? "button" : "span", { key: "w", className: "when", ...(alarm.edit ? { type: "button", title: t.moveAlarm, onClick: () => setDraft(editValue(alarm)) } : {}) },
          h("b", null, alarm.time || "—"), h("small", null, dayWord(alarm.date, t))),
        h("span", { key: "n", className: "note", title: alarm.note }, alarm.note),
        h("button", { key: "x", type: "button", className: "ad-icon-btn sm danger", title: t.dropAlarm, "aria-label": t.dropAlarm, disabled: busy, onClick: () => onDrop(alarm) }, h(Icon, { name: "trash" })),
      ]);
}

export function AlarmsPanel() {
  const t = words();
  const { status, alarms } = useStore(store);
  const resident = status?.resident || "default";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async (path, body) => {
    setBusy(true);
    try {
      const answer = await web(path, { method: "POST", body, resident });
      if (answer?.error) throw new Error(answer.error);
      if (answer?.alarms) store.set({ alarms: { on: Boolean(answer.on), alarms: answer.alarms } });
      else { const a = await web("/web/alarms", { resident }); store.set({ alarms: { on: Boolean(a?.on), alarms: a?.alarms || [] } }); }
      setError("");
      return true;
    } catch (e) { setError(e.message); return false; } finally { setBusy(false); }
  };
  const list = soonAlarms(alarms.alarms, 50);

  return h("div", { className: "ad-panel" },
    error && h("div", { className: "ad-error", role: "alert" }, error),
    !alarms.on && h(Empty, { icon: "alarm", text: t.alarmsOff, why: t.alarmsInfo }),
    alarms.on && list.length === 0 && h(Empty, { icon: "alarm", text: t.noAlarms, why: t.alarmsInfo }),
    alarms.on && list.length > 0 && h(Explained, { className: "ad-panel-bar ad-legend", text: t.alarmsInfo, head: [
      h("span", { key: "o" }, h("span", { className: "ad-dot" }), t.once),
      h("span", { key: "r" }, h(Icon, { name: "repeat" }), t.repeats),
      h("span", { key: "s", className: "sp" }),
    ] }),
    alarms.on && list.map((alarm) => h(Row, { key: alarm.id, alarm, t, busy,
      onSave: (a, when) => run("/web/alarms/edit", { id: a.id, when: String(when || "").trim() }),
      onDrop: (a) => run("/web/alarms/remove", { id: a.id }) })));
}
