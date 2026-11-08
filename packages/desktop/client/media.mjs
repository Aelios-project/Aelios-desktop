// Stickers and voice notes: where their bytes live, and how long a recording says it is.
// Stickers are served publicly at `<resident prefix>/stickers/<key>`; a voice note is read from /web/media by key.
// Follows Aelios-resident's page (public/app.js stickerUrl/play) and src/sticker-store.ts (AGPL-3.0, same author;
// main at b118dfb, 2026-11-07). Pure, so test/media.test.mjs can cover it.

export const residentPrefix = (resident) => (resident && resident !== "default" ? `/r/${resident}` : "");

/** The address of one sticker's picture. */
export const stickerSrc = (base, resident, key) => `${String(base || "").replace(/\/+$/, "")}${residentPrefix(resident)}/stickers/${key}`;

/** The packs a picker should show: the ones that are on, each with the stickers it has. */
export function pickerPacks(packs = []) {
  return packs.filter((pack) => pack && pack.enabled && Array.isArray(pack.stickers) && pack.stickers.length > 0)
    .map((pack) => ({ id: pack.id, name: pack.name || "", stickers: pack.stickers }));
}

/** A recording's length as minutes and seconds. */
export function voiceLength(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "";
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}
