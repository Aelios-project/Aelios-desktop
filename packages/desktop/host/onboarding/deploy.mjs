// Runs the two deploy commands the wizard needs through wrangler: upload, secrets, migrations.
// The cf token goes to the child environment only; a secret goes on standard input; every output is redacted by cli.
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

export class DeployError extends Error {
  constructor(message, { tail = "" } = {}) { super(message); this.name = "DeployError"; this.tail = tail; }
}

export const tokenEnv = (token, accountId) => ({
  ...(token ? { CLOUDFLARE_API_TOKEN: token } : {}),
  CLOUDFLARE_ACCOUNT_ID: accountId,
  CI: "1",
  WRANGLER_SEND_METRICS: "false",
});

/** The bundle's config with the real paths and database id. It lives in a temporary file that is deleted after. */
export function fillConfig(bundle, { d1Id = "" } = {}) {
  const dir = bundle.dir;
  return bundle.configText
    .split("{{MAIN}}").join(path.join(dir, "index.js"))
    .split("{{ASSETS}}").join(path.join(dir, "public"))
    .split("{{MIGRATIONS}}").join(path.join(dir, "migrations"))
    .split("{{D1_ID}}").join(d1Id);
}

export function makeDeployer({ wrangler, tmpdir = os.tmpdir() }) {
  if (!wrangler) throw new Error("a wrangler runner is required");

  async function withConfig(bundle, options, run) {
    const dir = mkdtempSync(path.join(tmpdir, "aelios-config-"));
    const file = path.join(dir, bundle.configFile);
    writeFileSync(file, fillConfig(bundle, options), { mode: 0o600 });
    try { return await run(file); } finally { rmSync(dir, { recursive: true, force: true }); }
  }

  const env = (options) => tokenEnv(options.token, options.accountId);

  return {
    async login() {
      const out = await wrangler(["login"], { extraEnv: { CI: "1", WRANGLER_SEND_METRICS: "false" } });
      if (out.code !== 0) throw new DeployError("The wrangler login did not finish", { tail: out.tail });
    },

    async upload(bundle, options) {
      return withConfig(bundle, options, async (config) => {
        const args = ["deploy", "--config", config, "--keep-vars", "--tag", options.tag];
        for (const [key, value] of Object.entries(options.vars ?? {})) args.push("--var", `${key}:${value}`);
        const out = await wrangler(args, { extraEnv: env(options), cwd: bundle.dir });
        if (out.code !== 0) throw new DeployError(`${bundle.worker} did not deploy`, { tail: out.tail });
        return out.tail;
      });
    },

    async secret(bundle, options) {
      return withConfig(bundle, options, async (config) => {
        const out = await wrangler(["secret", "put", options.name, "--config", config], {
          input: options.value, extraEnv: env(options), cwd: bundle.dir,
        });
        if (out.code !== 0) throw new DeployError(`The secret ${options.name} was not set`, { tail: out.tail });
      });
    },

    async migrate(bundle, options) {
      return withConfig(bundle, options, async (config) => {
        const out = await wrangler(["d1", "migrations", "apply", options.database, "--remote", "--config", config], {
          extraEnv: env(options), cwd: bundle.dir,
        });
        if (out.code !== 0) throw new DeployError("The database migrations did not finish", { tail: out.tail });
        return out.tail;
      });
    },

    /** What wrangler would apply; an empty list means the migrations are already there. */
    async pendingMigrations(bundle, options) {
      return withConfig(bundle, options, async (config) => {
        const out = await wrangler(["d1", "migrations", "list", options.database, "--remote", "--config", config], {
          extraEnv: env(options), cwd: bundle.dir,
        });
        if (out.code !== 0) return null;
        const names = out.out.match(/\b\d{4}_[a-z0-9_]+\.sql\b/gi) ?? [];
        return [...new Set(names)];
      });
    },
  };
}

/** Reads the bundles once, from the manifest the build script writes. */
export function loadBundles(root) {
  const manifest = JSON.parse(readFileSync(path.join(root, "manifest.json"), "utf8"));
  const bundles = {};
  for (const [id, entry] of Object.entries(manifest.bundles)) {
    const dir = path.join(root, id);
    bundles[id] = {
      id, dir, worker: entry.worker, version: entry.version, commit: entry.commit,
      configFile: entry.config, configText: readFileSync(path.join(dir, entry.config), "utf8"),
    };
  }
  return { manifest, bundles };
}
