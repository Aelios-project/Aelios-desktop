// The middle column: the conversation with the resident. Lines come from /web/messages (polled every 5 s).
// Header, bubbles and composer follow Aelios-resident's chat page (styles in style-chat.mjs).
import { createElement as h, useEffect, useRef, useState } from "react";
import { createMessages, web, call } from "./api.mjs";
import { Icon } from "./icons.mjs";
import { Md } from "./md.mjs";
import { store, useStore } from "./store.mjs";
import { words } from "./strings.mjs";

const POLL_MS = 5000;

const clock = (at) => (at ? new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "");

export function Chat() {
  const t = words();
  const { status, residents, right } = useStore(store);
  const resident = status?.resident || "default";
  const name = residents.find((r) => r.id === resident)?.name || t.title;
  const [lines, setLines] = useState([]);
  const [text, setText] = useState("");
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
    if (!body || busy) return;
    setBusy(true);
    try {
      const said = await web("/web/say", { method: "POST", body: { text: body }, resident });
      if (said?.error) throw new Error(said.error);
      setText("");
      reader.current = createMessages((path) => web(path, { resident }));
      await refresh();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  const onKey = (e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent?.isComposing) { e.preventDefault(); void send(); } };
  const runner = status?.runner;
  const state = runner && (t.runner[runner.state] || runner.state) + (runner.error ? ` · ${runner.error}` : "");

  const down = runner && ["stopped", "crashed", "revoked"].includes(runner.state);
  return h("section", { className: "ad-main" },
    h("div", { className: "ad-top" },
      h("div", { className: "ad-ident" },
        h("span", { className: "ad-avatar", "aria-hidden": true }, name.slice(0, 1)),
        h("div", { className: "ad-who" }, h("span", { className: "ad-name" }, name), state && h("span", { className: "ad-status" }, state))),
      h("div", { className: "ad-act" },
        down && h("button", { type: "button", className: "ad-btn quiet small", onClick: async () => store.set({ status: await call("start") }) }, t.start),
        !right.open && h("button", { type: "button", className: "ad-icon-btn", title: t.expand, "aria-label": t.expand, onClick: () => store.set({ right: { ...right, open: true } }) }, h(Icon, { name: "panel" })))),
    h("div", { className: "ad-stream", "aria-live": "polite" },
      lines.length === 0 && h("div", { className: "ad-note" }, t.empty),
      lines.map((line, i) => h("div", { key: line.id ?? i, className: `ad-row ${line.role === "user" ? "me" : "ai"}` },
        h("div", { className: "ad-bubble first" },
          line.role === "user" ? line.text : h(Md, { text: line.text }),
          h("span", { className: "ad-meta" }, clock(line.at))))),
      h("div", { ref: end, className: "grow" })),
    error && h("div", { className: "ad-error", role: "alert", style: { padding: "0 16px" } }, error),
    h("div", { className: "ad-compose" }, h("div", { className: "ad-bar" },
      h("div", { className: "ad-field" },
        h("textarea", { rows: 1, value: text, placeholder: t.write, "aria-label": t.write, onChange: (e) => setText(e.target.value), onKeyDown: onKey })),
      h("button", { className: "ad-round", type: "button", disabled: busy || !text.trim(), onClick: send, "aria-label": t.send, title: t.send }, h(Icon, { name: "send" })))));
}
