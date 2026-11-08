import assert from "node:assert/strict";
import { test } from "node:test";
import { paletteOf } from "../client/palette.mjs";
test("palette: what the surface says wins", () => {
  assert.equal(paletteOf({ scheme: "light", prefersLight: false }), "day");
  assert.equal(paletteOf({ scheme: "dark", prefersLight: true }), "night");
});
test("palette: with no answer the system decides, night when nothing is known", () => {
  assert.equal(paletteOf({ scheme: "", prefersLight: true }), "day");
  assert.equal(paletteOf({ scheme: "", prefersLight: false }), "night");
  assert.equal(paletteOf({}), "night");
});
test("palette: an unknown scheme falls back to the system", () => {
  assert.equal(paletteOf({ scheme: "light dark", prefersLight: true }), "day");
});
