// The small row of icons under one of the resident's replies, shown on hover or focus: read it aloud, keep it in
// memory, copy it; and on the latest reply, take it back or have it answered again. /web/speak gives a voice note
// to play, /web/pin keeps the words in Aelios, /web/take-back removes the reply (again: true answers anew).
import { createElement as h, useRef, useState } from "react";
import { blobUrl, web } from "./api.mjs";
import { Icon } from "./icons.mjs";
import { words } from "./strings.mjs";

export function MessageActions({ line, resident, last, onChanged }) {
  const t = words();
  const [state, setState] = useState("");
  const audio = useRef(null);
  const run = (key, job) => async () => {
    if (state === "busy") return;
    setState("busy");
    try { setState((await job()) || ""); } catch (e) { setState(e.message); }
  };
  const speak = run("speak", async () => {
    const spoken = await web("/web/speak", { method: "POST", body: { id: line.id }, resident });
    if (spoken?.error) throw new Error(spoken.error);
    const url = await blobUrl(`/web/media?key=${encodeURIComponent(spoken.key)}`, { resident });
    audio.current?.pause();
    audio.current = new Audio(url);
    await audio.current.play();
  });
  const pin = run("pin", async () => { const done = await web("/web/pin", { method: "POST", body: { text: line.text }, resident }); return done?.ok ? t.pinned : ""; });
  const copy = run("copy", async () => { await navigator.clipboard.writeText(String(line.text || "")); return t.copied; });
  const back = (again) => run("back", async () => {
    const done = await web("/web/take-back", { method: "POST", body: { id: line.id, again }, resident });
    if (done?.error) throw new Error(done.error);
    await onChanged?.();
  });
  const tool = (name, label, onClick) => h("button", { key: name, type: "button", className: "ad-icon-btn sm", title: label, "aria-label": label, disabled: state === "busy", onClick }, h(Icon, { name }));
  return h("div", { className: "ad-msg-acts" },
    tool("speaker", t.speakIt, speak), tool("pin", t.pinIt, pin), tool("copy", t.copy, copy),
    last && tool("undo", t.takeBack, back(false)), last && tool("refresh", t.redo, back(true)),
    state && state !== "busy" && h("span", { className: "said", role: "status" }, state));
}
