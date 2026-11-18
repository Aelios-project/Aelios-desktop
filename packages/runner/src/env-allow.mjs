// The environment a helper gets on the acpx engine: an allowlist, never the runner's whole environment.
// acpx takes exact names only, so the prefixes are expanded here against the runner's own environment.
// acpx itself also passes PATH, HOME, USER, LOGNAME, SHELL, LANG, LANGUAGE, TZ, TMPDIR, TMP, TEMP, LC_*, XDG_* and ACPX_AUTH_*.
// acpx also copies a non-empty ACPX_AUTH_<NAME> to <NAME> and lets neither be overridden, so a config `env` key with one of
// those names would be silently ignored. That is refused with a message instead.

import { kiroHomeOf } from "./kiro-home.mjs";

const BASE = ["PATH", "HOME", "USER", "LOGNAME", "SHELL", "LANG", "TERM", "TMPDIR", "TZ", "SSL_CERT_FILE", "SSL_CERT_DIR", "NODE_EXTRA_CA_CERTS", "SSH_AUTH_SOCK"];
const PROXY = ["HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "NO_PROXY"].flatMap(name => [name, name.toLowerCase()]);
const PREFIXES = { all: ["LC_", "XDG_"], kiro: ["KIRO_", "AWS_"], dsh: ["DEEPSEEK_", "DSH_"], claude: ["ANTHROPIC_", "CLAUDE_"], codex: ["OPENAI_", "CODEX_"], command: [] };

/**
 * @param {string} plugin  the config's plugin
 * @param {{env?: Record<string,string>}} config
 * @param {Record<string,string|undefined>} processEnv  the runner's environment
 * @returns {{allow: string[], env: Record<string,string>}}  `allow`: exact names the helper inherits; `env`: config `env`, passed as written
 */
export function envFor(plugin, config, processEnv) {
  const conflicts = authConflicts(config.env ?? {}, processEnv);
  if (conflicts.length) throw new Error(`The config env sets ${conflicts.join(", ")}, but an ACPX_AUTH_ variable in the runner's environment would override it. Unset the ACPX_AUTH_ variable or remove the key from env.`);
  const prefixes = [...PREFIXES.all, ...(PREFIXES[plugin] ?? [])];
  const expanded = Object.keys(processEnv).filter(name => prefixes.some(prefix => name.startsWith(prefix)));
  return { allow: [...new Set([...BASE, ...PROXY, ...expanded])], env: { ...(config.env ?? {}), ...(plugin === "kiro" ? { KIRO_HOME: kiroHomeOf(config) } : {}) } };
}

const AUTH = "ACPX_AUTH_";
const nameKey = name => process.platform === "win32" ? name.toUpperCase() : name;
// The name acpx derives from ACPX_AUTH_<suffix> (its toEnvToken).
const token = suffix => suffix.trim().replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").toUpperCase();

/** Config env keys acpx would not let through, because an inherited ACPX_AUTH_ grant claims the same name. */
export function authConflicts(env, processEnv) {
  const claimed = new Set();
  for (const [name, value] of Object.entries(processEnv)) {
    if (!nameKey(name).startsWith(AUTH) || typeof value !== "string" || !value.trim()) continue;
    const derived = token(name.slice(AUTH.length));
    if (!derived) continue;
    claimed.add(nameKey(name)); claimed.add(nameKey(derived));
  }
  return Object.keys(env).filter(name => claimed.has(nameKey(name)));
}
