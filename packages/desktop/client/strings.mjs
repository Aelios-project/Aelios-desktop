// The words the shell draws. English is the default; 中文 only when the reader picks it in Settings, kept in
// localStorage. Labels are a word or two; anything longer is an *Info line, shown behind an (i).
// The resident's own words come from the resident.
const WORDS = {
  en: {
    title: "Resident", brand: "Aelios", connectTitle: "Connect a resident", connect: "Connect", address: "Resident address", key: "Web key",
    folder: "Folder for the helper", helper: "Helper", access: "Permission", fullOk: "I understand full permission lets the helper change anything on this machine",
    connecting: "Connecting…", residents: "Residents", groups: "Groups", here: "Here", thisMachine: "This machine", unread: "New messages", answering: "Answering",
    settings: "Settings", close: "Close", backToDsh: "Back to DSH", dsh: "DSH", info: "About this", details: "Details", more: "More",
    panels: { waiting: "Waiting", threads: "Threads", alarms: "Alarms" }, collapse: "Hide the work panel", expand: "Show the work panel", widen: "Widen the panel", narrow: "Narrow the panel",
    search: "Search the conversation", searchHint: "Search messages", noHits: "No matches", around: "Search result", backToChat: "Back to now",
    mine: "You", given: "Resident", empty: "Say hello.", write: "Write a message · / for commands", writeGroup: "Write to the group", send: "Send",
    attach: "Add pictures or files", remove: "Remove", stickers: "Stickers", noStickers: "No sticker packs are on", voice: "Record a voice note",
    recording: "Recording — tap to send", play: "Play", stopPlay: "Stop", missed: "Not heard", upTo: "Up to four pictures", upToFiles: "Up to three files", fileTooBig: "Files can be up to 4 MB", tooBig: "That picture could not be read",
    openPicture: "Open the picture", ran: "done", thinking: "Thinking", members: "members", inLine: "in line", group: "Group",
    speakIt: "Read aloud", pinIt: "Keep in memory", pinned: "Kept", takeBack: "Take back", redo: "Answer again", copy: "Copy", copied: "Copied",
    commands: "Commands", cmd: { status: "Status report", letter: "Write the letter now", handoff: "Hand off to a new window" },
    kind: { ask: "Ask", permission: "Permission", stuck: "Stuck" }, openSettings: "Open settings", nothingWaiting: "Nothing needs you",
    open: "Open thread", settle: "Dismiss without answering", putAside: "Put away (it comes back if the thread fails again)",
    task: { sent: "Sent", working: "Working", done: "Done", failed: "Failed", needs_you: "Ask", quiet: "Silent", stopped: "Stopped", chosen: "Chosen", settled: "Settled", cancelled: "Stopped" },
    runs: { local: "At the resident", linux: "GitHub Actions", machine: "On a machine", retired: "Retired route" },
    helpers: { dsh: "DSH", kiro: "Kiro", command: "ACP command", resident: "The resident", actions: "GitHub Actions", machine: "This machine" },
    done: "Done", noThreads: "No threads yet", threadsInfo: "Ask the resident to look something up or write something; the work it hands out shows here.",
    threadsOff: "Background help is off", today: "today", tasksN: "tasks", quotaInfo: "Threads started in the last 24 hours, out of the daily limit.",
    back: "Back", stop: "Stop it", sayTo: "Message this thread directly", sendTo: "Send to the thread", files: "Files", session: "Session",
    saveFile: "Save the file", saving: "Saving…",
    who: { mine: "You", given: "Resident", result: "Result", thread: "Thread" }, thought: "Thought", plan: "Plan", input: "Input", output: "Result",
    toolKind: { read: "Read", edit: "Edit", delete: "Delete", move: "Move", search: "Search", execute: "Run", think: "Think", fetch: "Fetch", other: "Tool" },
    toolsN: "tool calls", filesN: "files changed", commandsN: "commands", permitYes: "Allow", permitNo: "Deny",
    decided: { allowed_you: "Allowed by you", denied_you: "Denied by you", allowed_tier: "Allowed", denied_tier: "Refused by the tier" },
    noAlarms: "No alarms", alarmsOff: "Alarms are off", once: "One-time", repeats: "Repeats", moveAlarm: "Change the time", dropAlarm: "Delete the alarm",
    save: "Save", saved: "Saved", cancel: "Cancel", create: "Create", dayToday: "Today", dayTomorrow: "Tomorrow", sureDelete: "Press again to delete",
    alarmsInfo: "The resident sets these for itself and decides what to say when one rings.",
    workspace: "Workspace", openFolder: "Open the folder", localSessions: "Sessions on this machine", noSessions: "Nothing has run here yet", log: "Runner log",
    since: "since", queued: "Queued", unsent: "Unsent", runningNow: "Running now", idle: "Idle", seen: "Resident sees it", unseen: "Resident does not see it", lastSeen: "last seen",
    tier: { read: "Read", edit: "Edit", full: "Full" }, stopRunner: "Stop", notWired: "This machine's details are not connected yet.",
    machineInfo: "The runner does the resident's work on this machine, through the helper, inside the workspace folder. Permission is the most it may do without asking you.",
    addResident: "New resident", residentId: "Id: a–z, 0–9 and -", newGroup: "New group", groupSettings: "Group settings", rounds: "Rounds", whoAnswers: "Who answers",
    reply: { all: "Everyone answers", one: "One answers", none: "Only when named" }, order: { list: "In list order", random: "In random order" },
    stopGroup: "Stop answering", removeGroup: "Delete the group", removeResident: "Delete this resident",
    sections: { resident: "Resident", model: "Model access", memory: "Memory", time: "Time", channels: "Channels", web: "Web & tools", voice: "Voice & stickers", work: "Background help", usage: "Usage", app: "App" },
    name: "Name", model: "Resident model", persona: "Persona", setFace: "Change the picture", dropFace: "Remove the picture",
    letter: "Letter", letterInfo: "Older conversation is packed into a letter the resident keeps, so it remembers past the window.",
    letterState: { written: "Written", none: "None yet" }, onItsWay: "on its way", failedToSend: "failed", blocked: "blocked", retryLetter: "Send again",
    filter: "Filter settings", noMatch: "Nothing matches", secretSaved: "Saved on the resident", fieldsInfo: "Settings the resident keeps behind its web door. Empty means the default.",
    mcp: "MCP servers", noMcp: "None connected", addMcp: "Connect a server", mcpName: "Name", mcpKey: "Key, if it needs one", tools: "tools",
    signIn: "Sign in", retryIt: "Retry", drop: "Remove", mcpInfo: "Tool servers the resident can call. A server that needs a sign-in waits for you.",
    mcpState: { ready: "On", authenticating: "Sign in", off: "Off" }, sites: "Site keys", addSite: "Add a site key", siteHost: "Site, e.g. example.com", siteKey: "Key",
    sitesInfo: "Keys the resident sends when it reads these sites.", telegram: "Telegram", telegramConnect: "Connect the bot",
    packs: "Sticker packs", importPack: "Import a pack by link", packLink: "t.me/addstickers/… or a .zip address", stickerWhen: "When to send it",
    githubSetup: "Set up GitHub Actions", testTask: "Send a test thread", roles: "Roles", addRole: "Add a role", roleName: "Role", roleTemplate: "Instructions", roleModel: "Model",
    span: { today: "Today", week: "7 days", month: "30 days" }, tokens: "tokens", cache: "from cache", cost: "cost", unpriced: "unpriced", noUsage: "No usage yet", recent: "Recent calls",
    usageInfo: "Tokens the resident read and wrote. Cache is the share of the prompt it did not pay for in full.",
    runnerTitle: "Runner", machineName: "This computer's name", start: "Start", pair: "Pair again", disconnect: "Disconnect", language: "Language",
    runner: { unpaired: "Unpaired", stopped: "Stopped", starting: "Starting", running: "Running", crashed: "Error", locked: "Elsewhere", revoked: "Revoked" },
  },
  zh: {
    title: "住户", brand: "Aelios", connectTitle: "连接住户", connect: "连接", address: "住户地址", key: "网页钥匙",
    folder: "帮手工作的文件夹", helper: "帮手", access: "权限", fullOk: "我知道完整权限会让帮手改动这台机器上的任何东西",
    connecting: "正在连接…", residents: "住户", groups: "群聊", here: "这里", thisMachine: "这台机器", unread: "有新消息", answering: "在回",
    settings: "设置", close: "关闭", backToDsh: "回到 DSH", dsh: "DSH", info: "说明", details: "详情", more: "更多",
    panels: { waiting: "等你", threads: "线程", alarms: "闹钟" }, collapse: "收起右栏", expand: "打开右栏", widen: "加宽右栏", narrow: "收窄右栏",
    search: "搜聊天记录", searchHint: "搜消息", noHits: "没找到", around: "搜索结果", backToChat: "回到现在",
    mine: "你", given: "住户", empty: "打个招呼吧。", write: "说点什么 · / 调命令", writeGroup: "对群里说点什么", send: "发送",
    attach: "发图或文件", remove: "拿掉", stickers: "表情包", noStickers: "没开表情包", voice: "录一段语音",
    recording: "在录…再点一下发出", play: "听", stopPlay: "停下", missed: "没听清", upTo: "一次最多四张", upToFiles: "一次最多三个文件", fileTooBig: "文件最大 4 MB", tooBig: "这张图读不了",
    openPicture: "看大图", ran: "完成", thinking: "思考", members: "位成员", inLine: "个在排队", group: "群聊",
    speakIt: "念出来", pinIt: "记进记忆", pinned: "记下了", takeBack: "撤回", redo: "重新回答", copy: "复制", copied: "复制了",
    commands: "命令", cmd: { status: "状态", letter: "现在写交接信", handoff: "交接到新窗口" },
    kind: { ask: "等你", permission: "要你点头", stuck: "卡住" }, openSettings: "去设置", nothingWaiting: "没有要你处理的",
    open: "打开线程", settle: "不回答，直接收起", putAside: "收起（线程再出错时会回来）",
    task: { sent: "派出", working: "在干", done: "做完", failed: "失败", needs_you: "等你", quiet: "没回音", stopped: "停下", chosen: "拍板", settled: "处理过", cancelled: "停下" },
    runs: { local: "在住户这里", linux: "GitHub Actions", machine: "在机器上", retired: "旧线路" },
    helpers: { dsh: "DSH", kiro: "Kiro", command: "ACP 命令", resident: "住户自己", actions: "GitHub Actions", machine: "这台机器" },
    done: "做完的", noThreads: "还没有线程", threadsInfo: "在聊天里让它去查点什么、写点什么，它交出去的活会出现在这里。",
    threadsOff: "后台帮忙关着", today: "今天", tasksN: "单", quotaInfo: "过去 24 小时派出去的线程，和每天的上限。",
    back: "返回", stop: "叫它停下", sayTo: "直接跟这条线程说", sendTo: "发给线程", files: "文件", session: "会话",
    saveFile: "下载文件", saving: "正在下载…",
    who: { mine: "你", given: "住户", result: "交回", thread: "线程" }, thought: "想法", plan: "计划", input: "输入", output: "结果",
    toolKind: { read: "读", edit: "改", delete: "删", move: "移动", search: "搜", execute: "运行", think: "想", fetch: "取网页", other: "工具" },
    toolsN: "次工具调用", filesN: "个文件改动", commandsN: "条命令", permitYes: "允许", permitNo: "拒绝",
    decided: { allowed_you: "你允许了", denied_you: "你拒绝了", allowed_tier: "已允许", denied_tier: "权限挡下了" },
    noAlarms: "没定闹钟", alarmsOff: "闹钟关着", once: "一次", repeats: "重复", moveAlarm: "改时间", dropAlarm: "删掉闹钟",
    save: "保存", saved: "存好了", cancel: "取消", create: "建好", dayToday: "今天", dayTomorrow: "明天", sureDelete: "再按一次就删",
    alarmsInfo: "住户自己定的闹钟，响的时候由它决定说什么。",
    workspace: "工作文件夹", openFolder: "打开文件夹", localSessions: "这台机器上的会话", noSessions: "这里还没跑过活", log: "执行端日志",
    since: "自", queued: "排队", unsent: "未送出", runningNow: "正在做", idle: "空闲", seen: "住户看得到", unseen: "住户看不到", lastSeen: "上次见到",
    tier: { read: "只读", edit: "可改", full: "完整" }, stopRunner: "停下", notWired: "这台机器的详情还没接上。",
    machineInfo: "执行端在这台机器上替住户干活：通过帮手，在工作文件夹里。权限是它不问你就能做到的上限。",
    addResident: "新住户", residentId: "代号：a–z、0–9 和 -", newGroup: "新群聊", groupSettings: "群设置", rounds: "轮数", whoAnswers: "谁来回",
    reply: { all: "大家都回", one: "一个人回", none: "点名才回" }, order: { list: "按列表顺序", random: "随机顺序" },
    stopGroup: "叫大家停下", removeGroup: "删掉这个群", removeResident: "删掉这个住户",
    sections: { resident: "住户", model: "模型接入", memory: "记忆", time: "时间", channels: "聊天渠道", web: "网页与工具", voice: "语音与表情", work: "后台帮忙", usage: "用量", app: "应用" },
    name: "名字", model: "住户模型", persona: "人设", setFace: "换头像", dropFace: "撤下头像",
    letter: "交接信", letterInfo: "更早的聊天会收进一封交接信，住户靠它记得窗口以外的事。",
    letterState: { written: "已写好", none: "还没有" }, onItsWay: "在路上", failedToSend: "没发出", blocked: "卡住", retryLetter: "再发一次",
    filter: "筛选设置", noMatch: "没有匹配的", secretSaved: "存在住户那里", fieldsInfo: "住户网页门后的设置。留空就是默认值。",
    mcp: "MCP 工具", noMcp: "没接", addMcp: "接一个", mcpName: "名字", mcpKey: "钥匙（要的话）", tools: "个工具",
    signIn: "去登录", retryIt: "重试", drop: "删掉", mcpInfo: "住户能调用的工具服务器。要登录的会等你。",
    mcpState: { ready: "已接", authenticating: "待登录", off: "没接上" }, sites: "网站钥匙", addSite: "加一把网站钥匙", siteHost: "网站，比如 example.com", siteKey: "钥匙",
    sitesInfo: "住户读这些网站时带上的钥匙。", telegram: "Telegram", telegramConnect: "连上机器人",
    packs: "表情包", importPack: "用链接导入", packLink: "t.me/addstickers/… 或 .zip 地址", stickerWhen: "什么时候发",
    githubSetup: "设置 GitHub Actions", testTask: "派一单试试", roles: "角色", addRole: "加一个角色", roleName: "角色", roleTemplate: "说明", roleModel: "模型",
    span: { today: "今天", week: "7 天", month: "30 天" }, tokens: "token", cache: "来自缓存", cost: "花费", unpriced: "未计价", noUsage: "还没有用量", recent: "最近的调用",
    usageInfo: "住户读写的 token。缓存是提示里不用全价付的那部分。",
    runnerTitle: "本机帮手", machineName: "这台电脑的名字", start: "启动", pair: "重新配对", disconnect: "断开", language: "语言",
    runner: { unpaired: "未配对", stopped: "已停止", starting: "启动中", running: "运行中", crashed: "出错", locked: "在别处", revoked: "已撤销" },
  },
};

export const LANGS = [{ id: "en", name: "English" }, { id: "zh", name: "中文" }];
const KEY = "aelios-desktop.lang";
let chosen = null;

/** The language the reader picked; English when nothing (or nothing known) was picked. */
export function langNow() {
  if (chosen === null) {
    try { chosen = globalThis.localStorage?.getItem(KEY) || ""; } catch { chosen = ""; }
  }
  return WORDS[chosen] ? chosen : "en";
}

export function setLang(id) {
  chosen = WORDS[id] ? id : "en";
  try { globalThis.localStorage?.setItem(KEY, chosen); } catch { /* kept for this visit only */ }
}

export const words = (lang = langNow()) => WORDS[lang] || WORDS.en;
