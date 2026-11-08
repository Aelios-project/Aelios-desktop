// The two repositories must say the same thing: every file that copies or follows Aelios-resident names
// Aelios-resident, its AGPL-3.0 licence, and the resident commit the copy came from — one commit for all of them.
// The resident's own page is not vendored here, so a stale header is the only way the copy could claim a source it
// no longer matches. RUN_DIR=... points at a checkout to check the named commit exists there.
import assert from "node:assert/strict";
import { test } from "node:test";
import { readdirSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const CLIENT = new URL("../client/", import.meta.url).pathname;
const README = new URL("../README.md", import.meta.url).pathname;
const COMMIT = /\bmain at ([0-9a-f]{7})\b/g;

/** Every client module that says it copied from the resident, with the commit it claims. */
function copied() {
  return readdirSync(CLIENT).filter((name) => name.endsWith(".mjs")).map((name) => {
    const text = readFileSync(join(CLIENT, name), "utf8");
    const head = text.split("\n").slice(0, 6).join("\n");
    if (!/copied from Aelios-resident/i.test(head)) return null;
    return { name, head, commits: [...head.matchAll(COMMIT)].map((m) => m[1]) };
  }).filter(Boolean);
}

test("provenance: every copied file names the resident, its licence, and one commit", () => {
  const files = copied();
  assert.ok(files.length >= 5, `expected the three style files, the tokens and the reader, found ${files.length}`);
  for (const file of files) {
    assert.match(file.head, /AGPL-3\.0/, `${file.name} must name the licence`);
    assert.equal(file.commits.length, 1, `${file.name} must name exactly one resident commit`);
  }
  const commits = new Set(files.flatMap((file) => file.commits));
  assert.equal(commits.size, 1, `the copies disagree on the resident commit: ${[...commits].join(", ")}`);
});

test("provenance: the package README names the same resident commit", () => {
  const readme = readFileSync(README, "utf8");
  const named = [...readme.matchAll(/`([0-9a-f]{7})`/g)].map((m) => m[1]);
  const copy = copied()[0].commits[0];
  assert.ok(named.includes(copy), `README must name ${copy}; it names ${named.join(", ") || "nothing"}`);
});

test("provenance: the named commit exists in a resident checkout when one is given", { skip: !process.env.RUN_DIR }, () => {
  const dir = process.env.RUN_DIR;
  const commit = copied()[0].commits[0];
  const type = execFileSync("git", ["-C", dir, "cat-file", "-t", commit], { encoding: "utf8" }).trim();
  assert.equal(type, "commit");
});