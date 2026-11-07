// Calls the host half, and reads the conversation with the `since` version the resident gives.
const ROUTE = "/api/aelios-desktop";
const FULL_MS = 60000;

export async function call(action, input = {}, request = fetch) {
  const response = await request(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, ...input }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "The desktop connection failed");
  return data;
}

/** A call to one of the resident's /web/ routes, through the host half. Returns the resident's JSON. */
export async function web(path, { method = "GET", body, resident } = {}, request = fetch) {
  const { status, data } = await call("web", { path, method, body, resident }, request);
  if (status >= 400) throw Object.assign(new Error(data?.error || `The resident answered ${status}`), { status });
  return data;
}

/** The resident's bytes (a picture, a handed-over file, a sticker) as an object URL, fetched once per path. */
const blobs = new Map();
export async function blobUrl(path, { resident } = {}, request = fetch) {
  const key = `${resident || ""}${path}`;
  if (blobs.has(key)) return blobs.get(key);
  const { type, data } = await call("blob", { path, resident }, request);
  if (!data) throw new Error("the resident has no such bytes");
  const url = URL.createObjectURL(new Blob([Uint8Array.from(atob(data), (c) => c.charCodeAt(0))], { type }));
  blobs.set(key, url);
  return url;
}

/**
 * Reads /web/messages. read() gives the lines when they changed, and null when they did not (the resident
 * answers { same } for the version we hold). Every FULL_MS it reads all of them again.
 */
export function createMessages(get, now = Date.now) {
  let rev = "";
  let fullAt = 0;
  return async function read() {
    const since = rev && now() - fullAt < FULL_MS ? `?since=${encodeURIComponent(rev)}` : "";
    const data = await get(`/web/messages${since}`);
    if (data?.rev) rev = data.rev;
    if (data?.same) return null;
    fullAt = now();
    return data?.data || [];
  };
}
