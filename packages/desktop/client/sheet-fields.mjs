// The resident's own settings (/web/config) as rows: a label, a field and a Save that wakes when the value changes.
// A section shows the fields that belong to it (settings.mjs sectionOf), with a filter when there are many.
import { createElement as h, useEffect, useState } from "react";
import { web } from "./api.mjs";
import { Explained } from "./info.mjs";
import { sectionOf } from "./settings.mjs";
import { words } from "./strings.mjs";

export function FieldRow({ row, resident, onSaved }) {
  const t = words();
  const initial = row.secret ? "" : row.value; // a secret is never shown, only whether one is kept
  const [draft, setDraft] = useState(initial);
  const [state, setState] = useState("");
  useEffect(() => setDraft(initial), [initial]);
  const save = async () => {
    setState("…");
    try {
      await web("/web/config", { method: "POST", body: { key: row.key, text: draft }, resident });
      setState(t.saved);
      onSaved?.();
    } catch (e) { setState(e.message); }
  };
  const field = row.choices.length
    ? h("select", { value: draft, "aria-label": row.label, onChange: (e) => setDraft(e.target.value) }, ["", ...row.choices].map((c) => h("option", { key: c, value: c }, c || "—")))
    : h("input", { type: row.secret ? "password" : "text", value: draft, "aria-label": row.label,
      placeholder: row.secret && row.value ? t.secretSaved : "", onChange: (e) => setDraft(e.target.value) });
  return h("div", { className: "ad-field-row" },
    h("label", null, row.label, state && h("span", { className: state === t.saved ? "ok" : "" }, state)),
    h("div", { className: "ad-set-line" }, field,
      h("button", { type: "button", className: "ad-btn quiet small", disabled: draft === initial, onClick: save }, t.save)));
}

/** The fields of one section, an (i) on what they are, and a filter once there are more than eight. */
export function Fields({ rows, section, resident, onSaved, skip = [] }) {
  const t = words();
  const [q, setQ] = useState("");
  const mine = rows.filter((row) => sectionOf(row.key) === section && !skip.includes(row.key));
  if (!mine.length) return null;
  const shown = q ? mine.filter((row) => `${row.label} ${row.key}`.toLowerCase().includes(q.toLowerCase())) : mine;
  return h("div", { className: "ad-sheet-block" },
    h(Explained, { className: "ad-sheet-subhead", text: t.fieldsInfo, head: [
      h("span", { key: "l", className: "ad-label" }, t.settings),
      mine.length > 8 && h("input", { key: "f", className: "ad-filter", type: "search", value: q, placeholder: t.filter, "aria-label": t.filter, onChange: (e) => setQ(e.target.value) }),
    ] }),
    shown.length === 0 && h("p", { className: "ad-hint" }, t.noMatch),
    shown.map((row) => h(FieldRow, { key: row.key, row, resident, onSaved })));
}
