// Generated from client/ by `npm run build`. Do not edit by hand.
window.__ModuleLoader__.load({
  id: '@aelios/desktop',
  factory: (require) => {
const module = { exports: {} }
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// client/index.mjs
var index_exports = {};
__export(index_exports, {
  Main: () => Main,
  STYLES: () => STYLES,
  Side: () => Side,
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);
var import_react32 = require("react");

// client/api.mjs
var ROUTE = "/api/aelios-desktop";
var FULL_MS = 6e4;
async function call(action, input = {}, request = fetch) {
  const response = await request(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, ...input }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "The desktop connection failed");
  return data;
}
async function web(path, { method = "GET", body, resident } = {}, request = fetch) {
  const { status, data } = await call("web", { path, method, body, resident }, request);
  if (status >= 400) throw Object.assign(new Error(data?.error || `The resident answered ${status}`), { status });
  return data;
}
async function upload(path, data, type, { resident } = {}, request = fetch) {
  const out = await call("upload", { path, data, type, resident }, request);
  if (out.status >= 400) throw new Error(out.data?.error || `the resident answered ${out.status}`);
  return out.data;
}
var blobs = /* @__PURE__ */ new Map();
async function blobUrl(path, { resident } = {}, request = fetch) {
  const key = `${resident || ""}${path}`;
  if (blobs.has(key)) return blobs.get(key);
  const { type, data } = await call("blob", { path, resident }, request);
  if (!data) throw new Error("the resident has no such bytes");
  const url = URL.createObjectURL(new Blob([Uint8Array.from(atob(data), (c) => c.charCodeAt(0))], { type }));
  blobs.set(key, url);
  return url;
}
function createMessages(get, now = Date.now) {
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

// client/palette.mjs
function paletteOf({ scheme, prefersLight = false } = {}) {
  const told = String(scheme || "").trim().toLowerCase();
  if (told === "light" || told === "dark") return told === "light" ? "day" : "night";
  return prefersLight ? "day" : "night";
}
function readSurface(doc = globalThis.document) {
  if (!doc?.documentElement) return { scheme: "", prefersLight: false };
  const scheme = getComputedStyle(doc.documentElement).colorScheme || "";
  const prefersLight = typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: light)").matches;
  return { scheme, prefersLight };
}

// client/platform.mjs
function shellTopInset(nav = globalThis.navigator, proc = globalThis.process) {
  const ua = nav?.userAgent || "";
  const electron = /Electron/i.test(ua) || Boolean(proc?.versions?.electron);
  if (!electron) return 0;
  const macOS = /Macintosh|Mac OS X/i.test(ua) || proc?.platform === "darwin";
  return macOS ? 30 : 0;
}

// client/chat.mjs
var import_react11 = require("react");

// client/chat-head.mjs
var import_react4 = require("react");

// client/icons.mjs
var import_react = require("react");
var ring = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
var PATHS = {
  send: "M12 19V5M5.5 11.5 12 5l6.5 6.5",
  back: "M15 18l-6-6 6-6",
  next: "M9 6l6 6-6 6",
  down: "M6 9l6 6 6-6",
  close: "M6 6l12 12M18 6 6 18",
  stop: "M7 7h10v10H7z",
  play: "M8 5.5v13l10.5-6.5z",
  open: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  panel: "M4 5h16v14H4zM15 5v14",
  plus: "M12 5v14M5 12h14",
  check: "M5 12.5l4.5 4.5L19 7.5",
  checks: "M2.5 12.5l4.5 4.5L16.5 7.5M12 16l1 1 9.5-9.5",
  sticker: "M12 3.5a8.5 8.5 0 1 0 0 17c.8 0 1.6-.1 2.3-.4l5.2 1.4-1.4-5.2c.3-.7.4-1.5.4-2.3a8.5 8.5 0 0 0-8.5-8.5zM9 9.5h.01M15 9.5h.01M8.5 14.5c1.6 1.8 5 1.8 7 0",
  mic: "M12 4a3 3 0 0 1 3 3v4a3 3 0 0 1-6 0V7a3 3 0 0 1 3-3zM5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21",
  wrench: "M4.5 19.5l7.6-7.6M12.1 11.9a4.5 4.5 0 0 1 5.6-6.6l-2.7 2.7.4 2.1 2.1.4 2.7-2.7a4.5 4.5 0 0 1-6.6 5.6",
  spark: "M12 3.5l2 5.5 5.5 2-5.5 2-2 5.5-2-5.5-5.5-2 5.5-2z",
  search: `${ring(11, 11, 6.5)}M20 20l-4.2-4.2`,
  gear: "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  laptop: "M5 6h14v9H5zM3 18.5h18",
  cloud: "M7 18h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.1 9.5 4.25 4.25 0 0 0 7 18z",
  home: "M4 11 12 4l8 7M6 10v10h12V10",
  repeat: "M17 3l3 3-3 3M4 11V10a4 4 0 0 1 4-4h12M7 21l-3-3 3-3M20 13v1a4 4 0 0 1-4 4H4",
  alarm: `${ring(12, 13, 7.5)}M12 9.5V13l2.5 1.8M4.5 4 2 6.5M19.5 4 22 6.5`,
  inbox: "M4 13l2.5-7h11L20 13v6H4zM4 13h4.5l1 2h5l1-2H20",
  threads: `M4 7h9M4 12h16M4 17h12${ring(18, 7, 2)}`,
  info: `${ring(12, 12, 9)}M12 11v5M12 7.8v.4`,
  people: `${ring(9, 8, 3.5)}M2.5 20c.8-3.5 3.3-5.5 6.5-5.5s5.7 2 6.5 5.5M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c1.8.7 3 2.5 3.5 5.2`,
  user: `${ring(12, 8, 4)}M4.5 20.5c1.3-3.6 4.2-5.5 7.5-5.5s6.2 1.9 7.5 5.5`,
  sliders: "M4 7h10M18 7h2M4 17h4M12 17h8M16 4.5v5M10 14.5v5",
  plug: "M9 3v5M15 3v5M6.5 8h11v3a5.5 5.5 0 0 1-11 0zM12 16.5V21",
  chart: "M4 20h16M7 16v-5M12 16V6M17 16v-8",
  exit: "M10 4H5v16h5M14 8l4 4-4 4M18 12H9",
  globe: `${ring(12, 12, 9)}M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z`,
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  mail: "M4 6h16v12H4zM4 7l8 6 8-6",
  refresh: "M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6",
  file: "M14 3H6v18h12V7zM14 3v4h4",
  stack: "M12 4l8 4-8 4-8-4zM4 12l8 4 8-4M4 16l8 4 8-4",
  eye: `M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z${ring(12, 12, 3)}`,
  pencil: "M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4",
  terminal: "M4 5h16v14H4zM7.5 9.5l3 2.5-3 2.5M12.5 15h4",
  shield: "M12 3.5l7 2.8v5.2c0 4.3-3 7.6-7 9-4-1.4-7-4.7-7-9V6.3zM9 12l2.2 2.2L15.5 10",
  move: "M5 12h14M15 8l4 4-4 4M9 5H5v14h4",
  folder: "M3.5 7.5a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z",
  widen: "M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4",
  narrow: "M3 12h6M21 12h-6M6 9l3 3-3 3M18 9l-3 3 3 3",
  pin: "M9 4h6l-1 5 3 3v1.5H7V12l3-3zM12 13.5V20",
  speaker: "M4 9.5h3.5L12 6v12l-4.5-3.5H4zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11",
  undo: "M9 7 4.5 11.5 9 16M5 11.5h9a5 5 0 0 1 0 10h-2",
  slash: "M15 4 9 20",
  copy: "M8 8h11v12H8zM5 16V4h11",
  // Helpers: the harness (DSH) as a terminal window with a prompt, Kiro as a small ghost, any other ACP command a plug.
  dsh: "M3.5 6a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2zM3.5 8.5h17M7.5 12.5l2.5 2-2.5 2M12 16.5h4",
  kiro: `M12 3a6.8 6.8 0 0 0-6.8 6.8V21l2.3-1.8 2.2 1.8 2.3-1.8 2.3 1.8 2.2-1.8 2.3 1.8V9.8A6.8 6.8 0 0 0 12 3z${ring(9.4, 10.4, 1.5)}${ring(14.6, 10.4, 1.5)}`
};
var ICONS = Object.keys(PATHS);
var FILLED = /* @__PURE__ */ new Set(["kiro"]);
var Icon = ({ name }) => (0, import_react.createElement)(
  "svg",
  { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true },
  FILLED.has(name) ? (0, import_react.createElement)("path", { d: PATHS[name], fill: "currentColor", stroke: "none", fillRule: "evenodd" }) : (0, import_react.createElement)("path", { d: PATHS[name] || PATHS.info })
);

// client/search-box.mjs
var import_react3 = require("react");

// client/search.mjs
function askedFor(raw) {
  const query = String(raw || "").trim().replace(/\s+/g, " ");
  if (!query) return { error: "empty" };
  if ([...query].length > 80) return { error: "long" };
  return { query };
}
var searchPath = (query) => `/web/search?q=${encodeURIComponent(query)}`;
function snippetOf(hit) {
  const tidy = (text) => String(text || "").replace(/\s+/g, " ").trim();
  return { before: tidy(hit?.before), match: tidy(hit?.match), after: tidy(hit?.after) };
}
function hitRows(results = [], limit = 8) {
  const seen = /* @__PURE__ */ new Set();
  return results.filter((hit) => hit && hit.id && !seen.has(hit.id) && seen.add(hit.id)).slice(0, limit);
}

// client/store.mjs
var import_react2 = require("react");
function createStore(initial) {
  let state = initial;
  const listeners = /* @__PURE__ */ new Set();
  return {
    get: () => state,
    set(patch) {
      state = { ...state, ...patch };
      listeners.forEach((f) => f());
    },
    subscribe(f) {
      listeners.add(f);
      return () => listeners.delete(f);
    }
  };
}
var useStore = (store2) => (0, import_react2.useSyncExternalStore)(store2.subscribe, store2.get);
var store = createStore({
  status: null,
  residents: [],
  error: "",
  alarms: { on: true, alarms: [] },
  search: { q: "", results: [], busy: false, done: false },
  around: null,
  // { lines, id } while the chat shows one search result
  groups: [],
  // the group chats, listed under the residents
  group: "",
  // the group open in the middle column, instead of the resident chat
  rail: true,
  // ours covers DSH's whole left column; false hands it back to DSH
  shown: false,
  // whether our own panel is the one DSH is drawing
  waiting: { items: [], open: 0 },
  threads: { open: 0 },
  // how many threads are at work or wait for the person: the Threads tab's number
  right: { open: true, panel: "waiting", overlay: false, width: 0 },
  // width 0: the default; dragged or widened, a number
  view: "chat",
  // what the middle column shows: "chat" (the resident or a group) or "machine" (this machine)
  // What only this machine knows (client/local-api.mjs). wired is false until the host answers these calls.
  local: { wired: null, machine: null, sessions: [] },
  sheet: "",
  // the settings section open in the sheet; "" when the sheet is closed
  groupSheet: null,
  // { id } to edit a group, { id: "" } for a new one, null when closed
  lang: "",
  // bumped when the reader picks a language, so everything draws again
  focus: ""
  // the thread the right panel should open
});

// client/strings.mjs
var WORDS = {
  en: {
    title: "Resident",
    brand: "Aelios",
    connectTitle: "Connect a resident",
    connect: "Connect",
    address: "Resident address",
    key: "Web key",
    folder: "Folder for the helper",
    helper: "Helper",
    access: "Permission",
    fullOk: "I understand full permission lets the helper change anything on this machine",
    connecting: "Connecting…",
    residents: "Residents",
    groups: "Groups",
    here: "Here",
    thisMachine: "This machine",
    unread: "New messages",
    answering: "Answering",
    settings: "Settings",
    close: "Close",
    backToDsh: "Back to DSH",
    dsh: "DSH",
    info: "About this",
    details: "Details",
    more: "More",
    panels: { waiting: "Waiting", threads: "Threads", alarms: "Alarms" },
    collapse: "Hide the work panel",
    expand: "Show the work panel",
    widen: "Widen the panel",
    narrow: "Narrow the panel",
    search: "Search the conversation",
    searchHint: "Search messages",
    noHits: "No matches",
    around: "Search result",
    backToChat: "Back to now",
    mine: "You",
    given: "Resident",
    empty: "Say hello.",
    write: "Write a message · / for commands",
    writeGroup: "Write to the group",
    send: "Send",
    attach: "Add pictures",
    remove: "Remove",
    stickers: "Stickers",
    noStickers: "No sticker packs are on",
    voice: "Record a voice note",
    recording: "Recording — tap to send",
    play: "Play",
    stopPlay: "Stop",
    missed: "Not heard",
    upTo: "Up to four pictures",
    tooBig: "That picture could not be read",
    openPicture: "Open the picture",
    ran: "done",
    thinking: "Thinking",
    members: "members",
    inLine: "in line",
    group: "Group",
    speakIt: "Read aloud",
    pinIt: "Keep in memory",
    pinned: "Kept",
    takeBack: "Take back",
    redo: "Answer again",
    copy: "Copy",
    copied: "Copied",
    commands: "Commands",
    cmd: { status: "Status report", letter: "Write the letter now", handoff: "Hand off to a new window" },
    kind: { ask: "Ask", note: "Update", done: "Done", stuck: "Stuck" },
    expired: "Expired",
    nothingWaiting: "All clear",
    open: "Open thread",
    markRead: "Dismiss",
    markAll: "Dismiss all updates",
    settle: "Dismiss without answering",
    task: { sent: "Sent", working: "Working", done: "Done", failed: "Failed", needs_you: "Ask", quiet: "Silent", stopped: "Stopped", chosen: "Chosen", settled: "Settled", cancelled: "Stopped" },
    runs: { local: "At the resident", linux: "GitHub Actions", machine: "On a machine", retired: "Retired route" },
    helpers: { dsh: "DSH", kiro: "Kiro", command: "ACP command", resident: "The resident", actions: "GitHub Actions", machine: "This machine" },
    done: "Done",
    noThreads: "No threads yet",
    threadsInfo: "Ask the resident to look something up or write something; the work it hands out shows here.",
    threadsOff: "Background help is off",
    today: "today",
    tasksN: "tasks",
    quotaInfo: "Threads started in the last 24 hours, out of the daily limit.",
    back: "Back",
    stop: "Stop it",
    sayTo: "Message this thread directly",
    sendTo: "Send to the thread",
    files: "Files",
    session: "Session",
    who: { mine: "You", given: "Resident", result: "Result", thread: "Thread" },
    thought: "Thought",
    plan: "Plan",
    input: "Input",
    output: "Result",
    toolKind: { read: "Read", edit: "Edit", delete: "Delete", move: "Move", search: "Search", execute: "Run", think: "Think", fetch: "Fetch", other: "Tool" },
    toolsN: "tool calls",
    filesN: "files changed",
    commandsN: "commands",
    allow: "Allow",
    deny: "Deny",
    decided: { allowed_you: "Allowed by you", denied_you: "Denied by you", allowed_tier: "Allowed", denied_tier: "Refused by the tier" },
    noAlarms: "No alarms",
    alarmsOff: "Alarms are off",
    once: "One-time",
    repeats: "Repeats",
    moveAlarm: "Change the time",
    dropAlarm: "Delete the alarm",
    save: "Save",
    saved: "Saved",
    cancel: "Cancel",
    create: "Create",
    dayToday: "Today",
    dayTomorrow: "Tomorrow",
    sureDelete: "Press again to delete",
    alarmsInfo: "The resident sets these for itself and decides what to say when one rings.",
    workspace: "Workspace",
    openFolder: "Open the folder",
    localSessions: "Sessions on this machine",
    noSessions: "Nothing has run here yet",
    log: "Runner log",
    since: "since",
    queued: "Queued",
    unsent: "Unsent",
    runningNow: "Running now",
    idle: "Idle",
    seen: "Resident sees it",
    unseen: "Resident does not see it",
    lastSeen: "last seen",
    tier: { read: "Read", edit: "Edit", full: "Full" },
    stopRunner: "Stop",
    notWired: "This machine's details are not connected yet.",
    machineInfo: "The runner does the resident's work on this machine, through the helper, inside the workspace folder. Permission is the most it may do without asking you.",
    addResident: "New resident",
    residentId: "Id: a–z, 0–9 and -",
    newGroup: "New group",
    groupSettings: "Group settings",
    rounds: "Rounds",
    whoAnswers: "Who answers",
    reply: { all: "Everyone answers", one: "One answers", none: "Only when named" },
    order: { list: "In list order", random: "In random order" },
    stopGroup: "Stop answering",
    removeGroup: "Delete the group",
    removeResident: "Delete this resident",
    sections: { resident: "Resident", model: "Model access", memory: "Memory", time: "Time", channels: "Channels", web: "Web & tools", voice: "Voice & stickers", work: "Background help", usage: "Usage", app: "App" },
    name: "Name",
    model: "Resident model",
    persona: "Persona",
    setFace: "Change the picture",
    dropFace: "Remove the picture",
    letter: "Letter",
    letterInfo: "Older conversation is packed into a letter the resident keeps, so it remembers past the window.",
    letterState: { written: "Written", none: "None yet" },
    onItsWay: "on its way",
    failedToSend: "failed",
    blocked: "blocked",
    retryLetter: "Send again",
    filter: "Filter settings",
    noMatch: "Nothing matches",
    secretSaved: "Saved on the resident",
    fieldsInfo: "Settings the resident keeps behind its web door. Empty means the default.",
    mcp: "MCP servers",
    noMcp: "None connected",
    addMcp: "Connect a server",
    mcpName: "Name",
    mcpKey: "Key, if it needs one",
    tools: "tools",
    signIn: "Sign in",
    retryIt: "Retry",
    drop: "Remove",
    mcpInfo: "Tool servers the resident can call. A server that needs a sign-in waits for you.",
    mcpState: { ready: "On", authenticating: "Sign in", off: "Off" },
    sites: "Site keys",
    addSite: "Add a site key",
    siteHost: "Site, e.g. example.com",
    siteKey: "Key",
    sitesInfo: "Keys the resident sends when it reads these sites.",
    telegram: "Telegram",
    telegramConnect: "Connect the bot",
    packs: "Sticker packs",
    importPack: "Import a pack by link",
    packLink: "t.me/addstickers/… or a .zip address",
    stickerWhen: "When to send it",
    githubSetup: "Set up GitHub Actions",
    testTask: "Send a test thread",
    roles: "Roles",
    addRole: "Add a role",
    roleName: "Role",
    roleTemplate: "Instructions",
    roleModel: "Model",
    span: { today: "Today", week: "7 days", month: "30 days" },
    tokens: "tokens",
    cache: "from cache",
    cost: "cost",
    unpriced: "unpriced",
    noUsage: "No usage yet",
    recent: "Recent calls",
    usageInfo: "Tokens the resident read and wrote. Cache is the share of the prompt it did not pay for in full.",
    runnerTitle: "Runner",
    start: "Start",
    pair: "Pair again",
    disconnect: "Disconnect",
    language: "Language",
    runner: { unpaired: "Unpaired", stopped: "Stopped", starting: "Starting", running: "Running", crashed: "Error", locked: "Elsewhere", revoked: "Revoked" }
  },
  zh: {
    title: "住户",
    brand: "Aelios",
    connectTitle: "连接住户",
    connect: "连接",
    address: "住户地址",
    key: "网页钥匙",
    folder: "帮手工作的文件夹",
    helper: "帮手",
    access: "权限",
    fullOk: "我知道完整权限会让帮手改动这台机器上的任何东西",
    connecting: "正在连接…",
    residents: "住户",
    groups: "群聊",
    here: "这里",
    thisMachine: "这台机器",
    unread: "有新消息",
    answering: "在回",
    settings: "设置",
    close: "关闭",
    backToDsh: "回到 DSH",
    dsh: "DSH",
    info: "说明",
    details: "详情",
    more: "更多",
    panels: { waiting: "等你", threads: "线程", alarms: "闹钟" },
    collapse: "收起右栏",
    expand: "打开右栏",
    widen: "加宽右栏",
    narrow: "收窄右栏",
    search: "搜聊天记录",
    searchHint: "搜消息",
    noHits: "没找到",
    around: "搜索结果",
    backToChat: "回到现在",
    mine: "你",
    given: "住户",
    empty: "打个招呼吧。",
    write: "说点什么 · / 调命令",
    writeGroup: "对群里说点什么",
    send: "发送",
    attach: "发图",
    remove: "拿掉",
    stickers: "表情包",
    noStickers: "没开表情包",
    voice: "录一段语音",
    recording: "在录…再点一下发出",
    play: "听",
    stopPlay: "停下",
    missed: "没听清",
    upTo: "一次最多四张",
    tooBig: "这张图读不了",
    openPicture: "看大图",
    ran: "完成",
    thinking: "思考",
    members: "位成员",
    inLine: "个在排队",
    group: "群聊",
    speakIt: "念出来",
    pinIt: "记进记忆",
    pinned: "记下了",
    takeBack: "撤回",
    redo: "重新回答",
    copy: "复制",
    copied: "复制了",
    commands: "命令",
    cmd: { status: "状态", letter: "现在写交接信", handoff: "交接到新窗口" },
    kind: { ask: "等你", note: "进展", done: "做完", stuck: "卡住" },
    expired: "过期",
    nothingWaiting: "都处理完了",
    open: "打开线程",
    markRead: "已读",
    markAll: "进展全部已读",
    settle: "不回答，直接收起",
    task: { sent: "派出", working: "在干", done: "做完", failed: "失败", needs_you: "等你", quiet: "没回音", stopped: "停下", chosen: "拍板", settled: "处理过", cancelled: "停下" },
    runs: { local: "在住户这里", linux: "GitHub Actions", machine: "在机器上", retired: "旧线路" },
    helpers: { dsh: "DSH", kiro: "Kiro", command: "ACP 命令", resident: "住户自己", actions: "GitHub Actions", machine: "这台机器" },
    done: "做完的",
    noThreads: "还没有线程",
    threadsInfo: "在聊天里让它去查点什么、写点什么，它交出去的活会出现在这里。",
    threadsOff: "后台帮忙关着",
    today: "今天",
    tasksN: "单",
    quotaInfo: "过去 24 小时派出去的线程，和每天的上限。",
    back: "返回",
    stop: "叫它停下",
    sayTo: "直接跟这条线程说",
    sendTo: "发给线程",
    files: "文件",
    session: "会话",
    who: { mine: "你", given: "住户", result: "交回", thread: "线程" },
    thought: "想法",
    plan: "计划",
    input: "输入",
    output: "结果",
    toolKind: { read: "读", edit: "改", delete: "删", move: "移动", search: "搜", execute: "运行", think: "想", fetch: "取网页", other: "工具" },
    toolsN: "次工具调用",
    filesN: "个文件改动",
    commandsN: "条命令",
    allow: "允许",
    deny: "拒绝",
    decided: { allowed_you: "你允许了", denied_you: "你拒绝了", allowed_tier: "已允许", denied_tier: "权限挡下了" },
    noAlarms: "没定闹钟",
    alarmsOff: "闹钟关着",
    once: "一次",
    repeats: "重复",
    moveAlarm: "改时间",
    dropAlarm: "删掉闹钟",
    save: "保存",
    saved: "存好了",
    cancel: "取消",
    create: "建好",
    dayToday: "今天",
    dayTomorrow: "明天",
    sureDelete: "再按一次就删",
    alarmsInfo: "住户自己定的闹钟，响的时候由它决定说什么。",
    workspace: "工作文件夹",
    openFolder: "打开文件夹",
    localSessions: "这台机器上的会话",
    noSessions: "这里还没跑过活",
    log: "执行端日志",
    since: "自",
    queued: "排队",
    unsent: "未送出",
    runningNow: "正在做",
    idle: "空闲",
    seen: "住户看得到",
    unseen: "住户看不到",
    lastSeen: "上次见到",
    tier: { read: "只读", edit: "可改", full: "完整" },
    stopRunner: "停下",
    notWired: "这台机器的详情还没接上。",
    machineInfo: "执行端在这台机器上替住户干活：通过帮手，在工作文件夹里。权限是它不问你就能做到的上限。",
    addResident: "新住户",
    residentId: "代号：a–z、0–9 和 -",
    newGroup: "新群聊",
    groupSettings: "群设置",
    rounds: "轮数",
    whoAnswers: "谁来回",
    reply: { all: "大家都回", one: "一个人回", none: "点名才回" },
    order: { list: "按列表顺序", random: "随机顺序" },
    stopGroup: "叫大家停下",
    removeGroup: "删掉这个群",
    removeResident: "删掉这个住户",
    sections: { resident: "住户", model: "模型接入", memory: "记忆", time: "时间", channels: "聊天渠道", web: "网页与工具", voice: "语音与表情", work: "后台帮忙", usage: "用量", app: "应用" },
    name: "名字",
    model: "住户模型",
    persona: "人设",
    setFace: "换头像",
    dropFace: "撤下头像",
    letter: "交接信",
    letterInfo: "更早的聊天会收进一封交接信，住户靠它记得窗口以外的事。",
    letterState: { written: "已写好", none: "还没有" },
    onItsWay: "在路上",
    failedToSend: "没发出",
    blocked: "卡住",
    retryLetter: "再发一次",
    filter: "筛选设置",
    noMatch: "没有匹配的",
    secretSaved: "存在住户那里",
    fieldsInfo: "住户网页门后的设置。留空就是默认值。",
    mcp: "MCP 工具",
    noMcp: "没接",
    addMcp: "接一个",
    mcpName: "名字",
    mcpKey: "钥匙（要的话）",
    tools: "个工具",
    signIn: "去登录",
    retryIt: "重试",
    drop: "删掉",
    mcpInfo: "住户能调用的工具服务器。要登录的会等你。",
    mcpState: { ready: "已接", authenticating: "待登录", off: "没接上" },
    sites: "网站钥匙",
    addSite: "加一把网站钥匙",
    siteHost: "网站，比如 example.com",
    siteKey: "钥匙",
    sitesInfo: "住户读这些网站时带上的钥匙。",
    telegram: "Telegram",
    telegramConnect: "连上机器人",
    packs: "表情包",
    importPack: "用链接导入",
    packLink: "t.me/addstickers/… 或 .zip 地址",
    stickerWhen: "什么时候发",
    githubSetup: "设置 GitHub Actions",
    testTask: "派一单试试",
    roles: "角色",
    addRole: "加一个角色",
    roleName: "角色",
    roleTemplate: "说明",
    roleModel: "模型",
    span: { today: "今天", week: "7 天", month: "30 天" },
    tokens: "token",
    cache: "来自缓存",
    cost: "花费",
    unpriced: "未计价",
    noUsage: "还没有用量",
    recent: "最近的调用",
    usageInfo: "住户读写的 token。缓存是提示里不用全价付的那部分。",
    runnerTitle: "本机帮手",
    start: "启动",
    pair: "重新配对",
    disconnect: "断开",
    language: "语言",
    runner: { unpaired: "未配对", stopped: "已停止", starting: "启动中", running: "运行中", crashed: "出错", locked: "在别处", revoked: "已撤销" }
  }
};
var LANGS = [{ id: "en", name: "English" }, { id: "zh", name: "中文" }];
var KEY = "aelios-desktop.lang";
var chosen = null;
function langNow() {
  if (chosen === null) {
    try {
      chosen = globalThis.localStorage?.getItem(KEY) || "";
    } catch {
      chosen = "";
    }
  }
  return WORDS[chosen] ? chosen : "en";
}
function setLang(id) {
  chosen = WORDS[id] ? id : "en";
  try {
    globalThis.localStorage?.setItem(KEY, chosen);
  } catch {
  }
}
var words = (lang = langNow()) => WORDS[lang] || WORDS.en;

// client/time.mjs
function shortWhen(at, now = /* @__PURE__ */ new Date(), words2 = { yesterday: "Yesterday" }) {
  if (!at) return "";
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return "";
  const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((day(now) - day(d)) / 864e5);
  if (days <= 0) return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (days === 1) return words2.yesterday;
  if (days < 7) return d.toLocaleDateString("en", { weekday: "short" });
  return d.toLocaleDateString("en", { month: "short", day: "numeric" });
}

// client/threads-api.mjs
function stateOf(task) {
  if (!task) return "";
  if (task.status !== "needs_you" || task.waiting !== false) return task.status;
  return task.chosen ? "chosen" : "settled";
}
var isWorking = (thread) => thread?.status === "sent" || thread?.status === "working";
function splitThreads(list = []) {
  const open = (t) => isWorking(t) || t.waiting;
  return { open: list.filter(open), done: list.filter((t) => !open(t)) };
}
function cardsByLine(lines = []) {
  const newest = {};
  for (const line of lines) for (const task of line.tasks || []) newest[task.thread || task.id] = line.id;
  const out = {};
  for (const line of lines) {
    const own = (line.tasks || []).filter((task) => newest[task.thread || task.id] === line.id);
    if (own.length) out[line.id] = own;
  }
  return out;
}
var post = (path, resident, body, request) => web(path, { method: "POST", body, resident }, request);
var loadThreads = (resident, request) => web("/web/threads", { resident }, request);
var loadThread = (resident, id, request) => web(`/web/thread?id=${encodeURIComponent(id)}`, { resident }, request);
var sayToThread = (resident, id, text, request) => post("/web/thread/say", resident, { id, text }, request);
var stopThread = (resident, id, request) => post("/web/thread/stop", resident, { id }, request);
var loadWaiting = (resident, request) => web("/web/waiting", { resident }, request);
var markSeen = (resident, item, request) => post("/web/waiting/seen", resident, item ? { id: item.id } : { all: true }, request);
var choose = (resident, task, text, request) => post("/web/task/choose", resident, { id: task, text }, request);
var when = (at) => shortWhen(at);
var safeLink = (url) => /^https?:\/\/[^\s<>"'`]+$/i.test(url || "");

// client/search-box.mjs
var IDLE = { q: "", results: [], busy: false, done: false };
function SearchBox({ resident, onClose }) {
  const t = words();
  const { search } = useStore(store);
  const [q, setQ] = (0, import_react3.useState)(search.q);
  const input = (0, import_react3.useRef)(null);
  (0, import_react3.useEffect)(() => {
    input.current?.focus();
    input.current?.select();
  }, []);
  const find = async (event) => {
    event.preventDefault();
    const asked = askedFor(q);
    if (asked.error) {
      store.set({ search: IDLE });
      return;
    }
    store.set({ search: { q: asked.query, results: [], busy: true, done: false } });
    try {
      const found = await web(searchPath(asked.query), { resident });
      store.set({ search: { q: asked.query, results: hitRows(found?.results || []), busy: false, done: true } });
    } catch (e) {
      store.set({ error: e.message, search: { q: asked.query, results: [], busy: false, done: true } });
    }
  };
  const openHit = async (hit) => {
    try {
      const around = await web(`/web/search/around?id=${encodeURIComponent(hit.id)}`, { resident });
      store.set({ around: { lines: around?.lines || [], id: hit.id } });
      onClose();
    } catch (e) {
      store.set({ error: e.message });
    }
  };
  const onKey = (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
    }
  };
  return (0, import_react3.createElement)(
    "div",
    { className: "ad-search", role: "dialog", "aria-label": t.search, onKeyDown: onKey },
    (0, import_react3.createElement)(
      "form",
      { role: "search", onSubmit: find },
      (0, import_react3.createElement)(Icon, { name: "search" }),
      (0, import_react3.createElement)("input", { ref: input, type: "search", value: q, placeholder: t.searchHint, "aria-label": t.search, onChange: (e) => setQ(e.target.value) }),
      (0, import_react3.createElement)("button", { type: "button", className: "ad-icon-btn sm", title: t.close, "aria-label": t.close, onClick: () => {
        store.set({ search: IDLE });
        onClose();
      } }, (0, import_react3.createElement)(Icon, { name: "close" }))
    ),
    search.q && (0, import_react3.createElement)(
      "div",
      { className: "ad-hits" },
      search.busy && (0, import_react3.createElement)("p", { className: "ad-hint" }, "…"),
      !search.busy && search.done && !search.results.length && (0, import_react3.createElement)("p", { className: "ad-hint" }, t.noHits),
      search.results.map((hit) => {
        const bit = snippetOf(hit);
        return (0, import_react3.createElement)(
          "button",
          { key: hit.id, type: "button", className: "ad-hit", onClick: () => openHit(hit) },
          (0, import_react3.createElement)("span", { className: "t" }, bit.before, /\s$/.test(hit.before || "") ? " " : "", (0, import_react3.createElement)("b", null, bit.match), /^\s/.test(hit.after || "") ? " " : "", bit.after),
          (0, import_react3.createElement)("span", { className: "s" }, [hit.role === "user" ? t.mine : t.given, when(hit.at)].filter(Boolean).join(" · "))
        );
      })
    )
  );
}

// client/chat-head.mjs
function ChatHead({ face, name, meta = null, resident = "", searchable = false, actions = null }) {
  const t = words();
  const { right, around } = useStore(store);
  const [finding, setFinding] = (0, import_react4.useState)(false);
  const top = (0, import_react4.useRef)(null);
  (0, import_react4.useEffect)(() => {
    const column = top.current?.parentElement;
    if (!column || !searchable) return void 0;
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setFinding(true);
      }
    };
    column.addEventListener("keydown", onKey);
    return () => column.removeEventListener("keydown", onKey);
  }, [searchable]);
  const covered = right.open && right.overlay;
  return [
    (0, import_react4.createElement)(
      "div",
      { key: "top", ref: top, className: "ad-top" },
      (0, import_react4.createElement)("div", { className: "ad-ident" }, face, (0, import_react4.createElement)("span", { className: "ad-name" }, name), meta),
      (0, import_react4.createElement)(
        "div",
        { className: "ad-act" },
        actions,
        searchable && (0, import_react4.createElement)("button", { type: "button", className: "ad-icon-btn", title: t.search, "aria-label": t.search, "aria-expanded": finding, onClick: () => setFinding((v) => !v) }, (0, import_react4.createElement)(Icon, { name: "search" })),
        !covered && (0, import_react4.createElement)("button", {
          type: "button",
          className: "ad-icon-btn",
          title: right.open ? t.collapse : t.expand,
          "aria-label": right.open ? t.collapse : t.expand,
          "aria-pressed": right.open,
          onClick: () => store.set({ right: { ...right, open: !right.open } })
        }, (0, import_react4.createElement)(Icon, { name: "panel" }))
      )
    ),
    finding && (0, import_react4.createElement)(SearchBox, { key: "find", resident, onClose: () => setFinding(false) }),
    around && (0, import_react4.createElement)(
      "div",
      { key: "around", className: "ad-around", role: "status" },
      (0, import_react4.createElement)(Icon, { name: "search" }),
      (0, import_react4.createElement)("span", null, t.around),
      (0, import_react4.createElement)("button", { type: "button", className: "ad-btn quiet small", onClick: () => store.set({ around: null }) }, t.backToChat)
    )
  ];
}

// client/composer.mjs
var import_react5 = require("react");

// client/attach.mjs
var MAX_PICTURES = 4;
var LONG_EDGE = 1568;
var KEEP_GIF_BYTES = 3.5 * 1024 * 1024;
function roomFor(have = 0, incoming = 0, max = MAX_PICTURES) {
  return Math.max(0, Math.min(incoming, max - have));
}
function shrinkTo(width, height, edge = LONG_EDGE) {
  const long = Math.max(width || 0, height || 0);
  if (!long || long <= edge) return { width: Math.max(1, Math.round(width || long)), height: Math.max(1, Math.round(height || long)) };
  const scale = edge / long;
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}
var bareBase64 = (dataUrl) => String(dataUrl || "").replace(/^data:[^;]*;base64,/, "");
var base64Of = (bytes) => {
  let out = "";
  for (let i = 0; i < bytes.length; i += 32768) out += String.fromCharCode.apply(null, bytes.subarray(i, i + 32768));
  return btoa(out);
};
async function readFace(file, edge = 512) {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = edge;
  canvas.height = edge;
  canvas.getContext("2d").drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, edge, edge);
  bitmap.close?.();
  const dataUrl = canvas.toDataURL("image/jpeg", 0.86);
  return { data: bareBase64(dataUrl), type: "image/jpeg", url: dataUrl };
}
async function readPicture(file) {
  if (file.type === "image/gif" && file.size < KEEP_GIF_BYTES) {
    return { url: URL.createObjectURL(file), data: base64Of(new Uint8Array(await file.arrayBuffer())) };
  }
  const bitmap = await createImageBitmap(file);
  const size = shrinkTo(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, size.width, size.height);
  bitmap.close?.();
  const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
  return { url: dataUrl, data: bareBase64(dataUrl) };
}

// client/media.mjs
var residentPrefix = (resident) => resident && resident !== "default" ? `/r/${resident}` : "";
var stickerSrc = (base, resident, key) => `${String(base || "").replace(/\/+$/, "")}${residentPrefix(resident)}/stickers/${key}`;
function pickerPacks(packs = []) {
  return packs.filter((pack) => pack && pack.enabled && Array.isArray(pack.stickers) && pack.stickers.length > 0).map((pack) => ({ id: pack.id, name: pack.name || "", stickers: pack.stickers }));
}
function voiceLength(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "";
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

// client/composer.mjs
var base64Of2 = async (blob) => {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 32768) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 32768));
  return btoa(binary);
};
var COMMANDS = ["status", "letter", "handoff"];
function Composer({ resident, base, placeholder, say, onError, rich = true, onCommand = null }) {
  const t = words();
  const [text, setText] = (0, import_react5.useState)("");
  const [pics, setPics] = (0, import_react5.useState)([]);
  const [packs, setPacks] = (0, import_react5.useState)(null);
  const [picker, setPicker] = (0, import_react5.useState)(false);
  const [recording, setRecording] = (0, import_react5.useState)(false);
  const [busy, setBusy] = (0, import_react5.useState)(false);
  const files = (0, import_react5.useRef)(null);
  const recorder = (0, import_react5.useRef)(null);
  const run = async (job) => {
    try {
      await job();
    } catch (e) {
      onError(e.message);
    }
  };
  const asked = onCommand && /^\/\w*$/.test(text.trim()) ? COMMANDS.filter((c) => c.startsWith(text.trim().slice(1))) : [];
  const command = async (name) => {
    setText("");
    await run(() => onCommand(name));
  };
  const send = async () => {
    const body = text.trim();
    if (onCommand && COMMANDS.includes(body.slice(1)) && body.startsWith("/")) {
      await command(body.slice(1));
      return;
    }
    if (!body && !pics.length || busy) return;
    setBusy(true);
    const payload = { text: body };
    if (pics.length) payload.pictures = pics.map((pic) => ({ data: pic.data }));
    const kept = pics;
    setText("");
    setPics([]);
    try {
      await say(payload);
    } catch (e) {
      setText((now) => now || body);
      setPics((now) => now.length ? now : kept);
      onError(e.message);
    }
    setBusy(false);
  };
  const openStickers = async () => {
    setPicker((was) => !was);
    if (packs) return;
    try {
      setPacks(pickerPacks((await web("/web/stickers", { resident }))?.packs));
    } catch {
      setPacks([]);
    }
  };
  const sendSticker = (key) => {
    setPicker(false);
    void run(() => say({ sticker: key }));
  };
  const record = () => run(async () => {
    if (recording) {
      recorder.current?.stop();
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const type = typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("audio/webm") ? { mimeType: "audio/webm" } : void 0;
    const tap = new MediaRecorder(stream, type);
    const chunks = [];
    tap.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    tap.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      setRecording(false);
      void run(async () => say({ voice: { data: await base64Of2(new Blob(chunks, { type: tap.mimeType || "audio/webm" })) } }));
    };
    tap.start();
    recorder.current = tap;
    setRecording(true);
  });
  const attach = async (event) => {
    const chosen2 = Array.from(event.target.files || []);
    event.target.value = "";
    const room = roomFor(pics.length, chosen2.length, MAX_PICTURES);
    if (chosen2.length > room) onError(t.upTo);
    const read = [];
    for (const file of chosen2.slice(0, room)) {
      try {
        read.push(await readPicture(file));
      } catch {
        onError(t.tooBig);
      }
    }
    if (read.length) setPics((was) => [...was, ...read].slice(0, MAX_PICTURES));
  };
  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent?.isComposing) {
      e.preventDefault();
      void send();
    }
  };
  const tool = (name, label, onClick, extra = {}) => (0, import_react5.createElement)("button", { type: "button", className: "ad-plain", title: label, "aria-label": label, onClick, ...extra }, (0, import_react5.createElement)(Icon, { name }));
  return (0, import_react5.createElement)(
    "div",
    { className: "ad-compose" },
    pics.length > 0 && (0, import_react5.createElement)("div", { className: "ad-thumbs" }, pics.map((pic, i) => (0, import_react5.createElement)(
      "div",
      { key: i },
      (0, import_react5.createElement)("img", { src: pic.url, alt: "" }),
      (0, import_react5.createElement)("button", { type: "button", className: "ad-x", "aria-label": t.remove, title: t.remove, onClick: () => setPics((was) => was.filter((_, at) => at !== i)) }, (0, import_react5.createElement)(Icon, { name: "close" }))
    ))),
    asked.length > 0 && (0, import_react5.createElement)("div", { className: "ad-cmds", role: "listbox", "aria-label": t.commands }, asked.map((c) => (0, import_react5.createElement)(
      "button",
      { key: c, type: "button", role: "option", onClick: () => command(c) },
      (0, import_react5.createElement)(Icon, { name: "slash" }),
      (0, import_react5.createElement)("code", null, `/${c}`),
      (0, import_react5.createElement)("span", null, t.cmd[c])
    ))),
    picker && (0, import_react5.createElement)(
      "div",
      { className: "ad-picker" },
      packs === null ? (0, import_react5.createElement)("p", { className: "ad-hint" }, "…") : packs.length === 0 ? (0, import_react5.createElement)("p", { className: "ad-hint" }, t.noStickers) : packs.map((pack) => (0, import_react5.createElement)(
        "div",
        { key: pack.id },
        (0, import_react5.createElement)("p", { className: "ad-label", style: { margin: "0 2px 6px" } }, pack.name),
        (0, import_react5.createElement)("div", { className: "ad-pack-grid" }, pack.stickers.map((sticker) => (0, import_react5.createElement)(
          "button",
          { key: sticker.key, type: "button", title: sticker.name || "", "aria-label": sticker.name || t.stickers, onClick: () => sendSticker(sticker.key) },
          sticker.video ? (0, import_react5.createElement)("video", { src: stickerSrc(base, resident, sticker.key), autoPlay: true, loop: true, muted: true, playsInline: true }) : (0, import_react5.createElement)("img", { src: stickerSrc(base, resident, sticker.key), alt: "" })
        )))
      ))
    ),
    (0, import_react5.createElement)(
      "div",
      { className: "ad-bar" },
      rich && (0, import_react5.createElement)("input", { ref: files, type: "file", accept: "image/*", multiple: true, hidden: true, onChange: attach }),
      rich && tool("plus", t.attach, () => files.current?.click()),
      (0, import_react5.createElement)(
        "div",
        { className: "ad-field" },
        (0, import_react5.createElement)("textarea", { rows: 1, value: text, placeholder, "aria-label": placeholder, onChange: (e) => setText(e.target.value), onKeyDown: onKey })
      ),
      rich && tool("sticker", t.stickers, openStickers, { "aria-expanded": picker }),
      rich && tool("mic", recording ? t.recording : t.voice, record, { className: `ad-plain${recording ? " rec" : ""}`, "aria-pressed": recording }),
      (0, import_react5.createElement)("button", { className: "ad-round", type: "button", disabled: busy || !text.trim() && !pics.length, onClick: send, "aria-label": t.send, title: t.send }, (0, import_react5.createElement)(Icon, { name: "send" }))
    )
  );
}

// client/face.mjs
var import_react6 = require("react");

// client/avatar.mjs
function avatarUrl(base, path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path) || /^data:/i.test(path)) return path;
  const root = String(base || "").replace(/\/+$/, "");
  return `${root}${path.startsWith("/") ? "" : "/"}${path}`;
}

// client/face.mjs
function Face({ resident, base, className = "" }) {
  const name = resident?.name || resident?.id || "";
  const src = avatarUrl(base, resident?.avatar);
  return (0, import_react6.createElement)("span", { className: `ad-avatar${className}`, "aria-hidden": true }, src ? (0, import_react6.createElement)("img", { src, alt: "" }) : name.slice(0, 1));
}

// client/md.mjs
var import_react7 = require("react");

// client/markdown.mjs
var MD_SAFE_URL = /^https?:\/\/[^\s<>"'`]+$/i;
var MD_LIST_ITEM = /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/;
var MD_FENCE = /^\s{0,3}(`{3,}|~{3,})\s*[\w+#.-]*\s*$/;
var MD_HEADING = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
var MD_RULE = /^\s{0,3}([-*_])(\s*\1){2,}\s*$/;
var MD_QUOTE = /^\s{0,3}>/;
var MD_URL_TAIL = /[).,;:!?'"，。！？；：、）」』】]+$/;
var MD_INLINE = [
  { re: /`([^`\n]+)`/, make: function(m) {
    return { t: "code", v: m[1] };
  } },
  { re: /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/, make: function(m) {
    return { t: "a", href: m[2], c: mdInline(m[1]) };
  } },
  { re: /\*\*(?=\S)([\s\S]*?\S)\*\*/, make: function(m) {
    return { t: "strong", c: mdInline(m[1]) };
  } },
  { re: /(^|[^\w])__(?=\S)([\s\S]*?\S)__(?!\w)/, lead: true, make: function(m) {
    return { t: "strong", c: mdInline(m[2]) };
  } },
  { re: /~~(?=\S)([\s\S]*?\S)~~/, make: function(m) {
    return { t: "del", c: mdInline(m[1]) };
  } },
  { re: /(^|[^\w*])\*(?=[^\s*])([^*\n]*?[^\s*])\*(?![\w*])/, lead: true, make: function(m) {
    return { t: "em", c: mdInline(m[2]) };
  } },
  { re: /(^|[^\w])_(?=[^\s_])([^_\n]*?[^\s_])_(?!\w)/, lead: true, make: function(m) {
    return { t: "em", c: mdInline(m[2]) };
  } },
  { re: /https?:\/\/[^\s<>"'`]+/i, make: function(m) {
    var url = m[0].replace(MD_URL_TAIL, "");
    return { t: "a", href: url, c: [{ t: "text", v: url }], used: url.length };
  } }
];
function mdText(nodes, text) {
  text.split("\n").forEach(function(part, i) {
    if (i) nodes.push({ t: "br" });
    if (part) nodes.push({ t: "text", v: part });
  });
}
function mdInline(text) {
  var nodes = [];
  var rest = String(text || "");
  while (rest) {
    var best = null;
    for (var i = 0; i < MD_INLINE.length; i++) {
      var m = MD_INLINE[i].re.exec(rest);
      if (!m) continue;
      var at = m.index + (MD_INLINE[i].lead ? m[1].length : 0);
      if (!best || at < best.at) best = { at, m, rule: MD_INLINE[i] };
    }
    if (!best) {
      mdText(nodes, rest);
      break;
    }
    if (best.at) mdText(nodes, rest.slice(0, best.at));
    var node = best.rule.make(best.m);
    var used = node.used !== void 0 ? best.at - best.m.index + node.used : best.m[0].length;
    delete node.used;
    nodes.push(node);
    rest = rest.slice(best.m.index + used);
  }
  return nodes;
}
function mdIndent(line) {
  return /^\s*/.exec(line)[0].replace(/\t/g, "    ").length;
}
function mdCells(line) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(function(cell) {
    return cell.trim();
  });
}
function mdTableAt(lines, i) {
  if (i + 1 >= lines.length || lines[i].indexOf("|") < 0) return false;
  var sep = mdCells(lines[i + 1]);
  return sep.length > 0 && lines[i + 1].indexOf("-") >= 0 && sep.every(function(cell) {
    return /^:?-{1,}:?$/.test(cell);
  });
}
function mdBlockAt(lines, i) {
  var line = lines[i];
  return MD_FENCE.test(line) || MD_HEADING.test(line) || MD_RULE.test(line) || MD_QUOTE.test(line) || MD_LIST_ITEM.test(line) || mdTableAt(lines, i);
}
function mdList(lines, start) {
  var first = MD_LIST_ITEM.exec(lines[start]);
  var indent = mdIndent(first[1]);
  var ordered = /\d/.test(first[2]);
  var node = { t: ordered ? "ol" : "ul", items: [] };
  if (ordered) node.start = parseInt(first[2], 10);
  var i = start;
  while (i < lines.length) {
    if (!lines[i].trim()) {
      var next = i + 1;
      while (next < lines.length && !lines[next].trim()) next++;
      var after = next < lines.length && MD_LIST_ITEM.exec(lines[next]);
      if (!after || mdIndent(after[1]) !== indent || /\d/.test(after[2]) !== ordered) break;
      i = next;
    }
    var m = MD_LIST_ITEM.exec(lines[i]);
    if (!m || mdIndent(m[1]) !== indent || /\d/.test(m[2]) !== ordered) break;
    var inner = indent + m[2].length + 1;
    var body = [m[3]];
    i++;
    while (i < lines.length) {
      var line = lines[i];
      if (!line.trim()) {
        var j = i + 1;
        while (j < lines.length && !lines[j].trim()) j++;
        if (j < lines.length && mdIndent(lines[j]) > indent && !(MD_LIST_ITEM.test(lines[j]) && mdIndent(MD_LIST_ITEM.exec(lines[j])[1]) <= indent)) {
          body.push("");
          i++;
          continue;
        }
        break;
      }
      var sub = MD_LIST_ITEM.exec(line);
      if (sub && mdIndent(sub[1]) <= indent) break;
      if (mdIndent(line) > indent) {
        body.push(line.replace(/^\s+/, function(space) {
          return space.slice(Math.min(space.length, inner));
        }));
        i++;
        continue;
      }
      if (mdBlockAt(lines, i)) break;
      body.push(line.trim());
      i++;
    }
    node.items.push(mdBlocks(body));
  }
  return { node, next: i };
}
function mdBlocks(lines) {
  var out = [];
  var i = 0;
  while (i < lines.length) {
    var line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    var fence = MD_FENCE.exec(line);
    if (fence) {
      var code = [];
      var close = new RegExp("^\\s{0,3}" + fence[1].charAt(0) + "{" + fence[1].length + ",}\\s*$");
      i++;
      while (i < lines.length && !close.test(lines[i])) code.push(lines[i++]);
      i++;
      out.push({ t: "pre", v: code.join("\n") });
      continue;
    }
    var heading = MD_HEADING.exec(line);
    if (heading) {
      out.push({ t: heading[1].length <= 2 ? "h3" : "h4", c: mdInline(heading[2]) });
      i++;
      continue;
    }
    if (MD_RULE.test(line)) {
      out.push({ t: "hr" });
      i++;
      continue;
    }
    if (MD_QUOTE.test(line)) {
      var quoted = [];
      while (i < lines.length && MD_QUOTE.test(lines[i])) quoted.push(lines[i++].replace(/^\s{0,3}>\s?/, ""));
      out.push({ t: "blockquote", c: mdBlocks(quoted) });
      continue;
    }
    if (mdTableAt(lines, i)) {
      var table = { t: "table", head: mdCells(line).map(mdInline), rows: [] };
      i += 2;
      while (i < lines.length && lines[i].trim() && lines[i].indexOf("|") >= 0) table.rows.push(mdCells(lines[i++]).map(mdInline));
      out.push(table);
      continue;
    }
    if (MD_LIST_ITEM.test(line)) {
      var list = mdList(lines, i);
      out.push(list.node);
      i = list.next;
      continue;
    }
    var para = [line.trim()];
    i++;
    while (i < lines.length && lines[i].trim() && !mdBlockAt(lines, i)) para.push(lines[i++].trim());
    out.push({ t: "p", c: mdInline(para.join("\n")) });
  }
  return out;
}
function parseMarkdown(text) {
  return mdBlocks(String(text || "").replace(/\r\n?/g, "\n").split("\n"));
}
var MD_TAGS = { p: "p", h3: "h3", h4: "h4", strong: "strong", em: "em", del: "del", blockquote: "blockquote", code: "code", hr: "hr", br: "br" };
function mdAppend(doc, parent, nodes) {
  nodes.forEach(function(node) {
    var el;
    if (node.t === "text") {
      parent.appendChild(doc.createTextNode(node.v));
      return;
    }
    if (node.t === "a") {
      el = doc.createElement("a");
      if (MD_SAFE_URL.test(node.href)) {
        el.setAttribute("href", node.href);
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener noreferrer");
      }
      mdAppend(doc, el, node.c);
    } else if (node.t === "pre") {
      el = doc.createElement("pre");
      var code = doc.createElement("code");
      code.textContent = node.v;
      el.appendChild(code);
    } else if (node.t === "ul" || node.t === "ol") {
      el = doc.createElement(node.t);
      if (node.t === "ol" && node.start !== 1) el.setAttribute("start", String(node.start));
      node.items.forEach(function(item) {
        var li = doc.createElement("li");
        mdAppend(doc, li, item);
        el.appendChild(li);
      });
    } else if (node.t === "table") {
      el = doc.createElement("div");
      el.className = "md-table";
      var table = doc.createElement("table");
      var row = function(cells, tag) {
        var tr = doc.createElement("tr");
        cells.forEach(function(cell) {
          var td = doc.createElement(tag);
          mdAppend(doc, td, cell);
          tr.appendChild(td);
        });
        return tr;
      };
      var thead = doc.createElement("thead");
      thead.appendChild(row(node.head, "th"));
      table.appendChild(thead);
      var tbody = doc.createElement("tbody");
      node.rows.forEach(function(cells) {
        tbody.appendChild(row(cells, "td"));
      });
      table.appendChild(tbody);
      el.appendChild(table);
    } else {
      el = doc.createElement(MD_TAGS[node.t] || "span");
      if (node.v !== void 0) el.textContent = node.v;
      if (node.c) mdAppend(doc, el, node.c);
    }
    parent.appendChild(el);
  });
}
function renderMarkdown(el, text) {
  while (el.firstChild) el.removeChild(el.firstChild);
  mdAppend(el.ownerDocument, el, parseMarkdown(text));
}

// client/md.mjs
function Md({ text }) {
  const ref = (0, import_react7.useRef)(null);
  (0, import_react7.useEffect)(() => {
    if (ref.current) renderMarkdown(ref.current, text || "");
  }, [text]);
  return (0, import_react7.createElement)("div", { className: "ad-md", ref });
}

// client/message.mjs
var import_react10 = require("react");

// client/activity.mjs
var TOOL_WORDS = {
  memory_recall: "looked in its memory",
  memory_remember: "remembered this",
  memory_notebook: "read its notebook",
  memory_forget: "forgot something",
  memory_keep_moment: "kept a moment",
  web_search: "searched the web",
  web_fetch: "read a page",
  make_sticker: "drew a sticker",
  send_sticker: "sent a sticker",
  send_voice: "sent a voice note",
  cloud_task: "handed it to a thread",
  set_alarm: "set an alarm",
  list_alarms: "checked the alarms",
  cancel_alarm: "cancelled an alarm",
  mcp_connect: "connected a tool",
  edit_persona: "edited its persona",
  make_file: "made a file"
};
function toolWord(name = "") {
  if (TOOL_WORDS[name]) return TOOL_WORDS[name];
  if (name.startsWith("mcp_")) return `used ${name.slice(4)}`;
  return name || "used a tool";
}
var STATE = { "output-available": "", "output-error": "failed", "output-denied": "not run", "input-streaming": "preparing" };
var parsed = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};
function detailOf(item) {
  const input = parsed(item.input);
  if (input && typeof input === "object") {
    const pick = input.query || input.url || input.note || input.title || input.name || input.text || input.path || "";
    if (pick) return String(pick).replace(/\s+/g, " ").slice(0, 80);
  }
  return String(item.input ?? "").replace(/\s+/g, " ").slice(0, 80);
}
function bubbleTexts(text) {
  const parts = [];
  let now = [];
  let fence = null;
  String(text || "").split("\n").forEach((line) => {
    const mark = /^\s{0,3}(`{3,}|~{3,})/.exec(line);
    if (mark && (!fence || mark[1].charAt(0) === fence.charAt(0) && mark[1].length >= fence.length)) fence = fence ? null : mark[1];
    if (!fence && !line.trim()) {
      if (now.join("").trim()) parts.push(now.join("\n").trim());
      now = [];
    } else now.push(line);
  });
  if (now.join("").trim()) parts.push(now.join("\n").trim());
  return parts;
}
function busyOf(line) {
  const activity = Array.isArray(line?.activity) ? line.activity : [];
  const thoughts = activity.filter((item) => item.type === "reasoning" && item.text);
  const tools = activity.filter((item) => item.type === "tool");
  if (!thoughts.length && !tools.length) return null;
  const bits = [];
  if (thoughts.length) bits.push(line.pending && !tools.length ? "thinking…" : "thought for a moment");
  if (tools.length) bits.push(`used ${tools.length} ${tools.length === 1 ? "tool" : "tools"}${line.pending ? " · still going" : ""}`);
  const items = [];
  thoughts.forEach((item, index) => items.push({
    key: `r${index}`,
    what: "thought",
    detail: String(item.text).replace(/\s+/g, " ").slice(0, 80),
    state: "",
    body: [{ label: "", text: item.text }]
  }));
  tools.forEach((item, index) => items.push({
    key: `t${index}`,
    what: toolWord(item.name),
    detail: detailOf(item),
    state: STATE[item.state] ?? "running",
    body: [{ label: "Input", text: item.input || "(none)" }].concat(item.output === void 0 ? [] : [{ label: "Result", text: item.output }])
  }));
  return { label: bits.join(" · "), live: Boolean(line.pending), thoughts: thoughts.length, tools: tools.length, items };
}

// client/message-actions.mjs
var import_react8 = require("react");
function MessageActions({ line, resident, last, onChanged }) {
  const t = words();
  const [state, setState] = (0, import_react8.useState)("");
  const audio = (0, import_react8.useRef)(null);
  const run = (key, job) => async () => {
    if (state === "busy") return;
    setState("busy");
    try {
      setState(await job() || "");
    } catch (e) {
      setState(e.message);
    }
  };
  const speak = run("speak", async () => {
    const spoken = await web("/web/speak", { method: "POST", body: { id: line.id }, resident });
    if (spoken?.error) throw new Error(spoken.error);
    const url = await blobUrl(`/web/media?key=${encodeURIComponent(spoken.key)}`, { resident });
    audio.current?.pause();
    audio.current = new Audio(url);
    await audio.current.play();
  });
  const pin = run("pin", async () => {
    const done = await web("/web/pin", { method: "POST", body: { text: line.text }, resident });
    return done?.ok ? t.pinned : "";
  });
  const copy = run("copy", async () => {
    await navigator.clipboard.writeText(String(line.text || ""));
    return t.copied;
  });
  const back = (again) => run("back", async () => {
    const done = await web("/web/take-back", { method: "POST", body: { id: line.id, again }, resident });
    if (done?.error) throw new Error(done.error);
    await onChanged?.();
  });
  const tool = (name, label, onClick) => (0, import_react8.createElement)("button", { key: name, type: "button", className: "ad-icon-btn sm", title: label, "aria-label": label, disabled: state === "busy", onClick }, (0, import_react8.createElement)(Icon, { name }));
  return (0, import_react8.createElement)(
    "div",
    { className: "ad-msg-acts" },
    tool("speaker", t.speakIt, speak),
    tool("pin", t.pinIt, pin),
    tool("copy", t.copy, copy),
    last && tool("undo", t.takeBack, back(false)),
    last && tool("refresh", t.redo, back(true)),
    state && state !== "busy" && (0, import_react8.createElement)("span", { className: "said", role: "status" }, state)
  );
}

// client/thread-chip.mjs
var import_react9 = require("react");

// client/thread-model.mjs
var KIND_ICON = { read: "eye", edit: "pencil", delete: "trash", move: "move", search: "search", execute: "terminal", think: "spark", fetch: "globe", other: "wrench" };
var HELPER_ICON = { dsh: "dsh", kiro: "kiro", command: "plug", resident: "spark", actions: "cloud", machine: "laptop" };
function helperOf(thread, local) {
  if (thread?.runs === "local") return "resident";
  if (thread?.runs === "linux") return "actions";
  const mine = (local?.sessions || []).find((s) => s.thread === thread?.id)?.plugin || local?.machine?.info?.plugin || "";
  return ["dsh", "kiro", "command"].includes(mine) ? mine : "machine";
}
function commandOf(item) {
  if (item?.kind !== "execute") return "";
  try {
    const input = typeof item.input === "string" ? JSON.parse(item.input) : item.input;
    const c = input?.command ?? input?.cmd;
    if (Array.isArray(c)) return c.join(" ");
    if (typeof c === "string") return c;
  } catch {
  }
  return item.title || "";
}
function countsOf(session) {
  const tools = (session?.turns || []).flatMap((t) => t.items || []).filter((x) => x.type === "tool");
  return { tools: tools.length, files: new Set(tools.flatMap((x) => (x.diffs || []).map((d) => d.path))).size, commands: tools.filter((x) => x.kind === "execute").length };
}
function waitingOf(cloud) {
  const task = (cloud?.tasks || []).find((x) => x.waiting && (x.choices || []).length);
  return task ? { task: task.id, choices: task.choices } : null;
}
function fromSession(session, cloud) {
  const items = [];
  for (const turn of session.turns || []) {
    if (turn.text) items.push({ type: "brief", who: turn.kind === "say" ? "mine" : "given", text: turn.text, at: turn.at });
    for (const item of turn.items || []) items.push(item);
    if (turn.end) items.push({ type: "result", status: turn.end.status, text: turn.end.summary, at: turn.end.at });
  }
  const results = (cloud?.lines || []).filter((l) => l.role === "result");
  const last = items.findLast?.((x) => x.type === "result") ?? [...items].reverse().find((x) => x.type === "result");
  if (last) Object.assign(last, { links: results.at(-1)?.links || [], sessionUrl: results.at(-1)?.sessionUrl || "", ...waitingOf(cloud) || {} });
  return items;
}
function fromCloud(cloud) {
  const items = [];
  const waiting = waitingOf(cloud);
  for (const line of cloud?.lines || []) {
    if (line.role === "user") items.push({ type: "brief", who: line.direct ? "mine" : "given", text: line.text || "" });
    else if (line.role === "result") {
      const own = waiting && waiting.task === line.task ? waiting : null;
      items.push({ type: "result", status: line.status || "", text: line.text || "", links: line.links || [], sessionUrl: line.sessionUrl || "", files: line.files || [], ...own || {} });
    } else {
      (line.steps || []).forEach((step, i) => items.push({ type: "tool", id: `${line.id}-${i}`, kind: "other", title: step, status: "completed", input: "", output: "", paths: [], diffs: [] }));
      if (line.text) items.push({ type: "say", text: line.text });
    }
  }
  return items;
}
function timeline(cloud, session) {
  return session?.turns?.length ? fromSession(session, cloud) : fromCloud(cloud);
}

// client/tones.mjs
var RUNNER = { running: "ok", starting: "warn", unpaired: "warn", locked: "warn", stopped: "bad", crashed: "bad", revoked: "bad" };
var runnerTone = (state) => RUNNER[state] || "idle";
var runnerDown = (state) => ["stopped", "crashed", "revoked"].includes(state);
function waitTone(item) {
  if (!item || item.expired) return "idle";
  return { ask: "hot", stuck: "bad", done: "ok", note: "info" }[item.kind] || "idle";
}
var taskTone = (state) => ({ working: "warn", sent: "warn", needs_you: "hot", done: "ok", chosen: "ok", settled: "idle", failed: "bad", quiet: "bad", stopped: "idle" })[state] || "idle";

// client/thread-chip.mjs
var openThread = (thread) => store.set({ focus: thread, right: { ...store.get().right, open: true, panel: "threads" } });
function ThreadChips({ tasks }) {
  const t = words();
  const { local } = useStore(store);
  return (0, import_react9.createElement)("div", { className: "ad-chips" }, tasks.map((task) => {
    const state = stateOf(task);
    const tone = taskTone(state);
    const helper = helperOf({ id: task.thread, runs: task.runs }, local);
    const label = t.task[state] || state;
    return (0, import_react9.createElement)(
      "button",
      { key: task.id, type: "button", className: "ad-chip", title: `${task.title} · ${label}`, onClick: () => openThread(task.thread || task.id) },
      (0, import_react9.createElement)("span", { className: "ad-helper", "aria-hidden": true }, (0, import_react9.createElement)(Icon, { name: HELPER_ICON[helper] || "plug" })),
      (0, import_react9.createElement)("span", { className: "n" }, task.title),
      (0, import_react9.createElement)("span", { className: `ad-dot ${tone}${isWorking(task) ? " live" : ""}`, role: "img", "aria-label": label })
    );
  }));
}

// client/message.mjs
var clock = (at) => at ? new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
function RowState({ state, t }) {
  if (!state) return (0, import_react10.createElement)("span", { title: t.ran, "aria-label": t.ran }, (0, import_react10.createElement)(Icon, { name: "check" }));
  const tone = state === "failed" || state === "not run" ? "bad" : "warn live";
  return (0, import_react10.createElement)("span", { className: `ad-dot ${tone}`, title: state, "aria-label": state });
}
function Busy({ busy }) {
  const t = words();
  const [open, setOpen] = (0, import_react10.useState)(false);
  const [seen, setSeen] = (0, import_react10.useState)({});
  return (0, import_react10.createElement)(
    "div",
    { className: `ad-busy${open ? " open" : ""}` },
    (0, import_react10.createElement)(
      "button",
      { type: "button", className: busy.live ? "live" : "", "aria-expanded": open, "aria-label": busy.label, title: busy.label, onClick: () => setOpen((v) => !v) },
      busy.thoughts > 0 && (0, import_react10.createElement)("span", { className: "spark" }, (0, import_react10.createElement)(Icon, { name: "spark" })),
      busy.thoughts > 0 && (0, import_react10.createElement)("span", null, t.thinking),
      busy.thoughts > 0 && busy.tools > 0 && (0, import_react10.createElement)("span", { className: "sep", "aria-hidden": true }),
      busy.tools > 0 && (0, import_react10.createElement)(Icon, { name: "wrench" }),
      busy.tools > 0 && (0, import_react10.createElement)("span", null, busy.tools),
      (0, import_react10.createElement)("span", { className: "chev" }, (0, import_react10.createElement)(Icon, { name: "next" }))
    ),
    open && (0, import_react10.createElement)("div", { className: "ad-busy-list" }, busy.items.map((item) => (0, import_react10.createElement)(
      "div",
      { key: item.key, className: "ad-busy-item" },
      (0, import_react10.createElement)(
        "button",
        { type: "button", "aria-expanded": Boolean(seen[item.key]), onClick: () => setSeen((v) => ({ ...v, [item.key]: !v[item.key] })) },
        (0, import_react10.createElement)("span", { className: "what" }, item.what),
        (0, import_react10.createElement)("span", { className: "detail" }, item.detail),
        (0, import_react10.createElement)(RowState, { state: item.state, t })
      ),
      seen[item.key] && (0, import_react10.createElement)("div", null, item.body.map((part, i) => (0, import_react10.createElement)(
        "div",
        { key: i },
        part.label && (0, import_react10.createElement)("div", { className: "label" }, part.label),
        (0, import_react10.createElement)("pre", null, part.text)
      )))
    )))
  );
}
function Pictures({ lineId, count, resident }) {
  const [urls, setUrls] = (0, import_react10.useState)([]);
  (0, import_react10.useEffect)(() => {
    let alive = true;
    const list = [];
    (async () => {
      for (let n = 0; n < count; n += 1) {
        try {
          list.push(await blobUrl(`/web/picture?id=${encodeURIComponent(lineId)}&n=${n}`, { resident }));
        } catch {
        }
      }
      if (alive) setUrls([...list]);
    })();
    return () => {
      alive = false;
    };
  }, [lineId, count, resident]);
  if (!urls.length) return null;
  return (0, import_react10.createElement)(
    "div",
    { className: `ad-pics${urls.length === 1 ? " one" : ""}` },
    urls.map((url) => (0, import_react10.createElement)("button", { key: url, type: "button", onClick: () => window.open(url, "_blank", "noopener"), "aria-label": words().openPicture }, (0, import_react10.createElement)("img", { src: url, alt: "" })))
  );
}
function Files({ files, resident }) {
  const [busy, setBusy] = (0, import_react10.useState)("");
  const save = async (file) => {
    if (busy) return;
    setBusy(file.key);
    try {
      const url = await blobUrl(`/web/file?key=${encodeURIComponent(file.key)}`, { resident });
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name || "file";
      document.body.append(a);
      a.click();
      a.remove();
    } catch {
    } finally {
      setBusy("");
    }
  };
  return (0, import_react10.createElement)("div", { className: "ad-files" }, files.map((file) => (0, import_react10.createElement)(
    "button",
    { key: file.key, type: "button", className: "ad-file", title: file.name, disabled: Boolean(busy), onClick: () => save(file) },
    (0, import_react10.createElement)(Icon, { name: "file" }),
    (0, import_react10.createElement)("span", { className: "n" }, file.name || "file"),
    file.size ? (0, import_react10.createElement)("span", { className: "s" }, `${Math.max(1, Math.round(file.size / 1024))} KB`) : null
  )));
}
function Voice({ voice, resident }) {
  const t = words();
  const [playing, setPlaying] = (0, import_react10.useState)(false);
  const audio = (0, import_react10.useRef)(null);
  const flip = async () => {
    if (!voice?.key) return;
    if (playing) {
      audio.current?.pause();
      setPlaying(false);
      return;
    }
    try {
      const url = await blobUrl(`/web/media?key=${encodeURIComponent(voice.key)}`, { resident });
      if (!audio.current) audio.current = new Audio(url);
      audio.current.src = url;
      audio.current.onended = () => setPlaying(false);
      audio.current.onerror = () => setPlaying(false);
      await audio.current.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  };
  return (0, import_react10.createElement)(
    "div",
    { className: "ad-voice" },
    (0, import_react10.createElement)(
      "button",
      { type: "button", className: "ad-voice-play", onClick: flip, "aria-label": playing ? t.stopPlay : t.play, title: playing ? t.stopPlay : t.play },
      playing ? (0, import_react10.createElement)("svg", { viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true }, (0, import_react10.createElement)("rect", { x: 6, y: 5, width: 4, height: 14, rx: 1 }), (0, import_react10.createElement)("rect", { x: 14, y: 5, width: 4, height: 14, rx: 1 })) : (0, import_react10.createElement)("svg", { viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true }, (0, import_react10.createElement)("path", { d: "M7 4.5v15l13-7.5z" }))
    ),
    (0, import_react10.createElement)("span", { className: "len" }, voice.missed ? t.missed : voiceLength(voice.seconds))
  );
}
function Stickers({ stickers }) {
  return (0, import_react10.createElement)("div", { className: "ad-stickers" }, stickers.map((sticker) => (0, import_react10.createElement)(
    "div",
    { key: sticker.url, className: "ad-sticker" },
    sticker.video ? (0, import_react10.createElement)("video", { src: sticker.url, autoPlay: true, loop: true, muted: true, playsInline: true, "aria-label": words().stickers }) : (0, import_react10.createElement)("img", { src: sticker.url, alt: "", loading: "lazy" })
  )));
}
function Message({ line, resident, last = false, onChanged = null, cards = [] }) {
  const busy = busyOf(line);
  const me = line.role === "user";
  const bubbles = me ? String(line.text || "").trim() ? [line.text] : [] : bubbleTexts(line.text);
  return (0, import_react10.createElement)(
    "div",
    { className: `ad-row ${me ? "me" : "ai"}` },
    busy && (0, import_react10.createElement)(Busy, { busy }),
    line.quote && (0, import_react10.createElement)("span", { className: "ad-quote" }, line.quote.text),
    (line.pictures ?? 0) > 0 && (0, import_react10.createElement)(Pictures, { lineId: line.id, count: line.pictures, resident }),
    bubbles.map((text, i) => (0, import_react10.createElement)(
      "div",
      { key: i, className: `ad-bubble${i === 0 ? " first" : ""}` },
      me ? text : (0, import_react10.createElement)(Md, { text }),
      i === bubbles.length - 1 && (0, import_react10.createElement)("span", { className: "ad-meta" }, clock(line.at))
    )),
    (line.files ?? []).length > 0 && (0, import_react10.createElement)(Files, { files: line.files, resident }),
    line.voice && (line.voice.key || line.voice.missed) && (0, import_react10.createElement)(Voice, { voice: line.voice, resident }),
    (line.stickers ?? []).length > 0 && (0, import_react10.createElement)(Stickers, { stickers: line.stickers }),
    cards.length > 0 && (0, import_react10.createElement)(ThreadChips, { tasks: cards }),
    !me && !line.pending && line.id && String(line.text || "").trim() && (0, import_react10.createElement)(MessageActions, { line, resident, last, onChanged })
  );
}

// client/chat.mjs
var POLL_MS = 5e3;
function Chat() {
  const t = words();
  const { status, residents, around } = useStore(store);
  const resident = status?.resident || "default";
  const me = residents.find((r) => r.id === resident) || { id: resident, name: t.title };
  const [lines, setLines] = (0, import_react11.useState)([]);
  const [error, setError] = (0, import_react11.useState)("");
  const [notice, setNotice] = (0, import_react11.useState)("");
  const end = (0, import_react11.useRef)(null);
  const reader = (0, import_react11.useRef)(null);
  const refresh = async () => {
    try {
      const next = await reader.current();
      if (next) setLines(next);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  };
  const restart = () => {
    reader.current = createMessages((path) => web(path, { resident }));
  };
  (0, import_react11.useEffect)(() => {
    restart();
    setLines([]);
    void refresh();
    const timer = setInterval(() => {
      if (!document.hidden) void refresh();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [resident]);
  (0, import_react11.useEffect)(() => {
    if (!around) end.current?.scrollIntoView?.({ block: "end" });
  }, [lines.length, around]);
  const say = async (body) => {
    const said = await web("/web/say", { method: "POST", body, resident });
    if (said?.error) throw new Error(said.error);
    restart();
    await refresh();
  };
  const onCommand = async (name) => {
    const d = await web("/web/command", { method: "POST", body: { name }, resident });
    if (d?.error) throw new Error(d.error);
    setNotice(d?.text || "");
  };
  const cards = cardsByLine(around ? around.lines : lines);
  return (0, import_react11.createElement)(
    "section",
    { className: "ad-main", "aria-label": me.name || me.id },
    (0, import_react11.createElement)(ChatHead, { face: (0, import_react11.createElement)(Face, { resident: me, base: status?.url }), name: me.name || me.id, resident, searchable: true }),
    (0, import_react11.createElement)(
      "div",
      { className: "ad-stream", "aria-live": "polite" },
      (0, import_react11.createElement)("div", { className: "grow" }),
      !around && lines.length === 0 && (0, import_react11.createElement)("div", { className: "ad-note" }, t.empty),
      (around ? around.lines : lines).map((line, i, all) => (0, import_react11.createElement)(Message, { key: line.id ?? i, line, resident, cards: cards[line.id], last: !around && i === all.length - 1 && line.role !== "user", onChanged: async () => {
        restart();
        await refresh();
      } })),
      (0, import_react11.createElement)("div", { ref: end })
    ),
    error && (0, import_react11.createElement)("div", { className: "ad-error", role: "alert", style: { padding: "0 18px 4px", textAlign: "center" } }, error),
    notice && (0, import_react11.createElement)(
      "div",
      { className: "ad-notice", role: "status" },
      (0, import_react11.createElement)("div", { className: "ad-md" }, (0, import_react11.createElement)(Md, { text: notice })),
      (0, import_react11.createElement)("button", { type: "button", className: "ad-icon-btn sm", title: t.close, "aria-label": t.close, onClick: () => setNotice("") }, (0, import_react11.createElement)(Icon, { name: "close" }))
    ),
    (0, import_react11.createElement)(Composer, { resident, base: status?.url, placeholder: t.write, say, onError: setError, onCommand })
  );
}

// client/group-chat.mjs
var import_react12 = require("react");

// client/group.mjs
var HER = "";
function authorOf(line, group, names) {
  if (line?.author === HER || !line?.author) return names.you;
  if (line.author === "you") return names.you;
  const member = (group?.members || []).find((m) => m.id === line.author);
  return member?.name || line.author;
}
function groupRows(lines = []) {
  return (lines || []).filter((line) => line && (line.text || line.pictures || line.stickers?.length)).map((line) => ({ seq: line.seq, author: line.author, text: line.text || "", at: line.at, note: line.kind === "note" || line.author === "", pictures: line.pictures || 0, stickers: line.stickers || [] }));
}
function groupList(groups = []) {
  const at = (g) => new Date(g?.last?.at || 0).getTime();
  return [...groups].filter(Boolean).sort((a, b) => Number(Boolean(b.running)) - Number(Boolean(a.running)) || at(b) - at(a));
}

// client/group-chat.mjs
var POLL_MS2 = 4e3;
function Pictures2({ group, seq, count }) {
  const [urls, setUrls] = (0, import_react12.useState)([]);
  (0, import_react12.useEffect)(() => {
    let alive = true;
    (async () => {
      const list = [];
      for (let n = 0; n < count; n += 1) {
        try {
          list.push(await blobUrl(`/web/group/picture?g=${encodeURIComponent(group)}&seq=${seq}&n=${n}`));
        } catch {
        }
      }
      if (alive) setUrls([...list]);
    })();
    return () => {
      alive = false;
    };
  }, [group, seq, count]);
  if (!urls.length) return null;
  return (0, import_react12.createElement)(
    "div",
    { className: `ad-pics${urls.length === 1 ? " one" : ""}` },
    urls.map((url) => (0, import_react12.createElement)("button", { key: url, type: "button", onClick: () => window.open(url, "_blank", "noopener"), "aria-label": words().openPicture }, (0, import_react12.createElement)("img", { src: url, alt: "" })))
  );
}
function Meta({ data, t }) {
  if (!data) return null;
  const queue = (data.waiting || []).length;
  if (data.running) return (0, import_react12.createElement)("span", { className: "ad-meta-chip", title: t.answering }, (0, import_react12.createElement)("span", { className: "ad-dot ok live", "aria-hidden": true }), t.answering);
  if (queue) return (0, import_react12.createElement)("span", { className: "ad-meta-chip", title: `${queue} ${t.inLine}` }, (0, import_react12.createElement)(Icon, { name: "stack" }), queue);
  const n = (data.group?.members || []).length;
  return (0, import_react12.createElement)("span", { className: "ad-meta-chip", title: `${n} ${t.members}`, "aria-label": `${n} ${t.members}` }, (0, import_react12.createElement)(Icon, { name: "people" }), n);
}
function GroupChat() {
  const t = words();
  const { status, group } = useStore(store);
  const [data, setData] = (0, import_react12.useState)(null);
  const [error, setError] = (0, import_react12.useState)("");
  const end = (0, import_react12.useRef)(null);
  const load = async () => setData(await web(`/web/group?g=${encodeURIComponent(group)}`));
  (0, import_react12.useEffect)(() => {
    if (!group) return void 0;
    let alive = true;
    setData(null);
    const tick = async () => {
      try {
        const next = await web(`/web/group?g=${encodeURIComponent(group)}`);
        if (alive) {
          setData(next);
          setError("");
        }
      } catch (e) {
        if (alive) setError(e.message);
      }
    };
    void tick();
    const timer = setInterval(() => {
      if (!document.hidden) void tick();
    }, POLL_MS2);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [group]);
  (0, import_react12.useEffect)(() => {
    end.current?.scrollIntoView?.({ block: "end" });
  }, [data?.lines?.length]);
  const say = async (body) => {
    if (!body.text) return;
    await web(`/web/group/say?g=${encodeURIComponent(group)}`, { method: "POST", body: { text: body.text } });
    await load();
  };
  const rows = groupRows(data?.lines);
  const name = data?.group?.name || t.group;
  const icon = data?.group?.icon;
  const face = (0, import_react12.createElement)("span", { className: "ad-avatar", "aria-hidden": true }, icon ? (0, import_react12.createElement)("img", { src: avatarUrl(status?.url, icon), alt: "" }) : (0, import_react12.createElement)(Icon, { name: "people" }));
  return (0, import_react12.createElement)(
    "section",
    { className: "ad-main", "aria-label": name },
    (0, import_react12.createElement)(ChatHead, {
      face,
      name,
      meta: (0, import_react12.createElement)(Meta, { data, t }),
      actions: (0, import_react12.createElement)("button", { type: "button", className: "ad-icon-btn", title: t.groupSettings, "aria-label": t.groupSettings, onClick: () => store.set({ groupSheet: { id: group } }) }, (0, import_react12.createElement)(Icon, { name: "gear" }))
    }),
    (0, import_react12.createElement)(
      "div",
      { className: "ad-stream", "aria-live": "polite" },
      (0, import_react12.createElement)("div", { className: "grow" }),
      rows.map((row) => (0, import_react12.createElement)(
        "div",
        { key: row.seq, className: `ad-row ${row.author === "you" ? "me" : row.note ? "note" : "ai"}` },
        !row.note && row.author !== "you" && (0, import_react12.createElement)("span", { className: "ad-who-g" }, authorOf(row, data?.group, { you: t.mine })),
        row.pictures > 0 && (0, import_react12.createElement)(Pictures2, { group, seq: row.seq, count: row.pictures }),
        row.text && (0, import_react12.createElement)("div", { className: `ad-bubble${row.note ? " ad-note-bubble" : " first"}` }, row.text),
        (row.stickers || []).length > 0 && (0, import_react12.createElement)("div", { className: "ad-stickers" }, row.stickers.map((s) => (0, import_react12.createElement)(
          "div",
          { key: s.url, className: "ad-sticker" },
          s.video ? (0, import_react12.createElement)("video", { src: s.url, autoPlay: true, loop: true, muted: true, playsInline: true }) : (0, import_react12.createElement)("img", { src: s.url, alt: "" })
        )))
      )),
      (0, import_react12.createElement)("div", { ref: end })
    ),
    error && (0, import_react12.createElement)("div", { className: "ad-error", role: "alert", style: { padding: "0 18px 4px", textAlign: "center" } }, error),
    (0, import_react12.createElement)(Composer, { placeholder: t.writeGroup, say, onError: setError, rich: false })
  );
}

// client/connect-form.mjs
var import_react13 = require("react");
function ConnectForm({ defaultWorkspace = "" }) {
  const t = words();
  const [form, setForm] = (0, import_react13.useState)({ url: "", key: "", workspace: "", helper: "dsh", access: "edit", confirmFull: false });
  const [busy, setBusy] = (0, import_react13.useState)(false);
  const [error, setError] = (0, import_react13.useState)("");
  const set = (name) => (e) => setForm({ ...form, [name]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      store.set({ status: await call("connect", { ...form, workspace: form.workspace || void 0 }) });
    } catch (err) {
      setError(err.message);
      setForm({ ...form, key: "" });
    } finally {
      setBusy(false);
    }
  }
  const field = (name, label, props = {}) => (0, import_react13.createElement)("label", null, label, (0, import_react13.createElement)("input", { value: form[name], onChange: set(name), disabled: busy, ...props }));
  return (0, import_react13.createElement)(
    "form",
    { className: "ad-form", onSubmit: submit },
    (0, import_react13.createElement)("h2", null, (0, import_react13.createElement)("span", { className: "ad-rail-mark", "aria-hidden": true, style: { display: "inline-grid", marginRight: 10, verticalAlign: "-4px" } }, "✦"), t.connectTitle),
    field("url", t.address, { type: "url", required: true, placeholder: "https://", autoComplete: "off" }),
    field("key", t.key, { type: "password", required: true, autoComplete: "off" }),
    field("workspace", t.folder, { placeholder: defaultWorkspace }),
    (0, import_react13.createElement)("label", null, t.helper, (0, import_react13.createElement)("select", { value: form.helper, onChange: set("helper"), disabled: busy }, (0, import_react13.createElement)("option", { value: "dsh" }, "DSH"), (0, import_react13.createElement)("option", { value: "kiro" }, "Kiro"))),
    (0, import_react13.createElement)("label", null, t.access, (0, import_react13.createElement)("select", { value: form.access, onChange: set("access"), disabled: busy }, ["read", "edit", "full"].map((v) => (0, import_react13.createElement)("option", { key: v, value: v }, t.tier[v])))),
    form.access === "full" && (0, import_react13.createElement)("label", { className: "check" }, (0, import_react13.createElement)("span", null, (0, import_react13.createElement)("input", { type: "checkbox", checked: form.confirmFull, onChange: set("confirmFull") }), " ", t.fullOk)),
    error && (0, import_react13.createElement)("div", { className: "ad-error", role: "alert" }, error),
    (0, import_react13.createElement)("button", { className: "ad-btn", type: "submit", disabled: busy }, busy ? t.connecting : t.connect)
  );
}

// client/group-sheet.mjs
var import_react14 = require("react");
var reloadGroups = async () => store.set({ groups: (await web("/web/groups"))?.groups || [] });
function GroupSheet() {
  const t = words();
  const { groupSheet, groups, residents, status } = useStore(store);
  const was = groups.find((g) => g.id === groupSheet?.id) || null;
  const [form, setForm] = (0, import_react14.useState)(() => ({ name: was?.name || "", members: was?.members || [], reply: was?.reply || "all", order: was?.order || "list", rounds: was?.rounds || 2 }));
  const [error, setError] = (0, import_react14.useState)("");
  const [sure, setSure] = (0, import_react14.useState)(false);
  if (!groupSheet) return null;
  const q = (path) => `${path}?g=${encodeURIComponent(was?.id || "")}`;
  const shut = () => store.set({ groupSheet: null });
  const run = async (job) => {
    try {
      await job();
      setError("");
    } catch (e) {
      setError(e.message);
    }
  };
  const save = (e) => {
    e.preventDefault();
    void run(async () => {
      const body = { ...form, rounds: Number(form.rounds) };
      const d = await web(was ? q("/web/group/config") : "/web/groups", { method: "POST", body });
      if (d?.error) throw new Error(d.error);
      await reloadGroups();
      if (!was && d?.group?.id) store.set({ group: d.group.id, view: "chat" });
      shut();
    });
  };
  const remove = () => run(async () => {
    if (!sure) {
      setSure(true);
      return;
    }
    await web(q("/web/group/remove"), { method: "POST", body: {} });
    await reloadGroups();
    store.set({ group: "", groupSheet: null });
  });
  const toggle = (id) => setForm({ ...form, members: form.members.includes(id) ? form.members.filter((m) => m !== id) : [...form.members, id] });
  const choice = (key, options) => (0, import_react14.createElement)("div", { className: "ad-seg", role: "radiogroup" }, Object.entries(options).map(([v, label]) => (0, import_react14.createElement)("button", { key: v, type: "button", role: "radio", "aria-checked": form[key] === v, onClick: () => setForm({ ...form, [key]: v }) }, label)));
  return (0, import_react14.createElement)(
    "div",
    { className: "ad-scrim", onClick: (e) => {
      if (e.target === e.currentTarget) shut();
    }, onKeyDown: (e) => {
      if (e.key === "Escape") shut();
    } },
    (0, import_react14.createElement)(
      "form",
      { className: "ad-sheet small", role: "dialog", "aria-modal": true, "aria-label": was ? t.groupSettings : t.newGroup, onSubmit: save },
      (0, import_react14.createElement)(
        "div",
        { className: "ad-sheet-head" },
        (0, import_react14.createElement)("h2", null, was ? t.groupSettings : t.newGroup),
        (0, import_react14.createElement)("button", { type: "button", className: "ad-icon-btn sm", title: t.close, "aria-label": t.close, onClick: shut }, (0, import_react14.createElement)(Icon, { name: "close" }))
      ),
      (0, import_react14.createElement)(
        "div",
        { className: "ad-sheet-scroll" },
        (0, import_react14.createElement)(
          "div",
          { className: "ad-field-row" },
          (0, import_react14.createElement)("label", null, t.name),
          (0, import_react14.createElement)("div", { className: "ad-set-line" }, (0, import_react14.createElement)("input", { autoFocus: true, value: form.name, "aria-label": t.name, onChange: (e) => setForm({ ...form, name: e.target.value }) }))
        ),
        (0, import_react14.createElement)(
          "div",
          { className: "ad-field-row" },
          (0, import_react14.createElement)("label", null, t.members, (0, import_react14.createElement)("span", { className: "ok" }, `${form.members.length}`)),
          (0, import_react14.createElement)("div", { className: "ad-checks" }, residents.map((r) => (0, import_react14.createElement)(
            "label",
            { key: r.id, className: "ad-check" },
            (0, import_react14.createElement)("input", { type: "checkbox", checked: form.members.includes(r.id), onChange: () => toggle(r.id) }),
            (0, import_react14.createElement)(Face, { resident: r, base: status?.url, className: " mini" }),
            r.name || r.id
          )))
        ),
        (0, import_react14.createElement)("div", { className: "ad-field-row" }, (0, import_react14.createElement)("label", null, t.whoAnswers), choice("reply", t.reply)),
        (0, import_react14.createElement)("div", { className: "ad-field-row" }, choice("order", t.order)),
        (0, import_react14.createElement)(
          "div",
          { className: "ad-field-row" },
          (0, import_react14.createElement)("label", null, t.rounds),
          (0, import_react14.createElement)("div", { className: "ad-set-line" }, (0, import_react14.createElement)("input", { type: "number", min: 1, max: 10, value: form.rounds, "aria-label": t.rounds, style: { maxWidth: 90 }, onChange: (e) => setForm({ ...form, rounds: e.target.value }) }))
        ),
        error && (0, import_react14.createElement)("p", { className: "ad-error" }, error),
        (0, import_react14.createElement)(
          "div",
          { className: "ad-card-row" },
          was && (0, import_react14.createElement)("button", { type: "button", className: "ad-btn quiet small", onClick: () => run(() => web(q("/web/group/stop"), { method: "POST", body: {} })) }, (0, import_react14.createElement)(Icon, { name: "stop" }), t.stopGroup),
          was && (0, import_react14.createElement)("button", { type: "button", className: "ad-btn quiet small danger", onClick: remove }, (0, import_react14.createElement)(Icon, { name: "trash" }), sure ? t.sureDelete : t.removeGroup),
          (0, import_react14.createElement)("span", { className: "sp" }),
          (0, import_react14.createElement)("button", { type: "submit", className: "ad-btn small", disabled: form.members.length < 2 }, was ? t.save : t.create)
        )
      )
    )
  );
}

// client/left.mjs
var import_react16 = require("react");

// client/poll.mjs
var import_react15 = require("react");
function usePoll(load, ms, deps) {
  (0, import_react15.useEffect)(() => {
    void load();
    const timer = setInterval(() => {
      if (!document.hidden) void load();
    }, ms);
    return () => clearInterval(timer);
  }, deps);
}

// client/seen.mjs
var KEY2 = "aelios-desktop.seen";
function newsOf(list = [], current = "", seen = {}) {
  const next = { ...seen };
  const news = /* @__PURE__ */ new Set();
  for (const r of list) {
    if (!r?.id) continue;
    const said = Number(r.saidAt) || 0;
    if (r.id === current || next[r.id] === void 0) next[r.id] = Math.max(said, next[r.id] || 0);
    else if (said > next[r.id]) news.add(r.id);
  }
  return { news, seen: next };
}
function readSeen(storage = globalThis.localStorage) {
  try {
    return JSON.parse(storage?.getItem(KEY2) || "{}") || {};
  } catch {
    return {};
  }
}
function keepSeen(seen, storage = globalThis.localStorage) {
  try {
    storage?.setItem(KEY2, JSON.stringify(seen));
  } catch {
  }
}

// client/left.mjs
var POLL_MS3 = 3e4;
var ID = /^[a-z][a-z0-9-]{0,23}$/;
var loadResidents = async () => {
  store.set({ residents: (await web("/web/residents", { resident: "default" }))?.residents || [] });
};
var Label = ({ text, add, onAdd, open }) => (0, import_react16.createElement)(
  "p",
  { className: "ad-label ad-rail-label" },
  (0, import_react16.createElement)("span", null, text),
  onAdd && (0, import_react16.createElement)("button", { type: "button", className: "ad-icon-btn sm", title: add, "aria-label": add, "aria-expanded": open, onClick: onAdd }, (0, import_react16.createElement)(Icon, { name: "plus" }))
);
function NewResident({ t, onDone }) {
  const [form, setForm] = (0, import_react16.useState)({ id: "", name: "", error: "" });
  const save = async (e) => {
    e.preventDefault();
    const id = form.id.trim().toLowerCase();
    if (!ID.test(id) || id === "default") {
      setForm({ ...form, error: t.residentId });
      return;
    }
    try {
      await web("/web/residents", { method: "POST", body: { id, name: form.name.trim() }, resident: "default" });
      await loadResidents();
      onDone();
    } catch (err) {
      setForm({ ...form, error: err.message });
    }
  };
  return (0, import_react16.createElement)(
    "form",
    { className: "ad-rail-form", onSubmit: save },
    (0, import_react16.createElement)("input", { autoFocus: true, value: form.name, placeholder: t.name, "aria-label": t.name, onChange: (e) => setForm({ ...form, name: e.target.value }) }),
    (0, import_react16.createElement)("input", { value: form.id, placeholder: t.residentId, "aria-label": t.residentId, onChange: (e) => setForm({ ...form, id: e.target.value }) }),
    form.error && (0, import_react16.createElement)("span", { className: "ad-error" }, form.error),
    (0, import_react16.createElement)("div", { className: "ad-card-row" }, (0, import_react16.createElement)("button", { type: "submit", className: "ad-btn small" }, t.create), (0, import_react16.createElement)("button", { type: "button", className: "ad-btn quiet small", onClick: onDone }, t.cancel))
  );
}
function Left({ onBack }) {
  const t = words();
  const { status, residents, groups, group, view } = useStore(store);
  const resident = status?.resident || "default";
  const [adding, setAdding] = (0, import_react16.useState)(false);
  usePoll(async () => {
    try {
      await loadResidents();
    } catch {
    }
  }, POLL_MS3, []);
  usePoll(async () => {
    try {
      store.set({ groups: (await web("/web/groups"))?.groups || [] });
    } catch {
    }
  }, POLL_MS3, []);
  const list = residents.length ? residents : [{ id: resident, name: t.title }];
  const { news, seen } = newsOf(list, resident, readSeen());
  (0, import_react16.useEffect)(() => keepSeen(seen), [residents, resident]);
  const pick = async (id) => {
    if (id === resident) {
      store.set({ group: "", around: null, view: "chat" });
      return;
    }
    try {
      store.set({ group: "", around: null, view: "chat", status: await call("select", { resident: id }) });
    } catch (e) {
      store.set({ error: e.message });
    }
  };
  const start = async () => {
    try {
      store.set({ status: await call("start") });
    } catch (e) {
      store.set({ error: e.message });
    }
  };
  const runner = status?.runner || { state: "unpaired", error: "" };
  const word = t.runner[runner.state] || runner.state;
  const chat = view !== "machine";
  return (0, import_react16.createElement)(
    "nav",
    { className: "ad-rail", "aria-label": t.residents },
    (0, import_react16.createElement)(
      "div",
      { className: "ad-rail-head" },
      (0, import_react16.createElement)("span", { className: "ad-rail-mark", "aria-hidden": true }, "✦"),
      (0, import_react16.createElement)("span", { className: "ad-rail-brand" }, t.brand)
    ),
    (0, import_react16.createElement)(
      "div",
      { className: "ad-rail-list" },
      (0, import_react16.createElement)(Label, { text: t.residents, add: t.addResident, open: adding, onAdd: () => setAdding((v) => !v) }),
      adding && (0, import_react16.createElement)(NewResident, { t, onDone: () => setAdding(false) }),
      list.map((r) => (0, import_react16.createElement)(
        "button",
        {
          key: r.id,
          type: "button",
          className: "ad-row-btn",
          title: r.name || r.id,
          "aria-current": chat && r.id === resident && !group ? "page" : void 0,
          onClick: () => pick(r.id)
        },
        (0, import_react16.createElement)(Face, { resident: r, base: status?.url }),
        (0, import_react16.createElement)("span", { className: "n" }, r.name || r.id),
        news.has(r.id) && (0, import_react16.createElement)("span", { className: "ad-dot hot", title: t.unread, "aria-label": t.unread })
      )),
      (0, import_react16.createElement)(Label, { text: t.groups, add: t.newGroup, onAdd: () => store.set({ groupSheet: { id: "" } }) }),
      groupList(groups).map((g) => (0, import_react16.createElement)(
        "button",
        {
          key: g.id,
          type: "button",
          className: "ad-row-btn",
          title: g.name,
          "aria-current": chat && g.id === group ? "page" : void 0,
          onClick: () => store.set({ group: g.id, around: null, view: "chat" })
        },
        (0, import_react16.createElement)("span", { className: "ad-avatar", "aria-hidden": true }, g.icon ? (0, import_react16.createElement)("img", { src: avatarUrl(status?.url, g.icon), alt: "" }) : (0, import_react16.createElement)(Icon, { name: "people" })),
        (0, import_react16.createElement)("span", { className: "n" }, g.name),
        g.running && (0, import_react16.createElement)("span", { className: "ad-dot ok live", title: t.answering, "aria-label": t.answering })
      )),
      (0, import_react16.createElement)(Label, { text: t.here }),
      (0, import_react16.createElement)(
        "div",
        { className: "ad-row-wrap" },
        (0, import_react16.createElement)(
          "button",
          {
            type: "button",
            className: "ad-row-btn",
            title: `${t.runnerTitle}: ${word}${runner.error ? ` · ${runner.error}` : ""}`,
            "aria-current": view === "machine" ? "page" : void 0,
            onClick: () => store.set({ view: "machine" })
          },
          (0, import_react16.createElement)(
            "span",
            { className: "ad-avatar machine", "aria-hidden": true },
            (0, import_react16.createElement)(Icon, { name: "laptop" }),
            (0, import_react16.createElement)("span", { className: `ad-dot ${runnerTone(runner.state)}${runner.state === "starting" ? " live" : ""}` })
          ),
          (0, import_react16.createElement)("span", { className: "n" }, t.thisMachine, (0, import_react16.createElement)("small", null, word))
        ),
        runnerDown(runner.state) && (0, import_react16.createElement)("button", { type: "button", className: "ad-machine-go", title: t.start, "aria-label": t.start, onClick: start }, (0, import_react16.createElement)(Icon, { name: "play" }))
      )
    ),
    (0, import_react16.createElement)(
      "div",
      { className: "ad-rail-foot" },
      (0, import_react16.createElement)("button", { type: "button", className: "ad-icon-btn sm", title: t.settings, "aria-label": t.settings, onClick: () => store.set({ sheet: "resident" }) }, (0, import_react16.createElement)(Icon, { name: "gear" })),
      (0, import_react16.createElement)("span", { className: "sp" }),
      (0, import_react16.createElement)("button", { type: "button", className: "ad-dsh", title: t.backToDsh, "aria-label": t.backToDsh, onClick: onBack }, (0, import_react16.createElement)(Icon, { name: "exit" }), t.dsh)
    )
  );
}

// client/local-api.mjs
var unwired = (e) => /unknown action/i.test(e?.message || "");
async function loadLocal() {
  try {
    const [machine, sessions] = await Promise.all([call("machine"), call("sessions")]);
    store.set({ local: { wired: true, machine, sessions: sessions?.sessions || [] } });
  } catch (e) {
    if (unwired(e)) store.set({ local: { wired: false, machine: null, sessions: [] } });
  }
}
async function loadSession(thread) {
  try {
    return (await call("session", { thread }))?.session || null;
  } catch {
    return null;
  }
}
var permit = (id, allow) => call("permit", { id, allow });
var openInFiles = (path) => call("open", path ? { path } : {});
var present = () => call("present").catch(() => {
});

// client/machine-view.mjs
var import_react18 = require("react");

// client/info.mjs
var import_react17 = require("react");
function Explained({ head, text, className = "" }) {
  const [open, setOpen] = (0, import_react17.useState)(false);
  const t = words();
  return (0, import_react17.createElement)(
    import_react17.Fragment,
    null,
    (0, import_react17.createElement)(
      "div",
      { className: `ad-explained ${className}`.trim() },
      head,
      (0, import_react17.createElement)("button", { type: "button", className: "ad-info", title: t.info, "aria-label": t.info, "aria-expanded": open, onClick: () => setOpen((v) => !v) }, (0, import_react17.createElement)(Icon, { name: "info" }))
    ),
    open && (0, import_react17.createElement)("p", { className: "ad-info-text" }, text)
  );
}
function Empty({ icon, text, why = "" }) {
  return (0, import_react17.createElement)(
    "div",
    { className: "ad-empty" },
    (0, import_react17.createElement)("span", { "aria-hidden": true }, (0, import_react17.createElement)(Icon, { name: icon })),
    why ? (0, import_react17.createElement)(Explained, { head: (0, import_react17.createElement)("span", null, text), text: why }) : (0, import_react17.createElement)("span", null, text)
  );
}

// client/machine-view.mjs
var ago = (at) => {
  const s = Math.max(0, Math.round((Date.now() - Number(at)) / 1e3));
  return s < 60 ? `${s}s` : s < 3600 ? `${Math.round(s / 60)}m` : `${Math.round(s / 3600)}h`;
};
function Live({ runner, info, t, act, pick, switching }) {
  const tone = runnerTone(runner.state);
  const helper = info?.plugin || "";
  return (0, import_react18.createElement)(
    "div",
    { className: "ad-mv-card live" },
    (0, import_react18.createElement)(Explained, { className: "ad-mv-title", text: t.machineInfo, head: (0, import_react18.createElement)("span", { className: "ad-label" }, t.runnerTitle) }),
    (0, import_react18.createElement)(
      "div",
      { className: "ad-mv-state" },
      (0, import_react18.createElement)("span", { className: `ad-dot big ${tone}${runner.state === "starting" || runner.state === "running" ? " live" : ""}`, "aria-hidden": true }),
      (0, import_react18.createElement)("b", null, t.runner[runner.state] || runner.state),
      runner.since && (0, import_react18.createElement)("span", { className: "ad-mi" }, `${t.since} ${new Date(runner.since).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`),
      runner.pid && (0, import_react18.createElement)("span", { className: "ad-mi", title: "PID" }, `#${runner.pid}`)
    ),
    runner.error && (0, import_react18.createElement)("p", { className: "ad-error" }, runner.error),
    (0, import_react18.createElement)(
      "div",
      { className: "ad-card-row" },
      helper && (0, import_react18.createElement)("span", { className: "ad-seg", role: "group", "aria-label": t.helper, title: t.helper }, ["dsh", "kiro"].map((id) => (0, import_react18.createElement)(
        "button",
        { key: id, type: "button", "aria-pressed": helper === id, disabled: switching, onClick: () => helper !== id && pick(id) },
        (0, import_react18.createElement)(Icon, { name: HELPER_ICON[id] }),
        t.helpers[id]
      ))),
      info?.access && (0, import_react18.createElement)("span", { className: `ad-pill ${info.access === "full" ? "bad" : info.access === "edit" ? "warn" : "idle"}`, title: t.access }, (0, import_react18.createElement)(Icon, { name: "shield" }), t.tier[info.access] || info.access),
      (0, import_react18.createElement)("span", { className: "sp" }),
      runnerDown(runner.state) || runner.state === "unpaired" ? (0, import_react18.createElement)("button", { type: "button", className: "ad-btn small", onClick: act("start") }, (0, import_react18.createElement)(Icon, { name: "play" }), t.start) : (0, import_react18.createElement)("button", { type: "button", className: "ad-btn quiet small", onClick: act("stop") }, (0, import_react18.createElement)(Icon, { name: "stop" }), t.stopRunner),
      (0, import_react18.createElement)("button", { type: "button", className: "ad-btn quiet small", onClick: act("repair") }, (0, import_react18.createElement)(Icon, { name: "refresh" }), t.pair)
    )
  );
}
function Sessions({ sessions, titles, t }) {
  const open = (thread) => store.set({ focus: thread, right: { ...store.get().right, open: true, panel: "threads" } });
  if (!sessions.length) return (0, import_react18.createElement)("p", { className: "ad-hint" }, t.noSessions);
  return (0, import_react18.createElement)("div", { className: "ad-mv-list" }, sessions.map((s) => {
    const tone = taskTone(s.status);
    return (0, import_react18.createElement)(
      "button",
      { key: s.thread, type: "button", className: "ad-mv-row", title: t.open, onClick: () => open(s.thread) },
      (0, import_react18.createElement)("span", { className: "ad-helper", title: t.helpers[s.plugin] || s.plugin }, (0, import_react18.createElement)(Icon, { name: HELPER_ICON[s.plugin] || "plug" })),
      (0, import_react18.createElement)("span", { className: "n" }, titles[s.thread] || s.thread),
      s.pending > 0 && (0, import_react18.createElement)("span", { className: "ad-mi hot", title: t.allow }, (0, import_react18.createElement)(Icon, { name: "shield" }), s.pending),
      (0, import_react18.createElement)("span", { className: "ad-mi", title: `${s.tools} ${t.toolsN}` }, (0, import_react18.createElement)(Icon, { name: "wrench" }), s.tools),
      (0, import_react18.createElement)("span", { className: "ad-mi", title: `${s.files} ${t.filesN}` }, (0, import_react18.createElement)(Icon, { name: "file" }), s.files),
      (0, import_react18.createElement)("span", { className: "ad-mi", title: `${s.commands} ${t.commandsN}` }, (0, import_react18.createElement)(Icon, { name: "terminal" }), s.commands),
      (0, import_react18.createElement)("span", { className: `ad-pill ${tone}` }, (0, import_react18.createElement)("span", { className: `ad-dot ${tone}${s.status === "working" ? " live" : ""}`, "aria-hidden": true }), t.task[s.status] || s.status),
      (0, import_react18.createElement)("span", { className: "ad-card-time" }, when(s.at))
    );
  }));
}
function MachineView() {
  const t = words();
  const { status, local } = useStore(store);
  const resident = status?.resident || "default";
  const [titles, setTitles] = (0, import_react18.useState)({});
  const [showLog, setShowLog] = (0, import_react18.useState)(true);
  const [error, setError] = (0, import_react18.useState)("");
  usePoll(loadLocal, 2e3, []);
  usePoll(async () => {
    try {
      setTitles(Object.fromEntries(((await loadThreads(resident))?.threads || []).map((x) => [x.id, x.title])));
    } catch {
    }
  }, 15e3, [resident]);
  const [switching, setSwitching] = (0, import_react18.useState)(false);
  const pick = async (helper) => {
    setSwitching(true);
    try {
      store.set({ status: await call("helper", { helper }) });
      setError("");
      await loadLocal();
    } catch (e) {
      setError(e.message);
    } finally {
      setSwitching(false);
    }
  };
  const act = (action) => async () => {
    try {
      store.set({ status: await call(action) });
      setError("");
    } catch (e) {
      setError(e.message);
    }
  };
  const runner = { ...status?.runner || { state: "unpaired" }, ...local.machine?.runner || {} };
  const info = local.machine?.info || null;
  const cloud = local.machine?.cloud || null;
  const tone = runnerTone(runner.state);
  const face = (0, import_react18.createElement)("span", { className: "ad-avatar", "aria-hidden": true }, (0, import_react18.createElement)(Icon, { name: "laptop" }));
  const meta = (0, import_react18.createElement)("span", { className: "ad-meta-chip" }, (0, import_react18.createElement)("span", { className: `ad-dot ${tone}`, "aria-hidden": true }), t.runner[runner.state] || runner.state);
  return (0, import_react18.createElement)(
    "section",
    { className: "ad-main", "aria-label": t.thisMachine },
    (0, import_react18.createElement)(ChatHead, { face, name: t.thisMachine, meta }),
    (0, import_react18.createElement)(
      "div",
      { className: "ad-mv" },
      error && (0, import_react18.createElement)("div", { className: "ad-error", role: "alert" }, error),
      local.wired === false && (0, import_react18.createElement)("p", { className: "ad-info-text ad-mv-wide" }, t.notWired),
      (0, import_react18.createElement)(Live, { runner, info, t, act, pick, switching }),
      (0, import_react18.createElement)(
        "div",
        { className: "ad-mv-card" },
        (0, import_react18.createElement)("span", { className: "ad-label" }, t.workspace),
        (0, import_react18.createElement)("div", { className: "ad-mv-folder" }, (0, import_react18.createElement)(Icon, { name: "folder" }), (0, import_react18.createElement)("code", { title: info?.workspace || "" }, info?.workspace || "—")),
        (0, import_react18.createElement)(
          "div",
          { className: "ad-card-row" },
          (0, import_react18.createElement)("button", { type: "button", className: "ad-btn quiet small", disabled: !info?.workspace, onClick: () => openInFiles().catch((e) => setError(e.message)) }, (0, import_react18.createElement)(Icon, { name: "open" }), t.openFolder),
          (0, import_react18.createElement)("span", { className: "sp" }),
          cloud && (0, import_react18.createElement)(
            "span",
            { className: "ad-mi", title: cloud.lastSeenAt ? `${t.lastSeen} ${ago(cloud.lastSeenAt)}` : "" },
            (0, import_react18.createElement)("span", { className: `ad-dot ${cloud.online ? "ok" : "idle"}`, "aria-hidden": true }),
            cloud.online ? t.seen : t.unseen
          )
        )
      ),
      (0, import_react18.createElement)(
        "div",
        { className: "ad-mv-card" },
        (0, import_react18.createElement)(
          "div",
          { className: "ad-mv-tiles" },
          (0, import_react18.createElement)("div", null, (0, import_react18.createElement)("small", null, t.runningNow), (0, import_react18.createElement)("b", { title: info?.running?.thread || "" }, info?.running ? titles[info.running.thread] || info.running.thread : t.idle)),
          (0, import_react18.createElement)("div", null, (0, import_react18.createElement)("small", null, t.queued), (0, import_react18.createElement)("b", null, info ? info.queued : "—")),
          (0, import_react18.createElement)("div", null, (0, import_react18.createElement)("small", null, t.unsent), (0, import_react18.createElement)("b", null, info ? info.unsent : "—"))
        )
      ),
      (0, import_react18.createElement)(
        "div",
        { className: "ad-mv-card ad-mv-wide" },
        (0, import_react18.createElement)("span", { className: "ad-label" }, t.localSessions, local.sessions.length > 0 && (0, import_react18.createElement)("span", { className: "ad-badge" }, local.sessions.length)),
        (0, import_react18.createElement)(Sessions, { sessions: local.sessions, titles, t })
      ),
      (runner.log || []).length > 0 && (0, import_react18.createElement)(
        "div",
        { className: "ad-mv-card ad-mv-wide" },
        (0, import_react18.createElement)("button", { type: "button", className: "ad-fold ad-label", "aria-expanded": showLog, onClick: () => setShowLog((v) => !v) }, (0, import_react18.createElement)(Icon, { name: "down" }), t.log),
        showLog && (0, import_react18.createElement)("pre", { className: "ad-mv-log", "aria-live": "polite" }, runner.log.map((line) => line.text).join("\n"))
      )
    )
  );
}

// client/sheet.mjs
var import_react24 = require("react");

// client/sheet-resident.mjs
var import_react19 = require("react");

// client/settings.mjs
var LABELS = {
  RESIDENT_NAME: "Name",
  MODEL: "Model",
  WEB_PUSH: "What to push",
  RESIDENT_TZ: "Time zone",
  HEARTBEAT: "Check-ins",
  ALARMS: "Alarms",
  STICKERS: "Stickers",
  VOICE_REPLY: "Voice replies",
  BG_TASK: "Background help",
  TASK_EXECUTION: "Where threads run",
  THINKING: "Thinking",
  TIME_ZONE: "Time zone",
  TG_BOT_TOKEN: "Telegram bot token",
  TG_ALLOWED: "Telegram: who may talk",
  WECOM_ALLOWED: "WeCom: who may talk",
  AELIOS_URL: "Aelios address",
  AELIOS_API_KEY: "Aelios key",
  CLOUD_TASKS: "Background help",
  CLOUD_TASK_GITHUB_TOKEN: "GitHub token",
  CLOUD_TASK_MODEL: "Model for threads",
  THINKING_EFFORT: "Thinking effort"
};
var SECTIONS = [
  ["channels", /^(TG_|WECOM_|WEB_PUSH$)/],
  ["model", /^(CUSTOM_|CLAUDE_|AI_GATEWAY)/],
  ["memory", /^AELIOS_/],
  ["time", /^(TIME_ZONE|CHECKIN_SCHEDULE|HEARTBEAT|QUIET_HOURS|ALARMS)$/],
  ["web", /^(WEB_|TAVILY_|BRAVE_|PERPLEXITY_)/],
  ["voice", /^(VOICE_|STICKERS$)/],
  ["work", /^CLOUD_TASK/]
];
var sectionOf = (key) => SECTIONS.find(([, rule]) => rule.test(String(key || "")))?.[0] || "resident";
var humanKey = (key) => String(key || "").toLowerCase().split("_").filter(Boolean).map((word, i) => i === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word).join(" ");
var labelOf = (key) => LABELS[key] || humanKey(key);
function shownValue(field) {
  if (!field) return "";
  if (field.kind === "secret") return field.saved ? "saved" : field.workerHas ? "from the Worker" : "";
  return field.value || field.fromWorker || "";
}
function settingRows(config) {
  const fields = Array.isArray(config?.fields) ? config.fields : [];
  return fields.map((field) => ({
    key: field.key,
    label: labelOf(field.key),
    kind: field.kind,
    choices: field.choices || [],
    value: shownValue(field),
    secret: field.kind === "secret"
  }));
}
function modelRows(models = []) {
  return models.filter((m) => m && (m.id || m.name)).map((m) => ({ id: String(m.id || m.name), name: String(m.name || m.id), note: m.group || m.provider || "" }));
}

// client/sheet-resident.mjs
function Letter({ letter, t, onRetry, busy }) {
  const d = letter?.delivery || {};
  const written = Boolean(letter?.write);
  return (0, import_react19.createElement)(
    "div",
    { className: "ad-sheet-block" },
    (0, import_react19.createElement)(Explained, { className: "ad-sheet-subhead", text: t.letterInfo, head: (0, import_react19.createElement)("span", { className: "ad-label" }, (0, import_react19.createElement)(Icon, { name: "mail" }), t.letter) }),
    (0, import_react19.createElement)(
      "div",
      { className: "ad-card-row" },
      (0, import_react19.createElement)("span", { className: `ad-pill ${written ? "ok" : "idle"}` }, (0, import_react19.createElement)("span", { className: `ad-dot ${written ? "ok" : "idle"}` }), written ? t.letterState.written : t.letterState.none),
      d.pending > 0 && (0, import_react19.createElement)("span", { className: "ad-mi", title: t.onItsWay }, (0, import_react19.createElement)("span", { className: "ad-dot warn live" }), d.pending),
      d.failed > 0 && (0, import_react19.createElement)("span", { className: "ad-mi", title: t.failedToSend }, (0, import_react19.createElement)("span", { className: "ad-dot bad" }), d.failed),
      d.blocked > 0 && (0, import_react19.createElement)("span", { className: "ad-mi", title: t.blocked }, (0, import_react19.createElement)("span", { className: "ad-dot bad" }), d.blocked),
      (0, import_react19.createElement)("span", { className: "sp" }),
      letter?.canRetry && (0, import_react19.createElement)("button", { type: "button", className: "ad-btn quiet small", disabled: busy, onClick: onRetry }, (0, import_react19.createElement)(Icon, { name: "refresh" }), t.retryLetter)
    ),
    d.latest?.lastError && (0, import_react19.createElement)("p", { className: "ad-hint" }, d.latest.lastError)
  );
}
function ResidentSection({ rows, reload }) {
  const t = words();
  const { status, residents } = useStore(store);
  const resident = status?.resident || "default";
  const me = residents.find((r) => r.id === resident) || { id: resident, name: t.title };
  const [name, setName] = (0, import_react19.useState)(me.name || "");
  const [models, setModels] = (0, import_react19.useState)(null);
  const [model, setModel] = (0, import_react19.useState)({ now: "", saved: "" });
  const [persona, setPersona] = (0, import_react19.useState)({ draft: "", saved: "" });
  const [letter, setLetter] = (0, import_react19.useState)(null);
  const [busy, setBusy] = (0, import_react19.useState)("");
  const [note, setNote] = (0, import_react19.useState)("");
  const [sure, setSure] = (0, import_react19.useState)(false);
  const face = (0, import_react19.useRef)(null);
  (0, import_react19.useEffect)(() => {
    void (async () => {
      const [m, md, p, lt] = await Promise.allSettled([web("/web/models", { resident }), web("/web/model", { resident }), web("/web/persona", { resident }), web("/web/letter", { resident })]);
      if (m.status === "fulfilled") setModels(modelRows(m.value?.models));
      if (md.status === "fulfilled") {
        const now = md.value?.model || md.value?.fallback || "";
        setModel({ now, saved: now });
      }
      if (p.status === "fulfilled") setPersona({ draft: p.value?.text || "", saved: p.value?.text || "" });
      if (lt.status === "fulfilled") setLetter(lt.value);
    })();
  }, [resident]);
  (0, import_react19.useEffect)(() => setName(me.name || ""), [me.name]);
  const act = (key, job) => async () => {
    if (busy) return;
    setBusy(key);
    setNote("");
    try {
      await job();
      setNote(t.saved);
    } catch (e) {
      setNote(e.message);
    } finally {
      setBusy("");
    }
  };
  const residentsAgain = async () => store.set({ residents: (await web("/web/residents", { resident: "default" }))?.residents || [] });
  const saveName = act("name", async () => {
    await web("/web/config", { method: "POST", body: { key: "RESIDENT_NAME", text: name }, resident });
    await residentsAgain();
    reload();
  });
  const saveModel = act("model", async () => {
    await web("/web/model", { method: "POST", body: { text: model.now }, resident });
    setModel({ ...model, saved: model.now });
  });
  const savePersona = act("persona", async () => {
    const saved = await web("/web/persona", { method: "POST", body: { text: persona.draft }, resident });
    setPersona({ draft: saved?.text ?? persona.draft, saved: saved?.text ?? persona.draft });
  });
  const pickFace = act("face", async () => {
    const file = face.current?.files?.[0];
    if (!file) return;
    const pic = await readFace(file);
    await upload("/web/avatar", pic.data, pic.type, { resident });
    await residentsAgain();
  });
  const dropFace = act("drop", async () => {
    await upload("/web/avatar/remove", "", "application/json", { resident });
    await residentsAgain();
  });
  const remove = act("remove", async () => {
    if (!sure) {
      setSure(true);
      return;
    }
    await web("/web/residents/remove", { method: "POST", body: { id: resident }, resident: "default" });
    store.set({ sheet: "", status: await call("select", { resident: "default" }) });
    await residentsAgain();
  });
  return (0, import_react19.createElement)(
    "div",
    { className: "ad-sheet-sections" },
    (0, import_react19.createElement)(
      "div",
      { className: "ad-sheet-me" },
      (0, import_react19.createElement)(Face, { resident: me, base: status?.url }),
      (0, import_react19.createElement)("div", null, (0, import_react19.createElement)("b", null, me.name || me.id), (0, import_react19.createElement)("span", null, me.id)),
      (0, import_react19.createElement)("input", { ref: face, type: "file", accept: "image/*", hidden: true, onChange: () => pickFace() }),
      (0, import_react19.createElement)("button", { type: "button", className: "ad-btn quiet small", onClick: () => face.current?.click() }, (0, import_react19.createElement)(Icon, { name: "pencil" }), t.setFace),
      me.avatar && (0, import_react19.createElement)("button", { type: "button", className: "ad-icon-btn sm danger", title: t.dropFace, "aria-label": t.dropFace, onClick: dropFace }, (0, import_react19.createElement)(Icon, { name: "trash" }))
    ),
    (0, import_react19.createElement)(
      "div",
      { className: "ad-sheet-block" },
      (0, import_react19.createElement)(
        "div",
        { className: "ad-field-row" },
        (0, import_react19.createElement)("label", null, t.name),
        (0, import_react19.createElement)(
          "div",
          { className: "ad-set-line" },
          (0, import_react19.createElement)("input", { value: name, "aria-label": t.name, onChange: (e) => setName(e.target.value) }),
          (0, import_react19.createElement)("button", { type: "button", className: "ad-btn quiet small", disabled: Boolean(busy) || name === (me.name || ""), onClick: saveName }, t.save)
        )
      ),
      (0, import_react19.createElement)(
        "div",
        { className: "ad-field-row" },
        (0, import_react19.createElement)("label", null, t.model),
        (0, import_react19.createElement)(
          "div",
          { className: "ad-set-line" },
          // Free text with the list as suggestions: a model the list lacks (claude-code/<model>, the Claude box) can be typed.
          (0, import_react19.createElement)("input", { value: model.now, list: "ad-models", "aria-label": t.model, spellCheck: false, onChange: (e) => setModel({ ...model, now: e.target.value }) }),
          (0, import_react19.createElement)("datalist", { id: "ad-models" }, (models || []).map((m) => (0, import_react19.createElement)("option", { key: m.id, value: m.id }, m.name))),
          (0, import_react19.createElement)("button", { type: "button", className: "ad-btn quiet small", disabled: Boolean(busy) || model.now === model.saved, onClick: saveModel }, t.save)
        )
      ),
      (0, import_react19.createElement)(
        "div",
        { className: "ad-field-row" },
        (0, import_react19.createElement)("label", { htmlFor: "ad-persona" }, t.persona),
        (0, import_react19.createElement)("textarea", { id: "ad-persona", className: "ad-persona", rows: 6, value: persona.draft, onChange: (e) => setPersona({ ...persona, draft: e.target.value }) }),
        (0, import_react19.createElement)(
          "div",
          { className: "ad-card-row" },
          (0, import_react19.createElement)("span", { className: "sp" }),
          (0, import_react19.createElement)("button", { type: "button", className: "ad-btn small", disabled: Boolean(busy) || persona.draft === persona.saved, onClick: savePersona }, t.save)
        )
      )
    ),
    (0, import_react19.createElement)(Letter, { letter, t, busy: Boolean(busy), onRetry: act("letter", async () => setLetter(await web("/web/letter/retry", { method: "POST", body: {}, resident }))) }),
    note && (0, import_react19.createElement)("p", { className: "ad-hint" }, note),
    resident !== "default" && (0, import_react19.createElement)(
      "div",
      { className: "ad-card-row" },
      (0, import_react19.createElement)("span", { className: "sp" }),
      (0, import_react19.createElement)("button", { type: "button", className: "ad-btn quiet small danger", onClick: remove }, (0, import_react19.createElement)(Icon, { name: "trash" }), sure ? t.sureDelete : t.removeResident)
    )
  );
}

// client/sheet-fields.mjs
var import_react20 = require("react");
function FieldRow({ row, resident, onSaved }) {
  const t = words();
  const initial = row.secret ? "" : row.value;
  const [draft, setDraft] = (0, import_react20.useState)(initial);
  const [state, setState] = (0, import_react20.useState)("");
  (0, import_react20.useEffect)(() => setDraft(initial), [initial]);
  const save = async () => {
    setState("…");
    try {
      await web("/web/config", { method: "POST", body: { key: row.key, text: draft }, resident });
      setState(t.saved);
      onSaved?.();
    } catch (e) {
      setState(e.message);
    }
  };
  const field = row.choices.length ? (0, import_react20.createElement)("select", { value: draft, "aria-label": row.label, onChange: (e) => setDraft(e.target.value) }, ["", ...row.choices].map((c) => (0, import_react20.createElement)("option", { key: c, value: c }, c || "—"))) : (0, import_react20.createElement)("input", {
    type: row.secret ? "password" : "text",
    value: draft,
    "aria-label": row.label,
    placeholder: row.secret && row.value ? t.secretSaved : "",
    onChange: (e) => setDraft(e.target.value)
  });
  return (0, import_react20.createElement)(
    "div",
    { className: "ad-field-row" },
    (0, import_react20.createElement)("label", null, row.label, state && (0, import_react20.createElement)("span", { className: state === t.saved ? "ok" : "" }, state)),
    (0, import_react20.createElement)(
      "div",
      { className: "ad-set-line" },
      field,
      (0, import_react20.createElement)("button", { type: "button", className: "ad-btn quiet small", disabled: draft === initial, onClick: save }, t.save)
    )
  );
}
function Fields({ rows, section, resident, onSaved, skip = [] }) {
  const t = words();
  const [q, setQ] = (0, import_react20.useState)("");
  const mine = rows.filter((row) => sectionOf(row.key) === section && !skip.includes(row.key));
  if (!mine.length) return null;
  const shown = q ? mine.filter((row) => `${row.label} ${row.key}`.toLowerCase().includes(q.toLowerCase())) : mine;
  return (0, import_react20.createElement)(
    "div",
    { className: "ad-sheet-block" },
    (0, import_react20.createElement)(Explained, { className: "ad-sheet-subhead", text: t.fieldsInfo, head: [
      (0, import_react20.createElement)("span", { key: "l", className: "ad-label" }, t.settings),
      mine.length > 8 && (0, import_react20.createElement)("input", { key: "f", className: "ad-filter", type: "search", value: q, placeholder: t.filter, "aria-label": t.filter, onChange: (e) => setQ(e.target.value) })
    ] }),
    shown.length === 0 && (0, import_react20.createElement)("p", { className: "ad-hint" }, t.noMatch),
    shown.map((row) => (0, import_react20.createElement)(FieldRow, { key: row.key, row, resident, onSaved }))
  );
}

// client/sheet-more.mjs
var import_react21 = require("react");
function usePost(resident) {
  const [error, setError] = (0, import_react21.useState)("");
  const post2 = async (path, body = {}) => {
    try {
      const d = await web(path, { method: "POST", body, resident });
      if (d?.error) throw new Error(d.error);
      setError("");
      return d;
    } catch (e) {
      setError(e.message);
      return null;
    }
  };
  return [post2, error];
}
function StickersBlock({ resident }) {
  const t = words();
  const { status } = useStore(store);
  const [packs, setPacks] = (0, import_react21.useState)(null);
  const [link, setLink] = (0, import_react21.useState)("");
  const [post2, error] = usePost(resident);
  (0, import_react21.useEffect)(() => {
    void web("/web/stickers", { resident }).then((d) => setPacks(d?.packs || [])).catch(() => setPacks([]));
  }, [resident]);
  const after = (d) => {
    if (d?.packs) setPacks(d.packs);
  };
  return (0, import_react21.createElement)(
    "div",
    { className: "ad-sheet-block" },
    (0, import_react21.createElement)("span", { className: "ad-label" }, (0, import_react21.createElement)(Icon, { name: "sticker" }), t.packs),
    (packs || []).map((p) => (0, import_react21.createElement)(
      "div",
      { key: p.id, className: "ad-pack-row" },
      (0, import_react21.createElement)(
        "div",
        { className: "ad-list-row" },
        (0, import_react21.createElement)("span", { className: "n" }, p.name || p.id, (0, import_react21.createElement)("small", null, `${(p.stickers || []).length}`)),
        (0, import_react21.createElement)("label", { className: "ad-switch", title: p.enabled ? "On" : "Off" }, (0, import_react21.createElement)("input", { type: "checkbox", checked: Boolean(p.enabled), onChange: async (e) => after(await post2("/web/stickers/pack", { id: p.id, on: e.target.checked })) }), (0, import_react21.createElement)("span", null)),
        (0, import_react21.createElement)("button", { type: "button", className: "ad-icon-btn sm danger", title: t.drop, "aria-label": t.drop, onClick: async () => after(await post2("/web/stickers/remove", { id: p.id })) }, (0, import_react21.createElement)(Icon, { name: "trash" }))
      ),
      (0, import_react21.createElement)("div", { className: "ad-pack-strip" }, (p.stickers || []).slice(0, 12).map((s) => (0, import_react21.createElement)("img", { key: s.key, src: stickerSrc(status?.url, resident, s.key), alt: s.name || "", title: s.when || s.name || "" })))
    )),
    (0, import_react21.createElement)(
      "form",
      { className: "ad-sheet-form row", onSubmit: async (e) => {
        e.preventDefault();
        const d = await post2("/web/stickers/import", { url: link });
        if (d) {
          after(d);
          setLink("");
        }
      } },
      (0, import_react21.createElement)("input", { placeholder: t.packLink, "aria-label": t.importPack, value: link, onChange: (e) => setLink(e.target.value) }),
      (0, import_react21.createElement)("button", { type: "submit", className: "ad-btn quiet small", disabled: !link }, (0, import_react21.createElement)(Icon, { name: "plus" }), t.importPack)
    ),
    error && (0, import_react21.createElement)("p", { className: "ad-error" }, error)
  );
}
function TelegramBlock({ resident }) {
  const t = words();
  const [post2, error] = usePost(resident);
  const [done, setDone] = (0, import_react21.useState)(false);
  return (0, import_react21.createElement)(
    "div",
    { className: "ad-card-row" },
    (0, import_react21.createElement)("span", { className: "ad-label" }, t.telegram),
    (0, import_react21.createElement)("span", { className: "sp" }),
    done && (0, import_react21.createElement)("span", { className: "ad-pill ok" }, (0, import_react21.createElement)("span", { className: "ad-dot ok" }), t.saved),
    (0, import_react21.createElement)("button", { type: "button", className: "ad-btn quiet small", onClick: async () => setDone(Boolean(await post2("/web/telegram/connect"))) }, (0, import_react21.createElement)(Icon, { name: "plug" }), t.telegramConnect),
    error && (0, import_react21.createElement)("p", { className: "ad-error full" }, error)
  );
}
function WorkBlock({ resident }) {
  const t = words();
  const [tasks, setTasks] = (0, import_react21.useState)(null);
  const [role, setRole] = (0, import_react21.useState)(null);
  const [post2, error] = usePost(resident);
  (0, import_react21.useEffect)(() => {
    void web("/web/tasks", { resident }).then(setTasks).catch(() => setTasks(null));
  }, [resident]);
  const after = (d) => {
    if (d && !d.error && d.roles) setTasks(d);
  };
  return (0, import_react21.createElement)(
    "div",
    { className: "ad-sheet-block" },
    (0, import_react21.createElement)(
      "div",
      { className: "ad-card-row" },
      (0, import_react21.createElement)("button", { type: "button", className: "ad-btn quiet small", onClick: async () => after(await post2("/web/tasks/github")) }, (0, import_react21.createElement)(Icon, { name: "cloud" }), t.githubSetup),
      (0, import_react21.createElement)("button", { type: "button", className: "ad-btn quiet small", onClick: async () => after(await post2("/web/tasks/test")) }, (0, import_react21.createElement)(Icon, { name: "play" }), t.testTask),
      tasks?.github?.repo && (0, import_react21.createElement)("span", { className: "ad-mi" }, (0, import_react21.createElement)(Icon, { name: "folder" }), tasks.github.repo)
    ),
    tasks?.github?.problem && (0, import_react21.createElement)("p", { className: "ad-error" }, tasks.github.problem),
    (0, import_react21.createElement)(
      "div",
      { className: "ad-sheet-subhead" },
      (0, import_react21.createElement)("span", { className: "ad-label" }, t.roles),
      (0, import_react21.createElement)("span", { className: "sp" }),
      (0, import_react21.createElement)("button", { type: "button", className: "ad-btn quiet small", "aria-expanded": Boolean(role), onClick: () => setRole(role ? null : { name: "", template: "", model: "" }) }, (0, import_react21.createElement)(Icon, { name: "plus" }), t.addRole)
    ),
    role && (0, import_react21.createElement)(
      "form",
      { className: "ad-sheet-form", onSubmit: async (e) => {
        e.preventDefault();
        const d = await post2("/web/tasks/roles", role);
        if (d) {
          after(d);
          setRole(null);
        }
      } },
      (0, import_react21.createElement)("input", { placeholder: t.roleName, "aria-label": t.roleName, value: role.name, onChange: (e) => setRole({ ...role, name: e.target.value }) }),
      (0, import_react21.createElement)("textarea", { rows: 3, placeholder: t.roleTemplate, "aria-label": t.roleTemplate, value: role.template, onChange: (e) => setRole({ ...role, template: e.target.value }) }),
      (0, import_react21.createElement)("input", { placeholder: t.roleModel, "aria-label": t.roleModel, value: role.model, onChange: (e) => setRole({ ...role, model: e.target.value }) }),
      (0, import_react21.createElement)("button", { type: "submit", className: "ad-btn small", disabled: !role.name }, t.save)
    ),
    (tasks?.roles || []).map((r) => (0, import_react21.createElement)(
      "div",
      { key: r.name, className: "ad-list-row" },
      (0, import_react21.createElement)("span", { className: "n" }, r.name, (0, import_react21.createElement)("small", null, r.model || "")),
      (0, import_react21.createElement)("button", { type: "button", className: "ad-icon-btn sm danger", title: t.drop, "aria-label": t.drop, onClick: async () => after(await post2("/web/tasks/roles/remove", { name: r.name })) }, (0, import_react21.createElement)(Icon, { name: "trash" }))
    )),
    error && (0, import_react21.createElement)("p", { className: "ad-error" }, error)
  );
}
function AppSection() {
  const t = words();
  const lang = langNow();
  const off = async () => {
    try {
      store.set({ sheet: "", status: await call("disconnect") });
    } catch (e) {
      store.set({ error: e.message });
    }
  };
  return (0, import_react21.createElement)(
    "div",
    { className: "ad-sheet-sections" },
    (0, import_react21.createElement)(
      "div",
      { className: "ad-sheet-block" },
      (0, import_react21.createElement)("span", { className: "ad-label" }, (0, import_react21.createElement)(Icon, { name: "globe" }), t.language),
      (0, import_react21.createElement)("div", { className: "ad-seg", role: "radiogroup", "aria-label": t.language }, LANGS.map((l) => (0, import_react21.createElement)("button", {
        key: l.id,
        type: "button",
        role: "radio",
        "aria-checked": l.id === lang,
        onClick: () => {
          setLang(l.id);
          store.set({ lang: l.id });
        }
      }, l.name)))
    ),
    (0, import_react21.createElement)(
      "div",
      { className: "ad-sheet-block" },
      (0, import_react21.createElement)(
        "div",
        { className: "ad-card-row" },
        (0, import_react21.createElement)("span", { className: "ad-label" }, t.disconnect),
        (0, import_react21.createElement)("span", { className: "sp" }),
        (0, import_react21.createElement)("button", { type: "button", className: "ad-btn quiet small danger", onClick: off }, (0, import_react21.createElement)(Icon, { name: "exit" }), t.disconnect)
      )
    )
  );
}

// client/sheet-tools.mjs
var import_react22 = require("react");

// client/mcp.mjs
function hostOf(url) {
  try {
    return new URL(String(url || "")).host || String(url || "");
  } catch {
    return String(url || "");
  }
}
function mcpState(state) {
  return { ready: "connected", authenticating: "waiting for you to sign in", "not-connected": "not connected", error: "not connected", failed: "not connected" }[state] || state || "";
}
function mcpRows(servers = []) {
  return (servers || []).filter(Boolean).map((s) => ({
    id: s.id,
    name: s.name || hostOf(s.url),
    host: hostOf(s.url),
    state: s.state,
    word: mcpState(s.state),
    tools: Number(s.tools) || 0,
    error: s.error || "",
    authUrl: s.authUrl || "",
    hasKey: Boolean(s.hasKey)
  }));
}

// client/sheet-tools.mjs
function useList(path, resident, pick) {
  const [list, setList] = (0, import_react22.useState)(null);
  (0, import_react22.useEffect)(() => {
    void web(path, { resident }).then((d) => setList(pick(d))).catch(() => setList([]));
  }, [resident]);
  return [list, setList];
}
function McpBlock({ resident }) {
  const t = words();
  const [servers, setServers] = useList("/web/mcp", resident, (d) => mcpRows(d?.servers));
  const [form, setForm] = (0, import_react22.useState)(null);
  const [error, setError] = (0, import_react22.useState)("");
  const post2 = (path, body) => async () => {
    try {
      const d = await web(path, { method: "POST", body, resident });
      if (d?.error) throw new Error(d.error);
      setServers(mcpRows(d?.servers));
      setError("");
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  };
  const add = async (e) => {
    e.preventDefault();
    if (await post2("/web/mcp", form)()) setForm(null);
  };
  return (0, import_react22.createElement)(
    "div",
    { className: "ad-sheet-block" },
    (0, import_react22.createElement)(Explained, { className: "ad-sheet-subhead", text: t.mcpInfo, head: [
      (0, import_react22.createElement)("span", { key: "l", className: "ad-label" }, (0, import_react22.createElement)(Icon, { name: "plug" }), t.mcp),
      (0, import_react22.createElement)("span", { key: "s", className: "sp" }),
      (0, import_react22.createElement)("button", { key: "a", type: "button", className: "ad-btn quiet small", "aria-expanded": Boolean(form), onClick: () => setForm(form ? null : { name: "", url: "", key: "" }) }, (0, import_react22.createElement)(Icon, { name: "plus" }), t.addMcp)
    ] }),
    form && (0, import_react22.createElement)(
      "form",
      { className: "ad-sheet-form", onSubmit: add },
      (0, import_react22.createElement)("input", { autoFocus: true, placeholder: t.mcpName, "aria-label": t.mcpName, value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }) }),
      (0, import_react22.createElement)("input", { placeholder: "https://…", "aria-label": "URL", value: form.url, onChange: (e) => setForm({ ...form, url: e.target.value }) }),
      (0, import_react22.createElement)("input", { type: "password", placeholder: t.mcpKey, "aria-label": t.mcpKey, value: form.key, onChange: (e) => setForm({ ...form, key: e.target.value }) }),
      (0, import_react22.createElement)("button", { type: "submit", className: "ad-btn small", disabled: !form.url }, t.save)
    ),
    servers === null ? (0, import_react22.createElement)("p", { className: "ad-hint" }, "…") : servers.length === 0 ? (0, import_react22.createElement)("p", { className: "ad-hint" }, t.noMcp) : servers.map((s) => {
      const tone = s.state === "ready" ? "ok" : s.state === "authenticating" ? "hot" : "bad";
      return (0, import_react22.createElement)(
        "div",
        { key: s.id, className: "ad-list-row" },
        (0, import_react22.createElement)("span", { className: "n", title: s.host }, s.name, (0, import_react22.createElement)("small", null, s.host)),
        (0, import_react22.createElement)("span", { className: `ad-pill ${tone}` }, (0, import_react22.createElement)("span", { className: `ad-dot ${tone}` }), t.mcpState[s.state] || t.mcpState.off),
        s.state === "ready" && (0, import_react22.createElement)("span", { className: "ad-mi", title: `${s.tools} ${t.tools}` }, (0, import_react22.createElement)(Icon, { name: "wrench" }), s.tools),
        s.authUrl && (0, import_react22.createElement)("a", { className: "ad-btn small", href: s.authUrl, target: "_blank", rel: "noopener noreferrer" }, t.signIn),
        (0, import_react22.createElement)("button", { type: "button", className: "ad-icon-btn sm", title: t.retryIt, "aria-label": t.retryIt, onClick: post2("/web/mcp/retry", { id: s.id }) }, (0, import_react22.createElement)(Icon, { name: "refresh" })),
        (0, import_react22.createElement)("button", { type: "button", className: "ad-icon-btn sm danger", title: t.drop, "aria-label": t.drop, onClick: post2("/web/mcp/remove", { id: s.id }) }, (0, import_react22.createElement)(Icon, { name: "trash" })),
        s.error && (0, import_react22.createElement)("p", { className: "ad-error full" }, s.error)
      );
    }),
    error && (0, import_react22.createElement)("p", { className: "ad-error" }, error)
  );
}
function SitesBlock({ resident }) {
  const t = words();
  const [sites, setSites] = useList("/web/sites", resident, (d) => d?.sites || []);
  const [form, setForm] = (0, import_react22.useState)({ site: "", key: "" });
  const [error, setError] = (0, import_react22.useState)("");
  const post2 = async (path, body) => {
    try {
      const d = await web(path, { method: "POST", body, resident });
      if (d?.error) throw new Error(d.error);
      setSites(d?.sites || []);
      setError("");
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  };
  const add = async (e) => {
    e.preventDefault();
    if (await post2("/web/sites", form)) setForm({ site: "", key: "" });
  };
  return (0, import_react22.createElement)(
    "div",
    { className: "ad-sheet-block" },
    (0, import_react22.createElement)(Explained, { className: "ad-sheet-subhead", text: t.sitesInfo, head: (0, import_react22.createElement)("span", { className: "ad-label" }, (0, import_react22.createElement)(Icon, { name: "globe" }), t.sites) }),
    (sites || []).map((s) => (0, import_react22.createElement)(
      "div",
      { key: s.host, className: "ad-list-row" },
      (0, import_react22.createElement)("span", { className: "n" }, s.host, (0, import_react22.createElement)("small", null, (s.names || []).join(" · "))),
      (0, import_react22.createElement)("button", { type: "button", className: "ad-icon-btn sm danger", title: t.drop, "aria-label": t.drop, onClick: () => post2("/web/sites/remove", { host: s.host }) }, (0, import_react22.createElement)(Icon, { name: "trash" }))
    )),
    (0, import_react22.createElement)(
      "form",
      { className: "ad-sheet-form row", onSubmit: add },
      (0, import_react22.createElement)("input", { placeholder: t.siteHost, "aria-label": t.siteHost, value: form.site, onChange: (e) => setForm({ ...form, site: e.target.value }) }),
      (0, import_react22.createElement)("input", { type: "password", placeholder: t.siteKey, "aria-label": t.siteKey, value: form.key, onChange: (e) => setForm({ ...form, key: e.target.value }) }),
      (0, import_react22.createElement)("button", { type: "submit", className: "ad-btn quiet small", disabled: !form.site || !form.key }, (0, import_react22.createElement)(Icon, { name: "plus" }), t.addSite)
    ),
    error && (0, import_react22.createElement)("p", { className: "ad-error" }, error)
  );
}

// client/sheet-usage.mjs
var import_react23 = require("react");

// client/usage.mjs
function money(cost) {
  if (!cost) return "$0";
  return "$" + (cost >= 1 ? cost.toFixed(2) : cost >= 0.01 ? cost.toFixed(3) : cost.toFixed(4));
}
function compact(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 1 : 2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + "k";
  return String(n || 0);
}
function hitText(t) {
  const all = t ? t.input + t.cacheRead + t.cacheWrite : 0;
  return all ? `${Math.round(t.cacheRead / all * 100)}%` : "—";
}
function costText(t) {
  if (!t) return "…";
  if (t.calls && t.unpriced === t.calls) return "unpriced";
  return money(t.cost);
}

// client/sheet-usage.mjs
var SPANS = ["today", "week", "month"];
var inputOf = (r) => (r.input || 0) + (r.cacheRead || 0) + (r.cacheWrite || 0);
function UsageSection({ resident }) {
  const t = words();
  const [data, setData] = (0, import_react23.useState)(null);
  (0, import_react23.useEffect)(() => {
    void web("/web/usage", { resident }).then(setData).catch(() => setData({}));
  }, [resident]);
  const totals = data?.totals || {};
  const rows = (data?.rows || []).slice(0, 30);
  return (0, import_react23.createElement)(
    "div",
    { className: "ad-sheet-sections" },
    (0, import_react23.createElement)(Explained, { className: "ad-sheet-subhead", text: t.usageInfo, head: (0, import_react23.createElement)("span", { className: "ad-label" }, t.sections.usage) }),
    (0, import_react23.createElement)("div", { className: "ad-tiles" }, SPANS.map((key) => {
      const s = totals[key];
      return (0, import_react23.createElement)(
        "div",
        { key, className: "ad-tile" },
        (0, import_react23.createElement)("small", null, t.span[key]),
        (0, import_react23.createElement)("b", null, s ? compact(inputOf(s) + (s.output || 0)) : "—"),
        (0, import_react23.createElement)("span", { className: "u" }, t.tokens),
        (0, import_react23.createElement)("span", { className: "row" }, (0, import_react23.createElement)("span", null, s ? hitText(s) : "—", " ", t.cache), (0, import_react23.createElement)("span", null, s ? costText(s) : ""))
      );
    })),
    (0, import_react23.createElement)("span", { className: "ad-label" }, t.recent),
    rows.length === 0 ? (0, import_react23.createElement)("p", { className: "ad-hint" }, data ? t.noUsage : "…") : (0, import_react23.createElement)("div", { className: "ad-calls", role: "table" }, rows.map((r, i) => (0, import_react23.createElement)(
      "div",
      { key: r.id ?? i, className: "ad-call", role: "row" },
      (0, import_react23.createElement)("span", { className: "w", role: "cell" }, shortWhen(r.at)),
      (0, import_react23.createElement)("span", { className: "m", role: "cell", title: r.model }, String(r.model || "").split("/").pop()),
      (0, import_react23.createElement)("span", { className: "n", role: "cell", title: `in ${inputOf(r)} · out ${r.output || 0}` }, `${compact(inputOf(r))} → ${compact(r.output || 0)}`),
      (0, import_react23.createElement)("span", { className: "c", role: "cell" }, r.cost === null || r.cost === void 0 ? "—" : money(r.cost))
    )))
  );
}

// client/sheet.mjs
var SECTIONS2 = [
  ["resident", "user"],
  ["model", "sliders"],
  ["memory", "stack"],
  ["time", "alarm"],
  ["channels", "mail"],
  ["web", "globe"],
  ["voice", "speaker"],
  ["work", "cloud"],
  ["usage", "chart"],
  ["app", "gear"]
];
function Section({ id, rows, resident, reload }) {
  const fields = (skip) => (0, import_react24.createElement)(Fields, { key: "f", rows, section: id, resident, onSaved: reload, skip });
  if (id === "resident") return [(0, import_react24.createElement)(ResidentSection, { key: "r", rows, reload }), fields(["RESIDENT_NAME"])];
  if (id === "channels") return [(0, import_react24.createElement)(TelegramBlock, { key: "t", resident }), fields()];
  if (id === "web") return [(0, import_react24.createElement)(McpBlock, { key: "m", resident }), (0, import_react24.createElement)(SitesBlock, { key: "s", resident }), fields()];
  if (id === "voice") return [(0, import_react24.createElement)(StickersBlock, { key: "s", resident }), fields()];
  if (id === "work") return [(0, import_react24.createElement)(WorkBlock, { key: "w", resident }), fields()];
  if (id === "usage") return (0, import_react24.createElement)(UsageSection, { resident });
  if (id === "app") return (0, import_react24.createElement)(AppSection);
  return fields();
}
function Sheet() {
  const t = words();
  const { sheet, status } = useStore(store);
  const resident = status?.resident || "default";
  const [rows, setRows] = (0, import_react24.useState)([]);
  const close = (0, import_react24.useRef)(null);
  const reload = async () => {
    try {
      setRows(settingRows(await web("/web/config", { resident })));
    } catch {
    }
  };
  (0, import_react24.useEffect)(() => {
    if (sheet) void reload();
  }, [Boolean(sheet), resident]);
  (0, import_react24.useEffect)(() => {
    if (sheet) close.current?.focus();
  }, [Boolean(sheet)]);
  if (!sheet) return null;
  const id = SECTIONS2.some(([s]) => s === sheet) ? sheet : "resident";
  const shut = () => store.set({ sheet: "" });
  return (0, import_react24.createElement)(
    "div",
    { className: "ad-scrim", onClick: (e) => {
      if (e.target === e.currentTarget) shut();
    }, onKeyDown: (e) => {
      if (e.key === "Escape") shut();
    } },
    (0, import_react24.createElement)(
      "section",
      { className: "ad-sheet", role: "dialog", "aria-modal": true, "aria-label": t.settings },
      (0, import_react24.createElement)(
        "nav",
        { className: "ad-sheet-nav", "aria-label": t.settings },
        (0, import_react24.createElement)("p", { className: "ad-sheet-title" }, t.settings),
        SECTIONS2.map(([s, icon]) => (0, import_react24.createElement)(
          "button",
          { key: s, type: "button", "aria-current": s === id ? "page" : void 0, onClick: () => store.set({ sheet: s }) },
          (0, import_react24.createElement)(Icon, { name: icon }),
          (0, import_react24.createElement)("span", null, t.sections[s])
        ))
      ),
      (0, import_react24.createElement)(
        "div",
        { className: "ad-sheet-body" },
        (0, import_react24.createElement)(
          "div",
          { className: "ad-sheet-head" },
          (0, import_react24.createElement)("h2", null, t.sections[id]),
          (0, import_react24.createElement)("button", { ref: close, type: "button", className: "ad-icon-btn sm", title: t.close, "aria-label": t.close, onClick: shut }, (0, import_react24.createElement)(Icon, { name: "close" }))
        ),
        (0, import_react24.createElement)("div", { className: "ad-sheet-scroll" }, (0, import_react24.createElement)(Section, { id, rows, resident, reload }))
      )
    )
  );
}

// client/right.mjs
var import_react31 = require("react");

// client/panel-ids.mjs
var PANEL_IDS = ["waiting", "threads", "alarms"];
var PANEL_ICONS = { waiting: "inbox", threads: "threads", alarms: "alarm" };
function tabCounts({ waiting, threads, alarms } = {}) {
  return {
    waiting: { n: Number(waiting?.open) || 0, hot: true },
    threads: { n: Number(threads?.open) || 0, hot: false },
    alarms: { n: alarms?.on === false ? 0 : (alarms?.alarms || []).filter((a) => a?.next).length, hot: false }
  };
}

// client/panels.mjs
var import_react30 = require("react");

// client/panel-alarms.mjs
var import_react25 = require("react");

// client/alarms.mjs
function soonAlarms(alarms = [], limit = 4) {
  return [...alarms].filter((a) => a && a.next).sort((a, b) => new Date(a.next) - new Date(b.next)).slice(0, limit).map((a) => ({
    id: a.id,
    note: a.note || "",
    when: a.when || "",
    edit: a.edit || null,
    date: a.date || "",
    time: a.time || "",
    once: a.edit === "date" || !a.edit && (!a.when || a.when === "一次")
  }));
}
function dayOf(date, now = /* @__PURE__ */ new Date()) {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date || "");
  if (!d) return { kind: "none", text: "" };
  const that = new Date(Number(d[1]), Number(d[2]) - 1, Number(d[3]));
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((that - today) / 864e5);
  if (days === 0) return { kind: "today", text: "" };
  if (days === 1) return { kind: "tomorrow", text: "" };
  if (days > 1 && days < 7) return { kind: "weekday", text: that.toLocaleDateString("en", { weekday: "short" }) };
  return { kind: "date", text: `${Number(d[2])}/${Number(d[3])}` };
}
var editValue = (alarm) => alarm.edit === "date" ? `${alarm.date} ${alarm.time}`.trim() : alarm.time;

// client/panel-alarms.mjs
function dayWord(date, t) {
  const day = dayOf(date);
  return day.kind === "today" ? t.dayToday : day.kind === "tomorrow" ? t.dayTomorrow : day.text;
}
function Row({ alarm, t, busy, onSave, onDrop }) {
  const [draft, setDraft] = (0, import_react25.useState)(null);
  const save = async (e) => {
    e.preventDefault();
    if (await onSave(alarm, draft)) setDraft(null);
  };
  return (0, import_react25.createElement)(
    "div",
    { className: "ad-alarm" },
    (0, import_react25.createElement)(
      "span",
      { className: "mark", title: alarm.once ? t.once : `${t.repeats}: ${alarm.when}`, "aria-label": alarm.once ? t.once : t.repeats },
      alarm.once ? (0, import_react25.createElement)("span", { className: "ad-dot" }) : (0, import_react25.createElement)(Icon, { name: "repeat" })
    ),
    draft !== null ? (0, import_react25.createElement)(
      "form",
      { className: "ad-alarm-edit", onSubmit: save, onKeyDown: (e) => {
        if (e.key === "Escape") setDraft(null);
      } },
      (0, import_react25.createElement)("input", { value: draft, autoFocus: true, "aria-label": t.moveAlarm, placeholder: alarm.edit === "date" ? "2026-11-09 08:00" : "07:30", onChange: (e) => setDraft(e.target.value) }),
      (0, import_react25.createElement)("button", { type: "submit", className: "ad-icon-btn sm", title: t.save, "aria-label": t.save, disabled: busy }, (0, import_react25.createElement)(Icon, { name: "check" })),
      (0, import_react25.createElement)("button", { type: "button", className: "ad-icon-btn sm", title: t.cancel, "aria-label": t.cancel, onClick: () => setDraft(null) }, (0, import_react25.createElement)(Icon, { name: "close" }))
    ) : [
      (0, import_react25.createElement)(
        alarm.edit ? "button" : "span",
        { key: "w", className: "when", ...alarm.edit ? { type: "button", title: t.moveAlarm, onClick: () => setDraft(editValue(alarm)) } : {} },
        (0, import_react25.createElement)("b", null, alarm.time || "—"),
        (0, import_react25.createElement)("small", null, dayWord(alarm.date, t))
      ),
      (0, import_react25.createElement)("span", { key: "n", className: "note", title: alarm.note }, alarm.note),
      (0, import_react25.createElement)("button", { key: "x", type: "button", className: "ad-icon-btn sm danger", title: t.dropAlarm, "aria-label": t.dropAlarm, disabled: busy, onClick: () => onDrop(alarm) }, (0, import_react25.createElement)(Icon, { name: "trash" }))
    ]
  );
}
function AlarmsPanel() {
  const t = words();
  const { status, alarms } = useStore(store);
  const resident = status?.resident || "default";
  const [busy, setBusy] = (0, import_react25.useState)(false);
  const [error, setError] = (0, import_react25.useState)("");
  const run = async (path, body) => {
    setBusy(true);
    try {
      const answer = await web(path, { method: "POST", body, resident });
      if (answer?.error) throw new Error(answer.error);
      if (answer?.alarms) store.set({ alarms: { on: Boolean(answer.on), alarms: answer.alarms } });
      else {
        const a = await web("/web/alarms", { resident });
        store.set({ alarms: { on: Boolean(a?.on), alarms: a?.alarms || [] } });
      }
      setError("");
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  };
  const list = soonAlarms(alarms.alarms, 50);
  return (0, import_react25.createElement)(
    "div",
    { className: "ad-panel" },
    error && (0, import_react25.createElement)("div", { className: "ad-error", role: "alert" }, error),
    !alarms.on && (0, import_react25.createElement)(Empty, { icon: "alarm", text: t.alarmsOff, why: t.alarmsInfo }),
    alarms.on && list.length === 0 && (0, import_react25.createElement)(Empty, { icon: "alarm", text: t.noAlarms, why: t.alarmsInfo }),
    alarms.on && list.length > 0 && (0, import_react25.createElement)(Explained, { className: "ad-panel-bar ad-legend", text: t.alarmsInfo, head: [
      (0, import_react25.createElement)("span", { key: "o" }, (0, import_react25.createElement)("span", { className: "ad-dot" }), t.once),
      (0, import_react25.createElement)("span", { key: "r" }, (0, import_react25.createElement)(Icon, { name: "repeat" }), t.repeats),
      (0, import_react25.createElement)("span", { key: "s", className: "sp" })
    ] }),
    alarms.on && list.map((alarm) => (0, import_react25.createElement)(Row, {
      key: alarm.id,
      alarm,
      t,
      busy,
      onSave: (a, when2) => run("/web/alarms/edit", { id: a.id, when: String(when2 || "").trim() }),
      onDrop: (a) => run("/web/alarms/remove", { id: a.id })
    }))
  );
}

// client/panel-threads.mjs
var import_react28 = require("react");

// client/thread-view.mjs
var import_react27 = require("react");

// client/thread-items.mjs
var import_react26 = require("react");
var TOOL_TONE = { completed: "ok", failed: "bad", in_progress: "warn live", pending: "warn live" };
var short = (p) => String(p).split("/").slice(-2).join("/");
function Tool({ item, t, onOpenPath }) {
  const [open, setOpen] = (0, import_react26.useState)(false);
  const command = commandOf(item);
  const added = (item.diffs || []).reduce((n, d) => n + (d.added || 0), 0);
  const removed = (item.diffs || []).reduce((n, d) => n + (d.removed || 0), 0);
  const kind = t.toolKind[item.kind] || t.toolKind.other;
  return (0, import_react26.createElement)(
    "div",
    { className: `ad-tool${open ? " open" : ""}` },
    (0, import_react26.createElement)(
      "button",
      { type: "button", className: "ad-tool-row", "aria-expanded": open, onClick: () => setOpen((v) => !v) },
      (0, import_react26.createElement)("span", { className: "k", title: kind, "aria-label": kind }, (0, import_react26.createElement)(Icon, { name: KIND_ICON[item.kind] || "wrench" })),
      (0, import_react26.createElement)("span", { className: "n" }, command ? (0, import_react26.createElement)("code", null, command) : item.title || kind),
      (added > 0 || removed > 0) && (0, import_react26.createElement)("span", { className: "ad-diffn" }, (0, import_react26.createElement)("b", null, `+${added}`), (0, import_react26.createElement)("i", null, `−${removed}`)),
      (0, import_react26.createElement)("span", { className: `ad-dot ${TOOL_TONE[item.status] || "idle"}`, title: item.status, "aria-label": item.status })
    ),
    open && (0, import_react26.createElement)(
      "div",
      { className: "ad-tool-body" },
      item.input && (0, import_react26.createElement)("div", null, (0, import_react26.createElement)("p", { className: "ad-label" }, t.input), (0, import_react26.createElement)("pre", null, item.input)),
      item.output && (0, import_react26.createElement)("div", null, (0, import_react26.createElement)("p", { className: "ad-label" }, t.output), (0, import_react26.createElement)("pre", null, item.output)),
      (item.diffs || []).length > 0 && (0, import_react26.createElement)("div", { className: "ad-tool-files" }, item.diffs.map((d) => (0, import_react26.createElement)(
        "button",
        { key: d.path, type: "button", className: "ad-pathbtn", title: d.path, onClick: () => onOpenPath(d.path) },
        (0, import_react26.createElement)(Icon, { name: "file" }),
        (0, import_react26.createElement)("span", null, short(d.path)),
        (0, import_react26.createElement)("span", { className: "ad-diffn" }, (0, import_react26.createElement)("b", null, `+${d.added}`), (0, import_react26.createElement)("i", null, `−${d.removed}`))
      ))),
      !(item.diffs || []).length && (item.paths || []).length > 0 && (0, import_react26.createElement)("div", { className: "ad-tool-files" }, item.paths.map((p) => (0, import_react26.createElement)(
        "button",
        { key: p, type: "button", className: "ad-pathbtn", title: p, onClick: () => onOpenPath(p) },
        (0, import_react26.createElement)(Icon, { name: "file" }),
        (0, import_react26.createElement)("span", null, short(p))
      )))
    )
  );
}
function Thought({ item, t }) {
  const [open, setOpen] = (0, import_react26.useState)(false);
  return (0, import_react26.createElement)(
    "div",
    { className: "ad-thought" },
    (0, import_react26.createElement)("button", { type: "button", "aria-expanded": open, onClick: () => setOpen((v) => !v) }, (0, import_react26.createElement)(Icon, { name: "spark" }), (0, import_react26.createElement)("span", null, t.thought), (0, import_react26.createElement)(Icon, { name: "next" })),
    open && (0, import_react26.createElement)("p", null, item.text)
  );
}
function Plan({ item, t }) {
  const steps = item.steps || [];
  const done = steps.filter((s) => s.status === "completed").length;
  return (0, import_react26.createElement)(
    "div",
    { className: "ad-plan" },
    (0, import_react26.createElement)("p", { className: "ad-label" }, t.plan, (0, import_react26.createElement)("span", { className: "ad-badge" }, `${done}/${steps.length}`)),
    (0, import_react26.createElement)("ul", null, steps.map((step, i) => (0, import_react26.createElement)(
      "li",
      { key: i, className: step.status },
      (0, import_react26.createElement)("span", { className: "box", "aria-hidden": true }, step.status === "completed" ? (0, import_react26.createElement)(Icon, { name: "check" }) : step.status === "in_progress" ? (0, import_react26.createElement)("span", { className: "ad-dot warn live" }) : null),
      (0, import_react26.createElement)("span", null, step.text)
    )))
  );
}
function Permission({ item, t, busy, onPermit }) {
  const waiting = item.decided === null || item.decided === void 0;
  const said = !waiting && t.decided[`${item.decided}_${item.by === "you" ? "you" : "tier"}`];
  return (0, import_react26.createElement)(
    "div",
    { className: `ad-perm${waiting ? " waiting" : ""}` },
    (0, import_react26.createElement)(
      "div",
      { className: "top" },
      (0, import_react26.createElement)(Icon, { name: "shield" }),
      (0, import_react26.createElement)("span", { className: "n" }, item.title || t.toolKind[item.kind] || item.kind),
      (0, import_react26.createElement)("span", { className: "ad-pill idle" }, t.toolKind[item.kind] || item.kind)
    ),
    (item.paths || []).length > 0 && (0, import_react26.createElement)("p", { className: "paths" }, item.paths.map(short).join(" · ")),
    waiting ? (0, import_react26.createElement)(
      "div",
      { className: "ad-card-row" },
      (0, import_react26.createElement)("button", { type: "button", className: "ad-btn small", disabled: busy, onClick: () => onPermit(item, true) }, (0, import_react26.createElement)(Icon, { name: "check" }), t.allow),
      (0, import_react26.createElement)("button", { type: "button", className: "ad-btn quiet small", disabled: busy, onClick: () => onPermit(item, false) }, (0, import_react26.createElement)(Icon, { name: "close" }), t.deny)
    ) : (0, import_react26.createElement)("p", { className: `said ${item.decided}` }, said)
  );
}
function Result({ item, t, busy, onChoose }) {
  const tone = taskTone(item.status);
  const links = (item.links || []).filter(safeLink);
  return (0, import_react26.createElement)(
    "div",
    { className: "ad-tl-result" },
    item.status && (0, import_react26.createElement)("span", { className: `ad-pill ${tone}` }, (0, import_react26.createElement)("span", { className: `ad-dot ${tone}`, "aria-hidden": true }), t.task[item.status] || item.status),
    item.text && (0, import_react26.createElement)("div", { className: "text" }, (0, import_react26.createElement)(Md, { text: item.text })),
    ((item.choices || []).length > 0 || links.length > 0 || safeLink(item.sessionUrl) || (item.files || []).length > 0) && (0, import_react26.createElement)(
      "div",
      { className: "ad-card-row" },
      (item.choices || []).map((c, i) => (0, import_react26.createElement)("button", { key: c, type: "button", className: `ad-btn small${i ? " quiet" : ""}`, disabled: busy, onClick: () => onChoose(item.task, c) }, c)),
      (item.files || []).map((f) => (0, import_react26.createElement)("span", { key: f.path, className: "ad-pill", title: f.path }, (0, import_react26.createElement)(Icon, { name: "file" }), f.path.split("/").pop())),
      links.map((l) => (0, import_react26.createElement)("a", { key: l, className: "ad-btn quiet small", href: l, target: "_blank", rel: "noopener noreferrer" }, (0, import_react26.createElement)(Icon, { name: "open" }), new URL(l).host)),
      safeLink(item.sessionUrl) && (0, import_react26.createElement)("a", { className: "ad-btn quiet small", href: item.sessionUrl, target: "_blank", rel: "noopener noreferrer" }, (0, import_react26.createElement)(Icon, { name: "open" }), t.session)
    )
  );
}
function Item(props) {
  const { item, t } = props;
  if (item.type === "brief") return (0, import_react26.createElement)("div", { className: "ad-tl-brief" }, (0, import_react26.createElement)("span", { className: "who" }, t.who[item.who] || ""), (0, import_react26.createElement)("div", null, item.text));
  if (item.type === "say") return (0, import_react26.createElement)("div", { className: "ad-tl-say" }, (0, import_react26.createElement)(Md, { text: item.text }));
  if (item.type === "thought") return (0, import_react26.createElement)(Thought, props);
  if (item.type === "tool") return (0, import_react26.createElement)(Tool, props);
  if (item.type === "plan") return (0, import_react26.createElement)(Plan, props);
  if (item.type === "perm") return (0, import_react26.createElement)(Permission, props);
  if (item.type === "result") return (0, import_react26.createElement)(Result, props);
  return null;
}

// client/thread-view.mjs
var POLL_MS4 = 4e3;
function ThreadView({ resident, id, onBack }) {
  const t = words();
  const { local } = useStore(store);
  const [thread, setThread] = (0, import_react27.useState)(null);
  const [session, setSession] = (0, import_react27.useState)(null);
  const [draft, setDraft] = (0, import_react27.useState)("");
  const [busy, setBusy] = (0, import_react27.useState)(false);
  const [error, setError] = (0, import_react27.useState)("");
  const end = (0, import_react27.useRef)(null);
  const reload = async () => {
    try {
      setThread(await loadThread(resident, id));
      setError("");
    } catch (e) {
      setError(e.message);
    }
    if (local.wired !== false) setSession(await loadSession(id));
  };
  (0, import_react27.useEffect)(() => {
    setThread(null);
    setSession(null);
    void reload();
    const timer = setInterval(() => {
      if (!document.hidden) void reload();
    }, POLL_MS4);
    return () => clearInterval(timer);
  }, [resident, id]);
  const act = async (job) => {
    if (busy) return;
    setBusy(true);
    try {
      await job();
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const say = () => act(async () => {
    const text = draft.trim();
    if (!text) return;
    setThread(await sayToThread(resident, id, text));
    setDraft("");
  });
  const onChoose = (task, text) => act(async () => {
    await choose(resident, task, text);
    store.set({ waiting: await loadWaiting(resident) });
    await reload();
  });
  const onPermit = (item, allow) => act(async () => {
    await permit(item.id, allow);
    await reload();
  });
  const onOpenPath = (path) => {
    void openInFiles(path).catch((e) => setError(e.message));
  };
  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent?.isComposing) {
      e.preventDefault();
      void say();
    }
  };
  const helper = helperOf({ id, runs: thread?.runs }, local);
  const state = thread ? stateOf(thread.tasks?.at(-1) || thread) : "";
  const tone = taskTone(state);
  const items = timeline(thread, session);
  const counts = countsOf(session);
  const working = thread && thread.runs === "machine" && thread.status === "working";
  return (0, import_react27.createElement)(
    "div",
    { className: "ad-panel ad-thread" },
    (0, import_react27.createElement)(
      "div",
      { className: "ad-tv-head" },
      (0, import_react27.createElement)("button", { type: "button", className: "ad-icon-btn sm", title: t.back, "aria-label": t.back, onClick: onBack }, (0, import_react27.createElement)(Icon, { name: "back" })),
      (0, import_react27.createElement)("span", { className: "ad-helper", title: t.helpers[helper], "aria-label": t.helpers[helper] }, (0, import_react27.createElement)(Icon, { name: HELPER_ICON[helper] })),
      (0, import_react27.createElement)("h3", null, thread?.title || t.thread),
      session?.cwd && (0, import_react27.createElement)("button", { type: "button", className: "ad-icon-btn sm", title: t.openFolder, "aria-label": t.openFolder, onClick: () => onOpenPath(session.cwd) }, (0, import_react27.createElement)(Icon, { name: "folder" })),
      working && (0, import_react27.createElement)("button", { type: "button", className: "ad-icon-btn sm danger", title: t.stop, "aria-label": t.stop, disabled: busy, onClick: () => act(() => stopThread(resident, id)) }, (0, import_react27.createElement)(Icon, { name: "stop" }))
    ),
    thread && (0, import_react27.createElement)(
      "div",
      { className: "ad-tv-meta" },
      state && (0, import_react27.createElement)("span", { className: `ad-pill ${tone}` }, (0, import_react27.createElement)("span", { className: `ad-dot ${tone}${state === "working" ? " live" : ""}`, "aria-hidden": true }), t.task[state] || state),
      (0, import_react27.createElement)("span", { className: "sp" }),
      counts.tools > 0 && (0, import_react27.createElement)("span", { className: "ad-mi", title: `${counts.tools} ${t.toolsN}` }, (0, import_react27.createElement)(Icon, { name: "wrench" }), counts.tools),
      counts.files > 0 && (0, import_react27.createElement)("span", { className: "ad-mi", title: `${counts.files} ${t.filesN}` }, (0, import_react27.createElement)(Icon, { name: "file" }), counts.files),
      counts.commands > 0 && (0, import_react27.createElement)("span", { className: "ad-mi", title: `${counts.commands} ${t.commandsN}` }, (0, import_react27.createElement)(Icon, { name: "terminal" }), counts.commands)
    ),
    (0, import_react27.createElement)("div", { className: "ad-timeline" }, items.map((item, i) => (0, import_react27.createElement)(Item, { key: item.id || `${item.type}-${i}`, item, t, busy, onPermit, onChoose, onOpenPath }))),
    (thread?.files || []).length > 0 && (0, import_react27.createElement)(
      "div",
      { className: "ad-tool-files" },
      (0, import_react27.createElement)("p", { className: "ad-label" }, t.files),
      thread.files.map((f) => (0, import_react27.createElement)("span", { key: f.path, className: "ad-pathbtn", title: f.path }, (0, import_react27.createElement)(Icon, { name: "file" }), (0, import_react27.createElement)("span", null, f.path)))
    ),
    error && (0, import_react27.createElement)("div", { className: "ad-error", role: "alert" }, error),
    (0, import_react27.createElement)("div", { ref: end }),
    thread?.canSay && (0, import_react27.createElement)(
      "div",
      { className: "ad-say" },
      (0, import_react27.createElement)("textarea", { rows: 1, value: draft, placeholder: t.sayTo, "aria-label": t.sayTo, onChange: (e) => setDraft(e.target.value), onKeyDown: onKey }),
      (0, import_react27.createElement)("button", { type: "button", className: "ad-round", disabled: busy || !draft.trim(), title: t.sendTo, "aria-label": t.sendTo, onClick: say }, (0, import_react27.createElement)(Icon, { name: "send" }))
    )
  );
}

// client/panel-threads.mjs
var RUN_ICON = { local: "spark", linux: "cloud", machine: "laptop", retired: "exit" };
function Row2({ item, t, local, onOpen }) {
  const state = stateOf(item);
  const tone = taskTone(state);
  const helper = helperOf(item, local);
  const pending = (local?.sessions || []).find((s) => s.thread === item.id)?.pending || 0;
  return (0, import_react28.createElement)(
    "button",
    { type: "button", className: `ad-card${item.waiting || pending ? " ask" : ""}`, title: t.open, onClick: () => onOpen(item.id) },
    (0, import_react28.createElement)(
      "span",
      { className: "ad-card-top" },
      (0, import_react28.createElement)("span", { className: "ad-helper", title: t.helpers[helper], "aria-label": t.helpers[helper] }, (0, import_react28.createElement)(Icon, { name: HELPER_ICON[helper] })),
      (0, import_react28.createElement)("span", { className: "ad-card-title" }, item.title),
      (0, import_react28.createElement)("span", { className: "ad-card-time" }, when(item.updatedAt))
    ),
    (0, import_react28.createElement)(
      "span",
      { className: "ad-card-row" },
      (0, import_react28.createElement)("span", { className: `ad-pill ${tone}` }, (0, import_react28.createElement)("span", { className: `ad-dot ${tone}${isWorking(item) ? " live" : ""}`, "aria-hidden": true }), t.task[state] || item.status),
      pending > 0 && (0, import_react28.createElement)("span", { className: "ad-mi", title: t.allow, style: { color: "var(--accent-text)" } }, (0, import_react28.createElement)(Icon, { name: "shield" }), pending),
      (0, import_react28.createElement)("span", { className: "sp" }),
      (0, import_react28.createElement)("span", { className: "ad-mi", title: `${item.tasks} ${t.tasksN}`, "aria-label": `${item.tasks} ${t.tasksN}` }, (0, import_react28.createElement)(Icon, { name: "stack" }), item.tasks)
    ),
    isWorking(item) && (0, import_react28.createElement)("span", { className: "ad-track", "aria-hidden": true }, (0, import_react28.createElement)("span"))
  );
}
function Quota({ q, t }) {
  if (!q?.configured) return null;
  const share = q.limit ? Math.min(100, Math.round((q.today || 0) / q.limit * 100)) : 0;
  return (0, import_react28.createElement)(Explained, { className: "ad-panel-bar", text: t.quotaInfo, head: [
    (0, import_react28.createElement)("span", { key: "w", className: "ad-mi", title: t.runs[q.mode] || q.mode }, (0, import_react28.createElement)(Icon, { name: RUN_ICON[q.mode] || "cloud" }), t.runs[q.mode] || q.mode),
    (0, import_react28.createElement)("span", { key: "s", className: "sp" }),
    (0, import_react28.createElement)("span", { key: "m", className: "ad-meter", title: `${q.today ?? 0}/${q.limit ?? 0} ${t.today}` }, (0, import_react28.createElement)("i", null, (0, import_react28.createElement)("b", { style: { width: `${share}%` } })), `${q.today ?? 0}/${q.limit ?? 0}`)
  ] });
}
function ThreadsPanel() {
  const t = words();
  const { status, focus, threads: quota, local } = useStore(store);
  const resident = status?.resident || "default";
  const [data, setData] = (0, import_react28.useState)({ loaded: false, on: true, threads: [] });
  const [error, setError] = (0, import_react28.useState)("");
  const [id, setId] = (0, import_react28.useState)("");
  const [showDone, setShowDone] = (0, import_react28.useState)(true);
  (0, import_react28.useEffect)(() => {
    if (focus) {
      setId(focus);
      store.set({ focus: "" });
    }
  }, [focus]);
  usePoll(async () => {
    try {
      const d = await loadThreads(resident);
      setData({ loaded: true, on: Boolean(d.on), threads: d.threads || [] });
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, 1e4, [resident]);
  if (id) return (0, import_react28.createElement)(ThreadView, { resident, id, onBack: () => setId("") });
  const { open, done } = splitThreads(data.threads);
  return (0, import_react28.createElement)(
    "div",
    { className: "ad-panel" },
    error && (0, import_react28.createElement)("div", { className: "ad-error", role: "alert" }, error),
    (0, import_react28.createElement)(Quota, { q: quota, t }),
    data.loaded && !data.on && data.threads.length === 0 && (0, import_react28.createElement)(Empty, { icon: "threads", text: t.threadsOff }),
    data.loaded && data.on && data.threads.length === 0 && (0, import_react28.createElement)(Empty, { icon: "threads", text: t.noThreads, why: t.threadsInfo }),
    open.map((item) => (0, import_react28.createElement)(Row2, { key: item.id, item, t, local, onOpen: setId })),
    done.length > 0 && (0, import_react28.createElement)(
      "button",
      { type: "button", className: "ad-fold ad-label", "aria-expanded": showDone, onClick: () => setShowDone((v) => !v) },
      (0, import_react28.createElement)(Icon, { name: "down" }),
      t.done,
      (0, import_react28.createElement)("span", { className: "ad-badge" }, done.length)
    ),
    showDone && done.map((item) => (0, import_react28.createElement)(Row2, { key: item.id, item, t, local, onOpen: setId }))
  );
}

// client/panel-waiting.mjs
var import_react29 = require("react");
function Card({ item, t, busy, open, onToggle, act }) {
  const asking = item.kind === "ask" && !item.expired;
  const tone = waitTone(item);
  const word = item.expired ? t.expired : t.kind[item.kind] || item.kind;
  return (0, import_react29.createElement)(
    "div",
    { className: `ad-card${asking ? " ask" : ""}${item.expired ? " dim" : ""}` },
    (0, import_react29.createElement)(
      "button",
      { type: "button", className: "ad-card-top", "aria-expanded": open, title: open ? "" : t.details, onClick: onToggle },
      (0, import_react29.createElement)("span", { className: "ad-card-title" }, item.title),
      (0, import_react29.createElement)("span", { className: "ad-card-time" }, when(item.at))
    ),
    (0, import_react29.createElement)(
      "div",
      { className: "ad-card-row" },
      (0, import_react29.createElement)("span", { className: `ad-pill ${tone}` }, (0, import_react29.createElement)("span", { className: `ad-dot ${tone}`, "aria-hidden": true }), word),
      asking && (item.options || []).map((option, i) => (0, import_react29.createElement)("button", { key: option, type: "button", className: `ad-btn small${i ? " quiet" : ""}`, disabled: Boolean(busy), onClick: act.answer(item, option) }, option)),
      asking ? (0, import_react29.createElement)("button", { type: "button", className: "ad-icon-btn sm ad-hide", title: t.settle, "aria-label": t.settle, disabled: Boolean(busy), onClick: act.settle(item) }, (0, import_react29.createElement)(Icon, { name: "close" })) : (0, import_react29.createElement)("button", { type: "button", className: "ad-icon-btn sm ad-hide", title: t.markRead, "aria-label": t.markRead, disabled: Boolean(busy), onClick: act.read(item) }, (0, import_react29.createElement)(Icon, { name: "check" }))
    ),
    open && item.line && (0, import_react29.createElement)("p", { className: "ad-card-more" }, item.line),
    open && item.thread && (0, import_react29.createElement)(
      "div",
      { className: "ad-card-row" },
      (0, import_react29.createElement)("button", { type: "button", className: "ad-btn quiet small", onClick: act.open(item) }, (0, import_react29.createElement)(Icon, { name: "open" }), t.open)
    )
  );
}
function WaitingPanel() {
  const t = words();
  const { status, waiting, right } = useStore(store);
  const resident = status?.resident || "default";
  const [busy, setBusy] = (0, import_react29.useState)("");
  const [error, setError] = (0, import_react29.useState)("");
  const [opened, setOpened] = (0, import_react29.useState)("");
  const run = (key, job) => async () => {
    if (busy) return;
    setBusy(key);
    try {
      await job();
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  };
  const act = {
    answer: (item, option) => run(item.task, async () => {
      await choose(resident, item.task, option);
      store.set({ waiting: await loadWaiting(resident) });
    }),
    read: (item) => run(item.id, async () => store.set({ waiting: await markSeen(resident, item) })),
    // An ask put away without an answer (the web page's "dealt with"): /web/task/settle.
    settle: (item) => run(item.task, async () => {
      await web("/web/task/settle", { method: "POST", body: { id: item.task }, resident });
      store.set({ waiting: await loadWaiting(resident) });
    }),
    open: (item) => async () => {
      if (item.kind !== "ask") await act.read(item)();
      store.set({ focus: item.thread, right: { ...right, panel: "threads" } });
    }
  };
  const items = waiting.items || [];
  const updates = items.filter((item) => item.kind !== "ask" || item.expired).length;
  return (0, import_react29.createElement)(
    "div",
    { className: "ad-panel" },
    error && (0, import_react29.createElement)("div", { className: "ad-error", role: "alert" }, error),
    updates > 1 && (0, import_react29.createElement)(
      "div",
      { className: "ad-panel-bar" },
      (0, import_react29.createElement)("span", { className: "sp" }),
      (0, import_react29.createElement)("button", {
        type: "button",
        className: "ad-icon-btn sm",
        title: t.markAll,
        "aria-label": t.markAll,
        disabled: Boolean(busy),
        onClick: run("all", async () => store.set({ waiting: await markSeen(resident) }))
      }, (0, import_react29.createElement)(Icon, { name: "checks" }))
    ),
    items.length === 0 && (0, import_react29.createElement)(Empty, { icon: "check", text: t.nothingWaiting }),
    items.map((item) => (0, import_react29.createElement)(Card, { key: item.id, item, t, busy, act, open: opened === item.id, onToggle: () => setOpened((was) => was === item.id ? "" : item.id) }))
  );
}

// client/panels.mjs
var DRAW = { waiting: WaitingPanel, threads: ThreadsPanel, alarms: AlarmsPanel };
var PANELS = PANEL_IDS.map((id) => ({ id, icon: PANEL_ICONS[id], render: () => (0, import_react30.createElement)(DRAW[id]) }));

// client/right.mjs
var WIDE = 580;
var clampWidth = (w, room) => Math.round(Math.max(300, Math.min(w, 860, room - 380)));
function grab(event, right) {
  const aside = event.currentTarget.parentElement;
  const box = aside.getBoundingClientRect();
  const room = aside.parentElement?.clientWidth || window.innerWidth;
  const move = (e) => store.set({ right: { ...store.get().right, width: clampWidth(box.right - e.clientX, room) } });
  const up = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
  event.preventDefault();
}
function Right() {
  const t = words();
  const state = useStore(store);
  const { status, right } = state;
  const resident = status?.resident || "default";
  usePoll(async () => {
    try {
      store.set({ waiting: await loadWaiting(resident) });
    } catch {
    }
  }, 1e4, [resident]);
  usePoll(async () => {
    try {
      store.set({ threads: await web("/web/tasks", { resident }) || { open: 0 } });
    } catch {
    }
  }, 15e3, [resident]);
  usePoll(async () => {
    try {
      const a = await web("/web/alarms", { resident });
      store.set({ alarms: { on: Boolean(a?.on), alarms: a?.alarms || [] } });
    } catch {
    }
  }, 3e4, [resident]);
  if (!right.open) return null;
  const panel = PANELS.find((p) => p.id === right.panel) || PANELS[0];
  const counts = tabCounts(state);
  const wide = right.width >= WIDE;
  const pick = (id) => store.set({ right: { ...right, panel: id } });
  const nudge = (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") store.set({ right: { ...right, width: clampWidth((right.width || 340) + (e.key === "ArrowLeft" ? 40 : -40), window.innerWidth) } });
  };
  return (0, import_react31.createElement)(
    "aside",
    { className: `ad-right${right.overlay ? " overlay" : ""}`, "aria-label": t.panels[panel.id], style: right.width ? { "--panel-w": `${right.width}px` } : void 0 },
    !right.overlay && (0, import_react31.createElement)("div", { className: "ad-grip", role: "separator", "aria-orientation": "vertical", "aria-label": t.widen, tabIndex: 0, onPointerDown: (e) => grab(e, right), onKeyDown: nudge }),
    (0, import_react31.createElement)(
      "div",
      { className: "ad-right-head" },
      (0, import_react31.createElement)("div", { className: "ad-tabs", role: "tablist" }, PANELS.map((p) => {
        const c = counts[p.id];
        return (0, import_react31.createElement)(
          "button",
          {
            key: p.id,
            type: "button",
            role: "tab",
            className: "ad-tab",
            "aria-selected": p.id === panel.id,
            title: c.n ? `${t.panels[p.id]} · ${c.n}` : t.panels[p.id],
            onClick: () => pick(p.id)
          },
          (0, import_react31.createElement)(Icon, { name: p.icon }),
          (0, import_react31.createElement)("span", { className: "w" }, t.panels[p.id]),
          c.n > 0 && (0, import_react31.createElement)("span", { className: `ad-badge${c.hot ? " hot" : ""}` }, c.n)
        );
      })),
      !right.overlay && (0, import_react31.createElement)("button", {
        type: "button",
        className: "ad-icon-btn sm",
        title: wide ? t.narrow : t.widen,
        "aria-label": wide ? t.narrow : t.widen,
        onClick: () => store.set({ right: { ...right, width: wide ? 0 : WIDE } })
      }, (0, import_react31.createElement)(Icon, { name: wide ? "narrow" : "widen" })),
      right.overlay && (0, import_react31.createElement)("button", { type: "button", className: "ad-icon-btn sm", title: t.collapse, "aria-label": t.collapse, onClick: () => store.set({ right: { ...right, open: false } }) }, (0, import_react31.createElement)(Icon, { name: "close" }))
    ),
    (0, import_react31.createElement)(panel.render)
  );
}

// client/style-base.mjs
var BASE = `
.ad-root { position: relative; display: flex; height: 100%; min-height: 0; overflow: hidden; color: var(--text-1); background: var(--bg); font-family: var(--font); font-size: 14px; line-height: 1.55; -webkit-font-smoothing: antialiased; }
.ad-root > * { position: relative; z-index: 1; }
.ad-root *, .ad-root *::before, .ad-root *::after { box-sizing: border-box; }
.ad-root button, .ad-root input, .ad-root textarea, .ad-root select { font: inherit; color: inherit; }
.ad-root button { cursor: pointer; }
.ad-root button:disabled { cursor: default; }
.ad-root a { color: var(--accent-text); }
.ad-root :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.ad-root svg { flex: none; }
.ad-root ::-webkit-scrollbar { width: 8px; height: 8px; }
.ad-root ::-webkit-scrollbar-thumb { border-radius: 4px; background: var(--line); }
.ad-root ::-webkit-scrollbar-track { background: transparent; }

/* The sky: a nebula and fixed stars, never moving. Behind every column. */
.ad-sky { position: absolute; inset: 0; z-index: 0; pointer-events: none; background: var(--bg); }
.ad-sky::before { content: ""; position: absolute; inset: 0;
  background: radial-gradient(58% 42% at 78% 8%, var(--nebula-a), transparent 72%), radial-gradient(52% 42% at 8% 86%, var(--nebula-b), transparent 72%),
    radial-gradient(40% 30% at 96% 62%, var(--nebula-c), transparent 70%); }
.ad-sky::after { content: ""; position: absolute; inset: 0; opacity: var(--stars-opacity); background-size: 420px 420px;
  background-image: radial-gradient(1px 1px at 24px 36px, var(--star-1), transparent), radial-gradient(1px 1px at 128px 96px, var(--star-2), transparent),
    radial-gradient(1.5px 1.5px at 212px 180px, var(--star-1), transparent), radial-gradient(1px 1px at 320px 64px, var(--star-2), transparent),
    radial-gradient(1px 1px at 392px 240px, var(--star-3), transparent), radial-gradient(1px 1px at 72px 300px, var(--star-2), transparent),
    radial-gradient(1.5px 1.5px at 268px 356px, var(--star-1), transparent); }

.ad-icon-btn { flex: none; width: 36px; height: 36px; border: 0; border-radius: 11px; display: grid; place-items: center; background: transparent; color: var(--text-3); position: relative; }
.ad-icon-btn:hover { color: var(--text-1); background: var(--line-soft); }
.ad-icon-btn[aria-expanded="true"] { color: var(--accent-text); background: var(--accent-soft); }
.ad-icon-btn svg { width: 18px; height: 18px; }
.ad-icon-btn.sm { width: 28px; height: 28px; border-radius: 8px; }
.ad-icon-btn.sm svg { width: 15px; height: 15px; }
.ad-icon-btn.danger:hover { color: var(--err-text); }
.ad-icon-btn:disabled { opacity: .4; }
.ad-avatar { position: relative; flex: none; width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; overflow: hidden; background: var(--avatar-bg); box-shadow: 0 0 0 1px var(--avatar-ring), 0 0 18px rgba(139, 124, 246, .18); color: var(--text-1); font-family: var(--serif); font-size: 17px; }
.ad-avatar.mini { width: 22px; height: 22px; font-size: 11px; box-shadow: 0 0 0 1px var(--avatar-ring); }
.ad-avatar img { width: 100%; height: 100%; object-fit: cover; }
.ad-avatar svg { width: 55%; height: 55%; color: var(--text-3); }
.ad-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 34px; padding: 0 14px; border-radius: 11px; border: 0; background: var(--accent); color: var(--on-accent); font-size: 13.5px; font-weight: 600; white-space: nowrap; text-decoration: none; }
.ad-root a.ad-btn { color: var(--on-accent); }
.ad-btn:hover { filter: brightness(1.05); }
.ad-btn svg { width: 15px; height: 15px; }
.ad-btn.quiet, .ad-root a.ad-btn.quiet { border: 1px solid var(--line); background: var(--panel-strong); color: var(--text-1); font-weight: 500; }
.ad-btn.quiet:hover { border-color: var(--line-dash); filter: none; }
.ad-btn.danger { color: var(--err-text); }
.ad-btn.small { height: 28px; padding: 0 10px; border-radius: 9px; font-size: 12.5px; }
.ad-btn:disabled { opacity: .45; filter: none; }

/* Status: a dot, or a pill holding a dot and one word. Counts: a badge. */
.ad-dot { flex: none; display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--idle); }
.ad-dot.ok { background: var(--ok); } .ad-dot.warn { background: var(--warn); } .ad-dot.bad { background: var(--err); }
.ad-dot.hot { background: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); } .ad-dot.info { background: var(--violet); }
.ad-dot.live { animation: ad-pulse 1.6s infinite ease-in-out; }
.ad-pill { flex: none; display: inline-flex; align-items: center; gap: 5px; height: 20px; padding: 0 8px 0 6px; border-radius: 999px; background: var(--line-soft); font-size: 11px; font-weight: 500; line-height: 1; color: var(--text-2); white-space: nowrap; }
.ad-pill .ad-dot { width: 6px; height: 6px; box-shadow: none; }
.ad-pill.hot { background: var(--accent-soft); color: var(--accent-text); font-weight: 600; }
.ad-pill.ok { background: var(--ok-soft); color: var(--ok-text); }
.ad-pill.bad { background: color-mix(in srgb, var(--err) 12%, transparent); color: var(--err-text); }
.ad-pill.warn { background: color-mix(in srgb, var(--warn) 16%, transparent); }
.ad-pill.info { background: color-mix(in srgb, var(--violet) 14%, transparent); color: var(--violet-text); }
.ad-pill.idle { color: var(--text-3); }
.ad-badge { flex: none; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 999px; background: var(--line); color: var(--text-2); font-size: 10.5px; font-weight: 700; line-height: 18px; text-align: center; font-variant-numeric: tabular-nums; }
.ad-badge.hot { background: var(--accent); color: var(--on-accent); }
@keyframes ad-pulse { 50% { opacity: .35; } }

/* An explanation behind an (i): the button, and the line it opens. */
.ad-info { flex: none; width: 22px; height: 22px; padding: 0; border: 0; border-radius: 50%; display: inline-grid; place-items: center; background: transparent; color: var(--text-4); vertical-align: middle; }
.ad-info:hover, .ad-info[aria-expanded="true"] { color: var(--accent-text); background: var(--accent-soft); }
.ad-info svg { width: 15px; height: 15px; }
.ad-info-text { margin: 0; padding: 8px 10px; border-radius: 10px; background: var(--line-soft); font-size: 12.5px; line-height: 1.55; color: var(--text-3); }
.ad-label { display: flex; align-items: center; gap: 6px; margin: 0; font-size: 11px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: var(--text-4); }
.ad-hint { margin: 0; font-size: 12.5px; color: var(--text-3); }
.ad-note { color: var(--text-4); font-size: 13px; text-align: center; margin: auto; padding: 24px 16px; max-width: 34ch; line-height: 1.7; }
.ad-error { color: var(--err-text); font-size: 12.5px; }
.ad-empty { margin: auto; display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 36px 16px; text-align: center; color: var(--text-4); font-size: 13px; }
.ad-empty > span:first-child { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; background: var(--line-soft); color: var(--text-3); }
.ad-empty svg { width: 20px; height: 20px; }
.ad-empty .ad-info-text { max-width: 30ch; }

.ad-form { margin: auto; width: min(420px, 90%); display: flex; flex-direction: column; gap: 12px; padding: 26px 24px; border-radius: 20px; border: 1px solid var(--line); background: var(--panel-strong); box-shadow: var(--shadow); }
.ad-form h2 { margin: 0 0 4px; font-family: var(--serif); font-size: 20px; font-weight: 700; letter-spacing: .02em; }
.ad-form label { display: flex; flex-direction: column; gap: 4px; font-size: 12.5px; color: var(--text-3); }
.ad-form label.check { flex-direction: row; align-items: flex-start; gap: 8px; }
.ad-form input, .ad-form select { min-width: 0; padding: 9px 12px; border-radius: 11px; border: 1px solid var(--line); background: var(--input-bg); color: var(--text-1); outline: 0; }
.ad-form input:focus, .ad-form select:focus { border-color: color-mix(in srgb, var(--accent) 60%, transparent); }
.ad-md { overflow-wrap: anywhere; }
.ad-md p, .ad-md ul, .ad-md ol, .ad-md pre, .ad-md blockquote, .ad-md .md-table, .ad-md h3, .ad-md h4, .ad-md hr { margin: 0 0 .55em; }
.ad-md > :last-child { margin-bottom: 0; }
.ad-md h3 { font-size: 1.08em; font-weight: 700; } .ad-md h4 { font-size: 1em; font-weight: 700; }
.ad-md ul, .ad-md ol { padding-left: 1.35em; }
.ad-md code { font-family: var(--mono); font-size: .88em; padding: .1em .35em; border-radius: 6px; background: var(--line-soft); }
.ad-md pre { padding: 8px 10px; border-radius: 10px; background: var(--line-soft); overflow-x: auto; font-size: 12.5px; line-height: 1.5; }
.ad-md pre code { padding: 0; background: none; font-size: inherit; }
.ad-md blockquote { padding-left: 10px; border-left: 3px solid var(--line); color: var(--text-2); }
.ad-md a { color: var(--accent-text); text-decoration: underline; text-underline-offset: 2px; }
.ad-md hr { border: 0; border-top: 1px solid var(--line); }
.ad-md .md-table { max-width: 100%; overflow-x: auto; }
.ad-md table { border-collapse: collapse; font-size: .9em; }
.ad-md th, .ad-md td { border: 1px solid var(--line); padding: 4px 8px; text-align: left; vertical-align: top; }
.ad-md th { background: var(--line-soft); font-weight: 600; }
@media (prefers-reduced-motion: reduce) { .ad-root * { animation: none !important; transition: none !important; } }
`;

// client/style-chat.mjs
var CHAT = `
.ad-main { position: relative; flex: 1; min-width: 0; display: flex; flex-direction: column; min-height: 0; }
.ad-top { position: relative; z-index: 4; display: flex; align-items: center; justify-content: center; min-height: 62px; padding: 10px 96px 6px; }
.ad-ident { display: flex; align-items: center; gap: 9px; min-width: 0; max-width: min(440px, 100%); padding: 4px 14px 4px 4px; border: 1px solid var(--line); border-radius: 999px; background: var(--panel-strong); box-shadow: var(--shadow); }
.ad-ident .ad-avatar { width: 30px; height: 30px; font-size: 13px; }
.ad-ident .ad-name { font-size: 14.5px; font-weight: 600; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-ident .ad-meta-chip { display: inline-flex; align-items: center; gap: 4px; margin-left: 2px; font-size: 12px; color: var(--text-3); font-variant-numeric: tabular-nums; }
.ad-ident .ad-meta-chip svg { width: 14px; height: 14px; }
.ad-top .ad-act { position: absolute; right: 12px; top: 50%; transform: translateY(-40%); display: flex; align-items: center; gap: 2px; }

.ad-search { position: absolute; top: 58px; right: 12px; z-index: 5; width: min(420px, calc(100% - 24px)); display: flex; flex-direction: column; max-height: min(60vh, 520px); border-radius: 16px; border: 1px solid var(--line); background: var(--panel-strong); box-shadow: var(--lift); overflow: hidden; }
.ad-search form { display: flex; align-items: center; gap: 8px; padding: 6px 6px 6px 12px; border-bottom: 1px solid var(--line-soft); }
.ad-search form > svg { width: 16px; height: 16px; color: var(--text-4); }
.ad-search input { flex: 1; min-width: 0; height: 34px; border: 0; outline: 0; background: transparent; color: var(--text-1); font-size: 14px; }
.ad-search input::placeholder { color: var(--text-4); }
.ad-hits { overflow-y: auto; padding: 6px; display: flex; flex-direction: column; gap: 2px; }
.ad-hits .ad-hint { padding: 10px; text-align: center; }
.ad-hit { display: flex; flex-direction: column; gap: 2px; padding: 8px 10px; border: 0; border-radius: 10px; background: transparent; text-align: left; }
.ad-hit:hover, .ad-hit:focus-visible { background: var(--line-soft); }
.ad-hit .t { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-size: 13px; line-height: 1.5; color: var(--text-2); overflow-wrap: anywhere; }
.ad-hit .t b { color: var(--accent-text); font-weight: 600; }
.ad-hit .s { font-size: 11px; color: var(--text-4); }
.ad-around { position: absolute; top: 60px; left: 50%; z-index: 3; transform: translateX(-50%); display: flex; align-items: center; gap: 8px; padding: 4px 4px 4px 12px; border-radius: 999px; border: 1px solid var(--line); background: var(--panel-strong); box-shadow: var(--shadow); font-size: 12px; color: var(--text-3); white-space: nowrap; }
.ad-around svg { width: 14px; height: 14px; }

.ad-stream { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 8px max(18px, calc((100% - 760px) / 2)) 16px; display: flex; flex-direction: column; gap: 10px; scroll-behavior: smooth; }
.ad-stream > .grow { flex: 1; }
.ad-row { display: flex; flex-direction: column; gap: 4px; max-width: 78%; }
.ad-row.ai { align-self: flex-start; align-items: flex-start; }
.ad-row.me { align-self: flex-end; align-items: flex-end; }
.ad-row.note { align-self: center; align-items: center; max-width: 92%; }
.ad-note-bubble { border-style: dashed !important; border-color: var(--line-dash) !important; background: transparent !important; box-shadow: none !important; border-radius: 14px !important; padding: 5px 12px !important; color: var(--text-3); font-size: 12px; }
.ad-who-g { padding: 0 4px 1px; font-size: 11px; letter-spacing: .03em; color: var(--text-4); }
.ad-bubble { position: relative; max-width: 100%; padding: 9px 13px; border-radius: 6px 18px 18px 18px; border: 1px solid var(--line); background: var(--panel); box-shadow: var(--shadow); font-size: 15px; overflow-wrap: anywhere; user-select: text; }
.ad-row.ai .ad-bubble.first { border-radius: 18px 18px 18px 6px; }
.ad-row.me .ad-bubble { background: var(--mine); border-color: var(--mine-line); box-shadow: none; border-radius: 18px 18px 6px 18px; white-space: pre-wrap; }
.ad-bubble .ad-md { display: block; }
.ad-bubble .ad-md > p:last-child { display: inline; }
.ad-bubble .ad-md > p { margin: 0; }
.ad-bubble .ad-md > p + p { margin-top: .55em; }
.ad-meta { float: right; margin: 9px -3px -6px 12px; font-size: 11px; line-height: 1; color: var(--text-4); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ad-row.me .ad-meta { color: var(--text-3); }
.ad-quote { margin: 0 0 2px; padding: 5px 10px; border-radius: 10px; background: var(--line-soft); font-size: 12px; line-height: 1.5; color: var(--text-3); max-width: 100%; white-space: pre-wrap; overflow-wrap: anywhere; }

.ad-busy { display: flex; flex-direction: column; gap: 6px; align-items: flex-start; max-width: 100%; }
.ad-busy > button { display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 8px 0 10px; border-radius: 999px; border: 1px dashed var(--line-dash); background: transparent; color: var(--text-3); font-size: 12px; font-variant-numeric: tabular-nums; }
.ad-busy > button:hover { color: var(--text-1); border-color: var(--text-4); }
.ad-busy > button.live { color: var(--accent-text); border-color: color-mix(in srgb, var(--accent) 55%, transparent); }
.ad-busy > button.live .spark { animation: ad-pulse 1.4s infinite ease-in-out; }
.ad-busy > button svg { width: 13px; height: 13px; }
.ad-busy > button .spark, .ad-busy > button .chev { display: grid; place-items: center; }
.ad-busy > button .spark { color: var(--violet-text); }
.ad-busy > button .sep { width: 1px; height: 12px; background: var(--line); }
.ad-busy > button .chev { color: var(--text-4); transition: transform .15s; }
.ad-busy > button .chev svg { width: 12px; height: 12px; }
.ad-busy.open > button .chev { transform: rotate(90deg); }
.ad-busy-list { display: flex; flex-direction: column; width: min(360px, 70vw); padding: 4px 12px; border-radius: 14px; background: var(--panel-strong); border: 1px solid var(--line); font-size: 12px; line-height: 1.5; }
.ad-busy-item { border-top: 1px solid var(--line-soft); }
.ad-busy-item:first-child { border-top: 0; }
.ad-busy-item > button { display: flex; align-items: center; gap: 8px; width: 100%; padding: 6px 0; border: 0; background: none; text-align: left; color: var(--text-2); }
.ad-busy-item > button svg { width: 13px; height: 13px; color: var(--text-4); }
.ad-busy-item .what { flex: none; color: var(--text-1); }
.ad-busy-item .detail { flex: 1; min-width: 0; color: var(--text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-busy-item pre { margin: 0 0 8px; max-height: 40vh; overflow: auto; padding: 8px 10px; border-radius: 10px; background: var(--input-bg); white-space: pre-wrap; overflow-wrap: anywhere; font: 12px/1.6 var(--mono); color: var(--text-2); }
.ad-busy-item .label { font-size: 11px; color: var(--text-4); }

.ad-pics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px; width: min(260px, 70vw); }
.ad-pics.one { grid-template-columns: minmax(0, 1fr); }
.ad-pics button { padding: 0; border: 0; border-radius: 14px; overflow: hidden; aspect-ratio: 1; background: var(--panel); }
.ad-pics.one button { aspect-ratio: auto; min-height: 120px; }
.ad-pics img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ad-files { display: flex; flex-wrap: wrap; gap: 6px; max-width: 100%; }
.ad-file { display: inline-flex; align-items: center; gap: 6px; max-width: 100%; padding: 6px 10px; border-radius: 12px; border: 1px solid var(--line); background: var(--panel); color: var(--text-2); font-size: 12.5px; }
.ad-file:hover { border-color: var(--line-dash); }
.ad-file svg { width: 14px; height: 14px; color: var(--accent-text); }
.ad-file .n { max-width: 22ch; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-file .s { color: var(--text-4); font-variant-numeric: tabular-nums; }
.ad-voice { display: flex; align-items: center; gap: 10px; padding: 6px 12px 6px 6px; border-radius: 18px 18px 18px 6px; border: 1px solid var(--line); background: var(--panel); }
.ad-row.me .ad-voice { background: var(--mine); border-color: var(--mine-line); border-radius: 18px 18px 6px 18px; }
.ad-voice-play { flex: none; width: 32px; height: 32px; border-radius: 50%; border: 0; display: grid; place-items: center; background: var(--violet); color: #fff; }
.ad-row.me .ad-voice-play { background: var(--accent); color: var(--on-accent); }
.ad-voice-play svg { width: 13px; height: 13px; }
.ad-voice .len { font-size: 12px; color: var(--text-3); font-variant-numeric: tabular-nums; }
.ad-stickers { display: flex; flex-wrap: wrap; gap: 6px; }
.ad-sticker { border-radius: 14px; overflow: hidden; background: var(--panel); }
.ad-sticker img, .ad-sticker video { display: block; width: 112px; height: auto; image-rendering: pixelated; }

.ad-chips { display: flex; flex-wrap: wrap; gap: 6px; max-width: 100%; }
.ad-chip { display: inline-flex; align-items: center; gap: 6px; max-width: 100%; height: 28px; padding: 0 10px 0 6px; border-radius: 999px; border: 1px solid var(--line); background: var(--panel); color: var(--text-2); font-size: 12.5px; }
.ad-chip:hover { color: var(--text-1); border-color: var(--text-4); }
.ad-chip .n { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ad-chip .ad-helper { width: 18px; height: 18px; background: transparent; }

.ad-compose { padding: 4px max(18px, calc((100% - 772px) / 2)) 16px; }
.ad-bar { display: flex; align-items: flex-end; gap: 4px; padding: 5px; border: 1px solid var(--line); border-radius: 24px; background: var(--panel-strong); box-shadow: var(--shadow); transition: border-color .15s; }
.ad-bar:focus-within { border-color: color-mix(in srgb, var(--accent) 60%, transparent); }
.ad-field { flex: 1; min-width: 0; display: flex; align-items: flex-end; min-height: 38px; padding-left: 4px; }
.ad-field textarea { flex: 1; min-width: 0; max-height: 38vh; padding: 8px 0; border: 0; outline: 0; background: transparent; resize: none; font-size: 15px; line-height: 1.5; }
.ad-field textarea:focus-visible { outline: 0; } /* the bar around it shows the focus */
.ad-field textarea::placeholder { color: var(--text-4); }
.ad-round { flex: none; width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; border: 0; background: var(--accent); color: var(--on-accent); }
.ad-round svg { width: 18px; height: 18px; }
.ad-round:disabled { opacity: .45; }
.ad-plain { flex: none; width: 34px; height: 34px; margin-bottom: 2px; border: 0; border-radius: 50%; display: grid; place-items: center; background: transparent; color: var(--text-4); }
.ad-plain:hover { color: var(--text-1); background: var(--line-soft); }
.ad-plain svg { width: 18px; height: 18px; }
.ad-plain.on, .ad-plain[aria-expanded="true"] { color: var(--accent-text); background: var(--accent-soft); }
.ad-plain.rec { color: #fff; background: var(--err); animation: ad-pulse 1.4s infinite ease-in-out; }
.ad-thumbs { display: flex; gap: 8px; padding: 0 2px 8px; overflow-x: auto; }
.ad-thumbs div { position: relative; flex: none; width: 60px; height: 60px; border-radius: 12px; overflow: hidden; background: var(--panel); }
.ad-thumbs img { width: 100%; height: 100%; object-fit: cover; }
.ad-thumbs .ad-x { position: absolute; top: 2px; right: 2px; width: 20px; height: 20px; border-radius: 50%; border: 0; background: rgba(0, 0, 0, .55); color: #fff; display: grid; place-items: center; }
.ad-thumbs .ad-x svg { width: 10px; height: 10px; }
.ad-picker { display: flex; flex-direction: column; gap: 8px; max-height: 240px; overflow-y: auto; margin: 0 0 8px; padding: 10px; border-radius: 16px; border: 1px solid var(--line); background: var(--panel-strong); box-shadow: var(--shadow); }
.ad-pack-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(60px, 1fr)); gap: 6px; }
.ad-pack-grid button { aspect-ratio: 1; padding: 6px; border: 0; border-radius: 12px; background: var(--line-soft); display: grid; place-items: center; }
.ad-pack-grid button:hover { background: var(--accent-soft); }
.ad-pack-grid img, .ad-pack-grid video { max-width: 100%; max-height: 100%; image-rendering: pixelated; }
.ad-msg-acts { display: flex; align-items: center; gap: 0; margin: -2px 0 0 2px; opacity: 0; transition: opacity .12s; }
.ad-row:hover .ad-msg-acts, .ad-msg-acts:focus-within { opacity: 1; }
.ad-msg-acts .ad-icon-btn { width: 26px; height: 26px; color: var(--text-4); }
.ad-msg-acts .ad-icon-btn svg { width: 14px; height: 14px; }
.ad-msg-acts .said { margin-left: 6px; font-size: 11.5px; color: var(--text-3); }
.ad-cmds { display: flex; flex-direction: column; gap: 2px; margin: 0 0 8px; padding: 6px; border-radius: 14px; border: 1px solid var(--line); background: var(--panel-strong); box-shadow: var(--shadow); }
.ad-cmds button { display: flex; align-items: center; gap: 10px; padding: 7px 10px; border: 0; border-radius: 9px; background: transparent; text-align: left; color: var(--text-2); font-size: 13px; }
.ad-cmds button:hover, .ad-cmds button:focus-visible { background: var(--accent-soft); color: var(--text-1); }
.ad-cmds svg { width: 14px; height: 14px; color: var(--text-4); }
.ad-cmds code { min-width: 70px; font-family: var(--mono); color: var(--accent-text); }
.ad-notice { display: flex; align-items: flex-start; gap: 8px; margin: 0 max(18px, calc((100% - 772px) / 2)) 8px; padding: 10px 8px 10px 14px; border-radius: 14px; border: 1px dashed var(--line-dash); background: var(--panel); font-size: 13px; max-height: 30vh; overflow-y: auto; }
.ad-notice .ad-md { flex: 1; min-width: 0; }
`;

// client/style-rail.mjs
var RAIL = `
.ad-rail { flex: none; width: var(--rail-w); display: flex; flex-direction: column; min-height: 0; padding: 10px 10px 8px; background: var(--glass); border-right: 1px solid var(--line-soft); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
.ad-rail-head { display: flex; align-items: center; gap: 9px; padding: calc(var(--ad-top-inset, 0px) + 6px) 8px 14px; }
.ad-rail-brand { flex: 1; min-width: 0; font-family: var(--serif); font-size: 18px; font-weight: 700; letter-spacing: .05em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-rail-mark { flex: none; width: 26px; height: 26px; border-radius: 9px; display: grid; place-items: center; background: var(--avatar-bg); box-shadow: 0 0 0 1px var(--avatar-ring); color: var(--moon); font-size: 13px; }
.ad-rail-list { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; margin: 0 -4px; padding: 0 4px; }
.ad-rail-list .ad-label { margin: 14px 8px 4px; }
.ad-rail-list .ad-label:first-child { margin-top: 2px; }
.ad-row-btn { position: relative; display: flex; align-items: center; gap: 10px; width: 100%; min-height: 46px; padding: 6px 8px; border: 0; border-radius: 12px; background: transparent; text-align: left; color: var(--text-2); }
.ad-row-btn:hover { background: var(--line-soft); color: var(--text-1); }
.ad-row-btn[aria-current="page"] { background: var(--accent-soft); color: var(--text-1); }
.ad-row-btn[aria-current="page"] .ad-avatar { box-shadow: 0 0 0 2px var(--accent), 0 0 16px rgba(244, 160, 124, .3); }
.ad-row-btn .ad-avatar { width: 34px; height: 34px; font-size: 15px; }
.ad-row-btn .n { flex: 1; min-width: 0; font-size: 14px; line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-row-btn[aria-current="page"] .n { font-weight: 600; }
.ad-row-btn .ad-dot { margin-right: 4px; }
.ad-rail-label { justify-content: space-between; min-height: 28px; }
.ad-rail-label .ad-icon-btn { width: 24px; height: 24px; margin-right: -4px; opacity: .7; }
.ad-rail-label .ad-icon-btn:hover { opacity: 1; }
.ad-rail-form { display: flex; flex-direction: column; gap: 6px; margin: 2px 4px 8px; padding: 10px; border-radius: 12px; border: 1px solid var(--line); background: var(--panel-strong); }
.ad-rail-form input { height: 32px; padding: 0 10px; border-radius: 9px; border: 1px solid var(--line); background: var(--input-bg); color: var(--text-1); font-size: 13px; outline: 0; }
.ad-rail-form input:focus { border-color: color-mix(in srgb, var(--accent) 60%, transparent); }
.ad-row-wrap { position: relative; display: flex; align-items: center; }
.ad-row-wrap .ad-machine-go { position: absolute; right: 8px; }
.ad-row-btn .n small { display: block; font-size: 11.5px; line-height: 1.3; color: var(--text-4); font-weight: 400; }
.ad-avatar.machine { overflow: visible; background: var(--line-soft); box-shadow: 0 0 0 1px var(--line); color: var(--text-2); }
.ad-avatar.machine svg { width: 52%; height: 52%; color: var(--text-2); }
.ad-avatar.machine .ad-dot { position: absolute; right: -1px; bottom: -1px; width: 11px; height: 11px; border: 2px solid var(--bg); }
.ad-rail-foot { display: flex; align-items: center; gap: 2px; margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--line-soft); }
.ad-rail-foot .sp { flex: 1; }
.ad-machine-go { flex: none; width: 28px; height: 28px; border: 0; border-radius: 50%; display: grid; place-items: center; background: var(--accent-soft); color: var(--accent-text); }
.ad-machine-go:hover { background: var(--accent); color: var(--on-accent); }
.ad-machine-go svg { width: 13px; height: 13px; }
.ad-dsh { flex: none; display: inline-flex; align-items: center; gap: 5px; height: 28px; padding: 0 9px; border: 1px solid var(--line); border-radius: 9px; background: transparent; color: var(--text-3); font-size: 12px; font-weight: 600; letter-spacing: .03em; }
.ad-dsh:hover { color: var(--text-1); border-color: var(--line-dash); }
.ad-dsh svg { width: 14px; height: 14px; }
.ad-side .ad-rail { width: 100%; height: 100%; border-right: 0; border-radius: 0; }
`;

// client/style-machine.mjs
var MACHINE = `
.ad-mv { flex: 1; min-height: 0; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); align-content: start; gap: 12px; padding: 8px max(18px, calc((100% - 880px) / 2)) 24px; }
.ad-mv-wide, .ad-mv-card.live { grid-column: 1 / -1; }
.ad-mv-card { display: flex; flex-direction: column; gap: 10px; min-width: 0; padding: 14px 16px; border-radius: 16px; border: 1px solid var(--line); background: var(--panel); box-shadow: var(--shadow); }
.ad-mv-title { justify-content: space-between; }
.ad-mv-state { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.ad-mv-state b { font-family: var(--serif); font-size: 22px; font-weight: 700; letter-spacing: .02em; }
.ad-dot.big { width: 12px; height: 12px; }
.ad-dot.big.ok { box-shadow: 0 0 0 4px var(--ok-soft); }
.ad-mv-card .ad-pill { height: 24px; gap: 6px; font-size: 12px; }
.ad-seg { display: inline-flex; padding: 2px; border-radius: 999px; background: var(--line-soft); }
.ad-seg button { display: inline-flex; align-items: center; gap: 5px; height: 22px; padding: 0 10px 0 7px; border: 0; border-radius: 999px; background: transparent; color: var(--text-3); font-size: 12px; font-weight: 500; }
.ad-seg button[aria-pressed="true"] { background: var(--panel-strong); color: var(--text-1); box-shadow: var(--shadow); }
.ad-seg button:disabled { opacity: .6; }
.ad-seg svg { width: 13px; height: 13px; }
.ad-mv-card .ad-pill svg { width: 13px; height: 13px; }
.ad-mv-card .ad-pill .ad-helper { width: 16px; height: 16px; background: transparent; }
.ad-mv-folder { display: flex; align-items: center; gap: 8px; min-width: 0; padding: 8px 10px; border-radius: 10px; background: var(--line-soft); }
.ad-mv-folder svg { width: 16px; height: 16px; color: var(--accent-text); }
.ad-mv-folder code { flex: 1; min-width: 0; font: 12.5px/1.4 var(--mono); color: var(--text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-mv-tiles { display: grid; grid-template-columns: 1.6fr 1fr 1fr; gap: 10px; height: 100%; }
.ad-mv-tiles > div { display: flex; flex-direction: column; justify-content: center; gap: 2px; min-width: 0; padding: 8px 10px; border-radius: 12px; background: var(--line-soft); }
.ad-mv-tiles small { font-size: 11px; color: var(--text-4); }
.ad-mv-tiles b { font-size: 18px; font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-mv-tiles > div:first-child b { font-size: 13.5px; }
.ad-mv-list { display: flex; flex-direction: column; gap: 2px; margin: 0 -8px; }
.ad-mv-row { display: flex; align-items: center; gap: 10px; min-height: 42px; padding: 6px 8px; border: 0; border-radius: 10px; background: transparent; text-align: left; color: var(--text-2); }
.ad-mv-row:hover { background: var(--line-soft); color: var(--text-1); }
.ad-mv-row .n { flex: 1; min-width: 0; font-size: 13.5px; color: var(--text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-mi.hot { color: var(--accent-text); font-weight: 600; }
.ad-mv-log { margin: 0; max-height: 220px; overflow: auto; padding: 10px 12px; border-radius: 10px; background: var(--input-bg); font: 11.5px/1.6 var(--mono); color: var(--text-3); white-space: pre-wrap; overflow-wrap: anywhere; }
`;

// client/style-right.mjs
var RIGHT = `
.ad-right { flex: none; width: var(--panel-w); display: flex; flex-direction: column; min-height: 0; background: var(--glass); border-left: 1px solid var(--line-soft); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
.ad-right.overlay { position: absolute; top: 0; right: 0; bottom: 0; z-index: 6; width: min(var(--panel-w), 88%); box-shadow: var(--lift); }
.ad-right-head { display: flex; align-items: center; gap: 4px; padding: 12px 10px 10px 12px; }
.ad-tabs { flex: 1; min-width: 0; display: flex; gap: 2px; padding: 3px; border-radius: 12px; background: var(--line-soft); }
.ad-tab { flex: 1; min-width: 0; display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 32px; padding: 0 6px; border: 0; border-radius: 9px; background: transparent; color: var(--text-3); font-size: 12.5px; white-space: nowrap; }
.ad-tab svg { width: 15px; height: 15px; }
.ad-tab:hover { color: var(--text-1); }
.ad-tab[aria-selected="true"] { background: var(--panel-strong); color: var(--text-1); font-weight: 600; box-shadow: var(--shadow); }
.ad-tab .w { display: none; overflow: hidden; text-overflow: ellipsis; }
.ad-tab[aria-selected="true"] { flex: 1.8; }
.ad-tab[aria-selected="true"] .w { display: inline; }

.ad-panel { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding: 4px 12px 14px; overscroll-behavior: contain; }
.ad-panel > * { flex-shrink: 0; }
.ad-panel-bar { display: flex; align-items: center; gap: 8px; min-height: 28px; padding: 0 2px; font-size: 12px; color: var(--text-3); }
.ad-panel-bar .sp { flex: 1; }
.ad-explained { display: flex; align-items: center; gap: 6px; min-width: 0; }
.ad-fold.ad-label { font-size: 11px; }
.ad-fold { display: flex; align-items: center; gap: 6px; width: 100%; margin-top: 6px; padding: 4px 4px; border: 0; background: transparent; color: var(--text-4); text-align: left; }
.ad-fold:hover { color: var(--text-1); }
.ad-fold svg { width: 13px; height: 13px; transition: transform .15s; }
.ad-fold[aria-expanded="false"] svg { transform: rotate(-90deg); }

.ad-card { position: relative; display: flex; flex-direction: column; gap: 7px; width: 100%; padding: 10px 12px; border-radius: 14px; border: 1px solid var(--line); background: var(--panel); color: inherit; text-align: left; }
button.ad-card:hover { border-color: var(--line-dash); background: var(--panel-strong); }
.ad-card.ask { border-color: color-mix(in srgb, var(--accent) 50%, transparent); background: var(--accent-soft); }
.ad-card.dim { opacity: .6; }
.ad-card-top { display: flex; align-items: flex-start; gap: 10px; width: 100%; padding: 0; border: 0; background: transparent; text-align: left; color: inherit; }
.ad-card-title { flex: 1; min-width: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-size: 13.5px; font-weight: 600; line-height: 1.4; overflow-wrap: anywhere; }
.ad-card-time { flex: none; padding-top: 1px; font-size: 11.5px; color: var(--text-4); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ad-card-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.ad-card-row .sp { flex: 1; }
.ad-card-more { margin: 0; font-size: 12.5px; line-height: 1.55; color: var(--text-2); overflow-wrap: anywhere; }
.ad-card .ad-hide { position: absolute; top: 6px; right: 6px; opacity: 0; transition: opacity .12s; background: var(--panel-strong); }
.ad-card:hover .ad-hide, .ad-card:focus-within .ad-hide { opacity: 1; }
.ad-card:hover .ad-card-time, .ad-card:focus-within .ad-card-time { visibility: hidden; }
.ad-mi { display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px; color: var(--text-4); font-variant-numeric: tabular-nums; }
.ad-mi svg { width: 13px; height: 13px; }
.ad-track { position: relative; height: 2px; border-radius: 2px; background: var(--line); overflow: hidden; }
.ad-track span { position: absolute; top: 0; bottom: 0; left: -40%; width: 40%; border-radius: 2px; background: var(--accent); animation: ad-slide 1.6s infinite ease-in-out; }
@keyframes ad-slide { to { left: 100%; } }
.ad-meter { display: inline-flex; align-items: center; gap: 6px; font-variant-numeric: tabular-nums; }
.ad-meter i { position: relative; display: block; width: 46px; height: 4px; border-radius: 2px; background: var(--line); overflow: hidden; }
.ad-meter i b { position: absolute; inset: 0 auto 0 0; border-radius: 2px; background: var(--accent); }

.ad-say { position: sticky; bottom: -14px; display: flex; gap: 6px; align-items: flex-end; margin: 0 -12px -14px; padding: 10px 12px 12px; background: var(--glass); backdrop-filter: blur(14px); }
.ad-say textarea { flex: 1; min-width: 0; min-height: 40px; max-height: 30vh; padding: 9px 12px; border-radius: 14px; border: 1px solid var(--line); background: var(--panel-strong); color: var(--text-1); outline: 0; resize: vertical; font-size: 13.5px; }
.ad-say textarea:focus { border-color: color-mix(in srgb, var(--accent) 60%, transparent); }

.ad-alarm { position: relative; display: flex; align-items: center; gap: 10px; padding: 8px 8px 8px 10px; border-radius: 12px; }
.ad-alarm:hover, .ad-alarm:focus-within { background: var(--line-soft); }
.ad-alarm .mark { flex: none; width: 14px; display: grid; place-items: center; color: var(--violet-text); }
.ad-alarm .mark svg { width: 14px; height: 14px; }
.ad-alarm .mark .ad-dot, .ad-legend .ad-dot { width: 7px; height: 7px; background: var(--accent); }
.ad-alarm .when { flex: none; width: 66px; display: flex; flex-direction: column; align-items: flex-start; padding: 0; border: 0; background: transparent; text-align: left; color: var(--text-1); }
.ad-alarm .when b { font-size: 14px; font-weight: 600; line-height: 1.3; font-variant-numeric: tabular-nums; }
.ad-alarm .when small { font-size: 11px; color: var(--text-4); }
.ad-alarm button.when:hover b { color: var(--accent-text); }
.ad-alarm .note { flex: 1; min-width: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-size: 13px; line-height: 1.45; color: var(--text-2); }
.ad-alarm .ad-icon-btn { opacity: 0; }
.ad-alarm:hover .ad-icon-btn, .ad-alarm:focus-within .ad-icon-btn { opacity: 1; }
.ad-alarm-edit { display: flex; align-items: center; gap: 4px; flex: 1; min-width: 0; }
.ad-alarm-edit input { flex: 1; min-width: 0; height: 30px; padding: 0 9px; border-radius: 9px; border: 1px solid color-mix(in srgb, var(--accent) 60%, transparent); background: var(--input-bg); color: var(--text-1); font-size: 13px; outline: 0; font-variant-numeric: tabular-nums; }
.ad-legend { gap: 12px; font-size: 11px; color: var(--text-4); }
.ad-legend .sp { flex: 1; }
.ad-legend span { display: inline-flex; align-items: center; gap: 5px; }
.ad-legend svg { width: 12px; height: 12px; color: var(--violet-text); }
`;

// client/style-sheet.mjs
var SHEET = `
.ad-scrim { position: absolute; inset: 0; z-index: 20; display: grid; place-items: center; padding: 28px; background: var(--scrim); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); container-type: inline-size; }
.ad-sheet { display: flex; width: min(820px, 100%); height: min(640px, 100%); border-radius: 20px; border: 1px solid var(--line); background: var(--panel-strong); box-shadow: var(--lift); overflow: hidden; }
.ad-sheet.small { width: min(480px, 100%); height: auto; max-height: 100%; flex-direction: column; }
.ad-sheet-nav { flex: none; width: 200px; display: flex; flex-direction: column; gap: 2px; padding: 16px 10px; border-right: 1px solid var(--line-soft); background: var(--line-soft); overflow-y: auto; }
.ad-sheet-title { margin: 2px 10px 12px; font-family: var(--serif); font-size: 18px; font-weight: 700; letter-spacing: .03em; }
.ad-sheet-nav button { display: flex; align-items: center; gap: 10px; height: 34px; padding: 0 10px; border: 0; border-radius: 10px; background: transparent; color: var(--text-2); font-size: 13.5px; text-align: left; white-space: nowrap; }
.ad-sheet-nav button:hover { background: var(--line-soft); color: var(--text-1); }
.ad-sheet-nav button[aria-current="page"] { background: var(--panel-strong); color: var(--text-1); font-weight: 600; box-shadow: var(--shadow); }
.ad-sheet-nav button[aria-current="page"] svg { color: var(--accent-text); }
.ad-sheet-nav svg { width: 16px; height: 16px; color: var(--text-3); }
.ad-sheet-body { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.ad-sheet-head { display: flex; align-items: center; gap: 8px; padding: 16px 16px 10px 24px; border-bottom: 1px solid var(--line-soft); }
.ad-sheet-head h2 { flex: 1; margin: 0; font-family: var(--serif); font-size: 19px; font-weight: 700; letter-spacing: .02em; }
.ad-sheet-scroll { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 18px; padding: 18px 24px 28px; }
.ad-sheet-sections { display: flex; flex-direction: column; gap: 18px; }
.ad-sheet-block { display: flex; flex-direction: column; gap: 10px; }
.ad-sheet-block + .ad-sheet-block { padding-top: 16px; border-top: 1px solid var(--line-soft); }
.ad-sheet-subhead { display: flex; align-items: center; gap: 8px; min-height: 28px; }
.ad-sheet-subhead .sp { flex: 1; }
.ad-sheet-subhead .ad-label svg, .ad-sheet-block > .ad-label svg { width: 13px; height: 13px; }
.ad-filter { margin-left: auto; width: 180px; height: 28px; padding: 0 10px; border-radius: 9px; border: 1px solid var(--line); background: var(--input-bg); color: var(--text-1); font-size: 12.5px; outline: 0; }
.ad-field-row { display: flex; flex-direction: column; gap: 5px; }
.ad-field-row > label { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--text-3); }
.ad-field-row > label span { font-size: 11.5px; color: var(--err-text); } .ad-field-row > label span.ok { color: var(--ok-text); }
.ad-set-line { display: flex; align-items: center; gap: 6px; }
.ad-set-line input, .ad-set-line select, .ad-sheet-form input, .ad-sheet-form textarea { flex: 1; min-width: 0; height: 34px; padding: 0 11px; border-radius: 10px; border: 1px solid var(--line); background: var(--input-bg); color: var(--text-1); font-size: 13.5px; outline: 0; }
.ad-sheet-form textarea { height: auto; padding: 8px 11px; resize: vertical; }
.ad-set-line input:focus, .ad-set-line select:focus, .ad-sheet-form input:focus, .ad-sheet-form textarea:focus, .ad-persona:focus { border-color: color-mix(in srgb, var(--accent) 60%, transparent); }
.ad-persona { width: 100%; min-height: 120px; max-height: 40vh; padding: 10px 12px; border-radius: 12px; border: 1px solid var(--line); background: var(--input-bg); color: var(--text-1); outline: 0; resize: vertical; font-size: 13.5px; line-height: 1.65; }
.ad-sheet-form { display: flex; flex-direction: column; gap: 6px; padding: 10px; border-radius: 12px; background: var(--line-soft); }
.ad-sheet-form.row { flex-direction: row; flex-wrap: wrap; align-items: center; background: transparent; padding: 0; }
.ad-sheet-me { display: flex; align-items: center; gap: 12px; }
.ad-sheet-me .ad-avatar { width: 56px; height: 56px; font-size: 22px; }
.ad-sheet-me > div { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.ad-sheet-me b { font-size: 16px; } .ad-sheet-me span { font-size: 12px; color: var(--text-4); }
.ad-list-row { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; min-height: 40px; padding: 4px 0; border-bottom: 1px solid var(--line-soft); }
.ad-list-row .n { flex: 1; min-width: 0; display: flex; flex-direction: column; font-size: 13.5px; color: var(--text-1); }
.ad-list-row .n small { font-size: 11.5px; color: var(--text-4); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-list-row .full { flex-basis: 100%; margin: 0; }
.ad-pack-row { display: flex; flex-direction: column; gap: 6px; }
.ad-pack-strip { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; }
.ad-pack-strip img { flex: none; width: 40px; height: 40px; object-fit: contain; border-radius: 8px; background: var(--line-soft); image-rendering: pixelated; }
.ad-switch { position: relative; flex: none; width: 34px; height: 20px; }
.ad-switch input { position: absolute; inset: 0; opacity: 0; margin: 0; cursor: pointer; }
.ad-switch span { position: absolute; inset: 0; border-radius: 999px; background: var(--line); transition: background .15s; pointer-events: none; }
.ad-switch span::after { content: ""; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0, 0, 0, .2); transition: transform .15s; }
.ad-switch input:checked + span { background: var(--accent); } .ad-switch input:checked + span::after { transform: translateX(14px); }
.ad-switch input:focus-visible + span { outline: 2px solid var(--accent); outline-offset: 2px; }
.ad-seg { display: inline-flex; gap: 2px; padding: 3px; border-radius: 11px; background: var(--line-soft); align-self: flex-start; }
.ad-seg button { height: 30px; padding: 0 16px; border: 0; border-radius: 8px; background: transparent; color: var(--text-3); font-size: 13px; }
.ad-seg button[aria-checked="true"] { background: var(--panel-strong); color: var(--text-1); font-weight: 600; box-shadow: var(--shadow); }
.ad-tiles { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.ad-tile { display: flex; flex-direction: column; gap: 2px; padding: 12px 14px; border-radius: 14px; border: 1px solid var(--line); background: var(--panel); }
.ad-tile small { font-size: 11.5px; color: var(--text-4); }
.ad-tile b { font-family: var(--serif); font-size: 24px; font-weight: 700; font-variant-numeric: tabular-nums; }
.ad-tile .u { margin-top: -4px; font-size: 11px; color: var(--text-4); }
.ad-tile .row { display: flex; justify-content: space-between; gap: 6px; margin-top: 6px; font-size: 12px; color: var(--text-3); font-variant-numeric: tabular-nums; }
.ad-calls { display: flex; flex-direction: column; }
.ad-call { display: grid; grid-template-columns: 96px minmax(0, 1fr) 110px 64px; gap: 10px; align-items: center; min-height: 32px; border-bottom: 1px solid var(--line-soft); font-size: 12.5px; color: var(--text-2); font-variant-numeric: tabular-nums; }
.ad-call .w { color: var(--text-4); } .ad-call .m { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .ad-call .n, .ad-call .c { text-align: right; }
.ad-check { display: flex; align-items: center; gap: 8px; font-size: 13.5px; }
.ad-checks { display: flex; flex-wrap: wrap; gap: 6px 14px; }
@container (max-width: 620px) {
  .ad-sheet { flex-direction: column; }
  .ad-sheet-nav { width: auto; flex-direction: row; padding: 8px; border-right: 0; border-bottom: 1px solid var(--line-soft); overflow-x: auto; }
  .ad-sheet-title { display: none; }
  .ad-tiles { grid-template-columns: minmax(0, 1fr); }
  .ad-call { grid-template-columns: 80px minmax(0, 1fr) 90px; } .ad-call .c { display: none; }
}
`;

// client/style-thread.mjs
var THREAD = `
.ad-right { position: relative; }
.ad-grip { position: absolute; top: 0; bottom: 0; left: -4px; z-index: 2; width: 8px; cursor: col-resize; }
.ad-grip::after { content: ""; position: absolute; top: 50%; left: 3px; width: 2px; height: 36px; margin-top: -18px; border-radius: 2px; background: var(--line); opacity: 0; transition: opacity .15s; }
.ad-right:hover .ad-grip::after, .ad-grip:focus-visible::after { opacity: 1; }
.ad-helper { flex: none; width: 26px; height: 26px; border-radius: 8px; display: grid; place-items: center; background: var(--line-soft); color: var(--text-2); }
.ad-helper svg { width: 15px; height: 15px; }
.ad-card .ad-helper { width: 22px; height: 22px; border-radius: 7px; }
.ad-card .ad-helper svg { width: 13px; height: 13px; }

.ad-thread { gap: 10px; }
.ad-tv-head { display: flex; align-items: center; gap: 8px; padding-top: 2px; }
.ad-tv-head h3 { flex: 1; min-width: 0; margin: 0; font-size: 14.5px; font-weight: 600; line-height: 1.35; overflow-wrap: anywhere; }
.ad-tv-meta { display: flex; align-items: center; gap: 10px; padding: 0 2px 4px; border-bottom: 1px solid var(--line-soft); }
.ad-tv-meta .sp { flex: 1; }
.ad-timeline { display: flex; flex-direction: column; gap: 8px; }
.ad-tl-brief { align-self: flex-end; max-width: 92%; padding: 8px 12px; border-radius: 14px 14px 4px 14px; background: var(--mine); border: 1px solid var(--mine-line); font-size: 13.5px; white-space: pre-wrap; overflow-wrap: anywhere; }
.ad-tl-brief .who { display: block; margin-bottom: 2px; font-size: 10.5px; letter-spacing: .06em; text-transform: uppercase; color: var(--text-3); }
.ad-tl-say { padding: 2px 2px; font-size: 13.5px; line-height: 1.6; color: var(--text-1); }
.ad-thought > button { display: inline-flex; align-items: center; gap: 6px; padding: 2px 6px; border: 0; border-radius: 8px; background: transparent; color: var(--violet-text); font-size: 12px; }
.ad-thought > button svg { width: 13px; height: 13px; }
.ad-thought > button svg:last-child { color: var(--text-4); transition: transform .15s; }
.ad-thought > button[aria-expanded="true"] svg:last-child { transform: rotate(90deg); }
.ad-thought p { margin: 4px 0 0 8px; padding-left: 10px; border-left: 2px solid color-mix(in srgb, var(--violet) 40%, transparent); font-size: 12.5px; color: var(--text-3); white-space: pre-wrap; }

.ad-tool { border: 1px solid var(--line); border-radius: 11px; background: var(--panel); overflow: hidden; }
.ad-tool.open { border-color: var(--line-dash); }
.ad-tool-row { display: flex; align-items: center; gap: 8px; width: 100%; min-height: 34px; padding: 6px 10px; border: 0; background: transparent; text-align: left; color: var(--text-2); font-size: 12.5px; }
.ad-tool-row:hover { background: var(--line-soft); }
.ad-tool-row .k { flex: none; width: 22px; height: 22px; border-radius: 7px; display: grid; place-items: center; background: var(--line-soft); color: var(--text-3); }
.ad-tool-row .k svg { width: 13px; height: 13px; }
.ad-tool-row .n { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-tool-row code { font-family: var(--mono); font-size: 12px; color: var(--text-1); }
.ad-tool-row code::before { content: "$ "; color: var(--text-4); }
.ad-tool-body { display: flex; flex-direction: column; gap: 8px; padding: 4px 10px 10px; border-top: 1px solid var(--line-soft); }
.ad-tool-body .ad-label { margin: 4px 0; }
.ad-tool-body pre { margin: 0; max-height: 280px; overflow: auto; padding: 8px 10px; border-radius: 9px; background: var(--input-bg); white-space: pre-wrap; overflow-wrap: anywhere; font: 11.5px/1.55 var(--mono); color: var(--text-2); }
.ad-tool-files { display: flex; flex-direction: column; gap: 2px; }
.ad-pathbtn { display: flex; align-items: center; gap: 6px; padding: 4px 6px; border: 0; border-radius: 7px; background: transparent; color: var(--text-2); font: 11.5px/1.4 var(--mono); text-align: left; }
.ad-pathbtn:hover { background: var(--line-soft); color: var(--accent-text); }
.ad-pathbtn svg { width: 12px; height: 12px; color: var(--text-4); }
.ad-pathbtn > span:nth-child(2) { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ad-diffn { flex: none; display: inline-flex; gap: 4px; font: 600 11px/1 var(--mono); }
.ad-diffn b { color: var(--ok-text); font-weight: 600; } .ad-diffn i { color: var(--err-text); font-style: normal; }

.ad-plan { padding: 8px 12px; border-radius: 12px; border: 1px solid var(--line); background: var(--panel); }
.ad-plan .ad-label { gap: 8px; margin-bottom: 4px; }
.ad-plan ul { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 3px; }
.ad-plan li { display: flex; align-items: flex-start; gap: 8px; font-size: 12.5px; line-height: 1.5; color: var(--text-2); }
.ad-plan li .box { flex: none; width: 15px; height: 15px; margin-top: 2px; border-radius: 5px; border: 1.5px solid var(--line-dash); display: grid; place-items: center; }
.ad-plan li.completed { color: var(--text-4); text-decoration: line-through; text-decoration-color: var(--line-dash); }
.ad-plan li.completed .box { border-color: var(--ok); background: var(--ok); color: var(--bg); }
.ad-plan li.in_progress { color: var(--text-1); font-weight: 500; }
.ad-plan li.in_progress .box { border-color: var(--warn); }
.ad-plan li .box svg { width: 10px; height: 10px; stroke-width: 3; }
.ad-plan li .box .ad-dot { width: 6px; height: 6px; }

.ad-perm { display: flex; flex-direction: column; gap: 6px; padding: 10px 12px; border-radius: 12px; border: 1px solid var(--line); background: var(--panel); }
.ad-perm.waiting { border-color: color-mix(in srgb, var(--accent) 55%, transparent); background: var(--accent-soft); }
.ad-perm .top { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; }
.ad-perm .top svg { width: 16px; height: 16px; color: var(--accent-text); }
.ad-perm .top .n { flex: 1; min-width: 0; overflow-wrap: anywhere; }
.ad-perm .paths { margin: 0; font: 11.5px/1.5 var(--mono); color: var(--text-3); overflow-wrap: anywhere; }
.ad-perm .said { margin: 0; font-size: 12px; color: var(--text-3); }
.ad-perm .said.allowed { color: var(--ok-text); } .ad-perm .said.denied { color: var(--err-text); }
.ad-tl-result { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; padding: 10px 12px; border-radius: 12px; border: 1px dashed var(--line-dash); }
.ad-tl-result .text { font-size: 13.5px; line-height: 1.6; }
`;

// client/theme.mjs
var TOKENS = `.ad-root {
  color-scheme: dark;
  --bg: #070a16;
  --nebula-a: rgba(139, 124, 246, .16);
  --nebula-b: rgba(244, 160, 124, .10);
  --nebula-c: rgba(90, 140, 255, .08);
  --stars-opacity: .9;
  --star-1: rgba(255, 255, 255, .85);
  --star-2: rgba(190, 205, 255, .7);
  --star-3: rgba(244, 160, 124, .55);
  --glass: rgba(7, 10, 22, .6);
  --panel: rgba(21, 27, 54, .62);
  --panel-strong: rgba(23, 29, 58, .96);
  --line: rgba(148, 163, 255, .16);
  --line-soft: rgba(148, 163, 255, .09);
  --line-dash: rgba(148, 163, 255, .32);
  --mine: rgba(244, 160, 124, .16);
  --mine-line: rgba(244, 160, 124, .35);
  --text-1: #eef0ff;
  --text-2: #c9cdea;
  --text-3: #a3a9cf;
  --text-4: #8a90b8;
  --accent: #F4A07C;
  --accent-text: #F4A07C;
  --accent-soft: rgba(244, 160, 124, .12);
  --on-accent: #251304;
  --violet: #8b7cf6;
  --violet-text: #b3a8ff;
  --moon: #F6DDAE;
  --ok: #7BD3A0;
  --ok-text: #a7e6c2;
  --ok-soft: rgba(123, 211, 160, .1);
  --warn: #F2C46D;
  --err: #f87171;
  --err-text: #fca5a5;
  --idle: #6d7399;
  --shadow: 0 1px 0 rgba(180, 190, 255, .07) inset, 0 10px 30px rgba(2, 5, 18, .5);
  --lift: 0 24px 80px rgba(2, 5, 18, .6);
  --avatar-bg: radial-gradient(circle at 35% 30%, #2d2b66, #11142e 72%);
  --avatar-ring: rgba(246, 221, 174, .35);
  --input-bg: #0b0f22;
  --scrim: rgba(4, 6, 16, .62);
  --rail-w: 248px;
  --panel-w: 340px;
  --font: system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", "Microsoft YaHei", "Segoe UI", sans-serif;
  --serif: "Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", Georgia, serif;
  --mono: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.ad-root.day {
  color-scheme: light;
  --bg: #F8F3EC;
  --nebula-a: rgba(244, 160, 124, .20);
  --nebula-b: rgba(246, 221, 174, .42);
  --nebula-c: rgba(139, 124, 246, .07);
  --stars-opacity: .55;
  --star-1: rgba(201, 150, 46, .55);
  --star-2: rgba(214, 120, 84, .35);
  --star-3: rgba(201, 150, 46, .45);
  --glass: rgba(251, 247, 241, .78);
  --panel: rgba(255, 255, 255, .80);
  --panel-strong: #FFFDFA;
  --line: rgba(120, 86, 60, .15);
  --line-soft: rgba(120, 86, 60, .08);
  --line-dash: rgba(120, 86, 60, .28);
  --mine: rgba(244, 160, 124, .22);
  --mine-line: rgba(214, 120, 84, .30);
  --text-1: #2B2420;
  --text-2: #463c36;
  --text-3: #6a5c53;
  --text-4: #75675d;
  --accent: #F4A07C;
  --accent-text: #A34D2A;
  --accent-soft: rgba(244, 160, 124, .18);
  --on-accent: #2a1608;
  --violet: #8b7cf6;
  --violet-text: #5B4BC4;
  --moon: #C9962E;
  --ok: #3E9A6A;
  --ok-text: #2c7a52;
  --ok-soft: rgba(62, 154, 106, .1);
  --warn: #D08A2E;
  --err: #B23B31;
  --err-text: #B23B31;
  --idle: #b3a69b;
  --shadow: 0 1px 0 rgba(255, 255, 255, .7) inset, 0 6px 20px rgba(120, 80, 50, .08);
  --lift: 0 24px 70px rgba(120, 80, 50, .18);
  --avatar-bg: radial-gradient(circle at 35% 30%, #fff6dc, #f6e1d3 75%);
  --avatar-ring: rgba(201, 150, 46, .45);
  --input-bg: #fff;
  --scrim: rgba(60, 40, 25, .22);
}`;

// client/index.mjs
var inject = ["slots", "layout"];
var STYLES = [TOKENS, BASE, RAIL, CHAT, RIGHT, THREAD, MACHINE, SHEET].join("\n");
var PANEL = "aelios-desktop";
var SHADOW_PRIORITY = -100;
var POLL_MS5 = 5e3;
function useStatus() {
  const { status } = useStore(store);
  (0, import_react32.useEffect)(() => {
    const load = async () => {
      try {
        store.set({ status: await call("status") });
      } catch (e) {
        store.set({ error: e.message });
      }
    };
    void load();
    const timer = setInterval(() => {
      if (!document.hidden) void load();
    }, POLL_MS5);
    return () => clearInterval(timer);
  }, []);
  return status;
}
var NARROW = 980;
function useDay() {
  const [day, setDay] = (0, import_react32.useState)(() => paletteOf(readSurface()) === "day");
  (0, import_react32.useEffect)(() => {
    const update = () => setDay(paletteOf(readSurface()) === "day");
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style", "class", "data-ds-theme-source"] });
    const media = typeof matchMedia === "function" ? matchMedia("(prefers-color-scheme: light)") : null;
    media?.addEventListener?.("change", update);
    return () => {
      observer.disconnect();
      media?.removeEventListener?.("change", update);
    };
  }, []);
  return day;
}
function Main() {
  const status = useStatus();
  const t = words();
  const day = useDay();
  const root = (0, import_react32.useRef)(null);
  (0, import_react32.useEffect)(() => {
    const el = root.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const fit = () => {
      const narrow = el.clientWidth < NARROW;
      const right = store.get().right;
      if (narrow === right.overlay) return;
      store.set({ right: narrow ? { ...right, overlay: true, open: false } : { ...right, overlay: false } });
    };
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    fit();
    return () => observer.disconnect();
  }, []);
  const { view, group, groupSheet } = useStore(store);
  usePoll(async () => {
    if (status?.connected) {
      await loadLocal();
      void present();
    }
  }, 1e4, [Boolean(status?.connected)]);
  const middle = view === "machine" ? MachineView : group ? GroupChat : Chat;
  return (0, import_react32.createElement)(
    "div",
    { className: `ad-root${day ? " day" : ""}`, ref: root },
    (0, import_react32.createElement)("div", { className: "ad-sky", "aria-hidden": true }),
    !status ? (0, import_react32.createElement)("div", { className: "ad-note" }, t.connecting) : status.connected ? [
      (0, import_react32.createElement)(middle, { key: "middle" }),
      (0, import_react32.createElement)(Right, { key: "right" }),
      (0, import_react32.createElement)(Sheet, { key: "sheet" }),
      groupSheet && (0, import_react32.createElement)(GroupSheet, { key: `group-${groupSheet.id || "new"}` })
    ] : (0, import_react32.createElement)(ConnectForm, { defaultWorkspace: status.defaultWorkspace })
  );
}
function Side({ onBack }) {
  const day = useDay();
  const inset = shellTopInset();
  return (0, import_react32.createElement)("div", { className: `ad-root ad-side${day ? " day" : ""}`, style: inset ? { "--ad-top-inset": `${inset}px` } : void 0 }, (0, import_react32.createElement)(Left, { onBack }));
}
var Nav = () => (0, import_react32.createElement)(
  "svg",
  { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, "aria-hidden": true },
  (0, import_react32.createElement)("path", { d: "M3 11 12 3l9 8M6 10v11h12V10M10 21v-7h4v7" })
);
function apply(ctx) {
  const t = words();
  ctx.effect(() => {
    const style = document.createElement("style");
    style.textContent = STYLES;
    document.head.append(style);
    return () => style.remove();
  });
  ctx.slots.inject("main", () => ctx.slots.register({ name: "main", key: PANEL }, Main));
  ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({ name: "sidebar.panellist", id: PANEL, order: 5, label: () => t.title }, Nav));
  const back = () => ctx.layout.selectPanel(null);
  ctx.effect(() => {
    const tick = () => {
      const shown = Boolean(document.querySelector(".ad-main"));
      if (shown === store.get().shown) return;
      store.set({ shown, rail: shown });
    };
    const timer = setInterval(tick, 600);
    tick();
    return () => clearInterval(timer);
  });
  let release = null;
  const sync = () => {
    const on = Boolean(store.get().status?.connected) && store.get().rail && store.get().shown;
    if (on && !release) release = ctx.slots.inject("sidebar", () => ctx.slots.register({ name: "sidebar", priority: SHADOW_PRIORITY }, () => (0, import_react32.createElement)(Side, { onBack: back })));
    if (!on && release) {
      release();
      release = null;
    }
  };
  ctx.effect(() => {
    const off = store.subscribe(sync);
    sync();
    return () => {
      off();
      release?.();
      release = null;
    };
  });
  ctx.effect(() => {
    void call("status").then((s) => {
      store.set({ status: s });
      if (s.connected) ctx.layout.selectPanel(PANEL);
    }).catch(() => {
    });
  });
}
return Object.defineProperty({ ...module.exports }, Symbol.toStringTag, { value: 'Module' })
  },
})
