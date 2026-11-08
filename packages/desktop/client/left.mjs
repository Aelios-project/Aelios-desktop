// The left column: who this is, what it has coming, and what it costs.
//   the residents (a card for the current one, a row for the others)
//   the alarms still to ring — the room that is left in this column goes here
//   the usage line at the very foot, then the two buttons that leave this column
// Styles in style-rail.mjs; drawn from the resident's own rail.
import { createElement as h, useEffect } from "react";
import { call, web } from "./api.mjs";
import { soonAlarms } from "./alarms.mjs";
import { Face } from "./face.mjs";
import { Icon } from "./icons.mjs";
import { store, useStore } from "./store.mjs";
import { words } from "./strings.mjs";
import { usageRows } from "./usage.mjs";

const POLL_MS = 30000;

export function Left({ onBack }) {
  const t = words();
  const { status, residents, usage, alarms } = useStore(store);
  const resident = status?.resident || "default";

  useEffect(() => {
    const load = async () => {
      try { store.set({ residents: (await web("/web/residents", { resident: "default" }))?.residents || [] }); } catch { /* keep the last list */ }
    };
    void load();
    const timer = setInterval(() => { if (!document.hidden) void load(); }, POLL_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [u, a] = await Promise.all([web("/web/usage", { resident }), web("/web/alarms", { resident })]);
        store.set({ usage: u?.totals || {}, alarms: { on: Boolean(a?.on), alarms: a?.alarms || [] } });
      } catch { /* keep the last numbers */ }
    };
    void load();
    const timer = setInterval(() => { if (!document.hidden) void load(); }, POLL_MS);
    return () => clearInterval(timer);
  }, [resident]);

  const pick = async (id) => store.set({ status: await call("select", { resident: id }) });
  const list = residents.length ? residents : [{ id: "default", name: t.title }];
  const current = list.find((r) => r.id === resident) || list[0];
  const others = list.filter((r) => r.id !== current.id);
  const rows = usageRows(usage);
  const next = soonAlarms(alarms.alarms);

  return h("nav", { className: "ad-rail", "aria-label": t.residents },
    h("div", { className: "ad-rail-head" },
      h("span", { className: "ad-rail-brand" }, h("span", { className: "ad-rail-mark", "aria-hidden": true }, "✦"), t.residents)),
    h("button", { type: "button", className: "ad-current on", title: current.name, onClick: () => pick(current.id) },
      h(Face, { resident: current, base: status?.url }),
      h("span", { className: "ad-name" }, current.name || current.id),
      h("span", { className: "ad-tag" }, status?.runner?.state ? (t.runner[status.runner.state] || status.runner.state) : t.title)),
    others.map((r) => h("button", { key: r.id, type: "button", className: "ad-rail-item", title: r.name, onClick: () => pick(r.id) },
      h(Face, { resident: r, base: status?.url }),
      h("span", { className: "ad-txt" }, h("span", { className: "ad-label" }, r.name || r.id)))),

    h("div", { className: "ad-alarms" },
      h("p", { className: "ad-group-title" }, t.alarms),
      !alarms.on ? h("p", { className: "ad-hint" }, t.alarmsOff)
        : next.length ? next.map((a) => h("div", { key: a.id, className: "ad-alarm", title: a.note },
          h("span", { className: "w" }, a.when), h("span", { className: "n" }, a.note)))
        : h("p", { className: "ad-hint" }, t.noAlarms)),

    rows.length > 0 && h("div", { className: "ad-usage" },
      rows.map((row) => h("div", { key: row.key, className: "ad-urow", title: row.label },
        h("span", { className: "l" }, row.label), h("span", { className: "s" }, row.size), h("span", { className: "h" }, row.hit)))),
    h("div", { className: "ad-rail-foot" },
      h("button", { type: "button", className: "ad-btn quiet small", title: t.backToDsh, onClick: onBack }, t.backToDsh),
      h("button", { type: "button", className: "ad-icon-btn sm", title: t.disconnect, "aria-label": t.disconnect, onClick: async () => store.set({ status: await call("disconnect") }) }, h(Icon, { name: "back" }))));
}