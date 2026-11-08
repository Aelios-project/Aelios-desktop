// Builds client.js (the browser half) from client/*.mjs.
//   node scripts/build-client.mjs          writes client.js
//   node scripts/build-client.mjs --check  exits 1 when client.js is not what a fresh build gives
// client.js is committed so a plugin install needs no build step. DSH loads it as a classic script, so the
// wrapper hands the bundle to its module loader; the platform modules stay external.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUTPUT = join(ROOT, "client.js");

export async function bundleClient() {
  const result = await build({
    absWorkingDir: ROOT, entryPoints: ["client/index.mjs"], bundle: true, format: "cjs", platform: "browser",
    target: "es2022", external: ["react"], charset: "utf8", write: false, logLevel: "silent",
  });
  if (result.warnings.length) throw new Error(result.warnings.map((w) => w.text).join("\n"));
  return [
    "// Generated from client/ by `npm run build`. Do not edit by hand.",
    "window.__ModuleLoader__.load({",
    "  id: '@aelios/desktop',",
    "  factory: (require) => {",
    "const module = { exports: {} }",
    result.outputFiles[0].text.trimEnd(),
    "return Object.defineProperty({ ...module.exports }, Symbol.toStringTag, { value: 'Module' })",
    "  },",
    "})",
    "",
  ].join("\n");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const text = await bundleClient();
  if (process.argv.includes("--check")) {
    let current = "";
    try { current = readFileSync(OUTPUT, "utf8"); } catch { /* missing */ }
    if (current !== text) { console.error("client.js is out of date; run npm run build"); process.exit(1); }
  } else writeFileSync(OUTPUT, text);
}
