// Joining an avatar's path to the resident's address, and nothing else.
import assert from "node:assert/strict";
import { test } from "node:test";
import { avatarUrl } from "../client/avatar.mjs";

test("avatar: a path is joined to the resident's address", () => {
  assert.equal(avatarUrl("https://resident.example", "/avatar/abc"), "https://resident.example/avatar/abc");
  assert.equal(avatarUrl("https://resident.example/", "/r/ada/avatar/abc"), "https://resident.example/r/ada/avatar/abc");
  assert.equal(avatarUrl("https://resident.example/base", "avatar/abc"), "https://resident.example/base/avatar/abc");
});

test("avatar: an absolute or data address is left alone, and no path means no picture", () => {
  assert.equal(avatarUrl("https://resident.example", "https://cdn.example/a.png"), "https://cdn.example/a.png");
  assert.equal(avatarUrl("https://resident.example", "data:image/png;base64,AA"), "data:image/png;base64,AA");
  assert.equal(avatarUrl("https://resident.example", null), "");
  assert.equal(avatarUrl(null, "/avatar/abc"), "/avatar/abc");
});
