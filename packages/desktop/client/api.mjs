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

/** A raw body to the resident: the picture that becomes its face. Returns what the resident answered. */
export async function upload(path, data, type, { resident } = {}, request = fetch) {
  const out = await call("upload", { path, data, type, resident }, request);
  if (out.status >= 400) throw new Error(out.data?.error || `the resident answered ${out.status}`);
  return out.data;
}

/** The resident's bytes (a picture, a handed-over file, a sticker) as an object URL, fetched once per path. */
const blobs = new Map();
const BLOBS_KEPT = 24; // a small LRU: object URLs are released once the page stops needing them
/** Base64 from the host half back to the bytes it came from; atob alone mangles anything but ASCII. */
function bytesOf(data) {
  const raw = atob(data);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}
export async function blobUrl(path, { resident } = {}, request = fetch) {
  const key = `${resident || ""}${path}`;
  const held = blobs.get(key);
  if (held) { blobs.delete(key); blobs.set(key, held); return held; }
  const { type, data } = await call("blob", { path, resident }, request);
  if (!data) throw new Error("the resident has no such bytes");
  const url = URL.createObjectURL(new Blob([bytesOf(data)], { type }));
  blobs.set(key, url);
  while (blobs.size > BLOBS_KEPT) {
    const [old, gone] = blobs.entries().next().value;
    blobs.delete(old);
    URL.revokeObjectURL(gone);
  }
  return url;
}

/**
 * Reads /web/messages. read() gives the lines when they changed, and null when they did not (the resident
 * answers { same } for the version we hold). Every FULL_MS it reads all of them again. `read.turn` is the reply
 * now running ({ requestId, stopping }) or null; the resident sends it with every answer, `same` too.
 */
export function createMessages(get, now = Date.now) {
  let rev = "";
  let fullAt = 0;
  async function read() {
    const since = rev && now() - fullAt < FULL_MS ? `?since=${encodeURIComponent(rev)}` : "";
    const data = await get(`/web/messages${since}`);
    if (data?.rev) rev = data.rev;
    read.turn = data?.turn ?? null;
    if (data?.same) return null;
    fullAt = now();
    return data?.data || [];
  }
  read.turn = null;
  return read;
}
