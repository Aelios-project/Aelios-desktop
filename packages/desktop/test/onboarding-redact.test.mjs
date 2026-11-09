import assert from "node:assert/strict";
import { test } from "node:test";
import { Redactor } from "../host/onboarding/redact.mjs";

test("redact: text, nested values, longest first", () => {
  const redactor = new Redactor(["abcdef", "abcd"]);
  assert.equal(redactor.text("x abcdef y"), "x [redacted] y");
  assert.equal(redactor.value({ a: ["abcd"], b: { c: "none" } }).a[0], "[redacted]");
  assert.equal(redactor.value({ b: { c: "none" } }).b.c, "none");
  assert.equal(redactor.text("abcdef"), "[redacted]", "a longer secret is not half replaced");
  assert.equal(redactor.size, 2);
});

test("redact: short values are ignored, drop forgets one", () => {
  const redactor = new Redactor(["abc"]);
  assert.equal(redactor.size, 0);
  redactor.add("abcd").add(null);
  assert.equal(redactor.size, 1);
  redactor.drop("abcd");
  assert.equal(redactor.text("abcd"), "abcd");
});

test("redact: an argument may not carry a secret", () => {
  const redactor = new Redactor(["swordfish"]);
  assert.throws(() => redactor.guard(["--key", "swordfish"]), /argument/);
  assert.throws(() => redactor.guard(["--key=swordfish"]), /argument/);
  redactor.guard(["--key", "[redacted]"]);
});
