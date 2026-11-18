// One item of a thread's timeline, drawn after its ACP event type (thread-model.mjs builds them): what was asked,
// the helper's messages, its thoughts and tool calls (folded; open for input, result, files, diffs), its plan as a
// checklist, a permission request with Allow and Deny while it waits, and each turn's result with its choices.
import { createElement as h, useState } from "react";
import { Icon } from "./icons.mjs";
import { Md } from "./md.mjs";
import { safeLink } from "./threads-api.mjs";
import { KIND_ICON, commandOf } from "./thread-model.mjs";
import { taskTone } from "./tones.mjs";

const TOOL_TONE = { completed: "ok", failed: "bad", in_progress: "warn live", pending: "warn live" };
const short = (p) => String(p).split("/").slice(-2).join("/");

function Tool({ item, t, onOpenPath }) {
  const [open, setOpen] = useState(false);
  const command = commandOf(item);
  const added = (item.diffs || []).reduce((n, d) => n + (d.added || 0), 0);
  const removed = (item.diffs || []).reduce((n, d) => n + (d.removed || 0), 0);
  const kind = t.toolKind[item.kind] || t.toolKind.other;
  return h("div", { className: `ad-tool${open ? " open" : ""}` },
    h("button", { type: "button", className: "ad-tool-row", "aria-expanded": open, onClick: () => setOpen((v) => !v) },
      h("span", { className: "k", title: kind, "aria-label": kind }, h(Icon, { name: KIND_ICON[item.kind] || "wrench" })),
      h("span", { className: "n" }, command ? h("code", null, command) : item.title || kind),
      (added > 0 || removed > 0) && h("span", { className: "ad-diffn" }, h("b", null, `+${added}`), h("i", null, `−${removed}`)),
      h("span", { className: `ad-dot ${TOOL_TONE[item.status] || "idle"}`, title: item.status, "aria-label": item.status })),
    open && h("div", { className: "ad-tool-body" },
      item.input && h("div", null, h("p", { className: "ad-label" }, t.input), h("pre", null, item.input)),
      item.output && h("div", null, h("p", { className: "ad-label" }, t.output), h("pre", null, item.output)),
      (item.diffs || []).length > 0 && h("div", { className: "ad-tool-files" }, item.diffs.map((d) => h("button", { key: d.path, type: "button", className: "ad-pathbtn", title: d.path, onClick: () => onOpenPath(d.path) },
        h(Icon, { name: "file" }), h("span", null, short(d.path)), h("span", { className: "ad-diffn" }, h("b", null, `+${d.added}`), h("i", null, `−${d.removed}`))))),
      !(item.diffs || []).length && (item.paths || []).length > 0 && h("div", { className: "ad-tool-files" }, item.paths.map((p) => h("button", { key: p, type: "button", className: "ad-pathbtn", title: p, onClick: () => onOpenPath(p) },
        h(Icon, { name: "file" }), h("span", null, short(p)))))));
}

function Thought({ item, t }) {
  const [open, setOpen] = useState(false);
  return h("div", { className: "ad-thought" },
    h("button", { type: "button", "aria-expanded": open, onClick: () => setOpen((v) => !v) }, h(Icon, { name: "spark" }), h("span", null, t.thought), h(Icon, { name: "next" })),
    open && h("p", null, item.text));
}

function Plan({ item, t }) {
  const steps = item.steps || [];
  const done = steps.filter((s) => s.status === "completed").length;
  return h("div", { className: "ad-plan" },
    h("p", { className: "ad-label" }, t.plan, h("span", { className: "ad-badge" }, `${done}/${steps.length}`)),
    h("ul", null, steps.map((step, i) => h("li", { key: i, className: step.status },
      h("span", { className: "box", "aria-hidden": true }, step.status === "completed" ? h(Icon, { name: "check" }) : step.status === "in_progress" ? h("span", { className: "ad-dot warn live" }) : null),
      h("span", null, step.text)))));
}

function Permission({ item, t, busy, onPermit }) {
  const waiting = item.decided === null || item.decided === undefined;
  const said = !waiting && t.decided[`${item.decided}_${item.by === "you" ? "you" : "tier"}`];
  return h("div", { className: `ad-perm${waiting ? " waiting" : ""}` },
    h("div", { className: "top" }, h(Icon, { name: "shield" }), h("span", { className: "n" }, item.title || t.toolKind[item.kind] || item.kind),
      h("span", { className: "ad-pill idle" }, t.toolKind[item.kind] || item.kind)),
    item.detail && h("pre", { className: "detail", title: item.detail }, item.detail),
    (item.paths || []).length > 0 && h("p", { className: "paths" }, item.paths.map(short).join(" · ")),
    waiting ? h("div", { className: "ad-card-row" },
      h("button", { type: "button", className: "ad-btn small", disabled: busy, onClick: () => onPermit(item, true) }, h(Icon, { name: "check" }), t.allow),
      h("button", { type: "button", className: "ad-btn quiet small", disabled: busy, onClick: () => onPermit(item, false) }, h(Icon, { name: "close" }), t.deny))
      : h("p", { className: `said ${item.decided}` }, said));
}

function Result({ item, t, busy, onChoose, onSaveFile, saving }) {
  const tone = taskTone(item.status);
  const links = (item.links || []).filter(safeLink);
  return h("div", { className: "ad-tl-result" },
    item.status && h("span", { className: `ad-pill ${tone}` }, h("span", { className: `ad-dot ${tone}`, "aria-hidden": true }), t.task[item.status] || item.status),
    item.text && h("div", { className: "text" }, h(Md, { text: item.text })),
    ((item.choices || []).length > 0 || links.length > 0 || safeLink(item.sessionUrl) || (item.files || []).length > 0) && h("div", { className: "ad-card-row" },
      (item.choices || []).map((c, i) => h("button", { key: c, type: "button", className: `ad-btn small${i ? " quiet" : ""}`, disabled: busy, onClick: () => onChoose(item.task, c) }, c)),
      (item.files || []).map((f) => h("button", { key: f.path, type: "button", className: "ad-file-pill", title: `${t.saveFile} · ${f.path}`, disabled: Boolean(saving) || !onSaveFile, onClick: () => onSaveFile?.(f.path) },
        h(Icon, { name: "file" }), h("span", { className: "n" }, f.path.split("/").pop()), saving === f.path ? h("span", { className: "s" }, t.saving) : null)),
      links.map((l) => h("a", { key: l, className: "ad-btn quiet small", href: l, target: "_blank", rel: "noopener noreferrer" }, h(Icon, { name: "open" }), new URL(l).host)),
      safeLink(item.sessionUrl) && h("a", { className: "ad-btn quiet small", href: item.sessionUrl, target: "_blank", rel: "noopener noreferrer" }, h(Icon, { name: "open" }), t.session)));
}

export function Item(props) {
  const { item, t } = props;
  if (item.type === "brief") return h("div", { className: "ad-tl-brief" }, h("span", { className: "who" }, t.who[item.who] || ""), h("div", null, item.text));
  if (item.type === "say") return h("div", { className: "ad-tl-say" }, h(Md, { text: item.text }));
  if (item.type === "thought") return h(Thought, props);
  if (item.type === "tool") return h(Tool, props);
  if (item.type === "plan") return h(Plan, props);
  if (item.type === "perm") return h(Permission, props);
  if (item.type === "result") return h(Result, props);
  return null;
}
