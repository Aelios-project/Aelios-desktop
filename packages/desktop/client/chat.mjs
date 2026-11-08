// The middle column: the conversation with the resident. Lines come from /web/messages (polled every 5 s).
// Header (chat-head.mjs), bubbles (message.mjs) and composer (composer.mjs) follow Aelios-resident's chat page.
import { createElement as h, useEffect, useRef, useState } from "react";
import { ChatHead } from "./chat-head.mjs";
import { Composer } from "./composer.mjs";
import { createMessages, web } from "./api.mjs";
import { Face } from "./face.mjs";
import { Icon } from "./icons.mjs";
import { Md } from "./md.mjs";
import { Message } from "./message.mjs";
import { store, useStore } from "./store.mjs";
import { words } from "./strings.mjs";
import { cardsByLine } from "./threads-api.mjs";

const POLL_MS = 5000;

export function Chat() {
  const t = words();
  const { status, residents, around } = useStore(store);
  const resident = status?.resident || "default";
  const me = residents.find((r) => r.id === resident) || { id: resident, name: t.title };
  const [lines, setLines] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const end = useRef(null);
  const reader = useRef(null);

  const refresh = async () => {
    try {
      const next = await reader.current();
      if (next) setLines(next);
      setError("");
    } catch (e) { setError(e.message); }
  };
  const restart = () => { reader.current = createMessages((path) => web(path, { resident })); };

  useEffect(() => {
    restart();
    setLines([]);
    void refresh();
    const timer = setInterval(() => { if (!document.hidden) void refresh(); }, POLL_MS);
    return () => clearInterval(timer);
  }, [resident]);

  useEffect(() => { if (!around) end.current?.scrollIntoView?.({ block: "end" }); }, [lines.length, around]);

  const say = async (body) => {
    const said = await web("/web/say", { method: "POST", body, resident });
    if (said?.error) throw new Error(said.error);
    restart();
    await refresh();
  };

  // A command's answer (/status, /letter, /handoff) is a note over the box, not a line of the conversation.
  const onCommand = async (name) => {
    const d = await web("/web/command", { method: "POST", body: { name }, resident });
    if (d?.error) throw new Error(d.error);
    setNotice(d?.text || "");
  };

  const cards = cardsByLine(around ? around.lines : lines);
  return h("section", { className: "ad-main", "aria-label": me.name || me.id },
    h(ChatHead, { face: h(Face, { resident: me, base: status?.url }), name: me.name || me.id, resident, searchable: true }),
    h("div", { className: "ad-stream", "aria-live": "polite" },
      h("div", { className: "grow" }),
      !around && lines.length === 0 && h("div", { className: "ad-note" }, t.empty),
      (around ? around.lines : lines).map((line, i, all) => h(Message, { key: line.id ?? i, line, resident, cards: cards[line.id], last: !around && i === all.length - 1 && line.role !== "user", onChanged: async () => { restart(); await refresh(); } })),
      h("div", { ref: end })),
    error && h("div", { className: "ad-error", role: "alert", style: { padding: "0 18px 4px", textAlign: "center" } }, error),
    notice && h("div", { className: "ad-notice", role: "status" }, h("div", { className: "ad-md" }, h(Md, { text: notice })),
      h("button", { type: "button", className: "ad-icon-btn sm", title: t.close, "aria-label": t.close, onClick: () => setNotice("") }, h(Icon, { name: "close" }))),
    h(Composer, { resident, base: status?.url, placeholder: t.write, say, onError: setError, onCommand }));
}
