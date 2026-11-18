// The acpx session store folder: created private, wide modes narrowed, refused when it cannot be made safe.
import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { openStore } from "../src/store.mjs";

const mode = file => statSync(file).mode & 0o777;

test("a fresh store is 0700; a wide mode inside it is narrowed to 0700 / 0600", () => {
  const home = mkdtempSync(path.join(os.tmpdir(), "store-"));
  try {
    const dir = openStore(home);
    assert.equal(dir, path.join(home, "acpx"));
    assert.equal(mode(dir), 0o700);
    mkdirSync(path.join(dir, "sessions"), { mode: 0o755 });
    const file = path.join(dir, "sessions", "t.json");
    writeFileSync(file, "{}"); chmodSync(file, 0o644); chmodSync(path.join(dir, "sessions"), 0o755); chmodSync(dir, 0o755);
    openStore(home);
    assert.deepEqual([mode(dir), mode(path.join(dir, "sessions")), mode(file)], [0o700, 0o700, 0o600]);
  } finally { rmSync(home, { recursive: true, force: true }); }
});

test("a store that cannot be made is refused with a message", () => {
  const home = mkdtempSync(path.join(os.tmpdir(), "store-"));
  try {
    writeFileSync(path.join(home, "acpx"), "a file where the folder should be");
    assert.throws(() => openStore(home), /Cannot use the acpx session store .* safe permissions/);
  } finally { rmSync(home, { recursive: true, force: true }); }
});
