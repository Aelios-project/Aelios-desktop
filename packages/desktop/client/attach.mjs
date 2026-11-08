// Pictures the reader attaches to a message: at most four, each shrunk to 1568 px on its long edge and sent as
// base64 inside /web/say, the way Aelios-resident's page does it (public/app.js addPhotos, AGPL-3.0, same author;
// main at b118dfb, 2026-11-07). The size rules are pure so test/attach.test.mjs can cover them; only readPicture
// touches a canvas.

export const MAX_PICTURES = 4;
export const LONG_EDGE = 1568;
const KEEP_GIF_BYTES = 3.5 * 1024 * 1024;

/** How many of `incoming` files still fit beside `have` pictures. */
export function roomFor(have = 0, incoming = 0, max = MAX_PICTURES) {
  return Math.max(0, Math.min(incoming, max - have));
}

/** A picture's size after the long edge is capped; never enlarged. */
export function shrinkTo(width, height, edge = LONG_EDGE) {
  const long = Math.max(width || 0, height || 0);
  if (!long || long <= edge) return { width: Math.max(1, Math.round(width || long)), height: Math.max(1, Math.round(height || long)) };
  const scale = edge / long;
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** Bytes as base64, without the `data:` prefix the canvas gives. */
export const bareBase64 = (dataUrl) => String(dataUrl || "").replace(/^data:[^;]*;base64,/, "");

const base64Of = (bytes) => {
  let out = "";
  for (let i = 0; i < bytes.length; i += 0x8000) out += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(out);
};

/** Read a file as the resident's face: a 512 px square, cropped to the middle, as base64 JPEG. */
export async function readFace(file, edge = 512) {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = edge;
  canvas.height = edge;
  canvas.getContext("2d").drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, edge, edge);
  bitmap.close?.();
  const dataUrl = canvas.toDataURL("image/jpeg", 0.86);
  return { data: bareBase64(dataUrl), type: "image/jpeg", url: dataUrl };
}

/** Read one file into a picture the resident accepts. A small GIF is sent as it is; everything else is redrawn. */
export async function readPicture(file) {
  if (file.type === "image/gif" && file.size < KEEP_GIF_BYTES) {
    return { url: URL.createObjectURL(file), data: base64Of(new Uint8Array(await file.arrayBuffer())) };
  }
  const bitmap = await createImageBitmap(file);
  const size = shrinkTo(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, size.width, size.height);
  bitmap.close?.();
  const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
  return { url: dataUrl, data: bareBase64(dataUrl) };
}