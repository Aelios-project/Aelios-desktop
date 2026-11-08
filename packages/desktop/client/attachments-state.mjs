// What the reader has attached to the message they are writing: pictures (shrunk, see attach.mjs) and files (PDF, text,
// code, office documents; read as base64, at most 4 MB each, three at a time). The resident checks type and size again
// and cleans the names; this only keeps the box sane. Used by the chat box and the thread box.
import { createElement as h, useState } from "react";
import { MAX_PICTURES, readPicture, roomFor } from "./attach.mjs";
import { Icon } from "./icons.mjs";
import { words } from "./strings.mjs";

export const MAX_FILES = 3;
export const FILE_MAX_BYTES = 4 * 1024 * 1024;
export const ACCEPT = "image/*,.pdf,.txt,.md,.csv,.json,.xml,.yaml,.yml,.toml,.log,.html,.css,.js,.ts,.tsx,.jsx,.py,.go,.rs,.java,.c,.h,.cpp,.sh,.sql,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.rtf";

const sizeText = (bytes) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

async function readDoc(file) {
  if (file.size > FILE_MAX_BYTES) throw new Error("size");
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return { name: file.name, size: file.size, data: btoa(binary) };
}

export function useAttachments(onError) {
  const [pics, setPics] = useState([]);
  const [docs, setDocs] = useState([]);
  const add = async (event) => {
    const t = words();
    const chosen = Array.from(event.target.files || []);
    event.target.value = "";
    const images = chosen.filter((file) => file.type.startsWith("image/"));
    const others = chosen.filter((file) => !file.type.startsWith("image/"));
    if (images.length > roomFor(pics.length, images.length, MAX_PICTURES)) onError(t.upTo);
    if (others.length > roomFor(docs.length, others.length, MAX_FILES)) onError(t.upToFiles);
    const readPics = [], readDocs = [];
    for (const file of images.slice(0, roomFor(pics.length, images.length, MAX_PICTURES))) {
      try { readPics.push(await readPicture(file)); } catch { onError(t.tooBig); }
    }
    for (const file of others.slice(0, roomFor(docs.length, others.length, MAX_FILES))) {
      try { readDocs.push(await readDoc(file)); } catch { onError(`${file.name}: ${t.fileTooBig}`); }
    }
    if (readPics.length) setPics((was) => [...was, ...readPics].slice(0, MAX_PICTURES));
    if (readDocs.length) setDocs((was) => [...was, ...readDocs].slice(0, MAX_FILES));
  };
  /** The fields a say request takes for what is attached. */
  const fields = () => ({
    ...(pics.length ? { pictures: pics.map((pic) => ({ data: pic.data })) } : {}),
    ...(docs.length ? { files: docs.map((doc) => ({ name: doc.name, data: doc.data })) } : {})
  });
  return { pics, docs, add, fields, any: pics.length + docs.length > 0, clear: () => { setPics([]); setDocs([]); },
    restore: (kept) => { setPics((now) => (now.length ? now : kept.pics)); setDocs((now) => (now.length ? now : kept.docs)); },
    snapshot: () => ({ pics, docs }),
    removePic: (at) => setPics((was) => was.filter((_, i) => i !== at)),
    removeDoc: (at) => setDocs((was) => was.filter((_, i) => i !== at)) };
}

/** The thumbnails and file chips above a box. */
export function Chips({ a }) {
  const t = words();
  const remove = (label, onClick) => h("button", { type: "button", className: "ad-x", "aria-label": label, title: label, onClick }, h(Icon, { name: "close" }));
  return h("div", null,
    a.pics.length > 0 && h("div", { className: "ad-thumbs" }, a.pics.map((pic, i) => h("div", { key: i }, h("img", { src: pic.url, alt: "" }), remove(t.remove, () => a.removePic(i))))),
    a.docs.length > 0 && h("div", { className: "ad-docs" }, a.docs.map((doc, i) => h("span", { key: i, className: "ad-doc" },
      h(Icon, { name: "file" }), h("span", null, `${doc.name} · ${sizeText(doc.size)}`), remove(t.remove, () => a.removeDoc(i))))));
}
