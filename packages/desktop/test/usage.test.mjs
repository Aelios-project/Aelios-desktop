// The usage block's numbers, in the shapes the resident's own page uses.
import assert from "node:assert/strict";
import { test } from "node:test";
import { compact, costText, hitText, money, tokensText, usageRows } from "../client/usage.mjs";

test("usage: money keeps enough places to see a small number", () => {
  assert.equal(money(0), "$0");
  assert.equal(money(0.004), "$0.0040");
  assert.equal(money(0.42), "$0.420");
  assert.equal(money(3.14159), "$3.14");
});

test("usage: token counts shrink to k and M", () => {
  assert.equal(compact(999), "999");
  assert.equal(compact(1234), "1.2k");
  assert.equal(compact(12345), "12k");
  assert.equal(compact(1234567), "1.23M");
  assert.equal(compact(12345678), "12.3M");
});

test("usage: cache hit is a share of every input token", () => {
  assert.equal(hitText({ input: 100, cacheRead: 900, cacheWrite: 0 }), "90%");
  assert.equal(hitText({ input: 0, cacheRead: 0, cacheWrite: 0 }), "—");
});

test("usage: unpriced calls say so instead of pretending zero", () => {
  assert.equal(costText({ calls: 4, unpriced: 4, cost: 0 }), "unpriced");
  assert.equal(costText({ calls: 4, unpriced: 1, cost: 0.5 }), "$0.500");
  assert.equal(costText(undefined), "…");
});

test("usage: three lines of size and cache only, and a span the answer lacks is left out", () => {
  const rows = usageRows({
    today: { calls: 1, input: 10, cacheRead: 0, cacheWrite: 0, output: 5 },
    week: { calls: 3, input: 100, cacheRead: 100, cacheWrite: 0, output: 2000 },
  });
  assert.deepEqual(rows.map((r) => [r.key, r.label, r.size, r.hit]), [["today", "Today", "10", "0%"], ["week", "7 days", "200", "50%"]]);
  assert.equal(usageRows({ month: { input: 20000, cacheRead: 40000, cacheWrite: 0 } })[0].size, "60k");
});
