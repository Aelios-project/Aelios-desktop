// Forwards the client half's requests to the resident's /web/ routes, with the web key added here.
// Only the paths in ALLOWED go through. /web/runner/* is not among them: the runner is handled by the
// supervisor and never from the page.
const ALLOWED = [
  "check", "messages", "say", "residents", "threads", "thread", "thread/say", "thread/stop",
  "waiting", "waiting/seen", "task/choose", "pin",
];
const RESIDENT = /^[a-z][a-z0-9-]{0,23}$/;
const MAX_BYTES = 4 * 1024 * 1024;

export class ProxyError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

/** Builds the full address, or throws. `path` is like "/web/messages?since=x". */
export function target(base, resident, path, method = "GET") {
  if (method !== "GET" && method !== "POST") throw new ProxyError("method not allowed", 405);
  if (typeof path !== "string" || path.length > 2048 || !path.startsWith("/web/") || /[\\#\x00-\x20]/.test(path)) throw new ProxyError("path not allowed");
  const [pathname, query = ""] = path.split("?");
  if (/%(?:2f|5c|2e)/i.test(pathname) || pathname.split("/").some((p) => p === "." || p === "..")) throw new ProxyError("path not allowed");
  if (!ALLOWED.includes(pathname.slice("/web/".length))) throw new ProxyError("path not allowed", 403);
  if (resident !== "default" && !RESIDENT.test(resident ?? "")) throw new ProxyError("resident not allowed");
  const url = new URL((resident === "default" ? "" : `/r/${resident}`) + pathname + (query ? `?${query}` : ""), base);
  if (url.origin !== new URL(base).origin) throw new ProxyError("path not allowed");
  return url;
}

export async function forward(connection, { resident = connection.resident, path, method = "GET", body }, request = fetch) {
  const url = target(connection.url, resident, path, method);
  const response = await request(url, {
    method,
    redirect: "error",
    signal: AbortSignal.timeout(30000),
    headers: { "x-web-key": connection.key, ...(method === "POST" ? { "content-type": "application/json" } : {}) },
    ...(method === "POST" ? { body: JSON.stringify(body ?? {}) } : {}),
  });
  const text = await response.text();
  if (text.length > MAX_BYTES) throw new ProxyError("answer too large", 502);
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { throw new ProxyError("the resident did not answer with JSON", 502); }
  return { status: response.status, data };
}
