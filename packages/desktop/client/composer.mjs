// The box under a conversation: pictures (+), the words, then stickers, a voice note and Send. `say` posts one
// message and resolves when the conversation has it; a group's box is the plain one (`rich` off).
import { createElement as h, useRef, useState } from "react";
import { web } from "./api.mjs";
import { Chips, ACCEPT, useAttachments } from "./attachments-state.mjs";
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

export function Composer({ resident, base, placeholder, say, onError, rich = true, onCommand = null, turn = null, onStop = null }) {
  const t = words();
  const [text, setText] = useState("");
  const [packs, setPacks] = useState(null);
  const [picker, setPicker] = useState(false);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const a = useAttachments(onError);
  const files = useRef(null);
  const recorder = useRef(null);

  const run = async (job) => { try { await job(); } catch (e) { onError(e.message); } };
  const asked = onCommand && /^\/\w*$/.test(text.trim()) ? COMMANDS.filter((c) => c.startsWith(text.trim().slice(1))) : [];
  const command = async (name) => { setText(""); await run(() => onCommand(name)); };
  const send = async () => {
    const body = text.trim();
    if (onCommand && COMMANDS.includes(body.slice(1)) && body.startsWith("/")) { await command(body.slice(1)); return; }
    if ((!body && !a.any) || busy) return;
    setBusy(true);
    const payload = { text: body, ...a.fields() };
    const kept = a.snapshot();
    // The box empties at once; what was written comes back only if the send failed and nothing new was typed.
    setText("");
    a.clear();
    try { await say(payload); } catch (e) {
      setText((now) => now || body);
      a.restore(kept);
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
  const onKey = (e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent?.isComposing) { e.preventDefault(); void send(); } };
  const tool = (name, label, onClick, extra = {}) => h("button", { type: "button", className: "ad-plain", title: label, "aria-label": label, onClick, ...extra }, h(Icon, { name }));

  return h("div", { className: "ad-compose" },
    a.any && h(Chips, { a }),
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
      rich && h("input", { ref: files, type: "file", accept: ACCEPT, multiple: true, hidden: true, onChange: a.add }),
      rich && tool("plus", t.attach, () => files.current?.click()),
      h("div", { className: "ad-field" },
        h("textarea", { rows: 1, value: text, placeholder, "aria-label": placeholder, onChange: (e) => setText(e.target.value), onKeyDown: onKey })),
      rich && tool("sticker", t.stickers, openStickers, { "aria-expanded": picker }),
      rich && tool("mic", recording ? t.recording : t.voice, record, { className: `ad-plain${recording ? " rec" : ""}`, "aria-pressed": recording }),
      turn && onStop
        ? h("button", { className: "ad-round", type: "button", disabled: Boolean(turn.stopping), onClick: onStop, "aria-label": t.stopReply, title: t.stopReply }, h(Icon, { name: "stop" }))
        : h("button", { className: "ad-round", type: "button", disabled: busy || (!text.trim() && !a.any), onClick: send, "aria-label": t.send, title: t.send }, h(Icon, { name: "send" }))));
}
