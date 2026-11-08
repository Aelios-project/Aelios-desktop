// The header over the middle column: who the conversation is with (a pill in the middle), and on the right the
// search (Ctrl/⌘ F while the column has focus) and the switch for the work panel. While the stream shows a search
// result, a small banner under the pill leads back to now. No status line: the runner's state lives in the rail.
import { createElement as h, useEffect, useRef, useState } from "react";
import { Icon } from "./icons.mjs";
import { SearchBox } from "./search-box.mjs";
import { store, useStore } from "./store.mjs";
import { words } from "./strings.mjs";

export function ChatHead({ face, name, meta = null, resident = "", searchable = false, actions = null }) {
  const t = words();
  const { right, around } = useStore(store);
  const [finding, setFinding] = useState(false);
  const top = useRef(null);

  useEffect(() => {
    const column = top.current?.parentElement;
    if (!column || !searchable) return undefined;
    const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f") { e.preventDefault(); setFinding(true); } };
    column.addEventListener("keydown", onKey);
    return () => column.removeEventListener("keydown", onKey);
  }, [searchable]);

  const covered = right.open && right.overlay;
  return [
    h("div", { key: "top", ref: top, className: "ad-top" },
      h("div", { className: "ad-ident" }, face, h("span", { className: "ad-name" }, name), meta),
      h("div", { className: "ad-act" },
        actions,
        searchable && h("button", { type: "button", className: "ad-icon-btn", title: t.search, "aria-label": t.search, "aria-expanded": finding, onClick: () => setFinding((v) => !v) }, h(Icon, { name: "search" })),
        !covered && h("button", { type: "button", className: "ad-icon-btn", title: right.open ? t.collapse : t.expand, "aria-label": right.open ? t.collapse : t.expand, "aria-pressed": right.open,
          onClick: () => store.set({ right: { ...right, open: !right.open } }) }, h(Icon, { name: "panel" })))),
    finding && h(SearchBox, { key: "find", resident, onClose: () => setFinding(false) }),
    around && h("div", { key: "around", className: "ad-around", role: "status" },
      h(Icon, { name: "search" }), h("span", null, t.around),
      h("button", { type: "button", className: "ad-btn quiet small", onClick: () => store.set({ around: null }) }, t.backToChat)),
  ];
}
