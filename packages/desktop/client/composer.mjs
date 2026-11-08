// The box under a conversation: pictures (+), the words, then stickers, a voice note and Send. `say` posts one
// message and resolves when the conversation has it; a group's box is the plain one (`rich` off).
import { createElement as h, useRef, useState } from "react";
import { web } from "./api.mjs";
import { MAX_PICTURES, readPicture, roomFor } from "./attach.mjs";
import { Icon } from "./icons.mjs";
import { pickerPacks, stickerSrc } from "./media.mjs";
import { words } from "./strings.mjs";

const base64Of = async (blob) => {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(binary);
};

export const COMMANDS = ["status", "letter", "handoff"];

export function Composer({ resident, base, placeholder, say, onError, rich = true, onCommand = null }) {
  const t = words();
  const [text, setText] = useState("");
  const [pics, setPics] = useState([]);
  const [packs, setPacks] = useState(null);
  const [picker, setPicker] = useState(false);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const files = useRef(null);
  const recorder = useRef(null);

  const run = async (job) => { try { await job(); } catch (e) { onError(e.message); } };
  const asked = onCommand && /^\/\w*$/.test(text.trim()) ? COMMANDS.filter((c) => c.startsWith(text.trim().slice(1))) : [];
  const command = async (name) => { setText(""); await run(() => onCommand(name)); };
  const send = async () => {
    const body = text.trim();
    if (onCommand && COMMANDS.includes(body.slice(1)) && body.startsWith("/")) { await command(body.slice(1)); return; }
    if ((!body && !pics.length) || busy) return;
    setBusy(true);
    const payload = { text: body };
    if (pics.length) payload.pictures = pics.map((pic) => ({ data: pic.data }));
    const kept = pics;
    // The box empties at once; what was written comes back only if the send failed and nothing new was typed.
    setText("");
    setPics([]);
    try { await say(payload); } catch (e) {
      setText((now) => now || body);
      setPics((now) => (now.length ? now : kept));
      onError(e.message);
    }
    setBusy(false);
  };
  const openStickers = async () => {
    setPicker((was) => !was);
    if (packs) return;
    try { setPacks(pickerPacks((await web("/web/stickers", { resident }))?.packs)); } catch { setPacks([]); }
  };
  const sendSticker = (key) => { setPicker(false); void run(() => say({ sticker: key })); };
  const record = () => run(async () => {
    if (recording) { recorder.current?.stop(); return; }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const type = typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("audio/webm") ? { mimeType: "audio/webm" } : undefined;
    const tap = new MediaRecorder(stream, type);
    const chunks = [];
    tap.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    tap.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      setRecording(false);
      void run(async () => say({ voice: { data: await base64Of(new Blob(chunks, { type: tap.mimeType || "audio/webm" })) } }));
    };
    tap.start();
    recorder.current = tap;
    setRecording(true);
  });
  const attach = async (event) => {
    const chosen = Array.from(event.target.files || []);
    event.target.value = "";
    const room = roomFor(pics.length, chosen.length, MAX_PICTURES);
    if (chosen.length > room) onError(t.upTo);
    const read = [];
    for (const file of chosen.slice(0, room)) {
      try { read.push(await readPicture(file)); } catch { onError(t.tooBig); }
    }
    if (read.length) setPics((was) => [...was, ...read].slice(0, MAX_PICTURES));
  };
  const onKey = (e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent?.isComposing) { e.preventDefault(); void send(); } };
  const tool = (name, label, onClick, extra = {}) => h("button", { type: "button", className: "ad-plain", title: label, "aria-label": label, onClick, ...extra }, h(Icon, { name }));

  return h("div", { className: "ad-compose" },
    pics.length > 0 && h("div", { className: "ad-thumbs" }, pics.map((pic, i) => h("div", { key: i },
      h("img", { src: pic.url, alt: "" }),
      h("button", { type: "button", className: "ad-x", "aria-label": t.remove, title: t.remove, onClick: () => setPics((was) => was.filter((_, at) => at !== i)) }, h(Icon, { name: "close" }))))),
    asked.length > 0 && h("div", { className: "ad-cmds", role: "listbox", "aria-label": t.commands }, asked.map((c) => h("button", { key: c, type: "button", role: "option", onClick: () => command(c) },
      h(Icon, { name: "slash" }), h("code", null, `/${c}`), h("span", null, t.cmd[c])))),
    picker && h("div", { className: "ad-picker" },
      packs === null ? h("p", { className: "ad-hint" }, "…")
        : packs.length === 0 ? h("p", { className: "ad-hint" }, t.noStickers)
          : packs.map((pack) => h("div", { key: pack.id },
            h("p", { className: "ad-label", style: { margin: "0 2px 6px" } }, pack.name),
            h("div", { className: "ad-pack-grid" }, pack.stickers.map((sticker) => h("button", { key: sticker.key, type: "button", title: sticker.name || "", "aria-label": sticker.name || t.stickers, onClick: () => sendSticker(sticker.key) },
              sticker.video
                ? h("video", { src: stickerSrc(base, resident, sticker.key), autoPlay: true, loop: true, muted: true, playsInline: true })
                : h("img", { src: stickerSrc(base, resident, sticker.key), alt: "" }))))))),
    h("div", { className: "ad-bar" },
      rich && h("input", { ref: files, type: "file", accept: "image/*", multiple: true, hidden: true, onChange: attach }),
      rich && tool("plus", t.attach, () => files.current?.click()),
      h("div", { className: "ad-field" },
        h("textarea", { rows: 1, value: text, placeholder, "aria-label": placeholder, onChange: (e) => setText(e.target.value), onKeyDown: onKey })),
      rich && tool("sticker", t.stickers, openStickers, { "aria-expanded": picker }),
      rich && tool("mic", recording ? t.recording : t.voice, record, { className: `ad-plain${recording ? " rec" : ""}`, "aria-pressed": recording }),
      h("button", { className: "ad-round", type: "button", disabled: busy || (!text.trim() && !pics.length), onClick: send, "aria-label": t.send, title: t.send }, h(Icon, { name: "send" }))));
}
