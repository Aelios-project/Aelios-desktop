// Searching the conversation: a box that drops from the chat header, its hits below it, and a press on a hit
// shows that part of the conversation in the stream. The rules and the shapes are in search.mjs.
import { createElement as h, useEffect, useRef, useState } from "react";
import { web } from "./api.mjs";
import { Icon } from "./icons.mjs";
import { askedFor, hitRows, searchPath, snippetOf } from "./search.mjs";
import { store, useStore } from "./store.mjs";
import { words } from "./strings.mjs";
import { when } from "./threads-api.mjs";

const IDLE = { q: "", results: [], busy: false, done: false };

export function SearchBox({ resident, onClose }) {
  const t = words();
  const { search } = useStore(store);
  const [q, setQ] = useState(search.q);
  const input = useRef(null);
  useEffect(() => { input.current?.focus(); input.current?.select(); }, []);

  const find = async (event) => {
    event.preventDefault();
    const asked = askedFor(q);
    if (asked.error) { store.set({ search: IDLE }); return; }
    store.set({ search: { q: asked.query, results: [], busy: true, done: false } });
    try {
      const found = await web(searchPath(asked.query), { resident });
      store.set({ search: { q: asked.query, results: hitRows(found?.results || []), busy: false, done: true } });
    } catch (e) { store.set({ error: e.message, search: { q: asked.query, results: [], busy: false, done: true } }); }
  };
  const openHit = async (hit) => {
    try {
      const around = await web(`/web/search/around?id=${encodeURIComponent(hit.id)}`, { resident });
      store.set({ around: { lines: around?.lines || [], id: hit.id } });
      onClose();
    } catch (e) { store.set({ error: e.message }); }
  };
  const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } };

  return h("div", { className: "ad-search", role: "dialog", "aria-label": t.search, onKeyDown: onKey },
    h("form", { role: "search", onSubmit: find },
      h(Icon, { name: "search" }),
      h("input", { ref: input, type: "search", value: q, placeholder: t.searchHint, "aria-label": t.search, onChange: (e) => setQ(e.target.value) }),
      h("button", { type: "button", className: "ad-icon-btn sm", title: t.close, "aria-label": t.close, onClick: () => { store.set({ search: IDLE }); onClose(); } }, h(Icon, { name: "close" }))),
    search.q && h("div", { className: "ad-hits" },
      search.busy && h("p", { className: "ad-hint" }, "…"),
      !search.busy && search.done && !search.results.length && h("p", { className: "ad-hint" }, t.noHits),
      search.results.map((hit) => {
        const bit = snippetOf(hit);
        return h("button", { key: hit.id, type: "button", className: "ad-hit", onClick: () => openHit(hit) },
          h("span", { className: "t" }, bit.before, /\s$/.test(hit.before || "") ? " " : "", h("b", null, bit.match), /^\s/.test(hit.after || "") ? " " : "", bit.after),
          h("span", { className: "s" }, [hit.role === "user" ? t.mine : t.given, when(hit.at)].filter(Boolean).join(" · ")));
      })));
}
