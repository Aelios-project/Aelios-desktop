// The picture rules before anything touches a canvas: how many fit, and how big they stay.
import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_PICTURES, bareBase64, roomFor, shrinkTo } from "../client/attach.mjs";

test("attach: four pictures at a time, never more", () => {
  assert.equal(MAX_PICTURES, 4);
  assert.equal(roomFor(0, 3), 3);
  assert.equal(roomFor(3, 2), 1);
  assert.equal(roomFor(4, 2), 0);
  assert.equal(roomFor(2, 9), 2);
});

test("pictures shrink to the long edge, and are never enlarged", () => {
  assert.deepEqual(shrinkTo(4000, 3000), { width: 1568, height: 1176 });
  assert.deepEqual(shrinkTo(3000, 4000), { width: 1176, height: 1568 });
  assert.deepEqual(shrinkTo(800, 600), { width: 800, height: 600 });
  assert.deepEqual(shrinkTo(0, 0), { width: 1, height: 1 });
});

test("a data URL becomes plain base64", () => {
  assert.equal(bareBase64("data:image/jpeg;base64,AAAA"), "AAAA");
  assert.equal(bareBase64("AAAA"), "AAAA");
  assert.equal(bareBase64(undefined), "");
});
