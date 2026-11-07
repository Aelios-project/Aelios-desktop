// The words the shell draws, in two languages. The resident's own words come from the resident.
const WORDS = {
  en: {
    title: "Resident", connect: "Connect", address: "Resident address", key: "Web key", folder: "Folder for the helper",
    helper: "Helper", access: "Permission", fullOk: "I understand full permission lets the helper change anything on this machine",
    connecting: "Connecting…", residents: "Residents", send: "Send", write: "Write to the resident", start: "Start runner",
    disconnect: "Disconnect", empty: "Nothing yet. Say hello.", sending: "Sending…",
    panels: { threads: "Threads", waiting: "Waiting", board: "Board", tools: "Tools" }, soon: "Left open for the next slice", openNow: "At work", backToDsh: "Back to DSH", showRail: "Residents", usage: "Usage", attach: "Send pictures", remove: "Remove", tooBig: "That picture could not be read", upTo: "Four pictures at a time", ran: "done", recent: "Recent", nothingWaiting: "Nothing is waiting for you.", collapse: "Collapse the side panel", expand: "Open the side panel",
    back: "Back", open: "Open thread", markRead: "Mark read", stop: "Stop it", sayTo: "Talk to it directly, not through the resident", sendTo: "Send to it",
    noThreads: "No threads yet. Ask the resident to look something up and the work will show here.", done: "Finished", threadsOff: "Background help is off.", expired: "expired", mine: "You said", given: "The resident said", result: "Handed back", thread: "Thread", files: "Files",
    task: { sent: "Sent out", working: "Working", done: "Done", failed: "Failed", needs_you: "Needs you", quiet: "No reply", stopped: "Stopped", chosen: "Chosen", settled: "Dealt with" },
    kind: { ask: "Waiting for you", note: "Progress", done: "Done", stuck: "Stuck" },
    runs: { local: "Runs at the resident", linux: "Runs on GitHub Actions", machine: "Runs on a machine", retired: "Old route, retired" }, tasksN: "tasks",
    runner: { unpaired: "runner not paired", stopped: "runner stopped", starting: "runner starting", running: "runner running", crashed: "runner stopped with an error", locked: "runner already running elsewhere", revoked: "pairing was revoked" },
  },
  zh: {
    title: "住户", connect: "连接", address: "住户地址", key: "网页钥匙", folder: "帮手工作的文件夹",
    helper: "帮手", access: "权限", fullOk: "我知道完整权限会让帮手改动这台机器上的任何东西",
    connecting: "正在连接…", residents: "住户", send: "发送", write: "对住户说点什么", start: "启动 runner",
    disconnect: "断开", empty: "还没有消息，先打个招呼吧。", sending: "正在发送…",
    panels: { threads: "线程", waiting: "等你", board: "看板", tools: "小工具" }, soon: "先留个位置", openNow: "在做", backToDsh: "回到 DSH", showRail: "住户", usage: "用量", attach: "发图", remove: "拿掉", tooBig: "这张图读不了", upTo: "一次最多四张", ran: "完成", recent: "最近", nothingWaiting: "没有在等你的事。", collapse: "收起右栏", expand: "打开右栏",
    back: "返回", open: "打开线程", markRead: "已读", stop: "叫它停下", sayTo: "直接跟它说，不经过住户", sendTo: "发给它",
    noThreads: "还没有线程。在聊天里让它去查点什么、写点什么，它交出去的活会出现在这里。", done: "做完的", threadsOff: "后台帮忙关着。", expired: "过期了", mine: "你说的", given: "住户交代的", result: "交回来的", thread: "线程", files: "它做的文件",
    task: { sent: "派出去了", working: "在干活", done: "做完了", failed: "没做成", needs_you: "等你拍板", quiet: "没回音", stopped: "已停下", chosen: "拍板了", settled: "处理过了" },
    kind: { ask: "等你", note: "进展", done: "做完了", stuck: "卡住了" },
    runs: { local: "在住户这里干", linux: "在 GitHub Actions 上干", machine: "在机器上干", retired: "旧线路，已停用" }, tasksN: "单",
    runner: { unpaired: "runner 未配对", stopped: "runner 已停止", starting: "runner 正在启动", running: "runner 运行中", crashed: "runner 出错停止", locked: "runner 已在别处运行", revoked: "配对已被撤销" },
  },
};

export const words = () => (typeof navigator !== "undefined" && /^zh/i.test(navigator.language) ? WORDS.zh : WORDS.en);
