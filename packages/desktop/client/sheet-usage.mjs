// The settings sheet's Usage: the three spans as tiles (tokens, the share from cache, the cost), then the recent
// calls one line each (when, model, tokens in and out, cost), from /web/usage. Numbers come from usage.mjs.
import { createElement as h, useEffect, useState } from "react";
import { web } from "./api.mjs";
import { Explained } from "./info.mjs";
import { shortWhen } from "./time.mjs";
import { compact, costText, hitText, money } from "./usage.mjs";
import { words } from "./strings.mjs";

const SPANS = ["today", "week", "month"];
const inputOf = (r) => (r.input || 0) + (r.cacheRead || 0) + (r.cacheWrite || 0);

export function UsageSection({ resident }) {
  const t = words();
  const [data, setData] = useState(null);
  useEffect(() => { void web("/web/usage", { resident }).then(setData).catch(() => setData({})); }, [resident]);
  const totals = data?.totals || {};
  const rows = (data?.rows || []).slice(0, 30);
  return h("div", { className: "ad-sheet-sections" },
    h(Explained, { className: "ad-sheet-subhead", text: t.usageInfo, head: h("span", { className: "ad-label" }, t.sections.usage) }),
    h("div", { className: "ad-tiles" }, SPANS.map((key) => {
      const s = totals[key];
      return h("div", { key, className: "ad-tile" },
        h("small", null, t.span[key]),
        h("b", null, s ? compact(inputOf(s) + (s.output || 0)) : "—"), h("span", { className: "u" }, t.tokens),
        h("span", { className: "row" }, h("span", null, s ? hitText(s) : "—", " ", t.cache), h("span", null, s ? costText(s) : "")));
    })),
    h("span", { className: "ad-label" }, t.recent),
    rows.length === 0 ? h("p", { className: "ad-hint" }, data ? t.noUsage : "…")
      : h("div", { className: "ad-calls", role: "table" }, rows.map((r, i) => h("div", { key: r.id ?? i, className: "ad-call", role: "row" },
        h("span", { className: "w", role: "cell" }, shortWhen(r.at)),
        h("span", { className: "m", role: "cell", title: r.model }, String(r.model || "").split("/").pop()),
        h("span", { className: "n", role: "cell", title: `in ${inputOf(r)} · out ${r.output || 0}` }, `${compact(inputOf(r))} → ${compact(r.output || 0)}`),
        h("span", { className: "c", role: "cell" }, r.cost === null || r.cost === undefined ? "—" : money(r.cost))))));
}
