// Shortens a line in the middle, so both ends stay readable: the program and the target of a long command.

/** `text` when it fits in `max` characters, else its start, "…" and its end, `max` characters in all. */
export function middle(text, max) {
  if (text.length <= max) return text;
  const keep = max - 1, head = Math.ceil(keep / 2);
  return text.slice(0, head) + "…" + text.slice(text.length - (keep - head));
}
