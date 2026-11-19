// Builds the two Workers the wizard deploys, from two source checkouts, into packages/desktop/bundles/.
// Each bundle carries its script, a config with {{MAIN}}, {{ASSETS}}, {{MIGRATIONS}} and {{D1_ID}} placeholders,
// its assets or migrations, its license, and a hash for every file. Run with --aelios <dir> --resident <dir>.
import { createHash } from "node:crypto";
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const OUT = path.resolve(import.meta.dirname, "../bundles");
const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, arg, index, list) => {
  if (arg.startsWith("--") && list[index + 1] && !list[index + 1].startsWith("--")) pairs.push([arg.slice(2), list[index + 1]]);
  return pairs;
}, []));

const D1_PLACEHOLDER = "00000000-0000-0000-0000-000000000000";
const sha = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");
const walk = (dir, base = dir) => readdirSync(dir).sort().flatMap((name) => {
  const full = path.join(dir, name);
  return statSync(full).isDirectory() ? walk(full, base) : [path.relative(base, full)];
});
const filesOf = (dir) => Object.fromEntries(walk(dir).map((file) => [file, sha(path.join(dir, file))]));
const replaceOnce = (text, from, to) => {
  if (!text.includes(from)) throw new Error(`${from} was not found in the config`);
  return text.split(from).join(to);
};

function build({ source, id, worker, config, assets, migrations }) {
  if (!source) throw new Error(`--${id} points at a checkout`);
  const dir = path.join(OUT, id);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: source, encoding: "utf8" }).trim();
  const sourceConfig = readFileSync(path.join(source, config), "utf8");
  const mainMatch = sourceConfig.match(/"main": "[^"]+"/) ?? sourceConfig.match(/main = "[^"]+"/);
  let bundleConfig = replaceOnce(sourceConfig, mainMatch[0], config.endsWith(".jsonc") ? '"main": "{{MAIN}}"' : 'main = "{{MAIN}}"');
  if (assets) bundleConfig = replaceOnce(bundleConfig, '"directory": "public"', '"directory": "{{ASSETS}}"');
  if (migrations) {
    bundleConfig = bundleConfig.replace(/(\[\[d1_databases\]\][\s\S]*?database_name = "[^"]+")/, (block) => `${block}\ndatabase_id = "{{D1_ID}}"`);
    bundleConfig += `\nmigrations_dir = "{{MIGRATIONS}}"\n`;
  }

  const buildConfig = bundleConfig
    .split("{{MAIN}}").join(path.join(source, config.endsWith(".toml") ? "src/index.ts" : "src/index.ts"))
    .split("{{ASSETS}}").join(path.join(source, assets ?? "public"))
    .split("{{MIGRATIONS}}").join(path.join(source, migrations ?? "migrations"))
    .split("{{D1_ID}}").join(D1_PLACEHOLDER);
  const tmp = path.join(OUT, `.${id}-build${path.extname(config)}`);
  writeFileSync(tmp, buildConfig);

  const outdir = path.join(dir, ".build");
  mkdirSync(outdir, { recursive: true });
  execFileSync(path.join(source, "node_modules/.bin/wrangler"), ["deploy", "--dry-run", "--outdir", outdir, "--config", tmp], {
    cwd: source, stdio: "inherit", env: { ...process.env, CI: "1", WRANGLER_SEND_METRICS: "false" },
  });
  cpSync(path.join(outdir, "index.js"), path.join(dir, "index.js"));
  rmSync(outdir, { recursive: true, force: true });
  rmSync(tmp, { force: true });

  if (assets) cpSync(path.join(source, assets), path.join(dir, assets), { recursive: true });
  if (migrations) cpSync(path.join(source, migrations), path.join(dir, migrations), { recursive: true });
  cpSync(path.join(source, "LICENSE"), path.join(dir, "LICENSE"));
  // Source comments stay in the source repository; the carried config is data, not a second copy of its prose.
  bundleConfig = bundleConfig.split("\n").filter((line) => !/^\s*(#|\/\/)/.test(line)).join("\n").replace(/\n{3,}/g, "\n\n");
  writeFileSync(path.join(dir, config), bundleConfig);

  return { worker, commit, version: `0.1.0-${commit.slice(0, 7)}`, config, files: filesOf(dir) };
}

mkdirSync(OUT, { recursive: true });
const bundles = {
  aelios: build({ source: args.aelios, id: "aelios", worker: "companion-memory-proxy", config: "wrangler.toml", migrations: "migrations" }),
  resident: build({ source: args.resident, id: "resident", worker: "aelios-resident", config: "wrangler.jsonc", assets: "public" }),
};
writeFileSync(path.join(OUT, "manifest.json"), `${JSON.stringify({ builtAt: new Date().toISOString(), bundles }, null, 2)}\n`);
console.log(`bundles written to ${OUT}`);
