import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "bundles");
const manifest = JSON.parse(readFileSync(path.join(ROOT, "manifest.json"), "utf8"));
const sha = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");
const files = (dir) => manifest.bundles[dir].files;

test("bundles: every filed hash matches the manifest, and no source map is carried", () => {
  for (const [id, entry] of Object.entries(manifest.bundles)) {
    assert.ok(entry.commit.length === 40, `${id} names the source commit`);
    assert.ok(entry.version.startsWith("0.1.0-"), `${id} has a version tag`);
    for (const [file, hash] of Object.entries(entry.files)) {
      const full = path.join(ROOT, id, file);
      assert.ok(statSync(full).isFile(), `${id}/${file} exists`);
      assert.equal(sha(full), hash, `${id}/${file} matches its hash`);
      assert.ok(!file.endsWith(".map"), `${id} carries no source map`);
    }
  }
});

test("bundles: Aelios carries its config, migrations and license", () => {
  const files = Object.keys(manifest.bundles.aelios.files);
  assert.ok(files.includes("index.js"));
  assert.ok(files.includes("wrangler.toml"));
  assert.ok(files.includes("LICENSE"));
  const migrations = files.filter((file) => file.startsWith("migrations/") && file.endsWith(".sql"));
  assert.equal(migrations.length, 19);
  const config = readFileSync(path.join(ROOT, "aelios", "wrangler.toml"), "utf8");
  assert.match(config, /database_id = "\{\{D1_ID\}\}"/);
  assert.match(config, /migrations_dir = "\{\{MIGRATIONS\}\}"/);
  assert.match(config, /\[\[queues\.consumers\]\]/);
  assert.match(config, /crons = \["10 20 \* \* \*"\]/);
});

test("bundles: the resident carries its assets, its bindings and all three migrations", () => {
  const files = Object.keys(manifest.bundles.resident.files);
  assert.ok(files.includes("index.js"));
  assert.ok(files.includes("wrangler.jsonc"));
  assert.ok(files.includes("LICENSE"));
  const assets = files.filter((file) => file.startsWith("public/"));
  assert.ok(assets.length >= 18, `18 assets, found ${assets.length}`);
  assert.ok(assets.includes("public/index.html"));
  assert.ok(assets.includes("public/vendor/alpine-3.14.9.min.js"));
  const config = readFileSync(path.join(ROOT, "resident", "wrangler.jsonc"), "utf8");
  assert.match(config, /"main": "\{\{MAIN\}\}"/);
  assert.match(config, /"directory": "\{\{ASSETS\}\}"/);
  assert.match(config, /"tag": "v1"/);
  assert.match(config, /"tag": "v2"/);
  assert.match(config, /"tag": "v3"/);
  assert.match(config, /"run_worker_first"/);
});
