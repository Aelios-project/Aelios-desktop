// Forwards the client half's requests to the resident's /web/ routes, with the web key added here.
// Only the paths in ALLOWED go through. /web/runner/* is not among them: the runner is handled by the
// supervisor and never from the page.
const ALLOWED = [
  "check", "messages", "say", "residents", "threads", "thread", "thread/say", "thread/stop",
  "waiting", "waiting/seen", "waiting/permission", "task/choose", "task/settle", "pin", "usage", "model", "models", "persona", "alarms", "search", "search/around", "stickers", "config", "avatar", "avatar/remove", "letter", "letter/retry", "tasks", "mcp", "mcp/remove", "mcp/retry",
  "groups", "group", "group/say",
];
// Bytes the page shows itself: her pictures in a reply, a file a reply handed over, a sticker.
const BYTES = ["picture", "file", "media", "group/picture"];
// Raw posts: a picture the reader puts up as the resident's face.
const RAW = ["avatar"];
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
  const name = pathname.slice("/web/".length);
  if (!ALLOWED.includes(name) && !BYTES.includes(name)) throw new ProxyError("path not allowed", 403);
  if (resident !== "default" && !RESIDENT.test(resident ?? "")) throw new ProxyError("resident not allowed");
  const url = new URL((resident === "default" ? "" : `/r/${resident}`) + pathname + (query ? `?${query}` : ""), base);
  if (url.origin !== new URL(base).origin) throw new ProxyError("path not allowed");
  return url;
}

/** A raw body (a picture) to one of the resident's write routes. */
export async function forwardRaw(connection, { resident = connection.resident, path = "", type = "application/octet-stream", data = "" }, request = fetch) {
  const name = path.split("?")[0].slice("/web/".length);
  if (!RAW.includes(name)) throw new ProxyError("path not allowed", 403);
  const url = target(connection.url, resident, path, "POST");
  const body = Buffer.from(String(data || ""), "base64");
  if (body.length > 4 * 1024 * 1024) throw new ProxyError("picture too large", 413);
  const response = await request(url, { method: "POST", redirect: "error", signal: AbortSignal.timeout(30000), headers: { "x-web-key": connection.key, "content-type": type }, body });
  const text = await response.text();
  let answer = null;
  try { answer = text ? JSON.parse(text) : null; } catch { throw new ProxyError("the resident did not answer with JSON", 502); }
  return { status: response.status, data: answer };
}

/** One of the resident's byte routes: its pictures, a handed-over file, a sticker. Read only. */
export async function forwardBytes(connection, { resident = connection.resident, path = "" }, request = fetch) {
  const name = path.split("?")[0].slice("/web/".length);
  if (!BYTES.includes(name)) throw new ProxyError("path not allowed", 403);
  const url = target(connection.url, resident, path, "GET");
  const response = await request(url, { redirect: "error", signal: AbortSignal.timeout(30000), headers: { "x-web-key": connection.key } });
  if (!response.ok) return { status: response.status, type: "", data: "" };
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length > MAX_BYTES) throw new ProxyError("answer too large", 502);
  return { status: response.status, type: response.headers.get("content-type") || "application/octet-stream", data: Buffer.from(bytes).toString("base64") };
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
