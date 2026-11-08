// The MCP servers the resident is connected to, for the Settings panel. /web/mcp answers
// { servers: [{ id, name, url, state, authUrl, error, tools, tokens, hasKey }] }.
// Shape from Aelios-resident src/mcp-servers.ts (AGPL-3.0, same author; main at b118dfb, 2026-11-07). Pure.

/** The host of a server address, or the address itself when it will not parse. */
export function hostOf(url) {
  try { return new URL(String(url || "")).host || String(url || ""); } catch { return String(url || ""); }
}

/** How a server stands, in words. */
export function mcpState(state) {
  return { ready: "connected", authenticating: "waiting for you to sign in", "not-connected": "not connected", error: "not connected", failed: "not connected" }[state] || state || "";
}

/** One row per server, in the order the resident gave them. */
export function mcpRows(servers = []) {
  return (servers || []).filter(Boolean).map((s) => ({
    id: s.id,
    name: s.name || hostOf(s.url),
    host: hostOf(s.url),
    state: s.state,
    word: mcpState(s.state),
    tools: Number(s.tools) || 0,
    error: s.error || "",
    authUrl: s.authUrl || "",
    hasKey: Boolean(s.hasKey),
  }));
}
