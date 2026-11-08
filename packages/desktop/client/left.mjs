// The left column: the residents, then what the resident spent. The threads live in the right column, so they are
// not repeated here; this side answers "who" and "how much", the panel answers "which work".
// Drawn like Aelios-resident's wide-screen rail (styles in style-rail.mjs).
import { createElement as h, useEffect } from "react";
import { call, web } from "./api.mjs";
import { Face } from "./face.mjs";
import { Icon } from "./icons.mjs";
import { store, useStore } from "./store.mjs";
import { words } from "./strings.mjs";
import { usageRows } from "./usage.mjs";

const POLL_MS = 30000;

export function Left({ onBack }) {
  const t = words();
  const { status, residents, usage } = useStore(store);

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
      try { store.set({ usage: (await web("/web/usage", { resident: status?.resident || "default" }))?.totals || {} }); } catch { /* keep the last numbers */ }
    };
    void load();
    const timer = setInterval(() => { if (!document.hidden) void load(); }, POLL_MS);
    return () => clearInterval(timer);
  }, [status?.resident]);

  const pick = async (id) => store.set({ status: await call("select", { resident: id }) });
  const list = residents.length ? residents : [{ id: "default", name: t.title }];
  const current = list.find((r) => r.id === (status?.resident || "default")) || list[0];
  const others = list.filter((r) => r.id !== current.id);
  const rows = usageRows(usage);

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
    rows.length > 0 && h("div", { className: "ad-usage" },
      h("p", { className: "ad-group-title" }, t.usage),
      rows.map((row) => h("div", { key: row.key, className: "ad-urow" },
        h("span", { className: "l" }, row.label),
        h("span", { className: "c" }, row.cost),
        h("span", { className: "d" }, row.calls, h("span", { className: "hit" }, ` · ${row.hit}`)),
        h("span", { className: "t" }, row.tokens)))),
    h("div", { className: "ad-rail-foot" },
      h("button", { type: "button", className: "ad-btn quiet small", title: t.backToDsh, onClick: onBack }, t.backToDsh),
      h("button", { type: "button", className: "ad-icon-btn sm", title: t.disconnect, "aria-label": t.disconnect, onClick: async () => store.set({ status: await call("disconnect") }) }, h(Icon, { name: "back" }))));
}