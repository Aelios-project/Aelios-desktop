// A turn's text parts as one report that fits the resident's summary limit. The resident refuses a longer summary, and the
// runner then drops the receipt, so the cut is made here and shows: where text was dropped there is a mark with the count.
export const SUMMARY_MAX = 4000;

const mark = count => `[... ${count} characters left out ...]`;

/** The longest start of `text` within `room` that ends at a paragraph or a line; a hard cut when the last break is in the first half. */
function cutAt(text, room) {
  if (room <= 0) return "";
  if (text.length <= room) return text;
  const head = text.slice(0, room), paragraph = head.lastIndexOf("\n\n"), line = head.lastIndexOf("\n");
  const at = paragraph > room / 2 ? paragraph : line > room / 2 ? line : room;
  const out = head.slice(0, at);
  return (/[\ud800-\udbff]$/.test(out) ? out.slice(0, -1) : out).trimEnd(); // not in the middle of a character
}

/** The longest end of `text` within `room` that starts at a paragraph or a line; a hard cut when the first break is in the last half. */
function cutFrom(text, room) {
  if (room <= 0) return "";
  if (text.length <= room) return text;
  const tail = text.slice(-room), paragraph = tail.indexOf("\n\n"), line = tail.indexOf("\n");
  const at = paragraph >= 0 && paragraph < room / 2 ? paragraph + 2 : line >= 0 && line < room / 2 ? line + 1 : 0;
  const out = tail.slice(at);
  return (/^[\udc00-\udfff]/.test(out) ? out.slice(1) : out).trimStart(); // not in the middle of a character
}

/**
 * The parts, in order, joined by a blank line. When that is over `max`: the last part stays whole (it is the answer), the
 * earlier text fills the rest of the room from its start, and the mark stands where text was dropped.
 * A last part that alone is over `max` keeps its end: the mark first, then the tail of the turn from a paragraph or line start.
 */
export function fitReport(parts, max = SUMMARY_MAX) {
  const text = parts.join("\n\n");
  if (text.length <= max) return text;
  const last = parts.at(-1), before = parts.slice(0, -1).join("\n\n");
  const spare = mark(text.length).length + 4; // the mark and its two blank lines, counted at the most digits it can have
  if (last.length + spare >= max) {
    const tail = cutFrom(text, max - spare);
    return `${mark(text.length - tail.length)}\n\n${tail}`;
  }
  const head = cutAt(before, max - last.length - spare);
  return [head, mark(before.length - head.length), last].filter(Boolean).join("\n\n");
}
