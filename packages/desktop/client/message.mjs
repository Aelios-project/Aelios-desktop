// One line of the conversation: what it was busy with, the pictures, the words as bubbles, the files it handed over.
// Follows Aelios-resident's chat rows and cards (AGPL-3.0, same author; main at b118dfb, 2026-11-07); the words and
// the split of the text come from client/activity.mjs.
import { createElement as h, useEffect, useRef, useState } from "react";
import { blobUrl } from "./api.mjs";
import { bubbleTexts, busyOf } from "./activity.mjs";
import { Icon } from "./icons.mjs";
import { Md } from "./md.mjs";
import { voiceLength } from "./media.mjs";
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
      ? h("video", { src: sticker.url, autoPlay: true, loop: true, muted: true, playsInline: true, "aria-label": "sticker" })
      : h("img", { src: sticker.url, alt: "", loading: "lazy" }))));
}

export function Message({ line, resident }) {
  const busy = busyOf(line);
  const me = line.role === "user";
  const bubbles = me ? (String(line.text || "").trim() ? [line.text] : []) : bubbleTexts(line.text);
  // A voice note or a sticker with no words is its own message, and it sits on the right like the owner's own.
  const mouthful = bubbles.length > 0 || (line.pictures ?? 0) > 0 || (line.files ?? []).length > 0;
  const onlyVoice = !mouthful && (Boolean(line.voice) || (line.stickers ?? []).length > 0);
  return h("div", { className: `ad-row ${me || onlyVoice ? "me" : "ai"}` },
    busy && h(Busy, { busy }),
    line.quote && h("span", { className: "ad-quote" }, line.quote.text),
    (line.pictures ?? 0) > 0 && h(Pictures, { lineId: line.id, count: line.pictures, resident }),
    bubbles.map((text, i) => h("div", { key: i, className: `ad-bubble${i === 0 ? " first" : ""}` },
      me ? text : h(Md, { text }),
      i === bubbles.length - 1 && h("span", { className: "ad-meta" }, clock(line.at)))),
    (line.files ?? []).length > 0 && h(Files, { files: line.files, resident }),
    line.voice && (line.voice.key || line.voice.missed) && h(Voice, { voice: line.voice, resident }),
    (line.stickers ?? []).length > 0 && h(Stickers, { stickers: line.stickers }));
}