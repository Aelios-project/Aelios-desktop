// The environment a helper gets on the acpx engine: an allowlist, never the runner's whole environment.
// acpx takes exact names only, so the prefixes are expanded here against the runner's own environment.
// acpx itself also passes PATH, HOME, USER, LOGNAME, SHELL, LANG, LANGUAGE, TZ, TMPDIR, TMP, TEMP, LC_*, XDG_* and ACPX_AUTH_*.

const BASE = ["PATH", "HOME", "USER", "LOGNAME", "SHELL", "LANG", "TERM", "TMPDIR", "TZ", "SSL_CERT_FILE", "SSL_CERT_DIR", "NODE_EXTRA_CA_CERTS", "SSH_AUTH_SOCK"];
const PROXY = ["HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "NO_PROXY"].flatMap(name => [name, name.toLowerCase()]);
const PREFIXES = { all: ["LC_", "XDG_"], kiro: ["KIRO_", "AWS_"], dsh: ["DEEPSEEK_", "DSH_"], command: [] };

/**
 * @param {string} plugin  the config's plugin
 * @param {{env?: Record<string,string>}} config
 * @param {Record<string,string|undefined>} processEnv  the runner's environment
 * @returns {{allow: string[], env: Record<string,string>}}  `allow`: exact names the helper inherits; `env`: config `env`, passed as written
 */
export function envFor(plugin, config, processEnv) {
  const prefixes = [...PREFIXES.all, ...(PREFIXES[plugin] ?? [])];
  const expanded = Object.keys(processEnv).filter(name => prefixes.some(prefix => name.startsWith(prefix)));
  return { allow: [...new Set([...BASE, ...PROXY, ...expanded])], env: { ...(config.env ?? {}) } };
}
