// A group chat with the resident: who said a line, and which lines are the group's own notes.
// Shapes from Aelios-resident src/group.ts (AGPL-3.0, same author; main at b118dfb, 2026-11-07): a list entry is
// { id, name, members, icon, last, running }, a view is { lines, group, speaking, waiting, running }.
// A line is { seq, author, text, at, kind: "say" | "note", pictures?: number, stickers?: [...] }. HER is "".

const HER = "";

/** The name a line is said under. */
export function authorOf(line, group, names) {
  if (line?.author === HER || !line?.author) return names.you;
  if (line.author === "you") return names.you;
  const member = (group?.members || []).find((m) => m.id === line.author);
  return member?.name || line.author;
}

/** Lines ready to draw: the group's own notes are the dashed ones. */
export function groupRows(lines = []) {
  return (lines || []).filter((line) => line && (line.text || line.pictures || line.stickers?.length))
    .map((line) => ({ seq: line.seq, author: line.author, text: line.text || "", at: line.at, note: line.kind === "note" || line.author === "", pictures: line.pictures || 0, stickers: line.stickers || [] }));
}

/** Groups newest first by their last line, the ones still answering first. */
export function groupList(groups = []) {
  const at = (g) => new Date(g?.last?.at || 0).getTime();
  return [...groups].filter(Boolean).sort((a, b) => Number(Boolean(b.running)) - Number(Boolean(a.running)) || at(b) - at(a));
}
