// Main-model patterns and the AI Gateway bits the model card needs. The matching rule is Aelios's own
// (src/gateway/config.ts): a glob against the requested name and against its basename after the last slash.
export function matchGlob(pattern, value) {
  const source = String(pattern).split("*").map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*");
  return new RegExp(`^${source}$`, "i").test(value);
}

export function matchesMainModel(patterns, requested) {
  const base = String(requested).slice(String(requested).lastIndexOf("/") + 1);
  return (patterns ?? []).some((pattern) => matchGlob(pattern, requested) || matchGlob(pattern, base));
}

const API = "https://api.cloudflare.com/client/v4";

async function cfGet(fetch, token, path) {
  const response = await fetch(`${API}${path}`, { headers: { authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`Cloudflare answered ${response.status}`);
  return response.json();
}

/** The built-in and custom providers, read live; the card never hard-codes the list. */
export async function providers(fetch, token, accountId) {
  const data = await cfGet(fetch, token, `/accounts/${accountId}/ai-gateway/providers?per_page=100`);
  return (data.result ?? []).filter((row) => row.enable !== false).map((row) => ({
    slug: row.slug, name: row.name, custom: row.source === "account",
  }));
}

/** The account's default gateway, or the first one; null only when the account has none. */
export async function defaultGateway(fetch, token, accountId) {
  const data = await cfGet(fetch, token, `/accounts/${accountId}/ai-gateway/gateways`);
  const rows = data.result ?? [];
  return rows.find((row) => row.id === "default") ?? rows[0] ?? null;
}

/** A provider key goes in on standard input; `--secret` would put it in the command line, where ps sees it. */
export async function putProviderKey(cli, { profile, gateway, slug, key }) {
  const out = await cli.cf([
    "ai-gateway", "gateways", "providers", "create", gateway,
    "--body", "@/dev/stdin", "--profile", profile,
  ], { input: JSON.stringify({ provider_slug: slug, secret: key }) });
  if (out.code !== 0) throw Object.assign(new Error("The provider key was not stored"), { tail: out.tail });
}
