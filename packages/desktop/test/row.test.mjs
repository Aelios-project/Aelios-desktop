// Which lines of the conversation draw a row: a sticker or a voice note sent on its own is a message, not an empty one.
import assert from "node:assert/strict";
import { test } from "node:test";
import { drawsRow, myWords } from "../client/row.mjs";

const STICKER = [{ url: "/stickers/bb5e17ed7a06444eb63671f8", video: false }];

test("row: a sticker sent with no words is a message of its own", () => {
  const bare = { id: "m1", role: "user", text: "", at: 1, stickers: STICKER };
  assert.equal(drawsRow(bare), true, "the picture is the whole message");
  assert.deepEqual(myWords(bare), [], "no empty bubble around it");
  // The shape /web/messages gives it after a pick.
  assert.equal(drawsRow({ id: "m2", role: "user", kind: "chat", text: "", at: 1, stickers: [{ url: "/stickers/bb5e17ed7a06444eb63671f8", video: false }] }), true);
});

test("row: words, pictures, files, an attachment, a voice note all count; a bare note does not", () => {
  assert.equal(drawsRow({ role: "user", text: "hi" }), true);
  assert.deepEqual(myWords({ role: "user", text: " hi " }), [" hi "]);
  assert.equal(drawsRow({ role: "user", text: "   " }), false);
  assert.equal(drawsRow({ role: "user", text: "", pictures: 2 }), true);
  assert.equal(drawsRow({ role: "user", text: "", attached: [{ name: "a.pdf" }] }), true);
  assert.equal(drawsRow({ role: "user", text: "", files: [{ key: "k", name: "a.md" }] }), true);
  assert.equal(drawsRow({ role: "user", text: "", voice: { key: "12ab", seconds: 3 } }), true);
  assert.equal(drawsRow({ role: "user", text: "", voice: { key: null, missed: true } }), true);
  assert.equal(drawsRow({ role: "user", text: "", stickers: [] }), false);
  assert.equal(drawsRow({ role: "user" }), false);
  // Her replies always draw: they carry the busy chip and the actions.
  assert.equal(drawsRow({ role: "assistant", text: "" }), true);
  assert.equal(drawsRow(null), false);
});