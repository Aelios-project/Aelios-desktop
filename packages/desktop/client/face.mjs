// A resident's face: its picture when it has one, its first letter when it does not.
import { createElement as h } from "react";
import { avatarUrl } from "./avatar.mjs";

export function Face({ resident, base, className = "" }) {
  const name = resident?.name || resident?.id || "";
  const src = avatarUrl(base, resident?.avatar);
  return h("span", { className: `ad-avatar${className}`, "aria-hidden": true }, src ? h("img", { src, alt: "" }) : name.slice(0, 1));
}
