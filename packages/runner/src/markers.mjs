// The ways a helper speaks to the user, as lines at the start of a line:
//   NOTE: ...     anywhere in the turn: the user should know, no answer needed
//   BLOCKED: ...  last line: an outside wall (permission, network, a missing dependency)
//   ASK: ...      last line: only the user can decide
// A reply with no marker is just a finished turn, even if it ends with a question mark.
export const NOTES_MAX = 1000;

/** `NOTE:` lines out of the text. @returns {{notes: string[], rest: string}} */
export function takeNotes(text) {
  const notes = [], kept = [];
  for (const line of text.split("\n")) {
    if (line.startsWith("NOTE:")) { const note = line.slice(5).trim(); if (note) notes.push(note); } else kept.push(line);
  }
  return { notes, rest: kept.join("\n").trim() };
}

/** The last line's marker, if any. @returns {{kind: "ask"|"blocked", text: string, body: string}|null} */
export function lastMarker(text) {
  const lines = text.trimEnd().split("\n"), last = lines.at(-1).trim();
  for (const [prefix, kind] of [["ASK:", "ask"], ["BLOCKED:", "blocked"]]) {
    if (last.startsWith(prefix)) return { kind, text: last.slice(prefix.length).trim(), body: lines.slice(0, -1).join("\n").trim() };
  }
  return null;
}

/** The notes as a receipt `notice`, or undefined when there are none. */
export const noticeOf = notes => notes.length ? { text: notes.join("\n").slice(0, NOTES_MAX), fyi: true } : undefined;
