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
var import_react5 = require("react");

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

// client/chat.mjs
var import_react2 = require("react");

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

// client/store.mjs
var import_react = require("react");
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
var useStore = (store2) => (0, import_react.useSyncExternalStore)(store2.subscribe, store2.get);
var store = createStore({ status: null, residents: [], error: "" });

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
    runner: { unpaired: "runner 未配对", stopped: "runner 已停止", starting: "runner 正在启动", running: "runner 运行中", crashed: "runner 出错停止", locked: "runner 已在别处运行", revoked: "配对已被撤销" }
  }
};
var words = () => typeof navigator !== "undefined" && /^zh/i.test(navigator.language) ? WORDS.zh : WORDS.en;

// client/chat.mjs
var POLL_MS = 5e3;
function Md({ text }) {
  const ref = (0, import_react2.useRef)(null);
  (0, import_react2.useEffect)(() => {
    if (ref.current) renderMarkdown(ref.current, text || "");
  }, [text]);
  return (0, import_react2.createElement)("div", { ref });
}
var clock = (at) => at ? new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
function Chat() {
  const t = words();
  const { status } = useStore(store);
  const resident = status?.resident || "default";
  const [lines, setLines] = (0, import_react2.useState)([]);
  const [text, setText] = (0, import_react2.useState)("");
  const [busy, setBusy] = (0, import_react2.useState)(false);
  const [error, setError] = (0, import_react2.useState)("");
  const end = (0, import_react2.useRef)(null);
  const reader = (0, import_react2.useRef)(null);
  const refresh = async () => {
    try {
      const next = await reader.current();
      if (next) setLines(next);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  };
  (0, import_react2.useEffect)(() => {
    reader.current = createMessages((path) => web(path, { resident }));
    setLines([]);
    void refresh();
    const timer = setInterval(() => {
      if (!document.hidden) void refresh();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [resident]);
  (0, import_react2.useEffect)(() => {
    end.current?.scrollIntoView?.({ block: "end" });
  }, [lines.length]);
  async function send() {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      const said = await web("/web/say", { method: "POST", body: { text: body }, resident });
      if (said?.error) throw new Error(said.error);
      setText("");
      reader.current = createMessages((path) => web(path, { resident }));
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent?.isComposing) {
      e.preventDefault();
      void send();
    }
  };
  const runner = status?.runner;
  return (0, import_react2.createElement)(
    "section",
    { className: "ad-main" },
    (0, import_react2.createElement)(
      "div",
      { className: "ad-head" },
      t.title,
      runner && (0, import_react2.createElement)("span", { className: "ad-state" }, t.runner[runner.state] || runner.state, runner.error ? ` · ${runner.error}` : ""),
      runner && ["stopped", "crashed", "revoked"].includes(runner.state) && (0, import_react2.createElement)("button", { className: "ad-btn quiet", onClick: async () => store.set({ status: await call("start") }) }, t.start),
      (0, import_react2.createElement)("button", { className: "ad-btn quiet", onClick: async () => store.set({ status: await call("disconnect") }) }, t.disconnect)
    ),
    (0, import_react2.createElement)(
      "div",
      { className: "ad-lines", "aria-live": "polite" },
      lines.length === 0 && (0, import_react2.createElement)("div", { className: "ad-note" }, t.empty),
      lines.map((line, i) => (0, import_react2.createElement)(
        "div",
        { key: line.id ?? i, className: `ad-row ${line.role === "user" ? "user" : "assistant"}` },
        (0, import_react2.createElement)(
          "div",
          { className: "ad-bubble" },
          line.role === "user" ? line.text : (0, import_react2.createElement)(Md, { text: line.text }),
          (0, import_react2.createElement)("span", { className: "ad-meta" }, clock(line.at))
        )
      )),
      (0, import_react2.createElement)("div", { ref: end })
    ),
    error && (0, import_react2.createElement)("div", { className: "ad-error", role: "alert" }, error),
    (0, import_react2.createElement)(
      "div",
      { className: "ad-compose" },
      (0, import_react2.createElement)("textarea", { rows: 2, value: text, placeholder: t.write, "aria-label": t.write, onChange: (e) => setText(e.target.value), onKeyDown: onKey }),
      (0, import_react2.createElement)("button", { className: "ad-btn", disabled: busy || !text.trim(), onClick: send }, busy ? t.sending : t.send)
    )
  );
}

// client/connect-form.mjs
var import_react3 = require("react");
function ConnectForm({ defaultWorkspace = "" }) {
  const t = words();
  const [form, setForm] = (0, import_react3.useState)({ url: "", key: "", workspace: "", helper: "dsh", access: "edit", confirmFull: false });
  const [busy, setBusy] = (0, import_react3.useState)(false);
  const [error, setError] = (0, import_react3.useState)("");
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
  const field = (name, label, props = {}) => (0, import_react3.createElement)("label", null, label, (0, import_react3.createElement)("input", { value: form[name], onChange: set(name), disabled: busy, ...props }));
  return (0, import_react3.createElement)(
    "form",
    { className: "ad-form", onSubmit: submit },
    field("url", t.address, { type: "url", required: true, placeholder: "https://", autoComplete: "off" }),
    field("key", t.key, { type: "password", required: true, autoComplete: "off" }),
    field("workspace", t.folder, { placeholder: defaultWorkspace }),
    (0, import_react3.createElement)("label", null, t.helper, (0, import_react3.createElement)("select", { value: form.helper, onChange: set("helper"), disabled: busy }, (0, import_react3.createElement)("option", { value: "dsh" }, "DSH"), (0, import_react3.createElement)("option", { value: "kiro" }, "Kiro"))),
    (0, import_react3.createElement)("label", null, t.access, (0, import_react3.createElement)("select", { value: form.access, onChange: set("access"), disabled: busy }, ["read", "edit", "full"].map((v) => (0, import_react3.createElement)("option", { key: v, value: v }, v)))),
    form.access === "full" && (0, import_react3.createElement)("label", null, (0, import_react3.createElement)("span", null, (0, import_react3.createElement)("input", { type: "checkbox", checked: form.confirmFull, onChange: set("confirmFull") }), " ", t.fullOk)),
    error && (0, import_react3.createElement)("div", { className: "ad-error", role: "alert" }, error),
    (0, import_react3.createElement)("button", { className: "ad-btn", type: "submit", disabled: busy }, busy ? t.connecting : t.connect)
  );
}

// client/left.mjs
var import_react4 = require("react");
var POLL_MS2 = 3e4;
function Left() {
  const t = words();
  const { status, residents } = useStore(store);
  (0, import_react4.useEffect)(() => {
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
  const pick = async (id) => store.set({ status: await call("select", { resident: id }) });
  const list = residents.length ? residents : [{ id: "default", name: t.title }];
  return (0, import_react4.createElement)(
    "nav",
    { className: "ad-left", "aria-label": t.residents },
    (0, import_react4.createElement)("h2", null, t.residents),
    list.map((r) => (0, import_react4.createElement)(
      "button",
      { key: r.id, className: "ad-item", type: "button", "aria-current": (status?.resident || "default") === r.id, onClick: () => pick(r.id) },
      (0, import_react4.createElement)("span", { className: "ad-avatar", "aria-hidden": true }, (r.name || r.id).slice(0, 1)),
      (0, import_react4.createElement)("span", null, r.name || r.id)
    ))
  );
}

// client/theme.mjs
var TOKENS = `.ad-root {
  color-scheme: dark;
  --bg: #070a16;
  --glass: rgba(7, 10, 22, .6);
  --panel: rgba(21, 27, 54, .62);
  --panel-strong: rgba(23, 29, 58, .94);
  --line: rgba(148, 163, 255, .16);
  --line-soft: rgba(148, 163, 255, .10);
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
  --ok-text: #a7e6c2;
  --err-text: #fca5a5;
  --shadow: 0 1px 0 rgba(180, 190, 255, .07) inset, 0 10px 30px rgba(2, 5, 18, .5);
  --avatar-bg: radial-gradient(circle at 35% 30%, #2d2b66, #11142e 72%);
  --avatar-ring: rgba(246, 221, 174, .35);
  --input-bg: #0b0f22;
  --font: system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", "Microsoft YaHei", "Segoe UI", sans-serif;
  --serif: "Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", serif;
  --mono: ui-monospace, SFMono-Regular, Menlo, monospace;
}`;
var LAYOUT = `
.ad-root { display: flex; height: 100%; min-height: 0; color: var(--text-1); background: var(--bg); font-family: var(--font); }
.ad-root * { box-sizing: border-box; }
.ad-left { flex: none; width: 260px; display: flex; flex-direction: column; gap: 4px; padding: 10px; border-right: 1px solid var(--line); background: var(--glass); overflow: auto; }
.ad-left h2 { margin: 4px 6px 6px; font-size: 12px; font-weight: 600; color: var(--text-3); }
.ad-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 6px; border: 0; border-radius: 12px; background: transparent; color: var(--text-1); font: inherit; text-align: left; cursor: pointer; }
.ad-item:hover { background: var(--line-soft); }
.ad-item[aria-current="true"] { background: var(--accent-soft); }
.ad-avatar { flex: none; width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; background: var(--avatar-bg); box-shadow: 0 0 0 1px var(--avatar-ring); font-family: var(--serif); }
.ad-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); }
.ad-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.ad-head { padding: 10px 16px; border-bottom: 1px solid var(--line); font-weight: 600; }
.ad-state { margin-left: 8px; font-size: 12px; font-weight: 400; color: var(--text-3); }
.ad-lines { flex: 1; min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: 10px; padding: 16px; }
.ad-row { display: flex; }
.ad-row.user { justify-content: flex-end; }
.ad-bubble { position: relative; max-width: min(640px, 85%); padding: 9px 13px; border-radius: 18px; border: 1px solid var(--line); background: var(--panel); box-shadow: var(--shadow); overflow-wrap: anywhere; user-select: text; }
.ad-row.user .ad-bubble { background: var(--mine); border-color: var(--mine-line); white-space: pre-wrap; }
.ad-bubble p { margin: 0 0 6px; } .ad-bubble p:last-child { margin: 0; }
.ad-meta { display: block; margin-top: 4px; font-size: 11px; color: var(--text-4); text-align: right; }
.ad-compose { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--line); }
.ad-compose textarea, .ad-form input, .ad-form select { flex: 1; min-width: 0; padding: 9px 12px; border-radius: 12px; border: 1px solid var(--line); background: var(--input-bg); color: var(--text-1); font: inherit; }
.ad-btn { padding: 9px 16px; border-radius: 12px; border: 1px solid var(--accent); background: var(--accent); color: var(--on-accent); font: inherit; cursor: pointer; }
.ad-btn:disabled { opacity: .5; cursor: default; }
.ad-btn.quiet { background: transparent; color: var(--accent-text); }
.ad-root :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.ad-form { margin: auto; width: min(420px, 90%); display: flex; flex-direction: column; gap: 12px; padding: 24px; border-radius: 18px; border: 1px solid var(--line); background: var(--panel-strong); box-shadow: var(--shadow); }
.ad-form label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--text-2); }
.ad-error { color: var(--err-text); font-size: 13px; }
.ad-note { color: var(--text-3); font-size: 13px; }
@media (prefers-reduced-motion: reduce) { .ad-root * { animation: none !important; transition: none !important; } }
`;

// client/index.mjs
var inject = ["slots", "layout"];
var PANEL = "aelios-desktop";
var SHADOW_PRIORITY = -100;
var POLL_MS3 = 5e3;
function useStatus() {
  const { status } = useStore(store);
  (0, import_react5.useEffect)(() => {
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
    }, POLL_MS3);
    return () => clearInterval(timer);
  }, []);
  return status;
}
function Main() {
  const status = useStatus();
  const t = words();
  return (0, import_react5.createElement)(
    "div",
    { className: "ad-root" },
    !status ? (0, import_react5.createElement)("div", { className: "ad-note" }, t.connecting) : status.connected ? (0, import_react5.createElement)(Chat) : (0, import_react5.createElement)(ConnectForm, { defaultWorkspace: status.defaultWorkspace })
  );
}
var Side = () => (0, import_react5.createElement)("div", { className: "ad-root ad-side" }, (0, import_react5.createElement)(Left));
var Nav = () => (0, import_react5.createElement)(
  "svg",
  { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, "aria-hidden": true },
  (0, import_react5.createElement)("path", { d: "M3 11 12 3l9 8M6 10v11h12V10M10 21v-7h4v7" })
);
function apply(ctx) {
  const t = words();
  ctx.effect(() => {
    const style = document.createElement("style");
    style.textContent = `${TOKENS}
${LAYOUT}
.ad-side .ad-left { width: 100%; border: 0; background: transparent; }`;
    document.head.append(style);
    return () => style.remove();
  });
  ctx.slots.inject("main", () => ctx.slots.register({ name: "main", key: PANEL }, Main));
  ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({ name: "sidebar.panellist", id: PANEL, order: 5, label: () => t.title }, Nav));
  let release = null;
  const sync = () => {
    const on = Boolean(store.get().status?.connected);
    if (on && !release) release = ctx.slots.inject("sidebar.workspaces", () => ctx.slots.register({ name: "sidebar.workspaces", priority: SHADOW_PRIORITY }, Side));
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
