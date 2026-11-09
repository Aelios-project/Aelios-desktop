import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { detectHelpers } from "../host/onboarding/helpers.mjs";

test("helpers: a name is found only when it is executable on PATH", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "ad-helpers-"));
  try {
    writeFileSync(path.join(dir, "dsh"), "#!/bin/sh\n");
    chmodSync(path.join(dir, "dsh"), 0o755);
    writeFileSync(path.join(dir, "kiro-cli"), "#!/bin/sh\n"); // not executable
    const found = detectHelpers({ env: { PATH: `${dir}:/nonexistent` } });
    assert.deepEqual(found.map((helper) => [helper.name, Boolean(helper.path)]), [["dsh", true], ["kiro-cli", false], ["claude", false]]);
    assert.equal(found[0].path, path.join(dir, "dsh"));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
