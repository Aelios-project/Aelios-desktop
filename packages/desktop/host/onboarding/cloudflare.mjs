// The Cloudflare side of the wizard: the cf profile of its own, the account, the Workers it finds, and the
// device authorization. `cf` prints JSON for every list and get, so nothing here parses a human table.
import os from "node:os";
import path from "node:path";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

export const PROFILE = "aelios-desktop";
export const AELIOS_NAME = "companion-memory-proxy";
export const RESIDENT_NAME = "aelios-resident";
export const WORKERS = [AELIOS_NAME, RESIDENT_NAME];

export class CloudflareError extends Error {
  constructor(message, { tail = "" } = {}) { super(message); this.name = "CloudflareError"; this.tail = tail; }
}

/** macOS keeps the profile in Preferences; the design only checked macOS. */
export function profilePaths(name = PROFILE, { home = os.homedir(), platform = process.platform } = {}) {
  const base = platform === "darwin"
    ? path.join(home, "Library", "Preferences", "cloudflare", "config")
    : path.join(home, ".config", "cloudflare", "config");
  return { config: path.join(base, `${name}.json`), keyring: path.join(base, `${name}.enc`) };
}

/** `file` holds a token we can read; `keyring` means the token is in the keychain and `wrangler login` is needed. */
export async function readProfile(name = PROFILE, { home, platform, read = readFile, exists = existsSync } = {}) {
  const { config, keyring } = profilePaths(name, { home, platform });
  try {
    const data = JSON.parse(await read(config, "utf8"));
    return { state: "file", token: String(data.oauth_token ?? ""), expiresAt: Number(data.expiration_time ?? 0) };
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return { state: (await exists(keyring)) ? "keyring" : "missing", token: null, expiresAt: 0 };
  }
}

const asArray = (value) => Array.isArray(value) ? value : Array.isArray(value?.result) ? value.result : [];
const asJson = (text) => { try { return JSON.parse(text); } catch { throw new CloudflareError("Cloudflare answered something that is not JSON"); } };

/** Refreshes an expired token as a side effect: every cf command with --profile does. */
export async function whoami(cli, profile = PROFILE) {
  const out = await cli.cf(["auth", "whoami", "--profile", profile]);
  if (out.code !== 0) throw new CloudflareError("Cloudflare is not signed in", { tail: out.tail });
  const data = asJson(out.out);
  const accounts = asArray(data.accounts ?? []);
  return { accounts, accountId: accounts[0]?.id ?? null };
}

export async function listWorkers(cli, profile = PROFILE) {
  const out = await cli.cf(["workers", "list", "--per-page", "100", "--profile", profile]);
  if (out.code !== 0) throw new CloudflareError("The Workers could not be listed", { tail: out.tail });
  return asArray(asJson(out.out));
}

export async function getWorker(cli, name, profile = PROFILE) {
  const out = await cli.cf(["workers", "get", name, "--profile", profile]);
  if (out.code !== 0) return null;
  return asJson(out.out);
}

export function findWorkers(workers) {
  const byName = (name) => workers.find((worker) => worker.name === name) ?? null;
  return { aelios: byName(AELIOS_NAME), resident: byName(RESIDENT_NAME) };
}

export const workerUrl = (worker) => worker?.subdomain?.url?.replace(/\/+$/, "") ?? null;

/** The names of the secrets a Worker has. */
export async function listSecrets(cli, name, profile = PROFILE) {
  const out = await cli.cf(["workers", "secrets", "list", "--worker", name, "--profile", profile]);
  if (out.code !== 0) return [];
  return asArray(asJson(out.out)).map((row) => row.name);
}

/** The link and the code cf prints in device mode; the card shows both in case the browser does not open. */
export function parseDeviceText(text) {
  const link = text.match(/https:\/\/dash\.cloudflare\.com\/oauth2\/device\/verify/)?.[0] ?? null;
  const code = text.match(/enter the code:[\s\S]{0,80}?\b([A-Z0-9]{4}-?[A-Z0-9]{4})\b/i)?.[1] ?? null;
  return { link, code };
}

/**
 * Runs the browser approval once with the wizard's own profile, so the owner's other cf logins stay as they are.
 * The card reads the link and the code as they arrive; the command ends when the owner approves or five minutes pass.
 */
export async function authorize(cli, { profile = PROFILE, onEvent = () => {}, timeout = 310000 } = {}) {
  let seen = { link: null, code: null };
  const out = await cli.cf(["auth", "create", profile, "--no-browser"], {
    timeout,
    onText: (text) => {
      if (seen.link && seen.code) return;
      const next = parseDeviceText(text);
      if (!next.link && !next.code) return;
      seen = { link: next.link ?? seen.link, code: next.code ?? seen.code };
      onEvent(seen);
    },
  });
  if (out.code !== 0) throw new CloudflareError("The Cloudflare approval did not finish", { tail: out.tail });
  return seen;
}
