// An explanation kept out of the way: a heading row ends in an (i), and the sentence opens under it on a press.
import { createElement as h, Fragment, useState } from "react";
import { Icon } from "./icons.mjs";
import { words } from "./strings.mjs";

export function Explained({ head, text, className = "" }) {
  const [open, setOpen] = useState(false);
  const t = words();
  return h(Fragment, null,
    h("div", { className: `ad-explained ${className}`.trim() }, head,
      h("button", { type: "button", className: "ad-info", title: t.info, "aria-label": t.info, "aria-expanded": open, onClick: () => setOpen((v) => !v) }, h(Icon, { name: "info" }))),
    open && h("p", { className: "ad-info-text" }, text));
}

/** An empty list: a soft icon and a few words, with the longer reason behind an (i) when there is one. */
export function Empty({ icon, text, why = "" }) {
  return h("div", { className: "ad-empty" },
    h("span", { "aria-hidden": true }, h(Icon, { name: icon })),
    why ? h(Explained, { head: h("span", null, text), text: why }) : h("span", null, text));
}
