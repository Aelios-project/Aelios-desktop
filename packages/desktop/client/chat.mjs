// The middle column: the conversation with the resident. Lines come from /web/messages (polled every 5 s).
// Header, bubbles and composer follow Aelios-resident's chat page (styles in style-chat.mjs).
import { createElement as h, useEffect, useRef, useState } from "react";
import { createMessages, web, call } from "./api.mjs";
import { MAX_PICTURES, readPicture, roomFor } from "./attach.mjs";
import { Icon } from "./icons.mjs";
import { Face } from "./face.mjs";
import { Message } from "./message.mjs";
import { store, useStore } from "./store.mjs";
import { words } from "./strings.mjs";

const POLL_MS = 5000;

export function Chat() {
  const t = words();
  const { status, residents, right, around } = useStore(store);
  const resident = status?.resident || "default";
  const name = residents.find((r) => r.id === resident)?.name || t.title;
  const [lines, setLines] = useState([]);
  const [text, setText] = useState("");
  const [pics, setPics] = useState([]);
  const picker = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const end = useRef(null);
  const reader = useRef(null);

  const refresh = async () => {
    try {
      const next = await reader.current();
      if (next) setLines(next);
      setError("");
    } catch (e) { setError(e.message); }
  };

  useEffect(() => {
    reader.current = createMessages((path) => web(path, { resident }));
    setLines([]);
    void refresh();
    const timer = setInterval(() => { if (!document.hidden) void refresh(); }, POLL_MS);
    return () => clearInterval(timer);
  }, [resident]);

  useEffect(() => { end.current?.scrollIntoView?.({ block: "end" }); }, [lines.length]);

  async function send() {
    const body = text.trim();
    if ((!body && !pics.length) || busy) return;
    setBusy(true);
    try {
      const payload = { text: body };
      if (pics.length) payload.pictures = pics.map((pic) => ({ data: pic.data }));
      const said = await web("/web/say", { method: "POST", body: payload, resident });
      if (said?.error) throw new Error(said.error);
      setText("");
      setPics([]);
      reader.current = createMessages((path) => web(path, { resident }));
      await refresh();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  async function attach(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    const room = roomFor(pics.length, files.length, MAX_PICTURES);
    if (files.length > room) setError(t.upTo);
    const read = [];
    for (const file of files.slice(0, room)) {
      try { read.push(await readPicture(file)); } catch { setError(t.tooBig); }
    }
    if (read.length) setPics((was) => [...was, ...read].slice(0, MAX_PICTURES));
  }

  const onKey = (e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent?.isComposing) { e.preventDefault(); void send(); } };
  const runner = status?.runner;
  const state = runner && (t.runner[runner.state] || runner.state) + (runner.error ? ` · ${runner.error}` : "");

  const down = runner && ["stopped", "crashed", "revoked"].includes(runner.state);
  return h("section", { className: "ad-main" },
    h("div", { className: "ad-top" },
      h("div", { className: "ad-ident" },
        h(Face, { resident: residents.find((r) => r.id === resident) || { id: resident, name } , base: status?.url }),
        h("div", { className: "ad-who" }, h("span", { className: "ad-name" }, name), state && h("span", { className: "ad-status" }, state))),
      h("div", { className: "ad-act" },
        down && h("button", { type: "button", className: "ad-btn quiet small", onClick: async () => store.set({ status: await call("start") }) }, t.start),
        !right.open && h("button", { type: "button", className: "ad-icon-btn", title: t.expand, "aria-label": t.expand, onClick: () => store.set({ right: { ...right, open: true } }) }, h(Icon, { name: "panel" })))),
    around && h("div", { className: "ad-around" },
      h("span", null, t.around),
      h("button", { type: "button", className: "ad-btn quiet small", onClick: () => store.set({ around: null }) }, t.backToChat)),
    h("div", { className: "ad-stream", "aria-live": "polite" },
      !around && lines.length === 0 && h("div", { className: "ad-note" }, t.empty),
      (around ? around.lines : lines).map((line, i) => h(Message, { key: line.id ?? i, line, resident })),
      h("div", { ref: end, className: "grow" })),
    error && h("div", { className: "ad-error", role: "alert", style: { padding: "0 16px" } }, error),
    h("div", { className: "ad-compose" },
      pics.length > 0 && h("div", { className: "ad-thumbs" }, pics.map((pic, i) => h("div", { key: i },
        h("img", { src: pic.url, alt: "" }),
        h("button", { type: "button", className: "ad-x", "aria-label": t.remove, title: t.remove, onClick: () => setPics((was) => was.filter((_, at) => at !== i)) }, h(Icon, { name: "close" }))))),
      h("div", { className: "ad-bar" },
        h("input", { ref: picker, type: "file", accept: "image/*", multiple: true, hidden: true, onChange: attach }),
        h("button", { className: "ad-round quiet", type: "button", title: t.attach, "aria-label": t.attach, onClick: () => picker.current?.click() }, h(Icon, { name: "plus" })),
        h("div", { className: "ad-field" },
          h("textarea", { rows: 1, value: text, placeholder: t.write, "aria-label": t.write, onChange: (e) => setText(e.target.value), onKeyDown: onKey })),
        h("button", { className: "ad-round", type: "button", disabled: busy || (!text.trim() && !pics.length), onClick: send, "aria-label": t.send, title: t.send }, h(Icon, { name: "send" })))));
}
