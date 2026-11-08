// The preview's stand-in for the host half: it answers POST /api/aelios-desktop the way the real route does, from
// fake-data.mjs, so the real client components draw themselves with no DSH, no runner and no resident. It also
// answers the local calls the host half does not have yet (machine, sessions, session, permit, open, present):
// see client/local-api.mjs for their shapes. Writes are accepted and forgotten.
import * as D from "./fake-data.mjs";

const ROUTE = "/api/aelios-desktop";
const ok = (data) => ({ status: 200, data });
const dot = (fill) => D.svgBase64(`<rect width="96" height="96" rx="20" fill="${fill}"/><circle cx="34" cy="40" r="7" fill="#231403"/><circle cx="62" cy="40" r="7" fill="#231403"/><path d="M30 62c10 10 26 10 36 0" stroke="#231403" stroke-width="5" fill="none" stroke-linecap="round"/>`, 96, 96);
const pictures = [
  D.svgBase64(`<rect width="260" height="260" fill="#f4a07c"/><circle cx="100" cy="96" r="46" fill="#f8f5ef"/><rect x="40" y="160" width="180" height="26" rx="13" fill="#f8f5ef"/>`),
  D.svgBase64(`<rect width="260" height="260" fill="#8b7cf6"/><rect x="36" y="70" width="188" height="18" rx="9" fill="#f8f5ef"/><rect x="36" y="108" width="140" height="18" rx="9" fill="#f8f5ef"/><rect x="36" y="146" width="164" height="18" rx="9" fill="#f8f5ef"/>`),
];

function web(path) {
  const [name, query = ""] = path.split("?");
  const q = new URLSearchParams(query);
  const answers = {
    "/web/residents": { residents: D.residents, max: 5 }, "/web/groups": { groups: D.groups }, "/web/group": D.group,
    "/web/messages": { rev: "1", data: D.messages }, "/web/waiting": D.waiting, "/web/tasks": D.tasks, "/web/threads": D.threads,
    "/web/alarms": D.alarms, "/web/config": D.config, "/web/models": D.models, "/web/model": { model: "anthropic/claude-sonnet" },
    "/web/persona": D.persona, "/web/letter": D.letter, "/web/mcp": D.mcp, "/web/sites": D.sites, "/web/stickers": D.stickers, "/web/usage": D.usage,
    "/web/search": { results: [{ id: "m4", role: "assistant", at: Date.now() - 30 * 60_000, before: "The note is drafted; the numbers are from the", match: "July", after: " ledger." }] },
  };
  if (name === "/web/thread") return D.thread[q.get("id")] || { error: "no such thread" };
  return answers[name] ?? { ok: true };
}

const actions = {
  status: () => ({ connected: true, defaultWorkspace: "/home/me/AeliosWork", url: "https://resident.example", resident: "default", helper: "kiro", runner: { state: "running", error: "" } }),
  select: (input) => ({ ...actions.status(), resident: input.resident }),
  web: (input) => ok(input.method === "POST" ? { ok: true } : web(input.path)),
  blob: (input) => (/picture/.test(input.path) ? { type: "image/svg+xml", data: pictures[Number(new URLSearchParams(input.path.split("?")[1]).get("n")) % 2] } : { type: "image/svg+xml", data: dot("#F6DDAE") }),
  upload: () => ok({ ok: true }),
  machine: () => D.machine,
  sessions: () => ({ sessions: D.sessionList }),
  session: (input) => ({ session: D.sessions[input.thread] || null }),
  permit: () => ({ ok: true }), open: () => ({ ok: true }), present: () => ({ ok: true }),
  start: () => actions.status(), stop: () => actions.status(), repair: () => actions.status(),
};

const real = window.fetch.bind(window);
window.fetch = async (url, init) => {
  if (String(url) !== ROUTE) return real(url, init);
  const input = JSON.parse(init.body);
  const act = actions[input.action];
  if (!act) return new Response(JSON.stringify({ error: "unknown action" }), { status: 400 });
  return new Response(JSON.stringify(act(input)), { headers: { "content-type": "application/json" } });
};
