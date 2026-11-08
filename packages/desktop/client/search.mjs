// Searching the conversation from the left column. The resident answers /web/search with
// { results: [{ id, role, at, before, match, after }], next }; /web/search/around?id= gives the lines around one hit.
// The shapes come from Aelios-resident, src/chat-search.ts (AGPL-3.0, same author; main at b118dfb, 2026-11-07).

/** The words to ask for, or why there is nothing to ask. */
export function askedFor(raw) {
  const query = String(raw || "").trim().replace(/\s+/g, " ");
  if (!query) return { error: "empty" };
  if ([...query].length > 80) return { error: "long" };
  return { query };
}

export const searchPath = (query) => `/web/search?q=${encodeURIComponent(query)}`;

/** One hit as the row shows it: the words either side, trimmed, with the hit itself in the middle. */
export function snippetOf(hit) {
  const tidy = (text) => String(text || "").replace(/\s+/g, " ").trim();
  return { before: tidy(hit?.before), match: tidy(hit?.match), after: tidy(hit?.after) };
}

/** Hits newest first, at most `limit`, without the id doubled. */
export function hitRows(results = [], limit = 8) {
  const seen = new Set();
  return results
    .filter((hit) => hit && hit.id && !seen.has(hit.id) && seen.add(hit.id))
    .slice(0, limit);
}
