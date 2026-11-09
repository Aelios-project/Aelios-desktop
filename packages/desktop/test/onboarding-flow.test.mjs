import assert from "node:assert/strict";
import { test } from "node:test";
import { PATHS, countCards, isPath } from "../host/onboarding/steps.mjs";

// The numbers come from requirement 11 and the design's step table. If a path grows, this fails and the
// requirement, the design and the PR text must change together.
test("flow: an existing resident needs 2 cards, a fresh install with defaults 4", () => {
  assert.equal(PATHS.existing.cards.length, 2);
  assert.equal(PATHS.fresh.cards.length, 4);
  assert.equal(countCards("existing"), 2);
  assert.equal(countCards("fresh"), 4);
  assert.equal(countCards("elsewhere"), 0);
});

test("flow: each path is a real list, starts at the resident and ends at the helpers", () => {
  for (const [name, path] of Object.entries(PATHS)) {
    assert.ok(path.cards.length > 1, `${name} has cards`);
    assert.equal(new Set(path.cards).size, path.cards.length, `${name} has no repeated card`);
    assert.equal(path.cards[0], "resident");
    assert.equal(path.cards.at(-1), "helpers");
    assert.ok(path.steps.length > 0, `${name} has deploy steps`);
    assert.equal(new Set(path.steps).size, path.steps.length, `${name} has no repeated step`);
    assert.ok(isPath(name));
  }
  assert.equal(isPath("toString"), false, "inherited names are not paths");
});
