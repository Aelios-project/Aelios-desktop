// Where a sticker and a voice note come from, and how a length is written.
import assert from "node:assert/strict";
import { test } from "node:test";
import { pickerPacks, residentPrefix, stickerSrc, voiceLength } from "../client/media.mjs";

test("media: a sticker lives under the resident's own prefix", () => {
  assert.equal(stickerSrc("https://r.example", "default", "abc"), "https://r.example/stickers/abc");
  assert.equal(stickerSrc("https://r.example/", "ada", "abc"), "https://r.example/r/ada/stickers/abc");
  assert.equal(residentPrefix(undefined), "");
});

test("media: only packs that are on, with stickers, reach the picker", () => {
  const packs = [{ id: "a", enabled: true, stickers: [{ key: "1" }] }, { id: "b", enabled: false, stickers: [{ key: "2" }] }, { id: "c", enabled: true, stickers: [] }];
  assert.deepEqual(pickerPacks(packs).map((p) => p.id), ["a"]);
  assert.deepEqual(pickerPacks(), []);
});

test("media: a length reads as minutes and seconds", () => {
  assert.equal(voiceLength(0), "0:00");
  assert.equal(voiceLength(7.6), "0:08");
  assert.equal(voiceLength(75), "1:15");
  assert.equal(voiceLength(undefined), "");
});
