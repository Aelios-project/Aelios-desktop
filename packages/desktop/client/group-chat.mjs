// One group open in the middle column: its lines, the pictures in them, and a box that says something to the group.
// Everything comes from /web/group, /web/group/say and /web/group/picture.
import { createElement as h, useEffect, useRef, useState } from "react";
import { blobUrl, web } from "./api.mjs";
import { authorOf, groupRows } from "./group.mjs";
import { Icon } from "./icons.mjs";
import { Face } from "./face.mjs";
import { store, useStore } from "./store.mjs";
import { words } from "./strings.mjs";

const POLL_MS = 4000;

function Pictures({ group, seq, count }) {
  const [urls, setUrls] = useState([]);
  useEffect(() => {
    let alive = true;
    (async () => {
      const list = [];
      for (let n = 0; n < count; n += 1) {
        try { list.push(await blobUrl(`/web/group/picture?g=${encodeURIComponent(group)}&seq=${seq}&n=${n}`)); } catch { /* left out */ }
      }
      if (alive) setUrls([...list]);
    })();
    return () => { alive = false; };
  }, [group, seq, count]);
  if (!urls.length) return null;
  return h("div", { className: `ad-pics${urls.length === 1 ? " one" : ""}` },
    urls.map((url) => h("button", { key: url, type: "button", onClick: () => window.open(url, "_blank", "noopener"), "aria-label": "Open the picture" }, h("img", { src: url, alt: "" }))));
}

export function GroupChat() {
  const t = words();
  const { status, residents, group } = useStore(store);
  const [data, setData] = useState(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const end = useRef(null);

  useEffect(() => {
    if (!group) return;
    let alive = true;
    const load = async () => {
      try { const next = await web(`/web/group?g=${encodeURIComponent(group)}`); if (alive) { setData(next); setError(""); } } catch (e) { if (alive) setError(e.message); }
    };
    void load();
    const timer = setInterval(() => { if (!document.hidden) void load(); }, POLL_MS);
    return () => { alive = false; clearInterval(timer); };
  }, [group]);

  useEffect(() => { end.current?.scrollIntoView?.({ block: "end" }); }, [data?.lines?.length]);

  const said = async () => {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      await web("/web/group/say", { method: "POST", body: { id: group, text: body } });
      setText("");
      setData(await web(`/web/group?g=${encodeURIComponent(group)}`));
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const onKey = (e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent?.isComposing) { e.preventDefault(); void said(); } };

  const rows = groupRows(data?.lines);
  const members = data?.group?.members || [];
  const composer = h("div", { className: "ad-compose" },
    h("div", { className: "ad-bar" },
      h("div", { className: "ad-field" }, h("textarea", { rows: 1, value: text, placeholder: t.writeGroup, "aria-label": t.writeGroup, onChange: (e) => setText(e.target.value), onKeyDown: onKey })),
      h("button", { className: "ad-round", type: "button", disabled: busy || !text.trim(), onClick: said, "aria-label": t.send, title: t.send }, h(Icon, { name: "send" }))));

  return h("section", { className: "ad-main" },
    h("div", { className: "ad-top" },
      h("button", { type: "button", className: "ad-ident", title: t.backToResident, onClick: () => store.set({ group: "" }) },
        h("span", { className: "ad-avatar", "aria-hidden": true }, (data?.group?.name || "·").slice(0, 1)),
        h("div", { className: "ad-who" }, h("span", { className: "ad-name" }, data?.group?.name || t.group), h("span", { className: "ad-status" }, likes(data, t)))),
      h("div", { className: "ad-act" },
        h("button", { type: "button", className: "ad-icon-btn", title: t.backToResident, "aria-label": t.backToResident, onClick: () => store.set({ group: "" }) }, h(Icon, { name: "back" })))),
    h("div", { className: "ad-stream", "aria-live": "polite" },
      rows.map((row) => h("div", { key: row.seq, className: `ad-row ${row.author === "you" ? "me" : row.note ? "note" : "ai"}` },
        !row.note && row.author !== "you" && h("span", { className: "ad-who-g" }, authorOf(row, data?.group, { you: t.mine })),
        row.pictures > 0 && h(Pictures, { group, seq: row.seq, count: row.pictures }),
        row.text && h("div", { className: `ad-bubble${row.note ? " ad-note-bubble" : " first"}` }, row.text),
        (row.stickers || []).length > 0 && h("div", { className: "ad-stickers" }, row.stickers.map((s) => h("div", { key: s.url, className: "ad-sticker" },
          s.video ? h("video", { src: s.url, autoPlay: true, loop: true, muted: true, playsInline: true }) : h("img", { src: s.url, alt: "" })))))),
      h("div", { ref: end })),
    error && h("div", { className: "ad-error", role: "alert", style: { padding: "0 16px" } }, error),
    composer);
}

/** Who is answering, or how many are in the group. */
function likes(data, t) {
  if (!data) return "";
  const queue = (data.waiting || []).length;
  if (data.running) return t.speaking;
  if (queue) return `${queue} ${t.inLine}`;
  return `${(data.group?.members || []).length} ${t.members}`;
}
