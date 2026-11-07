// The words the shell draws, in two languages. The resident's own words come from the resident.
const WORDS = {
  en: {
    title: "Resident", connect: "Connect", address: "Resident address", key: "Web key", folder: "Folder for the helper",
    helper: "Helper", access: "Permission", fullOk: "I understand full permission lets the helper change anything on this machine",
    connecting: "Connecting…", residents: "Residents", send: "Send", write: "Write to the resident", start: "Start runner",
    disconnect: "Disconnect", empty: "Nothing yet. Say hello.", sending: "Sending…",
    runner: { unpaired: "runner not paired", stopped: "runner stopped", starting: "runner starting", running: "runner running", crashed: "runner stopped with an error", locked: "runner already running elsewhere", revoked: "pairing was revoked" },
  },
  zh: {
    title: "住户", connect: "连接", address: "住户地址", key: "网页钥匙", folder: "帮手工作的文件夹",
    helper: "帮手", access: "权限", fullOk: "我知道完整权限会让帮手改动这台机器上的任何东西",
    connecting: "正在连接…", residents: "住户", send: "发送", write: "对住户说点什么", start: "启动 runner",
    disconnect: "断开", empty: "还没有消息，先打个招呼吧。", sending: "正在发送…",
    runner: { unpaired: "runner 未配对", stopped: "runner 已停止", starting: "runner 正在启动", running: "runner 运行中", crashed: "runner 出错停止", locked: "runner 已在别处运行", revoked: "配对已被撤销" },
  },
};

export const words = () => (typeof navigator !== "undefined" && /^zh/i.test(navigator.language) ? WORDS.zh : WORDS.en);
