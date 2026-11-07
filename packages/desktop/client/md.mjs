// A text drawn as Markdown, node by node (markdown.mjs), never as HTML.
import { createElement as h, useEffect, useRef } from "react";
import { renderMarkdown } from "./markdown.mjs";

export function Md({ text }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) renderMarkdown(ref.current, text || ""); }, [text]);
  return h("div", { className: "ad-md", ref });
}
