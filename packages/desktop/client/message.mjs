// One line of the conversation: what it was busy with, the pictures, the words as bubbles, the files it handed over.
// Follows Aelios-resident's chat rows and cards (AGPL-3.0, same author; main at b118dfb, 2026-11-07); the words and
// the split of the text come from client/activity.mjs.
import { createElement as h, useEffect, useState } from "react";
import { blobUrl } from "./api.mjs";
import { bubbleTexts, busyOf } from "./activity.mjs";
import { Icon } from "./icons.mjs";
import { Md } from "./md.mjs";
import { words } from "./strings.mjs";

const SPARK = "M12 3.5l2 5.5 5.5 2-5.5 2-2 5.5-2-5.5-5.5-2 5.5-2z";
const clock = (at) => (at ? new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "");

/** The dashed line under a reply, and each thought or tool call inside it. */
function Busy({ busy }) {
  const t = words();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState({});
  return h("div", { className: `ad-busy${open ? " open" : ""}` },
    h("button", { type: "button", className: busy.live ? "live" : "", "aria-expanded": open, onClick: () => setOpen((v) => !v) },
      h("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinejoin: "round", "aria-hidden": true }, h("path", { d: SPARK })),
      h("span", null, busy.label),
      h("svg", { className: "chev", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true }, h("path", { d: "M9 6l6 6-6 6" }))),
    open && h("div", { className: "ad-busy-list" }, busy.items.map((item) => h("div", { key: item.key, className: "ad-busy-item" },
      h("button", { type: "button", "aria-expanded": Boolean(seen[item.key]), onClick: () => setSeen((v) => ({ ...v, [item.key]: !v[item.key] })) },
        h("span", { className: "what" }, item.what), h("span", { className: "detail" }, item.detail), h("span", { className: "state" }, item.state || t.ran)),
      seen[item.key] && h("div", null, item.body.map((part, i) => h("div", { key: i },
        part.label && h("div", { className: "label" }, part.label),
        h("pre", null, part.text))))))));
}

/** Her pictures in a reply: one per place, read from the resident by the line's id. */
function Pictures({ lineId, count, resident }) {
  const [urls, setUrls] = useState([]);
  useEffect(() => {
    let alive = true;
    const list = [];
    (async () => {
      for (let n = 0; n < count; n += 1) {
        try { list.push(await blobUrl(`/web/picture?id=${encodeURIComponent(lineId)}&n=${n}`, { resident })); } catch { /* a picture that will not read is left out */ }
      }
      if (alive) setUrls([...list]);
    })();
    return () => { alive = false; };
  }, [lineId, count, resident]);
  if (!urls.length) return null;
  return h("div", { className: `ad-pics${urls.length === 1 ? " one" : ""}` },
    urls.map((url) => h("button", { key: url, type: "button", onClick: () => window.open(url, "_blank", "noopener"), "aria-label": "Open the picture" }, h("img", { src: url, alt: "" }))));
}

/** Files a reply handed over: a chip each, downloaded through the host half. */
function Files({ files, resident }) {
  const [busy, setBusy] = useState("");
  const save = async (file) => {
    if (busy) return;
    setBusy(file.key);
    try {
      const url = await blobUrl(`/web/file?key=${encodeURIComponent(file.key)}`, { resident });
      const a = document.createElement("a");
      a.href = url; a.download = file.name || "file";
      document.body.append(a); a.click(); a.remove();
    } catch { /* the chip stays, the reader can try again */ } finally { setBusy(""); }
  };
  return h("div", { className: "ad-files" }, files.map((file) => h("button", { key: file.key, type: "button", className: "ad-file", title: file.name, disabled: Boolean(busy), onClick: () => save(file) },
    h(Icon, { name: "open" }), h("span", { className: "n" }, file.name || "file"), file.size ? h("span", { className: "s" }, `${Math.max(1, Math.round(file.size / 1024))} KB`) : null)));
}

export function Message({ line, resident }) {
  const busy = busyOf(line);
  const me = line.role === "user";
  const bubbles = me ? (String(line.text || "").trim() ? [line.text] : []) : bubbleTexts(line.text);
  return h("div", { className: `ad-row ${me ? "me" : "ai"}` },
    busy && h(Busy, { busy }),
    line.quote && h("span", { className: "ad-quote" }, line.quote.text),
    (line.pictures ?? 0) > 0 && h(Pictures, { lineId: line.id, count: line.pictures, resident }),
    bubbles.map((text, i) => h("div", { key: i, className: `ad-bubble${i === 0 ? " first" : ""}` },
      me ? text : h(Md, { text }),
      i === bubbles.length - 1 && h("span", { className: "ad-meta" }, clock(line.at)))),
    (line.files ?? []).length > 0 && h(Files, { files: line.files, resident }));
}