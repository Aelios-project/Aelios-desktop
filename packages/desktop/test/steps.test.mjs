import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("setup takes four steps or fewer", () => {
  const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
  const section = readme.split("## Setup")[1].split("\n## ")[0];
  const steps = section.split("\n").filter((l) => /^\d+\. /.test(l));
  assert.ok(steps.length >= 1 && steps.length <= 4, `found ${steps.length} steps`);
});
