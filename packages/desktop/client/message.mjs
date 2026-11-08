// One line of the conversation: what it was busy with, the pictures, the words as bubbles, the files it handed over.
// Follows Aelios-resident's chat rows and cards (AGPL-3.0, same author; main at b118dfb, 2026-11-07); the words and
// the split of the text come from client/activity.mjs.
import { createElement as h, useEffect, useRef, useState } from "react";
import { blobUrl } from "./api.mjs";
import { bubbleTexts, busyOf } from "./activity.mjs";
import { Icon } from "./icons.mjs";
import { Md } from "./md.mjs";
import { MessageActions } from "./message-actions.mjs";
import { voiceLength } from "./media.mjs";
import { words } from "./strings.mjs";
import { ThreadChips } from "./thread-chip.mjs";

const clock = (at) => (at ? new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "");

/** How one row of the list stands: a tick when it ran, a dot (with its word as the tooltip) when it did not. */
function RowState({ state, t }) {
  if (!state) return h("span", { title: t.ran, "aria-label": t.ran }, h(Icon, { name: "check" }));
  const tone = state === "failed" || state === "not run" ? "bad" : "warn live";
  return h("span", { className: `ad-dot ${tone}`, title: state, "aria-label": state });
}

/** The chip under a reply: a spark when it thought, a wrench and a number for its tools; each one openable. */
function Busy({ busy }) {
  const t = words();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState({});
  return h("div", { className: `ad-busy${open ? " open" : ""}` },
    h("button", { type: "button", className: busy.live ? "live" : "", "aria-expanded": open, "aria-label": busy.label, title: busy.label, onClick: () => setOpen((v) => !v) },
      busy.thoughts > 0 && h("span", { className: "spark" }, h(Icon, { name: "spark" })),
      busy.thoughts > 0 && h("span", null, t.thinking),
      busy.thoughts > 0 && busy.tools > 0 && h("span", { className: "sep", "aria-hidden": true }),
      busy.tools > 0 && h(Icon, { name: "wrench" }),
      busy.tools > 0 && h("span", null, busy.tools),
      h("span", { className: "chev" }, h(Icon, { name: "next" }))),
    open && h("div", { className: "ad-busy-list" }, busy.items.map((item) => h("div", { key: item.key, className: "ad-busy-item" },
      h("button", { type: "button", "aria-expanded": Boolean(seen[item.key]), onClick: () => setSeen((v) => ({ ...v, [item.key]: !v[item.key] })) },
        h("span", { className: "what" }, item.what), h("span", { className: "detail" }, item.detail), h(RowState, { state: item.state, t })),
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
    urls.map((url) => h("button", { key: url, type: "button", onClick: () => window.open(url, "_blank", "noopener"), "aria-label": words().openPicture }, h("img", { src: url, alt: "" }))));
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
    h(Icon, { name: "file" }), h("span", { className: "n" }, file.name || "file"), file.size ? h("span", { className: "s" }, `${Math.max(1, Math.round(file.size / 1024))} KB`) : null)));
}

/** Files the user attached to this message: name and size, no download (the page shows the same chips). */
function Attached({ attached }) {
  return h("div", { className: "ad-files" }, attached.map((file, i) => h("span", { key: i, className: "ad-file", title: file.name },
    h(Icon, { name: "file" }), h("span", { className: "n" }, file.name || "file"), file.size ? h("span", { className: "s" }, `${Math.max(1, Math.round(file.size / 1024))} KB`) : null)));
}

/** A voice note: hers, played straight from the resident's media store. */
function Voice({ voice, resident }) {
  const t = words();
  const [playing, setPlaying] = useState(false);
  const audio = useRef(null);
  const flip = async () => {
    if (!voice?.key) return;
    if (playing) { audio.current?.pause(); setPlaying(false); return; }
    try {
      const url = await blobUrl(`/web/media?key=${encodeURIComponent(voice.key)}`, { resident });
      if (!audio.current) audio.current = new Audio(url);
      audio.current.src = url;
      audio.current.onended = () => setPlaying(false);
      audio.current.onerror = () => setPlaying(false);
      await audio.current.play();
      setPlaying(true);
    } catch { setPlaying(false); }
  };
  return h("div", { className: "ad-voice" },
    h("button", { type: "button", className: "ad-voice-play", onClick: flip, "aria-label": playing ? t.stopPlay : t.play, title: playing ? t.stopPlay : t.play },
      playing
        ? h("svg", { viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true }, h("rect", { x: 6, y: 5, width: 4, height: 14, rx: 1 }), h("rect", { x: 14, y: 5, width: 4, height: 14, rx: 1 }))
        : h("svg", { viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true }, h("path", { d: "M7 4.5v15l13-7.5z" }))),
    h("span", { className: "len" }, voice.missed ? t.missed : voiceLength(voice.seconds)));
}

/** Stickers a reply carried: a still picture, or the short loop it is. */
function Stickers({ stickers }) {
  return h("div", { className: "ad-stickers" }, stickers.map((sticker) => h("div", { key: sticker.url, className: "ad-sticker" },
    sticker.video
      ? h("video", { src: sticker.url, autoPlay: true, loop: true, muted: true, playsInline: true, "aria-label": words().stickers })
      : h("img", { src: sticker.url, alt: "", loading: "lazy" }))));
}

/** `last` marks the newest reply (it can be taken back); `onChanged` reads the conversation again after. */
export function Message({ line, resident, last = false, onChanged = null, cards = [] }) {
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
    me && (line.attached ?? []).length > 0 && h(Attached, { attached: line.attached }),
    (line.files ?? []).length > 0 && h(Files, { files: line.files, resident }),
    line.voice && (line.voice.key || line.voice.missed) && h(Voice, { voice: line.voice, resident }),
    (line.stickers ?? []).length > 0 && h(Stickers, { stickers: line.stickers }),
    cards.length > 0 && h(ThreadChips, { tasks: cards }),
    !me && !line.pending && line.id && String(line.text || "").trim() && h(MessageActions, { line, resident, last, onChanged }));
}