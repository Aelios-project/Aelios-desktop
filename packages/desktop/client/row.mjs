// Whether a line of the conversation draws a row at all, and how a user's own line speaks. A sticker or a voice note
// sent on its own has no words: the picture or the clip is the whole message, and a line with only that is not empty.

/** The words of a user's line in the order they draw: one bubble for what was typed, or none for a bare sticker. */
export function myWords(line) {
  return String(line?.text ?? "").trim() ? [line.text] : [];
}

/** False for a line with nothing to show (a note the page already told the reader, say). */
export function drawsRow(line) {
  if (!line) return false;
  if (line.role !== "user") return true;
  return myWords(line).length > 0 || (line.pictures ?? 0) > 0 || (line.attached ?? []).length > 0
    || (line.files ?? []).length > 0 || (line.stickers ?? []).length > 0 || Boolean(line.voice?.key) || Boolean(line.voice?.missed);
}