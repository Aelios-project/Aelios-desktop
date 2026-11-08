// Made-up data for the preview: a resident, two more, a group, a conversation, the waiting list, threads (one that
// ran on this machine with DSH, one still running with Kiro and waiting on a permission), alarms, settings and usage.
// Nobody real; every name and number is invented.
const now = Date.now();
const min = 60_000;
const hm = (at) => new Date(at).toTimeString().slice(0, 5);
const ymd = (at) => { const d = new Date(at); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const svg = (body, w = 96, h = 96) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body}</svg>`)}`;
export const svgBase64 = (body, w = 260, h = 260) => btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body}</svg>`);

const face = (bg, skin) => svg(`<rect width="96" height="96" fill="${bg}"/><circle cx="48" cy="38" r="17" fill="${skin}"/><path d="M18 96c6-20 17-30 30-30s24 10 30 30z" fill="${skin}"/>`);
export const residents = [
  { id: "default", name: "Aster", avatar: face("#2b2156", "#F6DDAE"), saidAt: now - 2 * min },
  { id: "morrow", name: "Morrow", avatar: null, saidAt: now - 9 * min },
  { id: "hollow", name: "Hollow", avatar: face("#f4a07c", "#fff6dc"), saidAt: now - 3 * 3600_000 },
];
export const seenBefore = { default: now - 2 * min, morrow: now - 3600_000, hollow: now };
export const groups = [{ id: "g1", name: "The three of us", members: ["default", "morrow", "hollow"], reply: "all", order: "list", rounds: 2, icon: null, running: true, last: { at: now - min } }];

const tool = (name, input, output, state = "output-available") => ({ type: "tool", name, input: JSON.stringify(input), output, state });
export const messages = [
  { id: "m1", role: "assistant", at: now - 42 * min, text: "Morning. The mail sorted itself into three piles; the one about the lease needs a look before noon." },
  { id: "m2", role: "user", at: now - 40 * min, text: "Thanks — put the lease on top and leave the rest." },
  { id: "m3", role: "assistant", at: now - 39 * min, activity: [{ type: "reasoning", text: "The lease is the one with a date on it." }, tool("memory_recall", { query: "lease" }, "Signed last March."), tool("web_search", { query: "rent notice rules" }, "Two notices in a week is unusual.")],
    text: "Done. I also opened a thread for the weekly note; it is at `notes/weekly.md` and wants the numbers by four.", pictures: 2 },
  { id: "m4", role: "assistant", at: now - 30 * min, text: "The note is drafted; the numbers are from the July ledger.", files: [{ key: "f1", name: "weekly-note.md", size: 6100 }] },
  { id: "m5", role: "assistant", at: now - 29 * min, voice: { key: "v1", seconds: 7 }, text: "" },
  { id: "m6", role: "user", at: now - 6 * min, text: "What is it waiting on?" },
  { id: "m7", role: "assistant", at: now - 5 * min, text: "Two things:\n- the July count, from the ledger\n- your call on the title\n\nBoth are in Waiting, on the right." },
];

export const waiting = { open: 2, items: [
  { id: "w1", kind: "ask", title: "Weekly note: which title?", line: "The note is drafted. Pick a title and the thread carries on.", at: now - 4 * min, task: "k2", thread: "t2", options: ["Keep it plain", "Make it a number"] },
  { id: "w2", kind: "ask", title: "Mail: two bills look the same", line: "It holds both until you say which one is real.", at: now - 33 * min, task: "k6", thread: "t1", options: ["The second", "The first"] },
  { id: "w3", kind: "note", title: "Ledger parser: tests are running", line: "Half of the cases pass; it is fixing the date format.", at: now - 2 * min, thread: "t3" },
  { id: "w4", kind: "done", title: "Build numbers checked", line: "Three of four agree; the fourth is from an old build.", at: now - 20 * 3600_000, thread: "t4" },
] };

export const threads = { on: true, threads: [
  { id: "t3", title: "Refactor the ledger parser", status: "working", runs: "machine", tasks: 1, updatedAt: now - min, waiting: false },
  { id: "t2", title: "Draft the weekly note", status: "needs_you", runs: "machine", tasks: 2, updatedAt: now - 4 * min, waiting: true },
  { id: "t1", title: "Sort the morning mail", status: "working", runs: "local", tasks: 4, updatedAt: now - 9 * min, waiting: false },
  { id: "t4", title: "Check the build numbers", status: "done", runs: "linux", tasks: 3, updatedAt: now - 20 * 3600_000, waiting: false },
  { id: "t5", title: "Read the new spec", status: "failed", runs: "local", tasks: 1, updatedAt: now - 26 * 3600_000, waiting: false },
  { id: "t0", title: "Tidy the downloads folder", status: "done", runs: "machine", tasks: 3, updatedAt: now - 2 * 86400_000, waiting: false },
] };
export const tasks = { on: true, configured: true, mode: "linux", today: 4, limit: 10, open: 3, github: { on: true, repo: "example/hands", problem: "" }, roles: [{ name: "Researcher", model: "auto" }, { name: "Editor", model: "" }] };

export const thread = {
  t2: { id: "t2", title: "Draft the weekly note", status: "needs_you", runs: "machine", canSay: true, files: [{ path: "notes/weekly.md" }],
    tasks: [{ id: "k2", status: "needs_you", waiting: true, choices: ["Keep it plain", "Make it a number"] }],
    lines: [{ id: "task_k2", role: "user", task: "k2", text: "Write the weekly note from the July ledger." }, { id: "result_k2", role: "result", task: "k2", status: "needs_you", text: "The note is drafted. Which title do you want?" }] },
  t3: { id: "t3", title: "Refactor the ledger parser", status: "working", runs: "machine", canSay: true, tasks: [{ id: "k3", status: "working" }],
    lines: [{ id: "task_k3", role: "user", task: "k3", text: "Make the ledger parser read both date formats, and keep the tests green." }] },
  t1: { id: "t1", title: "Sort the morning mail", status: "working", runs: "local", canSay: false, tasks: [{ id: "k1", status: "working" }],
    lines: [{ id: "task_k1", role: "user", task: "k1", text: "Sort today's mail into piles." }, { id: "l1", role: "thread", steps: ["read 14 messages", "grouped by sender"], text: "Three piles so far." }] },
};
const T = (at, item) => ({ at, ...item });
export const sessions = {
  t3: { plugin: "kiro", cwd: "/home/me/AeliosWork/ledger", turns: [{ kind: "job", at: now - 12 * min, text: thread.t3.lines[0].text, end: null, items: [
    T(now - 12 * min, { type: "say", text: "I'll read the parser and its tests first, then change the date handling." }),
    T(now - 11 * min, { type: "plan", steps: [{ text: "Read parser.js and its tests", status: "completed" }, { text: "Accept DD/MM and YYYY-MM-DD", status: "completed" }, { text: "Run the tests", status: "in_progress" }, { text: "Push the branch", status: "pending" }] }),
    T(now - 11 * min, { type: "tool", id: "c1", kind: "read", title: "Read src/parser.js", status: "completed", input: '{"path":"src/parser.js"}', output: "export function parseDate(text) {\n  const [d, m, y] = text.split('/');\n  …", paths: ["/home/me/AeliosWork/ledger/src/parser.js"], diffs: [] }),
    T(now - 10 * min, { type: "thought", text: "Two formats share the same separators only sometimes; checking the first four characters is enough." }),
    T(now - 9 * min, { type: "tool", id: "c2", kind: "edit", title: "Edit src/parser.js", status: "completed", input: '{"path":"src/parser.js"}', output: "", paths: ["/home/me/AeliosWork/ledger/src/parser.js"], diffs: [{ path: "/home/me/AeliosWork/ledger/src/parser.js", added: 18, removed: 4 }, { path: "/home/me/AeliosWork/ledger/test/parser.test.js", added: 22, removed: 0 }] }),
    T(now - 4 * min, { type: "tool", id: "c3", kind: "execute", title: "npm test", status: "completed", input: '{"command":["npm","test"]}', output: "✓ reads DD/MM/YYYY\n✓ reads YYYY-MM-DD\n✓ keeps empty rows out\n\n3 passing (41ms)", paths: [], diffs: [] }),
    T(now - min, { type: "say", text: "Tests pass. The branch is ready to push." }),
    T(now - min, { type: "perm", id: "p_3a9f01c2d4", title: "git push origin ledger-dates", kind: "execute", paths: [], decided: null, by: "" }),
  ] }] },
  t2: { plugin: "dsh", cwd: "/home/me/AeliosWork/notes", turns: [{ kind: "job", at: now - 30 * min, text: thread.t2.lines[0].text, end: { status: "needs_you", summary: "The note is drafted. Which title do you want?", at: now - 4 * min }, items: [
    T(now - 29 * min, { type: "tool", id: "d1", kind: "search", title: "Search ledger for July", status: "completed", input: '{"query":"2026-07"}', output: "41 rows", paths: [], diffs: [] }),
    T(now - 27 * min, { type: "tool", id: "d2", kind: "execute", title: "node totals.js july", status: "completed", input: '{"command":"node totals.js july"}', output: "income 4,210\nspent 3,880", paths: [], diffs: [] }),
    T(now - 24 * min, { type: "tool", id: "d3", kind: "edit", title: "Write notes/weekly.md", status: "completed", input: "", output: "", paths: [], diffs: [{ path: "/home/me/AeliosWork/notes/weekly.md", added: 42, removed: 3 }] }),
    T(now - 5 * min, { type: "perm", id: "p_77c2e0aa91", title: "Read ~/Documents/budget.xlsx", kind: "read", paths: ["/Users/me/Documents/budget.xlsx"], decided: "denied", by: "tier" }),
  ] }] },
};
export const sessionList = [
  { thread: "t3", plugin: "kiro", at: now - min, status: "working", turns: 1, tools: 3, files: 2, commands: 1, pending: 1 },
  { thread: "t2", plugin: "dsh", at: now - 4 * min, status: "needs_you", turns: 1, tools: 3, files: 1, commands: 1, pending: 0 },
  { thread: "t0", plugin: "dsh", at: now - 2 * 86400_000, status: "done", turns: 3, tools: 12, files: 5, commands: 4, pending: 0 },
];
const log = ["aelios-runner: kiro, access edit, folder /home/me/AeliosWork", "started w_51c0 resumed", "tick ok", "started w_9e22 new", "permission held for the owner: git push origin ledger-dates"];
export const machine = {
  runner: { state: "running", error: "", since: now - 47 * min, pid: 48213, log: log.map((text, i) => ({ at: now - (5 - i) * min, text: `${new Date(now - (5 - i) * min).toISOString()} ${text}` })) },
  info: { plugin: "kiro", access: "edit", workspace: "/home/me/AeliosWork", paired: true, queued: 1, unsent: 0, threads: 3, running: { thread: "t3" } },
  cloud: { online: true, lastSeenAt: now - 4000 },
};

export const alarms = { on: true, alarms: [
  { id: "a1", note: "ask how the exam went", next: new Date(now + 20 * min).toISOString(), when: "一次", edit: "date", date: ymd(now + 20 * min), time: hm(now + 20 * min) },
  { id: "a2", note: "remind to sleep", next: new Date(now + 5 * 3600_000).toISOString(), when: "每天 23:00", edit: "time", date: ymd(now + 5 * 3600_000), time: "23:00" },
  { id: "a3", note: "check the rent notice", next: new Date(now + 24 * 3600_000).toISOString(), when: "一次", edit: "date", date: ymd(now + 24 * 3600_000), time: "09:00" },
  { id: "a4", note: "water the plants and open the window for an hour", next: new Date(now + 4 * 86400_000).toISOString(), when: "every week on sat at 10:00", edit: "time", date: ymd(now + 4 * 86400_000), time: "10:00" },
] };

const field = (key, kind = "text", value = "", choices = []) => ({ key, kind, value, choices, saved: kind === "secret" && Boolean(value) });
export const config = { fields: [
  field("RESIDENT_NAME", "text", "Aster"), field("THINKING_EFFORT", "choice", "medium", ["low", "medium", "high"]), field("PERSONA_EDIT", "choice", "on", ["on", "off"]),
  field("LETTER_IDLE_MINUTES", "text", "90"), field("AELIOS_URL", "text", "https://memory.example"),
  field("TIME_ZONE", "text", "Europe/Lisbon"), field("QUIET_HOURS", "text", "23:00-07:30"), field("ALARMS", "choice", "on", ["on", "off"]),
  field("TG_BOT_TOKEN", "secret", "x"), field("TG_ALLOWED", "text", "1 person"), field("WEB_PUSH", "choice", "replies", ["replies", "all", "off"]),
  field("WEB_SEARCH", "choice", "tavily", ["off", "tavily", "brave"]), field("TAVILY_API_KEY", "secret", "x"), field("VOICE_PROVIDER", "choice", "cartesia", ["off", "cartesia"]),
  field("STICKERS", "choice", "on", ["on", "off"]), field("CLOUD_TASKS", "choice", "on", ["on", "off"]), field("CLOUD_TASK_MODEL", "text", "auto"),
] };
const totals = (input, read, out, cost) => ({ calls: 12, input, cacheRead: read, cacheWrite: 0, output: out, cost, unpriced: 0 });
export const usage = { totals: { today: totals(28_000, 61_000, 4_100, 0.42), week: totals(3_400_000, 22_500_000, 410_000, 9.8), month: totals(5_900_000, 40_900_000, 820_000, 21.37) },
  rows: Array.from({ length: 8 }, (_, i) => ({ id: i, at: now - i * 17 * min, model: i % 3 ? "anthropic/claude-sonnet" : "openai/gpt-mini", input: 1200 + i * 90, cacheRead: 18_000 - i * 500, cacheWrite: 0, output: 300 + i * 40, cost: 0.011 + i * 0.002 })) };
export const persona = { text: "A quiet resident who keeps the days in order and says less than it knows." };
export const models = { models: [{ id: "auto", name: "Auto" }, { id: "anthropic/claude-sonnet", name: "Claude Sonnet" }, { id: "openai/gpt-mini", name: "GPT mini" }] };
export const mcp = { servers: [{ id: "1", name: "Playwright", url: "https://tools.example/mcp", state: "ready", tools: 12 }, { id: "2", name: "Notes", url: "https://notes.example/mcp", state: "authenticating", authUrl: "https://notes.example/auth" }] };
export const sites = { sites: [{ host: "example.com", names: ["Authorization"] }] };
const sticker = (c) => ({ key: `s${c}`, name: "", when: "when it is pleased" });
export const stickers = { on: true, packs: [{ id: "p1", name: "Little moons", enabled: true, stickers: [1, 2, 3, 4, 5, 6].map(sticker) }, { id: "p2", name: "Paper cats", enabled: false, stickers: [7, 8, 9].map(sticker) }] };
export const letter = { write: { state: "done" }, delivery: { pending: 1, failed: 0, blocked: 0 }, canRetry: false };
export const group = { group: { ...groups[0], members: [{ id: "default", name: "Aster" }, { id: "morrow", name: "Morrow" }, { id: "hollow", name: "Hollow" }] }, running: true, waiting: [],
  lines: [{ seq: 1, author: "you", text: "Dinner plans for Friday?", at: now - 9 * min }, { seq: 2, author: "default", text: "The noodle place, if it is open.", at: now - 8 * min }, { seq: 3, author: "morrow", text: "Seconded. I'll check the hours.", at: now - 7 * min }, { seq: 4, author: "", kind: "note", text: "Hollow is thinking…" }] };
