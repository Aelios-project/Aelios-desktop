// The settings sheet: everything the resident's web door offers, so the web page is never needed. It lies over
// the window, a list of sections on its left (an icon and a word each) and the section on its right; Escape or the
// close button puts it away. The resident's own settings (/web/config) are read once here and each one shows in
// the section it belongs to (settings.mjs sectionOf), beside that section's own controls.
import { createElement as h, useEffect, useRef, useState } from "react";
import { web } from "./api.mjs";
import { Icon } from "./icons.mjs";
import { ResidentSection } from "./sheet-resident.mjs";
import { Fields } from "./sheet-fields.mjs";
import { AppSection, StickersBlock, TelegramBlock, WorkBlock } from "./sheet-more.mjs";
import { McpBlock, SitesBlock } from "./sheet-tools.mjs";
import { UsageSection } from "./sheet-usage.mjs";
import { settingRows } from "./settings.mjs";
import { store, useStore } from "./store.mjs";
import { words } from "./strings.mjs";

export const SECTIONS = [
  ["resident", "user"], ["model", "sliders"], ["memory", "stack"], ["time", "alarm"], ["channels", "mail"],
  ["web", "globe"], ["voice", "speaker"], ["work", "cloud"], ["usage", "chart"], ["app", "gear"],
];

/** What one section draws: its own controls first, then the resident's settings that belong to it. */
function Section({ id, rows, resident, reload }) {
  const fields = (skip) => h(Fields, { key: "f", rows, section: id, resident, onSaved: reload, skip });
  if (id === "resident") return [h(ResidentSection, { key: "r", rows, reload }), fields(["RESIDENT_NAME"])];
  if (id === "channels") return [h(TelegramBlock, { key: "t", resident }), fields()];
  if (id === "web") return [h(McpBlock, { key: "m", resident }), h(SitesBlock, { key: "s", resident }), fields()];
  if (id === "voice") return [h(StickersBlock, { key: "s", resident }), fields()];
  if (id === "work") return [h(WorkBlock, { key: "w", resident }), fields()];
  if (id === "usage") return h(UsageSection, { resident });
  if (id === "app") return h(AppSection);
  return fields();
}

export function Sheet() {
  const t = words();
  const { sheet, status } = useStore(store);
  const resident = status?.resident || "default";
  const [rows, setRows] = useState([]);
  const close = useRef(null);
  const reload = async () => { try { setRows(settingRows(await web("/web/config", { resident }))); } catch { /* keep the last */ } };
  useEffect(() => { if (sheet) void reload(); }, [Boolean(sheet), resident]);
  useEffect(() => { if (sheet) close.current?.focus(); }, [Boolean(sheet)]);
  if (!sheet) return null;
  const id = SECTIONS.some(([s]) => s === sheet) ? sheet : "resident";
  const shut = () => store.set({ sheet: "" });

  return h("div", { className: "ad-scrim", onClick: (e) => { if (e.target === e.currentTarget) shut(); }, onKeyDown: (e) => { if (e.key === "Escape") shut(); } },
    h("section", { className: "ad-sheet", role: "dialog", "aria-modal": true, "aria-label": t.settings },
      h("nav", { className: "ad-sheet-nav", "aria-label": t.settings },
        h("p", { className: "ad-sheet-title" }, t.settings),
        SECTIONS.map(([s, icon]) => h("button", { key: s, type: "button", "aria-current": s === id ? "page" : undefined, onClick: () => store.set({ sheet: s }) },
          h(Icon, { name: icon }), h("span", null, t.sections[s])))),
      h("div", { className: "ad-sheet-body" },
        h("div", { className: "ad-sheet-head" },
          h("h2", null, t.sections[id]),
          h("button", { ref: close, type: "button", className: "ad-icon-btn sm", title: t.close, "aria-label": t.close, onClick: shut }, h(Icon, { name: "close" }))),
        h("div", { className: "ad-sheet-scroll" }, h(Section, { id, rows, resident, reload })))));
}
