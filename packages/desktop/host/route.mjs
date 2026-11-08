// The one route the client half calls: POST /api/aelios-desktop { action, ... }. It never returns the key.
import { ConnectError, connect, defaultWorkspace, disconnect, ensurePaired } from "./connect.mjs";
import { makeLocal } from "./local.mjs";
import { ProxyError, forward, forwardBytes, forwardRaw } from "./proxy.mjs";

export const ROUTE = "/api/aelios-desktop";
const MAX_BODY = 8 * 1024 * 1024; // a message may carry four pictures, base64
const HEADERS = { "cache-control": "no-store", "x-content-type-options": "nosniff" };
const json = (value, status = 200) => Response.json(value, { status, headers: HEADERS });

export function makeRoute(deps) {
  const { store, supervisor } = deps;
  const local = makeLocal(deps);

  async function status() {
    const c = await store.get();
    return { connected: Boolean(c), defaultWorkspace: defaultWorkspace(), url: c?.url ?? null, resident: c?.resident ?? null, helper: c?.plugin ?? null, runner: supervisor.snapshot() };
  }

  const actions = {
    status,
    async connect(input) { await connect(input, deps); return status(); },
    async disconnect() { await disconnect(deps); return status(); },
    async repair() {
      const c = await store.get();
      if (!c) throw new ProxyError("not connected", 409);
      // Pairing again with what was saved: the runner keeps its own device, and a stale one is unpaired first.
      await connect({ url: c.url, key: c.key, helper: c.plugin, access: c.access, workspace: c.workspace, resident: c.resident, confirmFull: true }, deps);
      return status();
    },
    async start() { await ensurePaired(deps); return status(); },
    machine: () => local.machine(),
    sessions: () => local.sessions(),
    session: (input) => local.session(input),
    permit: (input) => local.permit(input),
    open: (input) => local.open(input),
    present: () => local.present(),
    async stop() { await supervisor.stop(); return status(); },
    async select({ resident }) {
      const c = await store.get();
      if (!c) throw new ProxyError("not connected", 409);
      await store.set({ ...c, resident: String(resident) });
      return status();
    },
    async upload({ path, type, data, resident }) {
      const c = await store.get();
      if (!c) throw new ProxyError("not connected", 409);
      return forwardRaw(c, { path, type, data, resident });
    },
    async blob({ path, resident }) {
      const c = await store.get();
      if (!c) throw new ProxyError("not connected", 409);
      return forwardBytes(c, { path, resident });
    },
    async web({ path, method, body, resident }) {
      const c = await store.get();
      if (!c) throw new ProxyError("not connected", 409);
      return forward(c, { path, method, body, resident });
    },
  };

  return async function fetchRoute(request) {
    try {
      if (!(request.headers.get("content-type") || "").startsWith("application/json")) return json({ error: "JSON needed" }, 415);
      const text = await request.text();
      if (text.length > MAX_BODY) return json({ error: "too large" }, 413);
      const input = JSON.parse(text);
      const act = Object.hasOwn(actions, input?.action) ? actions[input.action] : null;
      if (!act) return json({ error: "unknown action" }, 400);
      return json(await act(input));
    } catch (error) {
      if (error instanceof ConnectError) return json({ error: error.message, code: "CONNECT" }, 400);
      if (error instanceof ProxyError) return json({ error: error.message }, error.status);
      if (error instanceof SyntaxError) return json({ error: "bad JSON" }, 400);
      return json({ error: "The desktop connection could not handle the request" }, 500);
    }
  };
}
