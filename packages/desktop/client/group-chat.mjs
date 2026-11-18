// One group open in the middle column: its lines, the pictures in them, and a box that says something to the group.
// Everything comes from /web/group, /web/group/say and /web/group/picture. The header is the chat's own, with the
// member count (or who is answering) as an icon and a number; the rail is the way back to a resident.
import { createElement as h, useEffect, useRef, useState } from "react";
import { avatarUrl } from "./avatar.mjs";
import { blobUrl, web } from "./api.mjs";
import { ChatHead } from "./chat-head.mjs";
import { Composer } from "./composer.mjs";
import { authorOf, groupRows } from "./group.mjs";
import { Icon } from "./icons.mjs";
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
    urls.map((url) => h("button", { key: url, type: "button", onClick: () => window.open(url, "_blank", "noopener"), "aria-label": words().openPicture }, h("img", { src: url, alt: "" }))));
}

/** Who is answering, or how many wait in line, or how many are in the group: an icon and a number. */
function Meta({ data, t }) {
  if (!data) return null;
  const queue = (data.waiting || []).length;
  if (data.running) return h("span", { className: "ad-meta-chip", title: t.answering }, h("span", { className: "ad-dot ok live", "aria-hidden": true }), t.answering);
  if (queue) return h("span", { className: "ad-meta-chip", title: `${queue} ${t.inLine}` }, h(Icon, { name: "stack" }), queue);
  const n = (data.group?.members || []).length;
  return h("span", { className: "ad-meta-chip", title: `${n} ${t.members}`, "aria-label": `${n} ${t.members}` }, h(Icon, { name: "people" }), n);
}

export function GroupChat() {
  const t = words();
  const { status, group } = useStore(store);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const end = useRef(null);
  const load = async () => setData(await web(`/web/group?g=${encodeURIComponent(group)}`));

  useEffect(() => {
    if (!group) return undefined;
    let alive = true;
    setData(null);
    const tick = async () => {
      try { const next = await web(`/web/group?g=${encodeURIComponent(group)}`); if (alive) { setData(next); setError(""); } } catch (e) { if (alive) setError(e.message); }
    };
    void tick();
    const timer = setInterval(() => { if (!document.hidden) void tick(); }, POLL_MS);
    return () => { alive = false; clearInterval(timer); };
  }, [group]);

  useEffect(() => { end.current?.scrollIntoView?.({ block: "end" }); }, [data?.lines?.length]);

  const say = async (body) => {
    if (!body.text) return;
    // The resident reads the group from ?g=, not from the body.
    await web(`/web/group/say?g=${encodeURIComponent(group)}`, { method: "POST", body: { text: body.text } });
    await load();
  };
  const rows = groupRows(data?.lines);
  const name = data?.group?.name || t.group;
  const icon = data?.group?.icon;
  const face = h("span", { className: "ad-avatar", "aria-hidden": true }, icon ? h("img", { src: avatarUrl(status?.url, icon), alt: "" }) : h(Icon, { name: "people" }));

  return h("section", { className: "ad-main", "aria-label": name },
    h(ChatHead, { face, name, meta: h(Meta, { data, t }),
      actions: h("button", { type: "button", className: "ad-icon-btn", title: t.groupSettings, "aria-label": t.groupSettings, onClick: () => store.set({ groupSheet: { id: group } }) }, h(Icon, { name: "gear" })) }),
    h("div", { className: "ad-stream", "aria-live": "polite" },
      h("div", { className: "grow" }),
      rows.map((row) => h("div", { key: row.seq, className: `ad-row ${row.author === "you" ? "me" : row.note ? "note" : "ai"}` },
        !row.note && row.author !== "you" && h("span", { className: "ad-who-g" }, authorOf(row, data?.group, { you: t.mine })),
        row.pictures > 0 && h(Pictures, { group, seq: row.seq, count: row.pictures }),
        row.text && h("div", { className: `ad-bubble${row.note ? " ad-note-bubble" : " first"}` }, row.text),
        (row.stickers || []).length > 0 && h("div", { className: "ad-stickers" }, row.stickers.map((s) => h("div", { key: s.url, className: "ad-sticker" },
          s.video ? h("video", { src: avatarUrl(status?.url, s.url), autoPlay: true, loop: true, muted: true, playsInline: true }) : h("img", { src: avatarUrl(status?.url, s.url), alt: "" })))))),
      h("div", { ref: end })),
    error && h("div", { className: "ad-error", role: "alert", style: { padding: "0 18px 4px", textAlign: "center" } }, error),
    h(Composer, { placeholder: t.writeGroup, say, onError: setError, rich: false }));
}
