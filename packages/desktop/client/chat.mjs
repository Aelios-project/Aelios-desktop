// The middle column: the conversation with the resident. Lines come from /web/messages (polled every 5 s).
import { createElement as h, useEffect, useRef, useState } from "react";
import { createMessages, web, call } from "./api.mjs";
import { renderMarkdown } from "./markdown.mjs";
import { store, useStore } from "./store.mjs";
import { words } from "./strings.mjs";

const POLL_MS = 5000;

function Md({ text }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) renderMarkdown(ref.current, text || ""); }, [text]);
  return h("div", { ref });
}

const clock = (at) => (at ? new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "");

export function Chat() {
  const t = words();
  const { status } = useStore(store);
  const resident = status?.resident || "default";
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

  return h("section", { className: "ad-main" },
    h("div", { className: "ad-head" }, t.title,
      runner && h("span", { className: "ad-state" }, t.runner[runner.state] || runner.state, runner.error ? ` · ${runner.error}` : ""),
      runner && ["stopped", "crashed", "revoked"].includes(runner.state) && h("button", { className: "ad-btn quiet", onClick: async () => store.set({ status: await call("start") }) }, t.start),
      h("button", { className: "ad-btn quiet", onClick: async () => store.set({ status: await call("disconnect") }) }, t.disconnect)),
    h("div", { className: "ad-lines", "aria-live": "polite" },
      lines.length === 0 && h("div", { className: "ad-note" }, t.empty),
      lines.map((line, i) => h("div", { key: line.id ?? i, className: `ad-row ${line.role === "user" ? "user" : "assistant"}` },
        h("div", { className: "ad-bubble" },
          line.role === "user" ? line.text : h(Md, { text: line.text }),
          h("span", { className: "ad-meta" }, clock(line.at))))),
      h("div", { ref: end })),
    error && h("div", { className: "ad-error", role: "alert" }, error),
    h("div", { className: "ad-compose" },
      h("textarea", { rows: 2, value: text, placeholder: t.write, "aria-label": t.write, onChange: (e) => setText(e.target.value), onKeyDown: onKey }),
      h("button", { className: "ad-btn", disabled: busy || !text.trim(), onClick: send }, busy ? t.sending : t.send)));
}
