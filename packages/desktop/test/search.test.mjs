// Asking for a search, and shaping one hit into a row.
import assert from "node:assert/strict";
import { test } from "node:test";
import { askedFor, hitRows, searchPath, snippetOf } from "../client/search.mjs";

test("search: the words are folded, and nothing is not worth asking", () => {
  assert.deepEqual(askedFor("  july   ledger "), { query: "july ledger" });
  assert.deepEqual(askedFor("   "), { error: "empty" });
  assert.deepEqual(askedFor("x".repeat(81)), { error: "long" });
});

test("search: the path carries the words encoded", () => {
  assert.equal(searchPath("a b&c"), "/web/search?q=a%20b%26c");
});

test("search: a snippet trims both sides and keeps the hit", () => {
  assert.deepEqual(snippetOf({ before: " the  lease\nis ", match: "due", after: " before noon " }), { before: "the lease is", match: "due", after: "before noon" });
  assert.deepEqual(snippetOf({}), { before: "", match: "", after: "" });
});

test("search: rows keep the order, drop repeats, and stop at the limit", () => {
  const hits = [{ id: "a" }, { id: "b" }, { id: "a" }, null, { id: "c" }, { id: "d" }];
  assert.deepEqual(hitRows(hits, 3).map((h) => h.id), ["a", "b", "c"]);
});
