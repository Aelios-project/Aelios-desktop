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
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);
var import_react15 = require("react");

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
var import_react6 = require("react");

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

// client/icons.mjs
var import_react = require("react");
var PATHS = {
  send: "M12 19V5M5.5 11.5 12 5l6.5 6.5",
  back: "M15 18l-6-6 6-6",
  close: "M6 6l12 12M18 6 6 18",
  stop: "M7 7h10v10H7z",
  open: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  panel: "M4 5h16v14H4zM15 5v14",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  plus: "M12 5v14M5 12h14",
  wrench: "M14.5 6a4 4 0 1 0 3.8 6.2L21 15l-1.8 1.8-2.8-2.7A4 4 0 0 0 14.5 6z"
};
var Icon = ({ name }) => (0, import_react.createElement)(
  "svg",
  { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true },
  (0, import_react.createElement)("path", { d: PATHS[name] })
);

// client/face.mjs
var import_react2 = require("react");

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
  return (0, import_react2.createElement)("span", { className: `ad-avatar${className}`, "aria-hidden": true }, src ? (0, import_react2.createElement)("img", { src, alt: "" }) : name.slice(0, 1));
}

// client/message.mjs
var import_react4 = require("react");

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
  return { label: bits.join(" · "), live: Boolean(line.pending), items };
}

// client/md.mjs
var import_react3 = require("react");

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
  const ref = (0, import_react3.useRef)(null);
  (0, import_react3.useEffect)(() => {
    if (ref.current) renderMarkdown(ref.current, text || "");
  }, [text]);
  return (0, import_react3.createElement)("div", { className: "ad-md", ref });
}

// client/strings.mjs
var WORDS = {
  en: {
    title: "Resident",
    connect: "Connect",
    address: "Resident address",
    key: "Web key",
    folder: "Folder for the helper",
    helper: "Helper",
    access: "Permission",
    fullOk: "I understand full permission lets the helper change anything on this machine",
    connecting: "Connecting…",
    residents: "Residents",
    send: "Send",
    write: "Write to the resident",
    start: "Start runner",
    disconnect: "Disconnect",
    empty: "Nothing yet. Say hello.",
    sending: "Sending…",
    panels: { threads: "Threads", waiting: "Waiting", me: "Me", board: "Board", tools: "Tools" },
    soon: "Left open for the next slice",
    openNow: "At work",
    backToDsh: "Back to DSH",
    showRail: "Residents",
    usage: "Usage",
    attach: "Send pictures",
    remove: "Remove",
    model: "Model",
    persona: "Persona",
    savePersona: "Save the persona",
    personaSaved: "Saved.",
    runnerTitle: "Runner",
    pair: "Pair it again",
    whyRunner: "The runner is the helper on this machine. Without a pairing the resident cannot hand it work; the chat itself keeps working.",
    tooBig: "That picture could not be read",
    upTo: "Four pictures at a time",
    ran: "done",
    recent: "Recent",
    nothingWaiting: "Nothing is waiting for you.",
    collapse: "Collapse the side panel",
    expand: "Open the side panel",
    back: "Back",
    open: "Open thread",
    markRead: "Mark read",
    stop: "Stop it",
    sayTo: "Talk to it directly, not through the resident",
    sendTo: "Send to it",
    noThreads: "No threads yet. Ask the resident to look something up and the work will show here.",
    done: "Finished",
    threadsOff: "Background help is off.",
    expired: "expired",
    mine: "You said",
    given: "The resident said",
    result: "Handed back",
    thread: "Thread",
    files: "Files",
    task: { sent: "Sent out", working: "Working", done: "Done", failed: "Failed", needs_you: "Needs you", quiet: "No reply", stopped: "Stopped", chosen: "Chosen", settled: "Dealt with" },
    kind: { ask: "Waiting for you", note: "Progress", done: "Done", stuck: "Stuck" },
    runs: { local: "Runs at the resident", linux: "Runs on GitHub Actions", machine: "Runs on a machine", retired: "Old route, retired" },
    tasksN: "tasks",
    runner: { unpaired: "runner not paired", stopped: "runner stopped", starting: "runner starting", running: "runner running", crashed: "runner stopped with an error", locked: "runner already running elsewhere", revoked: "pairing was revoked" }
  },
  zh: {
    title: "住户",
    connect: "连接",
    address: "住户地址",
    key: "网页钥匙",
    folder: "帮手工作的文件夹",
    helper: "帮手",
    access: "权限",
    fullOk: "我知道完整权限会让帮手改动这台机器上的任何东西",
    connecting: "正在连接…",
    residents: "住户",
    send: "发送",
    write: "对住户说点什么",
    start: "启动 runner",
    disconnect: "断开",
    empty: "还没有消息，先打个招呼吧。",
    sending: "正在发送…",
    panels: { threads: "线程", waiting: "等你", me: "我", board: "看板", tools: "小工具" },
    soon: "先留个位置",
    openNow: "在做",
    backToDsh: "回到 DSH",
    showRail: "住户",
    usage: "用量",
    attach: "发图",
    remove: "拿掉",
    model: "模型",
    persona: "人设",
    savePersona: "保存人设",
    personaSaved: "存好了。",
    runnerTitle: "本机帮手",
    pair: "重新配对",
    whyRunner: "本机帮手是这台机器上的执行端。没配对，住户就没法把活交给它；聊天本身不受影响。",
    tooBig: "这张图读不了",
    upTo: "一次最多四张",
    ran: "完成",
    recent: "最近",
    nothingWaiting: "没有在等你的事。",
    collapse: "收起右栏",
    expand: "打开右栏",
    back: "返回",
    open: "打开线程",
    markRead: "已读",
    stop: "叫它停下",
    sayTo: "直接跟它说，不经过住户",
    sendTo: "发给它",
    noThreads: "还没有线程。在聊天里让它去查点什么、写点什么，它交出去的活会出现在这里。",
    done: "做完的",
    threadsOff: "后台帮忙关着。",
    expired: "过期了",
    mine: "你说的",
    given: "住户交代的",
    result: "交回来的",
    thread: "线程",
    files: "它做的文件",
    task: { sent: "派出去了", working: "在干活", done: "做完了", failed: "没做成", needs_you: "等你拍板", quiet: "没回音", stopped: "已停下", chosen: "拍板了", settled: "处理过了" },
    kind: { ask: "等你", note: "进展", done: "做完了", stuck: "卡住了" },
    runs: { local: "在住户这里干", linux: "在 GitHub Actions 上干", machine: "在机器上干", retired: "旧线路，已停用" },
    tasksN: "单",
    runner: { unpaired: "runner 未配对", stopped: "runner 已停止", starting: "runner 正在启动", running: "runner 运行中", crashed: "runner 出错停止", locked: "runner 已在别处运行", revoked: "配对已被撤销" }
  }
};
var words = () => typeof navigator !== "undefined" && /^zh/i.test(navigator.language) ? WORDS.zh : WORDS.en;

// client/message.mjs
var SPARK = "M12 3.5l2 5.5 5.5 2-5.5 2-2 5.5-2-5.5-5.5-2 5.5-2z";
var clock = (at) => at ? new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
function Busy({ busy }) {
  const t = words();
  const [open, setOpen] = (0, import_react4.useState)(false);
  const [seen, setSeen] = (0, import_react4.useState)({});
  return (0, import_react4.createElement)(
    "div",
    { className: `ad-busy${open ? " open" : ""}` },
    (0, import_react4.createElement)(
      "button",
      { type: "button", className: busy.live ? "live" : "", "aria-expanded": open, onClick: () => setOpen((v) => !v) },
      (0, import_react4.createElement)("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinejoin: "round", "aria-hidden": true }, (0, import_react4.createElement)("path", { d: SPARK })),
      (0, import_react4.createElement)("span", null, busy.label),
      (0, import_react4.createElement)("svg", { className: "chev", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true }, (0, import_react4.createElement)("path", { d: "M9 6l6 6-6 6" }))
    ),
    open && (0, import_react4.createElement)("div", { className: "ad-busy-list" }, busy.items.map((item) => (0, import_react4.createElement)(
      "div",
      { key: item.key, className: "ad-busy-item" },
      (0, import_react4.createElement)(
        "button",
        { type: "button", "aria-expanded": Boolean(seen[item.key]), onClick: () => setSeen((v) => ({ ...v, [item.key]: !v[item.key] })) },
        (0, import_react4.createElement)("span", { className: "what" }, item.what),
        (0, import_react4.createElement)("span", { className: "detail" }, item.detail),
        (0, import_react4.createElement)("span", { className: "state" }, item.state || t.ran)
      ),
      seen[item.key] && (0, import_react4.createElement)("div", null, item.body.map((part, i) => (0, import_react4.createElement)(
        "div",
        { key: i },
        part.label && (0, import_react4.createElement)("div", { className: "label" }, part.label),
        (0, import_react4.createElement)("pre", null, part.text)
      )))
    )))
  );
}
function Pictures({ lineId, count, resident }) {
  const [urls, setUrls] = (0, import_react4.useState)([]);
  (0, import_react4.useEffect)(() => {
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
  return (0, import_react4.createElement)(
    "div",
    { className: `ad-pics${urls.length === 1 ? " one" : ""}` },
    urls.map((url) => (0, import_react4.createElement)("button", { key: url, type: "button", onClick: () => window.open(url, "_blank", "noopener"), "aria-label": "Open the picture" }, (0, import_react4.createElement)("img", { src: url, alt: "" })))
  );
}
function Files({ files, resident }) {
  const [busy, setBusy] = (0, import_react4.useState)("");
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
  return (0, import_react4.createElement)("div", { className: "ad-files" }, files.map((file) => (0, import_react4.createElement)(
    "button",
    { key: file.key, type: "button", className: "ad-file", title: file.name, disabled: Boolean(busy), onClick: () => save(file) },
    (0, import_react4.createElement)(Icon, { name: "open" }),
    (0, import_react4.createElement)("span", { className: "n" }, file.name || "file"),
    file.size ? (0, import_react4.createElement)("span", { className: "s" }, `${Math.max(1, Math.round(file.size / 1024))} KB`) : null
  )));
}
function Message({ line, resident }) {
  const busy = busyOf(line);
  const me = line.role === "user";
  const bubbles = me ? String(line.text || "").trim() ? [line.text] : [] : bubbleTexts(line.text);
  return (0, import_react4.createElement)(
    "div",
    { className: `ad-row ${me ? "me" : "ai"}` },
    busy && (0, import_react4.createElement)(Busy, { busy }),
    line.quote && (0, import_react4.createElement)("span", { className: "ad-quote" }, line.quote.text),
    (line.pictures ?? 0) > 0 && (0, import_react4.createElement)(Pictures, { lineId: line.id, count: line.pictures, resident }),
    bubbles.map((text, i) => (0, import_react4.createElement)(
      "div",
      { key: i, className: `ad-bubble${i === 0 ? " first" : ""}` },
      me ? text : (0, import_react4.createElement)(Md, { text }),
      i === bubbles.length - 1 && (0, import_react4.createElement)("span", { className: "ad-meta" }, clock(line.at))
    )),
    (line.files ?? []).length > 0 && (0, import_react4.createElement)(Files, { files: line.files, resident })
  );
}

// client/store.mjs
var import_react5 = require("react");
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
var useStore = (store2) => (0, import_react5.useSyncExternalStore)(store2.subscribe, store2.get);
var store = createStore({
  status: null,
  residents: [],
  threads: [],
  error: "",
  usage: {},
  rail: true,
  // ours covers DSH's whole left column; false hands it back to DSH
  shown: false,
  // whether our own panel is the one DSH is drawing
  waiting: { items: [], open: 0 },
  right: { open: true, panel: "waiting", overlay: false },
  focus: ""
  // the thread the right panel should open
});

// client/chat.mjs
var POLL_MS = 5e3;
function Chat() {
  const t = words();
  const { status, residents, right } = useStore(store);
  const resident = status?.resident || "default";
  const name = residents.find((r) => r.id === resident)?.name || t.title;
  const [lines, setLines] = (0, import_react6.useState)([]);
  const [text, setText] = (0, import_react6.useState)("");
  const [pics, setPics] = (0, import_react6.useState)([]);
  const picker = (0, import_react6.useRef)(null);
  const [busy, setBusy] = (0, import_react6.useState)(false);
  const [error, setError] = (0, import_react6.useState)("");
  const end = (0, import_react6.useRef)(null);
  const reader = (0, import_react6.useRef)(null);
  const refresh = async () => {
    try {
      const next = await reader.current();
      if (next) setLines(next);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  };
  (0, import_react6.useEffect)(() => {
    reader.current = createMessages((path) => web(path, { resident }));
    setLines([]);
    void refresh();
    const timer = setInterval(() => {
      if (!document.hidden) void refresh();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [resident]);
  (0, import_react6.useEffect)(() => {
    end.current?.scrollIntoView?.({ block: "end" });
  }, [lines.length]);
  async function send() {
    const body = text.trim();
    if (!body && !pics.length || busy) return;
    setBusy(true);
    try {
      const payload = { text: body };
      if (pics.length) payload.pictures = pics.map((pic) => ({ data: pic.data }));
      const said = await web("/web/say", { method: "POST", body: payload, resident });
      if (said?.error) throw new Error(said.error);
      setText("");
      setPics([]);
      reader.current = createMessages((path) => web(path, { resident }));
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function attach(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    const room = roomFor(pics.length, files.length, MAX_PICTURES);
    if (files.length > room) setError(t.upTo);
    const read = [];
    for (const file of files.slice(0, room)) {
      try {
        read.push(await readPicture(file));
      } catch {
        setError(t.tooBig);
      }
    }
    if (read.length) setPics((was) => [...was, ...read].slice(0, MAX_PICTURES));
  }
  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent?.isComposing) {
      e.preventDefault();
      void send();
    }
  };
  const runner = status?.runner;
  const state = runner && (t.runner[runner.state] || runner.state) + (runner.error ? ` · ${runner.error}` : "");
  const down = runner && ["stopped", "crashed", "revoked"].includes(runner.state);
  return (0, import_react6.createElement)(
    "section",
    { className: "ad-main" },
    (0, import_react6.createElement)(
      "div",
      { className: "ad-top" },
      (0, import_react6.createElement)(
        "div",
        { className: "ad-ident" },
        (0, import_react6.createElement)(Face, { resident: residents.find((r) => r.id === resident) || { id: resident, name }, base: status?.url }),
        (0, import_react6.createElement)("div", { className: "ad-who" }, (0, import_react6.createElement)("span", { className: "ad-name" }, name), state && (0, import_react6.createElement)("span", { className: "ad-status" }, state))
      ),
      (0, import_react6.createElement)(
        "div",
        { className: "ad-act" },
        down && (0, import_react6.createElement)("button", { type: "button", className: "ad-btn quiet small", onClick: async () => store.set({ status: await call("start") }) }, t.start),
        !right.open && (0, import_react6.createElement)("button", { type: "button", className: "ad-icon-btn", title: t.expand, "aria-label": t.expand, onClick: () => store.set({ right: { ...right, open: true } }) }, (0, import_react6.createElement)(Icon, { name: "panel" }))
      )
    ),
    (0, import_react6.createElement)(
      "div",
      { className: "ad-stream", "aria-live": "polite" },
      lines.length === 0 && (0, import_react6.createElement)("div", { className: "ad-note" }, t.empty),
      lines.map((line, i) => (0, import_react6.createElement)(Message, { key: line.id ?? i, line, resident })),
      (0, import_react6.createElement)("div", { ref: end, className: "grow" })
    ),
    error && (0, import_react6.createElement)("div", { className: "ad-error", role: "alert", style: { padding: "0 16px" } }, error),
    (0, import_react6.createElement)(
      "div",
      { className: "ad-compose" },
      pics.length > 0 && (0, import_react6.createElement)("div", { className: "ad-thumbs" }, pics.map((pic, i) => (0, import_react6.createElement)(
        "div",
        { key: i },
        (0, import_react6.createElement)("img", { src: pic.url, alt: "" }),
        (0, import_react6.createElement)("button", { type: "button", className: "ad-x", "aria-label": t.remove, title: t.remove, onClick: () => setPics((was) => was.filter((_, at) => at !== i)) }, (0, import_react6.createElement)(Icon, { name: "close" }))
      ))),
      (0, import_react6.createElement)(
        "div",
        { className: "ad-bar" },
        (0, import_react6.createElement)("input", { ref: picker, type: "file", accept: "image/*", multiple: true, hidden: true, onChange: attach }),
        (0, import_react6.createElement)("button", { className: "ad-round quiet", type: "button", title: t.attach, "aria-label": t.attach, onClick: () => picker.current?.click() }, (0, import_react6.createElement)(Icon, { name: "plus" })),
        (0, import_react6.createElement)(
          "div",
          { className: "ad-field" },
          (0, import_react6.createElement)("textarea", { rows: 1, value: text, placeholder: t.write, "aria-label": t.write, onChange: (e) => setText(e.target.value), onKeyDown: onKey })
        ),
        (0, import_react6.createElement)("button", { className: "ad-round", type: "button", disabled: busy || !text.trim() && !pics.length, onClick: send, "aria-label": t.send, title: t.send }, (0, import_react6.createElement)(Icon, { name: "send" }))
      )
    )
  );
}

// client/connect-form.mjs
var import_react7 = require("react");
function ConnectForm({ defaultWorkspace = "" }) {
  const t = words();
  const [form, setForm] = (0, import_react7.useState)({ url: "", key: "", workspace: "", helper: "dsh", access: "edit", confirmFull: false });
  const [busy, setBusy] = (0, import_react7.useState)(false);
  const [error, setError] = (0, import_react7.useState)("");
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
  const field = (name, label, props = {}) => (0, import_react7.createElement)("label", null, label, (0, import_react7.createElement)("input", { value: form[name], onChange: set(name), disabled: busy, ...props }));
  return (0, import_react7.createElement)(
    "form",
    { className: "ad-form", onSubmit: submit },
    field("url", t.address, { type: "url", required: true, placeholder: "https://", autoComplete: "off" }),
    field("key", t.key, { type: "password", required: true, autoComplete: "off" }),
    field("workspace", t.folder, { placeholder: defaultWorkspace }),
    (0, import_react7.createElement)("label", null, t.helper, (0, import_react7.createElement)("select", { value: form.helper, onChange: set("helper"), disabled: busy }, (0, import_react7.createElement)("option", { value: "dsh" }, "DSH"), (0, import_react7.createElement)("option", { value: "kiro" }, "Kiro"))),
    (0, import_react7.createElement)("label", null, t.access, (0, import_react7.createElement)("select", { value: form.access, onChange: set("access"), disabled: busy }, ["read", "edit", "full"].map((v) => (0, import_react7.createElement)("option", { key: v, value: v }, v)))),
    form.access === "full" && (0, import_react7.createElement)("label", null, (0, import_react7.createElement)("span", null, (0, import_react7.createElement)("input", { type: "checkbox", checked: form.confirmFull, onChange: set("confirmFull") }), " ", t.fullOk)),
    error && (0, import_react7.createElement)("div", { className: "ad-error", role: "alert" }, error),
    (0, import_react7.createElement)("button", { className: "ad-btn", type: "submit", disabled: busy }, busy ? t.connecting : t.connect)
  );
}

// client/left.mjs
var import_react8 = require("react");

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
function tokensText(t) {
  if (!t) return "";
  return `in ${compact(t.input + t.cacheRead + t.cacheWrite)} · out ${compact(t.output)}`;
}
function costText(t) {
  if (!t) return "…";
  if (t.calls && t.unpriced === t.calls) return "unpriced";
  return money(t.cost);
}
var SPANS = [
  { key: "today", label: "Today" },
  { key: "week", label: "7 days" },
  { key: "month", label: "30 days" }
];
function usageRows(totals = {}) {
  return SPANS.map(({ key, label }) => {
    const t = totals?.[key];
    if (!t) return null;
    return { key, label, cost: costText(t), calls: `${t.calls} ${t.calls === 1 ? "call" : "calls"}`, tokens: tokensText(t), hit: hitText(t) };
  }).filter(Boolean);
}

// client/left.mjs
var POLL_MS2 = 3e4;
function Left({ onBack }) {
  const t = words();
  const { status, residents, usage } = useStore(store);
  (0, import_react8.useEffect)(() => {
    const load = async () => {
      try {
        store.set({ residents: (await web("/web/residents", { resident: "default" }))?.residents || [] });
      } catch {
      }
    };
    void load();
    const timer = setInterval(() => {
      if (!document.hidden) void load();
    }, POLL_MS2);
    return () => clearInterval(timer);
  }, []);
  (0, import_react8.useEffect)(() => {
    const load = async () => {
      try {
        store.set({ usage: (await web("/web/usage", { resident: status?.resident || "default" }))?.totals || {} });
      } catch {
      }
    };
    void load();
    const timer = setInterval(() => {
      if (!document.hidden) void load();
    }, POLL_MS2);
    return () => clearInterval(timer);
  }, [status?.resident]);
  const pick = async (id) => store.set({ status: await call("select", { resident: id }) });
  const list = residents.length ? residents : [{ id: "default", name: t.title }];
  const current = list.find((r) => r.id === (status?.resident || "default")) || list[0];
  const others = list.filter((r) => r.id !== current.id);
  const rows = usageRows(usage);
  return (0, import_react8.createElement)(
    "nav",
    { className: "ad-rail", "aria-label": t.residents },
    (0, import_react8.createElement)(
      "div",
      { className: "ad-rail-head" },
      (0, import_react8.createElement)("span", { className: "ad-rail-brand" }, (0, import_react8.createElement)("span", { className: "ad-rail-mark", "aria-hidden": true }, "✦"), t.residents)
    ),
    (0, import_react8.createElement)(
      "button",
      { type: "button", className: "ad-current on", title: current.name, onClick: () => pick(current.id) },
      (0, import_react8.createElement)(Face, { resident: current, base: status?.url }),
      (0, import_react8.createElement)("span", { className: "ad-name" }, current.name || current.id),
      (0, import_react8.createElement)("span", { className: "ad-tag" }, status?.runner?.state ? t.runner[status.runner.state] || status.runner.state : t.title)
    ),
    others.map((r) => (0, import_react8.createElement)(
      "button",
      { key: r.id, type: "button", className: "ad-rail-item", title: r.name, onClick: () => pick(r.id) },
      (0, import_react8.createElement)(Face, { resident: r, base: status?.url }),
      (0, import_react8.createElement)("span", { className: "ad-txt" }, (0, import_react8.createElement)("span", { className: "ad-label" }, r.name || r.id))
    )),
    rows.length > 0 && (0, import_react8.createElement)(
      "div",
      { className: "ad-usage" },
      (0, import_react8.createElement)("p", { className: "ad-group-title" }, t.usage),
      rows.map((row) => (0, import_react8.createElement)(
        "div",
        { key: row.key, className: "ad-urow" },
        (0, import_react8.createElement)("span", { className: "l" }, row.label),
        (0, import_react8.createElement)("span", { className: "c" }, row.cost),
        (0, import_react8.createElement)("span", { className: "d" }, row.calls, (0, import_react8.createElement)("span", { className: "hit" }, ` · ${row.hit}`)),
        (0, import_react8.createElement)("span", { className: "t" }, row.tokens)
      ))
    ),
    (0, import_react8.createElement)(
      "div",
      { className: "ad-rail-foot" },
      (0, import_react8.createElement)("button", { type: "button", className: "ad-btn quiet small", title: t.backToDsh, onClick: onBack }, t.backToDsh),
      (0, import_react8.createElement)("button", { type: "button", className: "ad-icon-btn sm", title: t.disconnect, "aria-label": t.disconnect, onClick: async () => store.set({ status: await call("disconnect") }) }, (0, import_react8.createElement)(Icon, { name: "back" }))
    )
  );
}

// client/right.mjs
var import_react14 = require("react");

// client/panels.mjs
var import_react13 = require("react");

// client/panel-ids.mjs
var PANEL_IDS = ["waiting", "threads", "me", "board", "tools"];

// client/panel-me.mjs
var import_react9 = require("react");
var POLL_MS3 = 15e3;
function MePanel() {
  const t = words();
  const { status, residents } = useStore(store);
  const resident = status?.resident || "default";
  const me = residents.find((r) => r.id === resident) || { id: resident, name: t.title };
  const runner = status?.runner || { state: "unpaired", error: "" };
  const [model, setModel] = (0, import_react9.useState)(null);
  const [persona, setPersona] = (0, import_react9.useState)("");
  const [draft, setDraft] = (0, import_react9.useState)("");
  const [busy, setBusy] = (0, import_react9.useState)("");
  const [note, setNote] = (0, import_react9.useState)("");
  const [error, setError] = (0, import_react9.useState)("");
  (0, import_react9.useEffect)(() => {
    const load = async () => {
      try {
        const [m, p] = await Promise.all([web("/web/model", { resident }), web("/web/persona", { resident })]);
        setModel(m);
        setPersona(p?.text || "");
        setDraft((was) => was || p?.text || "");
      } catch (e) {
        setError(e.message);
      }
    };
    void load();
    const timer = setInterval(() => {
      if (!document.hidden) void load();
    }, POLL_MS3);
    return () => clearInterval(timer);
  }, [resident]);
  const act = (key, job) => async () => {
    if (busy) return;
    setBusy(key);
    setError("");
    setNote("");
    try {
      await job();
      setNote(t.personaSaved);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  };
  const savePersona = act("persona", async () => {
    const saved = await web("/web/persona", { method: "POST", body: { text: draft }, resident });
    setPersona(saved?.text ?? draft);
  });
  const pair = act("pair", async () => store.set({ status: await call("repair") }));
  const start = act("start", async () => store.set({ status: await call("start") }));
  const off = act("off", async () => store.set({ status: await call("disconnect") }));
  return (0, import_react9.createElement)(
    "div",
    { className: "ad-panel" },
    (0, import_react9.createElement)(
      "div",
      { className: "ad-me-head" },
      (0, import_react9.createElement)(Face, { resident: me, base: status?.url }),
      (0, import_react9.createElement)("div", null, (0, import_react9.createElement)("b", null, me.name || me.id), (0, import_react9.createElement)("span", { className: "ad-sub" }, me.id))
    ),
    (0, import_react9.createElement)("p", { className: "ad-me-line" }, (0, import_react9.createElement)("span", null, t.model), (0, import_react9.createElement)("code", null, model?.model || model?.fallback || "—")),
    (0, import_react9.createElement)(
      "div",
      { className: "ad-me-block" },
      (0, import_react9.createElement)("label", { className: "ad-me-label", htmlFor: "ad-persona" }, t.persona),
      (0, import_react9.createElement)("textarea", { id: "ad-persona", className: "ad-me-text", rows: 6, value: draft, placeholder: persona || "…", onChange: (e) => setDraft(e.target.value) }),
      (0, import_react9.createElement)(
        "div",
        { className: "ad-links" },
        (0, import_react9.createElement)("button", { type: "button", className: "ad-btn small", disabled: Boolean(busy) || draft === persona, onClick: savePersona }, t.savePersona)
      )
    ),
    (0, import_react9.createElement)(
      "div",
      { className: "ad-me-block" },
      (0, import_react9.createElement)("p", { className: "ad-me-label" }, t.runnerTitle),
      (0, import_react9.createElement)("p", { className: `ad-me-state s-${runner.state}` }, t.runner[runner.state] || runner.state, runner.error ? ` · ${runner.error}` : ""),
      (0, import_react9.createElement)("p", { className: "ad-hint" }, t.whyRunner),
      (0, import_react9.createElement)(
        "div",
        { className: "ad-links" },
        (0, import_react9.createElement)("button", { type: "button", className: "ad-btn quiet small", disabled: Boolean(busy), onClick: pair }, t.pair),
        runner.state !== "running" && (0, import_react9.createElement)("button", { type: "button", className: "ad-btn quiet small", disabled: Boolean(busy), onClick: start }, t.start),
        (0, import_react9.createElement)("button", { type: "button", className: "ad-btn quiet small", disabled: Boolean(busy), onClick: off }, t.disconnect)
      )
    ),
    note && (0, import_react9.createElement)("p", { className: "ad-hint" }, note),
    error && (0, import_react9.createElement)("div", { className: "ad-error", role: "alert" }, error)
  );
}

// client/panel-waiting.mjs
var import_react10 = require("react");

// client/threads-api.mjs
function stateOf(task) {
  if (!task) return "";
  if (task.status !== "needs_you" || task.waiting !== false) return task.status;
  return task.chosen ? "chosen" : "settled";
}
var pillOf = (state) => ({ working: "warn", sent: "warn", needs_you: "hot", done: "ok", failed: "bad", quiet: "bad", chosen: "ok" })[state] || "";
var isWorking = (thread) => thread?.status === "sent" || thread?.status === "working";
function splitThreads(list = []) {
  const open = (t) => isWorking(t) || t.waiting;
  return { open: list.filter(open), done: list.filter((t) => !open(t)) };
}
var post = (path, resident, body, request) => web(path, { method: "POST", body, resident }, request);
var loadThreads = (resident, request) => web("/web/threads", { resident }, request);
var loadThread = (resident, id, request) => web(`/web/thread?id=${encodeURIComponent(id)}`, { resident }, request);
var sayToThread = (resident, id, text, request) => post("/web/thread/say", resident, { id, text }, request);
var stopThread = (resident, id, request) => post("/web/thread/stop", resident, { id }, request);
var loadWaiting = (resident, request) => web("/web/waiting", { resident }, request);
var markSeen = (resident, item, request) => post("/web/waiting/seen", resident, item ? { id: item.id } : { all: true }, request);
var choose = (resident, task, text, request) => post("/web/task/choose", resident, { id: task, text }, request);
var when = (at) => at ? new Date(at).toLocaleString([], { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
var safeLink = (url) => /^https?:\/\/[^\s<>"'`]+$/i.test(url || "");

// client/panel-waiting.mjs
function WaitingPanel() {
  const t = words();
  const { status, waiting, right } = useStore(store);
  const resident = status?.resident || "default";
  const [busy, setBusy] = (0, import_react10.useState)("");
  const [error, setError] = (0, import_react10.useState)("");
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
  const answer = (item, option) => run(item.task, async () => {
    await choose(resident, item.task, option);
    store.set({ waiting: await loadWaiting(resident) });
  });
  const read = (item) => run(item.id, async () => store.set({ waiting: await markSeen(resident, item) }));
  const open = (item) => async () => {
    if (item.kind !== "ask") await read(item)();
    store.set({ focus: item.thread, right: { ...right, panel: "threads" } });
  };
  return (0, import_react10.createElement)(
    "div",
    { className: "ad-panel" },
    error && (0, import_react10.createElement)("div", { className: "ad-error", role: "alert" }, error),
    waiting.items.length === 0 && (0, import_react10.createElement)("div", { className: "ad-note" }, t.nothingWaiting),
    waiting.items.map((item) => (0, import_react10.createElement)(
      "div",
      { key: item.id, className: `ad-trow${item.kind === "ask" && !item.expired ? " ask" : ""}${item.expired ? " dim" : ""}` },
      (0, import_react10.createElement)(
        "span",
        { className: "top-line" },
        (0, import_react10.createElement)("span", { className: "t" }, item.title),
        (0, import_react10.createElement)("span", { className: `ad-pill ${item.kind === "ask" && !item.expired ? "hot" : item.kind === "stuck" ? "bad" : item.kind === "done" ? "ok" : ""}` }, t.kind[item.kind] + (item.expired ? ` · ${t.expired}` : ""))
      ),
      (0, import_react10.createElement)("span", { className: "sub" }, (0, import_react10.createElement)("span", null, item.line), (0, import_react10.createElement)("span", null, when(item.at))),
      (0, import_react10.createElement)(
        "span",
        { className: "ad-links" },
        (item.options || []).map((option, i) => (0, import_react10.createElement)("button", { key: option, type: "button", className: `ad-btn small${i ? " quiet" : ""}`, disabled: Boolean(busy), onClick: answer(item, option) }, option)),
        (0, import_react10.createElement)("button", { type: "button", className: "ad-icon-btn sm", title: t.open, "aria-label": t.open, onClick: open(item) }, (0, import_react10.createElement)(Icon, { name: "open" })),
        item.kind !== "ask" && (0, import_react10.createElement)("button", { type: "button", className: "ad-icon-btn sm", title: t.markRead, "aria-label": t.markRead, onClick: read(item) }, (0, import_react10.createElement)(Icon, { name: "close" }))
      )
    ))
  );
}

// client/panel-threads.mjs
var import_react12 = require("react");

// client/thread-view.mjs
var import_react11 = require("react");
var POLL_MS4 = 5e3;
function Line({ line, thread, t, onChoose, busy }) {
  const task = line.role === "result" ? (thread.tasks || []).find((x) => x.id === line.task && x.waiting) : null;
  const shown = (thread.tasks || []).find((x) => x.id === line.task);
  const state = shown && shown.status === line.status ? stateOf(shown) : line.status;
  const who = line.role === "user" ? line.direct ? t.mine : t.given : line.role === "result" ? t.result : t.thread;
  const links = (line.links || []).filter(safeLink);
  return (0, import_react11.createElement)(
    "div",
    { className: `ad-tline r-${line.role}` },
    (0, import_react11.createElement)("div", { className: "who-l" }, (0, import_react11.createElement)("span", null, who), line.role === "result" && (0, import_react11.createElement)("span", { className: `ad-pill ${pillOf(state)}` }, t.task[state] || state)),
    (line.steps || []).map((step, i) => (0, import_react11.createElement)("div", { key: i, className: "step-l" }, step)),
    line.text && (line.direct ? (0, import_react11.createElement)("div", { className: "text" }, line.text) : (0, import_react11.createElement)("div", { className: "text" }, (0, import_react11.createElement)(Md, { text: line.text }))),
    (line.files?.length > 0 || links.length > 0 || task) && (0, import_react11.createElement)(
      "div",
      { className: "ad-links" },
      (line.files || []).map((f) => (0, import_react11.createElement)("span", { key: f.path, className: "ad-pill", title: f.path }, f.path.split("/").pop())),
      links.map((l) => (0, import_react11.createElement)("a", { key: l, className: "ad-btn quiet small", href: l, target: "_blank", rel: "noopener noreferrer" }, new URL(l).host)),
      task && (task.choices || []).map((c, i) => (0, import_react11.createElement)("button", { key: c, type: "button", className: `ad-btn small${i ? " quiet" : ""}`, disabled: busy, onClick: () => onChoose(task, c) }, c))
    )
  );
}
function ThreadView({ resident, id, onBack }) {
  const t = words();
  const [thread, setThread] = (0, import_react11.useState)(null);
  const [draft, setDraft] = (0, import_react11.useState)("");
  const [busy, setBusy] = (0, import_react11.useState)(false);
  const [error, setError] = (0, import_react11.useState)("");
  const reload = async () => {
    try {
      setThread(await loadThread(resident, id));
      setError("");
    } catch (e) {
      setError(e.message);
    }
  };
  (0, import_react11.useEffect)(() => {
    setThread(null);
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
    await choose(resident, task.id, text);
    store.set({ waiting: await loadWaiting(resident) });
    await reload();
  });
  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent?.isComposing) {
      e.preventDefault();
      void say();
    }
  };
  return (0, import_react11.createElement)(
    "div",
    { className: "ad-panel" },
    (0, import_react11.createElement)(
      "div",
      { className: "ad-links" },
      (0, import_react11.createElement)("button", { type: "button", className: "ad-icon-btn sm", title: t.back, "aria-label": t.back, onClick: onBack }, (0, import_react11.createElement)(Icon, { name: "back" })),
      (0, import_react11.createElement)("strong", { style: { flex: 1, minWidth: 0, overflowWrap: "anywhere" } }, thread?.title || t.thread),
      thread && thread.runs === "machine" && thread.status === "working" && (0, import_react11.createElement)("button", { type: "button", className: "ad-icon-btn sm", title: t.stop, "aria-label": t.stop, disabled: busy, onClick: () => act(() => stopThread(resident, id)) }, (0, import_react11.createElement)(Icon, { name: "stop" }))
    ),
    thread && (0, import_react11.createElement)("span", { className: "ad-hint" }, t.runs[thread.runs] || ""),
    (thread?.lines || []).map((line) => (0, import_react11.createElement)(Line, { key: line.id, line, thread, t, onChoose, busy })),
    (thread?.files || []).length > 0 && (0, import_react11.createElement)("div", { className: "ad-tline" }, (0, import_react11.createElement)("div", { className: "who-l" }, t.files), thread.files.map((f) => (0, import_react11.createElement)("div", { key: f.path, className: "step-l" }, f.path))),
    error && (0, import_react11.createElement)("div", { className: "ad-error", role: "alert" }, error),
    thread?.canSay && (0, import_react11.createElement)(
      "div",
      { className: "ad-say" },
      (0, import_react11.createElement)("textarea", { rows: 2, value: draft, placeholder: t.sayTo, "aria-label": t.sayTo, onChange: (e) => setDraft(e.target.value), onKeyDown: onKey }),
      (0, import_react11.createElement)("button", { type: "button", className: "ad-round", disabled: busy || !draft.trim(), title: t.sendTo, "aria-label": t.sendTo, onClick: say }, (0, import_react11.createElement)(Icon, { name: "send" }))
    )
  );
}

// client/panel-threads.mjs
var POLL_MS5 = 1e4;
function Row({ item, t, onOpen }) {
  const working = isWorking(item);
  return (0, import_react12.createElement)(
    "button",
    { type: "button", className: `ad-trow${working ? " working" : ""}${item.waiting ? " ask" : ""}`, title: t.open, onClick: () => onOpen(item.id) },
    (0, import_react12.createElement)("span", { className: "top-line" }, (0, import_react12.createElement)("span", { className: "t" }, item.title), (0, import_react12.createElement)("span", { className: `ad-pill ${pillOf(stateOf(item))}` }, t.task[stateOf(item)] || item.status)),
    working && (0, import_react12.createElement)("span", { className: "ad-track", "aria-hidden": true }, (0, import_react12.createElement)("span")),
    (0, import_react12.createElement)("span", { className: "sub" }, (0, import_react12.createElement)("span", null, `${t.runs[item.runs] || ""} · ${item.tasks} ${t.tasksN}`), (0, import_react12.createElement)("span", null, when(item.updatedAt)))
  );
}
function ThreadsPanel() {
  const t = words();
  const { status, focus } = useStore(store);
  const resident = status?.resident || "default";
  const [data, setData] = (0, import_react12.useState)({ loaded: false, on: true, threads: [] });
  const [error, setError] = (0, import_react12.useState)("");
  const [id, setId] = (0, import_react12.useState)("");
  (0, import_react12.useEffect)(() => {
    if (focus) {
      setId(focus);
      store.set({ focus: "" });
    }
  }, [focus]);
  (0, import_react12.useEffect)(() => {
    const load = async () => {
      try {
        const d = await loadThreads(resident);
        setData({ loaded: true, on: Boolean(d.on), threads: d.threads || [] });
        setError("");
      } catch (e) {
        setError(e.message);
      }
    };
    void load();
    const timer = setInterval(() => {
      if (!document.hidden) void load();
    }, POLL_MS5);
    return () => clearInterval(timer);
  }, [resident]);
  if (id) return (0, import_react12.createElement)(ThreadView, { resident, id, onBack: () => setId("") });
  const { open, done } = splitThreads(data.threads);
  return (0, import_react12.createElement)(
    "div",
    { className: "ad-panel" },
    error && (0, import_react12.createElement)("div", { className: "ad-error", role: "alert" }, error),
    data.loaded && !data.on && (0, import_react12.createElement)("p", { className: "ad-hint" }, t.threadsOff),
    open.map((item) => (0, import_react12.createElement)(Row, { key: item.id, item, t, onOpen: setId })),
    done.length > 0 && (0, import_react12.createElement)("p", { className: "ad-group" }, t.done),
    done.map((item) => (0, import_react12.createElement)(Row, { key: item.id, item, t, onOpen: setId })),
    data.loaded && data.threads.length === 0 && (0, import_react12.createElement)("div", { className: "ad-note" }, t.noThreads)
  );
}

// client/panels.mjs
var MARK = { board: "grid", tools: "wrench" };
function Empty({ id }) {
  return (0, import_react13.createElement)(
    "div",
    { className: "ad-panel" },
    (0, import_react13.createElement)(
      "div",
      { className: "ad-slot" },
      (0, import_react13.createElement)("span", { className: "ad-slot-mark", "aria-hidden": true }, (0, import_react13.createElement)(Icon, { name: MARK[id] || "grid" })),
      (0, import_react13.createElement)("span", null, words().soon)
    )
  );
}
var DRAW = { waiting: WaitingPanel, threads: ThreadsPanel, me: MePanel };
var PANELS = PANEL_IDS.map((id) => ({ id, render: () => DRAW[id] ? (0, import_react13.createElement)(DRAW[id]) : (0, import_react13.createElement)(Empty, { id }) }));

// client/right.mjs
var POLL_MS6 = 1e4;
function Right() {
  const t = words();
  const { status, waiting, right } = useStore(store);
  const resident = status?.resident || "default";
  (0, import_react14.useEffect)(() => {
    const load = async () => {
      try {
        store.set({ waiting: await loadWaiting(resident) });
      } catch {
      }
    };
    void load();
    const timer = setInterval(() => {
      if (!document.hidden) void load();
    }, POLL_MS6);
    return () => clearInterval(timer);
  }, [resident]);
  if (!right.open) return null;
  const panel = PANELS.find((p) => p.id === right.panel) || PANELS[0];
  const pick = (id) => store.set({ right: { ...right, panel: id } });
  return (0, import_react14.createElement)(
    "aside",
    { className: `ad-right${right.overlay ? " overlay" : ""}`, "aria-label": t.panels[panel.id] },
    (0, import_react14.createElement)(
      "div",
      { className: "ad-right-head" },
      (0, import_react14.createElement)(
        "div",
        { className: "ad-right-line" },
        (0, import_react14.createElement)("h2", { className: "ad-right-title" }, t.panels[panel.id]),
        (0, import_react14.createElement)("button", { type: "button", className: "ad-icon-btn sm", title: t.collapse, "aria-label": t.collapse, onClick: () => store.set({ right: { ...right, open: false } }) }, (0, import_react14.createElement)(Icon, { name: "close" }))
      ),
      (0, import_react14.createElement)("div", { className: "ad-tabs", role: "tablist" }, PANELS.map((p) => (0, import_react14.createElement)(
        "button",
        { key: p.id, type: "button", role: "tab", className: "ad-tab", "aria-selected": p.id === panel.id, onClick: () => pick(p.id) },
        t.panels[p.id],
        p.id === "waiting" && waiting.open > 0 && (0, import_react14.createElement)("span", { className: "ad-badge" }, waiting.open)
      )))
    ),
    (0, import_react14.createElement)(panel.render)
  );
}

// client/style-base.mjs
var BASE = `
.ad-root { position: relative; display: flex; height: 100%; min-height: 0; overflow: hidden; color: var(--text-1); background: var(--bg); font-family: var(--font); font-size: 15px; line-height: 1.6; -webkit-font-smoothing: antialiased; }
.ad-root > * { position: relative; z-index: 1; }
.ad-root *, .ad-root *::before, .ad-root *::after { box-sizing: border-box; }
.ad-root button, .ad-root input, .ad-root textarea, .ad-root select { font: inherit; color: inherit; }
.ad-root button { cursor: pointer; }
.ad-root a { color: var(--accent-text); }
.ad-root :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.ad-root svg { flex: none; }
.ad-root ::-webkit-scrollbar { width: 8px; height: 8px; }
.ad-root ::-webkit-scrollbar-thumb { border-radius: 4px; background: var(--line-dash); }
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

.ad-icon-btn { flex: none; width: 40px; height: 40px; border: 0; border-radius: 13px; display: grid; place-items: center; background: transparent; color: var(--text-2); position: relative; }
.ad-icon-btn:hover { color: var(--text-1); background: var(--line-soft); }
.ad-icon-btn svg { width: 19px; height: 19px; }
.ad-icon-btn.sm { width: 32px; height: 32px; border-radius: 9px; }
.ad-icon-btn.sm svg { width: 16px; height: 16px; }
.ad-icon-btn.primary { background: var(--accent); color: var(--on-accent); }
.ad-icon-btn.primary:hover { filter: brightness(1.05); }
.ad-avatar { position: relative; flex: none; width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; overflow: hidden; background: var(--avatar-bg); box-shadow: 0 0 0 1px var(--avatar-ring), 0 0 18px rgba(139, 124, 246, .22); color: var(--text-1); font-family: var(--serif); font-size: 17px; }
.ad-avatar.mini { width: 24px; height: 24px; font-size: 12px; }
.ad-avatar img { width: 100%; height: 100%; object-fit: cover; }
.ad-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 38px; padding: 0 15px; border-radius: 12px; border: 0; background: var(--accent); color: var(--on-accent); font-size: 14px; font-weight: 600; white-space: nowrap; }
.ad-btn:hover { filter: brightness(1.05); }
.ad-btn.quiet { border: 1px solid var(--line); background: transparent; color: var(--text-1); font-weight: 400; }
.ad-btn.quiet:hover { border-color: var(--accent); }
.ad-btn.small { height: 30px; padding: 0 11px; border-radius: 10px; font-size: 13px; }
.ad-btn:disabled { opacity: .45; cursor: default; }
.ad-pill { display: inline-flex; align-items: center; height: 22px; padding: 0 8px; border-radius: 999px; border: 1px solid var(--line); font-size: 11px; line-height: 1; color: var(--text-3); white-space: nowrap; }
.ad-pill.ok { color: var(--ok-text); border-color: color-mix(in srgb, var(--ok) 40%, transparent); background: var(--ok-soft); }
.ad-pill.warn { color: var(--accent-text); border-color: color-mix(in srgb, var(--accent) 55%, transparent); }
.ad-pill.hot { background: var(--accent); border-color: var(--accent); color: var(--on-accent); font-weight: 600; }
.ad-pill.bad { color: var(--err-text); border-color: color-mix(in srgb, var(--err) 50%, transparent); }
.ad-hint { margin: 0; font-size: 13px; color: var(--text-3); }
.ad-note { color: var(--text-4); font-size: 13px; text-align: center; margin: auto; padding: 24px 16px; max-width: 34ch; line-height: 1.7; }
.ad-error { color: var(--err-text); font-size: 13px; }
.ad-divider { align-self: center; display: inline-flex; align-items: center; gap: 6px; padding: 2px 10px; border-radius: 999px; background: var(--panel); font-size: 11px; line-height: 1.7; color: var(--text-3); }
.ad-form { margin: auto; width: min(420px, 90%); display: flex; flex-direction: column; gap: 12px; padding: 26px 24px; border-radius: 20px; border: 1px solid var(--line); background: var(--panel-strong); box-shadow: var(--shadow); }
.ad-form h2 { margin: 0; font-family: var(--serif); font-size: 20px; font-weight: 700; letter-spacing: .04em; }
.ad-form label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--text-2); }
.ad-form input, .ad-form select { min-width: 0; padding: 10px 12px; border-radius: 13px; border: 1px solid var(--line); background: var(--input-bg); outline: 0; }
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
.ad-main { flex: 1; min-width: 0; display: flex; flex-direction: column; min-height: 0; }
.ad-top, .ad-stream, .ad-compose { width: 100%; }
.ad-stream { padding-inline: max(18px, calc((100% - 768px) / 2)); }
.ad-compose { padding-inline: max(18px, calc((100% - 780px) / 2)); }
.ad-top { position: relative; display: flex; align-items: center; justify-content: center; min-height: 64px; padding: 8px 56px 4px 16px; }
.ad-ident { display: flex; align-items: center; gap: 8px; min-width: 0; max-width: min(460px, 100%); padding: 4px 14px 4px 4px; border: 1px solid var(--line); border-radius: 999px; background: var(--panel-strong); box-shadow: var(--shadow); }
.ad-ident .ad-avatar { width: 30px; height: 30px; font-size: 13px; }
.ad-who { min-width: 0; display: flex; flex-direction: column; }
.ad-name { font-size: 15px; font-weight: 600; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-status { font-size: 11px; line-height: 1.4; color: var(--text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-top .ad-act { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); display: flex; align-items: center; gap: 2px; }
.ad-stream { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 8px 18px 16px; display: flex; flex-direction: column; gap: 12px; scroll-behavior: smooth; }
.ad-stream > .grow { flex: 1; }
.ad-row { display: flex; flex-direction: column; gap: 4px; max-width: 78%; }
.ad-row.ai { align-self: flex-start; align-items: flex-start; }
.ad-row.me { align-self: flex-end; align-items: flex-end; }
.ad-bubble { position: relative; max-width: 100%; padding: 9px 13px; border-radius: 6px 18px 18px 18px; border: 1px solid var(--line); background: var(--panel); box-shadow: var(--shadow); overflow-wrap: anywhere; user-select: text; }
.ad-row.ai .ad-bubble.first { border-radius: 18px 18px 18px 6px; }
.ad-row.me .ad-bubble { background: var(--mine); border-color: var(--mine-line); box-shadow: none; border-radius: 18px 18px 6px 18px; white-space: pre-wrap; }
.ad-row.me .ad-bubble .ad-md { white-space: pre-wrap; }
.ad-bubble .ad-md { display: block; }
.ad-bubble .ad-md > p:last-child { display: inline; }
.ad-bubble .ad-md > p { margin: 0; }
.ad-bubble .ad-md > p + p { margin-top: .55em; }
.ad-meta { float: right; margin: 9px -3px -6px 12px; font-size: 11px; line-height: 1; color: var(--text-4); white-space: nowrap; }
.ad-row.me .ad-meta { color: var(--text-3); }
.ad-compose { padding: 4px 18px 18px; }
.ad-bar { display: flex; align-items: flex-end; gap: 6px; padding: 6px; border: 1px solid var(--line); border-radius: 26px; background: var(--panel-strong); box-shadow: var(--shadow); transition: border-color .15s; }
.ad-bar:focus-within { border-color: color-mix(in srgb, var(--accent) 60%, transparent); }
.ad-field { flex: 1; min-width: 0; display: flex; align-items: flex-end; min-height: 40px; padding-left: 8px; }
.ad-field textarea { flex: 1; min-width: 0; max-height: 38vh; padding: 8px 0; border: 0; outline: 0; background: transparent; resize: none; font-size: 15px; line-height: 1.5; }
.ad-field textarea::placeholder { color: var(--text-4); }
.ad-round { flex: none; width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; border: 0; background: var(--accent); color: var(--on-accent); }
.ad-round svg { width: 19px; height: 19px; }
.ad-round:disabled { opacity: .5; cursor: default; }
.ad-round.quiet { background: var(--line-soft); color: var(--text-2); }
.ad-quote { margin: 0 0 2px; padding: 5px 10px; border-radius: 10px; background: var(--line-soft); font-size: 12px; line-height: 1.5; color: var(--text-3); max-width: 100%; white-space: pre-wrap; overflow-wrap: anywhere; }
.ad-busy { display: flex; flex-direction: column; gap: 6px; align-items: flex-start; max-width: 100%; }
.ad-busy > button { display: inline-flex; align-items: center; gap: 6px; min-height: 32px; padding: 0 12px 0 10px; border-radius: 999px; border: 1px dashed var(--line-dash); background: transparent; color: var(--text-3); font-size: 12px; }
.ad-busy > button.live { color: var(--accent-text); border-color: color-mix(in srgb, var(--accent) 55%, transparent); }
.ad-busy > button svg { width: 14px; height: 14px; color: var(--moon); }
.ad-busy > button .chev { width: 12px; height: 12px; color: currentColor; transition: transform .15s; }
.ad-busy.open > button .chev { transform: rotate(90deg); }
.ad-busy-list { display: flex; flex-direction: column; width: min(340px, 78vw); padding: 6px 12px; border-radius: 14px; background: var(--panel-strong); border: 1px solid var(--line); font-size: 12px; line-height: 1.5; }
.ad-busy-item { border-top: 1px solid var(--line-soft); }
.ad-busy-item:first-child { border-top: 0; }
.ad-busy-item > button { display: flex; gap: 8px; width: 100%; padding: 6px 0; border: 0; background: none; text-align: left; color: var(--text-2); }
.ad-busy-item .what { flex: none; color: var(--text-1); }
.ad-busy-item .detail { flex: 1; min-width: 0; color: var(--text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-busy-item .state { flex: none; color: var(--text-4); }
.ad-busy-item pre { margin: 0 0 8px; max-height: 40vh; overflow: auto; padding: 8px 10px; border-radius: 10px; background: var(--input-bg); white-space: pre-wrap; overflow-wrap: anywhere; font: 12px/1.6 var(--mono); color: var(--text-2); }
.ad-busy-item .label { font-size: 11px; color: var(--text-4); }
.ad-pics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px; width: min(260px, 70vw); }
.ad-pics.one { grid-template-columns: minmax(0, 1fr); }
.ad-pics button { padding: 0; border: 0; border-radius: 14px; overflow: hidden; aspect-ratio: 1; background: var(--panel); }
.ad-pics.one button { aspect-ratio: auto; min-height: 120px; }
.ad-pics img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ad-files { display: flex; flex-wrap: wrap; gap: 6px; max-width: 100%; }
.ad-file { display: inline-flex; align-items: center; gap: 6px; max-width: 100%; padding: 6px 10px; border-radius: 12px; border: 1px solid var(--line); background: var(--panel); color: var(--text-2); font-size: 12px; }
.ad-file:hover { border-color: var(--line-dash); }
.ad-file svg { width: 14px; height: 14px; color: var(--accent-text); }
.ad-file .n { max-width: 22ch; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-file .s { color: var(--text-4); }
.ad-thumbs { display: flex; gap: 8px; padding: 0 2px 8px; overflow-x: auto; }
.ad-thumbs div { position: relative; flex: none; width: 64px; height: 64px; border-radius: 12px; overflow: hidden; background: var(--panel); }
.ad-thumbs img { width: 100%; height: 100%; object-fit: cover; }
.ad-thumbs .ad-x { position: absolute; top: 2px; right: 2px; width: 22px; height: 22px; border-radius: 50%; border: 0; background: rgba(0, 0, 0, .55); color: #fff; display: grid; place-items: center; }
.ad-thumbs .ad-x svg { width: 11px; height: 11px; }
.ad-typing { display: inline-flex; gap: 4px; padding: 3px 2px; }
.ad-typing span { width: 6px; height: 6px; border-radius: 50%; background: var(--text-3); animation: ad-bounce 1.2s infinite ease-in-out; }
.ad-typing span:nth-child(2) { animation-delay: .15s; } .ad-typing span:nth-child(3) { animation-delay: .3s; }
@keyframes ad-bounce { 0%, 60%, 100% { opacity: .35; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-2px); } }
`;

// client/style-rail.mjs
var RAIL = `
.ad-rail { flex: none; width: var(--rail-w); display: flex; flex-direction: column; gap: 2px; min-height: 0; padding: 10px; overflow-y: auto; background: var(--glass); border-right: 1px solid var(--line-soft); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
.ad-rail-head { display: flex; align-items: center; gap: 2px; padding: 0 0 10px 6px; padding-top: var(--ad-top-inset, 0px); }
.ad-rail-brand { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; font-family: var(--serif); font-size: 17px; font-weight: 700; letter-spacing: .06em; white-space: nowrap; overflow: hidden; }
.ad-rail-mark { width: 24px; height: 24px; border-radius: 8px; display: grid; place-items: center; background: var(--avatar-bg); box-shadow: 0 0 0 1px var(--avatar-ring); color: var(--moon); font-size: 13px; }
.ad-current { display: flex; flex-direction: column; align-items: center; gap: 2px; align-self: center; width: 132px; margin: 4px 0 12px; padding: 12px 8px 10px; border: 1px solid var(--line); border-radius: 18px; background: var(--panel); box-shadow: var(--shadow); color: var(--text-1); }
.ad-current:hover { border-color: var(--line-dash); }
.ad-current.on { background: var(--accent-soft); border-color: color-mix(in srgb, var(--accent) 45%, transparent); }
.ad-current .ad-avatar { width: 64px; height: 64px; margin-bottom: 6px; font-size: 26px; }
.ad-current .ad-name { max-width: 100%; font-size: 14px; font-weight: 600; line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-current .ad-tag { max-width: 100%; padding: 0 6px; border: 1px solid var(--line); border-radius: 6px; font-size: 11px; line-height: 18px; color: var(--text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-current .ad-tag.live { color: var(--violet-text); }
.ad-rail-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px; border: 0; border-radius: 12px; background: transparent; text-align: left; color: var(--text-2); }
.ad-rail-item:hover { background: var(--line-soft); }
.ad-rail-item.on { background: var(--accent-soft); color: var(--text-1); }
.ad-rail-item.on .ad-avatar { box-shadow: 0 0 0 2px var(--accent); }
.ad-rail-item .ad-avatar { width: 38px; height: 38px; font-size: 16px; }
.ad-rail-item .ad-txt { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.ad-rail-item .ad-label { font-size: 14px; line-height: 1.45; color: var(--text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-rail-item .ad-sub { font-size: 12px; line-height: 1.4; color: var(--text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-rail-item .ad-dot { position: absolute; top: 6px; left: 38px; width: 9px; height: 9px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 0 2px var(--bg); }
.ad-rail-item { position: relative; }
.ad-group-title { display: flex; align-items: baseline; gap: 6px; margin: 12px 8px 2px; font-size: 11px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--text-4); }
.ad-group-title span { font-weight: 400; letter-spacing: 0; text-transform: none; color: var(--text-3); }
.ad-thread { display: flex; flex-direction: column; gap: 1px; width: 100%; padding: 6px 8px; border: 0; border-radius: 10px; background: transparent; text-align: left; color: var(--text-2); }
.ad-thread:hover { background: var(--line-soft); }
.ad-thread .ad-t { font-size: 13px; line-height: 1.45; color: var(--text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-thread .ad-s { display: flex; align-items: center; gap: 6px; font-size: 11px; line-height: 1.5; color: var(--text-4); }
.ad-thread .ad-s .ad-live { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); animation: ad-pulse 1.6s infinite ease-in-out; }
@keyframes ad-pulse { 50% { opacity: .3; } }
.ad-usage { display: flex; flex-direction: column; gap: 2px; margin-top: auto; padding: 4px 0 10px; }
.ad-urow { display: grid; grid-template-columns: 1fr auto; gap: 0 8px; padding: 6px 8px; border-radius: 10px; }
.ad-urow:hover { background: var(--line-soft); }
.ad-urow .l { font-size: 12px; color: var(--text-3); }
.ad-urow .c { font-size: 12px; font-variant-numeric: tabular-nums; color: var(--text-1); }
.ad-urow .d { grid-column: 1; font-size: 11px; line-height: 1.4; color: var(--text-4); }
.ad-urow .d .hit { color: var(--text-3); }
.ad-urow .t { grid-column: 2; text-align: right; font-size: 11px; line-height: 1.4; color: var(--text-4); }
.ad-rail-foot { display: flex; align-items: center; gap: 2px; margin-top: auto; padding-top: 10px; }
.ad-side .ad-rail { width: 100%; height: 100%; border-right: 0; border-radius: 0; }
`;

// client/style-right.mjs
var RIGHT = `
.ad-right { flex: none; width: var(--panel-w); display: flex; flex-direction: column; min-height: 0; background: var(--glass); border-left: 1px solid var(--line-soft); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
.ad-right-head { display: flex; flex-direction: column; gap: 8px; padding: 14px 12px 10px 18px; border-bottom: 1px solid var(--line-soft); }
.ad-right-line { display: flex; align-items: center; gap: 6px; }
.ad-right-title { flex: 1; min-width: 0; margin: 0; font-family: var(--serif); font-size: 16px; font-weight: 700; letter-spacing: .04em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-tabs { display: flex; gap: 2px; padding: 2px; border-radius: 12px; background: var(--line-soft); }
.ad-tab { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 5px; height: 28px; padding: 0 8px; border: 0; border-radius: 10px; background: transparent; color: var(--text-3); font-size: 12.5px; white-space: nowrap; }
.ad-tab:hover { color: var(--text-1); }
.ad-tab[aria-selected="true"] { background: var(--panel-strong); color: var(--accent-text); font-weight: 600; box-shadow: var(--shadow); }
.ad-tab:disabled { opacity: .45; cursor: default; }
.ad-badge { min-width: 16px; height: 16px; padding: 0 4px; border-radius: 999px; background: var(--accent); color: var(--on-accent); font-size: 10px; font-weight: 700; line-height: 16px; text-align: center; }
.ad-right.overlay { position: absolute; top: 0; right: 0; bottom: 0; z-index: 3; width: min(var(--panel-w), 86%); box-shadow: -18px 0 50px rgba(2, 5, 18, .35); }
.ad-panel { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding: 12px; overscroll-behavior: contain; }
.ad-panel > * { flex-shrink: 0; }
.ad-group { margin: 8px 0 -4px; padding: 0 6px; font-size: 11px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--text-4); }
.ad-trow { display: flex; flex-direction: column; gap: 6px; width: 100%; padding: 12px; border-radius: 16px; border: 1px solid var(--line); background: var(--panel); color: inherit; text-align: left; }
button.ad-trow:hover { border-color: var(--line-dash); background: var(--panel-strong); }
.ad-trow.working { border-style: dashed; border-color: var(--line-dash); }
.ad-trow.ask { border-color: color-mix(in srgb, var(--accent) 55%, transparent); background: var(--accent-soft); }
.ad-trow.dim { opacity: .55; }
.ad-trow .top-line { display: flex; align-items: center; gap: 8px; }
.ad-trow .t { flex: 1; min-width: 0; font-size: 14px; font-weight: 600; line-height: 1.45; overflow-wrap: anywhere; }
.ad-trow .sub { display: flex; gap: 8px; font-size: 12px; line-height: 1.5; color: var(--text-3); }
.ad-trow .sub span:first-child { flex: 1; min-width: 0; overflow-wrap: anywhere; }
.ad-links { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.ad-track { position: relative; height: 3px; border-radius: 2px; background: var(--line); overflow: hidden; }
.ad-track span { position: absolute; top: 0; bottom: 0; left: -40%; width: 40%; border-radius: 2px; background: var(--accent); animation: ad-slide 1.6s infinite ease-in-out; }
@keyframes ad-slide { to { left: 100%; } }
.ad-tline { display: flex; flex-direction: column; gap: 4px; padding: 10px 12px; border-radius: 14px; border: 1px solid var(--line); background: var(--panel); }
.ad-tline.r-user { background: var(--mine); border-color: var(--mine-line); }
.ad-tline.r-result { border-style: dashed; border-color: var(--line-dash); }
.ad-tline .who-l { display: flex; align-items: center; gap: 8px; font-size: 11px; letter-spacing: .04em; color: var(--text-4); }
.ad-tline .step-l { font-size: 12px; color: var(--text-4); overflow-wrap: anywhere; }
.ad-tline .text { font-size: 14px; white-space: pre-wrap; overflow-wrap: anywhere; }
.ad-tline .text.ad-md { white-space: normal; }
.ad-say { position: sticky; bottom: -12px; display: flex; gap: 6px; align-items: flex-end; margin: 0 -12px -12px; padding: 10px 12px 12px; background: var(--glass); backdrop-filter: blur(14px); }
.ad-say textarea { flex: 1; min-width: 0; min-height: 40px; max-height: 30vh; padding: 9px 12px; border-radius: 14px; border: 1px solid var(--line); background: var(--panel-strong); outline: 0; resize: vertical; font-size: 14px; }
.ad-say textarea:focus { border-color: color-mix(in srgb, var(--accent) 60%, transparent); }
.ad-say .ad-round { width: 40px; height: 40px; }
.ad-me-head { display: flex; align-items: center; gap: 10px; }
.ad-me-head .ad-avatar { width: 44px; height: 44px; }
.ad-me-head b { display: block; font-size: 15px; font-weight: 600; }
.ad-me-head .ad-sub { font-size: 12px; color: var(--text-4); }
.ad-me-line { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 0; font-size: 12px; color: var(--text-3); }
.ad-me-line code { padding: 2px 8px; border-radius: 8px; background: var(--line-soft); font-family: var(--mono); font-size: 11.5px; color: var(--text-2); overflow-wrap: anywhere; }
.ad-me-block { display: flex; flex-direction: column; gap: 6px; padding: 10px 12px; border-radius: 14px; border: 1px solid var(--line); background: var(--panel); }
.ad-me-label { margin: 0; font-size: 11px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--text-4); }
.ad-me-text { width: 100%; min-height: 96px; max-height: 40vh; padding: 9px 10px; border-radius: 10px; border: 1px solid var(--line); background: var(--input-bg); outline: 0; resize: vertical; font-size: 13px; line-height: 1.6; }
.ad-me-text:focus { border-color: color-mix(in srgb, var(--accent) 60%, transparent); }
.ad-me-state { margin: 0; font-size: 13px; color: var(--text-2); }
.ad-me-state.s-running { color: var(--ok-text); }
.ad-me-state.s-unpaired, .ad-me-state.s-locked, .ad-me-state.s-revoked { color: var(--accent-text); }
.ad-me-state.s-crashed { color: var(--err-text); }
.ad-slot { margin: auto; display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px 16px; text-align: center; color: var(--text-4); font-size: 13px; line-height: 1.7; }
.ad-slot .ad-slot-mark { width: 36px; height: 36px; border-radius: 12px; display: grid; place-items: center; border: 1px dashed var(--line-dash); color: var(--text-3); }
.ad-slot .ad-slot-mark svg { width: 18px; height: 18px; }
`;

// client/theme.mjs
var TOKENS = `.ad-root {
  color-scheme: dark;
  --bg: #070a16;
  --stars-opacity: .9;
  --star-1: rgba(255, 255, 255, .85);
  --star-2: rgba(190, 205, 255, .7);
  --star-3: rgba(244, 160, 124, .55);
  --glass: rgba(7, 10, 22, .6);
  --panel: rgba(21, 27, 54, .62);
  --panel-strong: rgba(23, 29, 58, .94);
  --line: rgba(148, 163, 255, .16);
  --line-soft: rgba(148, 163, 255, .10);
  --line-dash: rgba(148, 163, 255, .32);
  --mine: rgba(244, 160, 124, .16);
  --mine-line: rgba(244, 160, 124, .35);
  --text-1: #eef0ff;
  --text-2: #c9cdea;
  --text-3: #9aa0c8;
  --text-4: #7f85b0;
  --accent: #F4A07C;
  --accent-text: #F4A07C;
  --accent-soft: rgba(244, 160, 124, .12);
  --on-accent: #251304;
  --violet-text: #b3a8ff;
  --ok: #7BD3A0;
  --ok-text: #a7e6c2;
  --ok-soft: rgba(123, 211, 160, .1);
  --err: #f87171;
  --err-text: #fca5a5;
  --shadow: 0 1px 0 rgba(180, 190, 255, .07) inset, 0 10px 30px rgba(2, 5, 18, .5);
  --avatar-bg: radial-gradient(circle at 35% 30%, #2d2b66, #11142e 72%);
  --avatar-ring: rgba(246, 221, 174, .35);
  --input-bg: #0b0f22;
  --scrim: rgba(4, 6, 16, .62);
  --rail-w: 272px;
  --panel-w: 352px;
  --font: system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", "Microsoft YaHei", "Segoe UI", sans-serif;
  --serif: "Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", serif;
  --mono: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.ad-root.day {
color-scheme: light;
    --bg: #F8F5EF;
    --stars-opacity: .7;
    --star-1: rgba(201, 150, 46, .6);
    --star-2: rgba(139, 124, 246, .45);
    --star-3: rgba(201, 150, 46, .5);
    --glass: rgba(248, 245, 239, .74);
    --panel: rgba(255, 255, 255, .82);
    --panel-strong: rgba(255, 255, 255, .97);
    --line: rgba(109, 92, 210, .16);
    --line-soft: rgba(109, 92, 210, .10);
    --line-dash: rgba(109, 92, 210, .3);
    --mine: rgba(244, 160, 124, .24);
    --mine-line: rgba(214, 120, 84, .35);
    --text-1: #232437;
    --text-2: #3c3e5c;
    --text-3: #5a5d82;
    --text-4: #666a90;
    --accent-text: #B0532F;
    --accent-soft: rgba(244, 160, 124, .16);
    --on-accent: #2a1608;
    --violet-text: #5B4BC4;
    --ok: #3E9A6A;
    --ok-text: #2c7a52;
    --ok-soft: rgba(62, 154, 106, .1);
    --err: #B23B31;
    --err-text: #B23B31;
    --shadow: 0 1px 0 rgba(255, 255, 255, .7) inset, 0 8px 22px rgba(88, 76, 160, .10);
    --avatar-bg: radial-gradient(circle at 35% 30%, #fff6dc, #e9e2fb 75%);
--avatar-ring: rgba(201, 150, 46, .45);
--input-bg: #fff;
}`;

// client/index.mjs
var inject = ["slots", "layout"];
var PANEL = "aelios-desktop";
var SHADOW_PRIORITY = -100;
var POLL_MS7 = 5e3;
function useStatus() {
  const { status } = useStore(store);
  (0, import_react15.useEffect)(() => {
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
    }, POLL_MS7);
    return () => clearInterval(timer);
  }, []);
  return status;
}
var NARROW = 980;
function useDay() {
  const [day, setDay] = (0, import_react15.useState)(() => paletteOf(readSurface()) === "day");
  (0, import_react15.useEffect)(() => {
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
  const root = (0, import_react15.useRef)(null);
  (0, import_react15.useEffect)(() => {
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
  return (0, import_react15.createElement)(
    "div",
    { className: `ad-root${day ? " day" : ""}`, ref: root },
    (0, import_react15.createElement)("div", { className: "ad-sky", "aria-hidden": true }),
    !status ? (0, import_react15.createElement)("div", { className: "ad-note" }, t.connecting) : status.connected ? [(0, import_react15.createElement)(Chat, { key: "chat" }), (0, import_react15.createElement)(Right, { key: "right" })] : (0, import_react15.createElement)(ConnectForm, { defaultWorkspace: status.defaultWorkspace })
  );
}
function Side({ onBack }) {
  const day = useDay();
  const inset = shellTopInset();
  return (0, import_react15.createElement)("div", { className: `ad-root ad-side${day ? " day" : ""}`, style: inset ? { "--ad-top-inset": `${inset}px` } : void 0 }, (0, import_react15.createElement)(Left, { onBack }));
}
var Nav = () => (0, import_react15.createElement)(
  "svg",
  { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, "aria-hidden": true },
  (0, import_react15.createElement)("path", { d: "M3 11 12 3l9 8M6 10v11h12V10M10 21v-7h4v7" })
);
function apply(ctx) {
  const t = words();
  ctx.effect(() => {
    const style = document.createElement("style");
    style.textContent = [TOKENS, BASE, RAIL, CHAT, RIGHT].join("\n");
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
    if (on && !release) release = ctx.slots.inject("sidebar", () => ctx.slots.register({ name: "sidebar", priority: SHADOW_PRIORITY }, () => (0, import_react15.createElement)(Side, { onBack: back })));
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
