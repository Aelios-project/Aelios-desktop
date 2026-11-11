// This machine, in the middle column: what only a local app can show. The runner's live state (since when, its
// helper, its permission tier, start, stop, pair again), the workspace folder (opened in the system's file manager),
// whether the resident sees this machine, what is running and queued, every thread's session that ran here (a press
// opens it in the right panel) and the runner's log. The runner's state comes from the connection status; the rest
// from local-api.mjs, which says so when the host half does not answer it yet.
import { createElement as h, useState } from "react";
import { call } from "./api.mjs";
import { ChatHead } from "./chat-head.mjs";
import { Icon } from "./icons.mjs";
import { Explained } from "./info.mjs";
import { loadLocal, openInFiles } from "./local-api.mjs";
import { usePoll } from "./poll.mjs";
import { store, useStore } from "./store.mjs";
import { words } from "./strings.mjs";
import { HELPER_ICON } from "./thread-model.mjs";
import { loadThreads, when } from "./threads-api.mjs";
import { runnerDown, runnerTone, taskTone } from "./tones.mjs";

const ago = (at) => { const s = Math.max(0, Math.round((Date.now() - Number(at)) / 1000)); return s < 60 ? `${s}s` : s < 3600 ? `${Math.round(s / 60)}m` : `${Math.round(s / 3600)}h`; };

function Live({ runner, info, t, act, pick, switching, asking, setAsking, setAccess }) {
  const tone = runnerTone(runner.state);
  const helper = info?.plugin || "";
  return h("div", { className: "ad-mv-card live" },
    h(Explained, { className: "ad-mv-title", text: t.machineInfo, head: h("span", { className: "ad-label" }, t.runnerTitle) }),
    h("div", { className: "ad-mv-state" },
      h("span", { className: `ad-dot big ${tone}${runner.state === "starting" || runner.state === "running" ? " live" : ""}`, "aria-hidden": true }),
      h("b", null, t.runner[runner.state] || runner.state),
      info?.name && h("span", { className: "ad-mi", title: t.machineName }, info.name),
      runner.since && h("span", { className: "ad-mi" }, `${t.since} ${new Date(runner.since).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`),
      runner.pid && h("span", { className: "ad-mi", title: "PID" }, `#${runner.pid}`)),
    runner.error && h("p", { className: "ad-error" }, runner.error),
    h("div", { className: "ad-card-row" },
      helper && h("span", { className: "ad-seg", role: "group", "aria-label": t.helper, title: t.helper }, ["dsh", "kiro"].map((id) =>
        h("button", { key: id, type: "button", "aria-pressed": helper === id, disabled: switching, onClick: () => helper !== id && pick(id) },
          h(Icon, { name: HELPER_ICON[id] }), t.helpers[id]))),
      info?.access && h("button", { type: "button", className: `ad-pill ${info.access === "full" ? "bad" : "warn"}`, title: t.switchAccess, disabled: switching,
        onClick: () => (info.access === "full" ? setAccess("edit") : setAsking(!asking)) }, h(Icon, { name: "shield" }), t.tier[info.access] || info.access),
      h("span", { className: "sp" }),
      runnerDown(runner.state) || runner.state === "unpaired"
        ? h("button", { type: "button", className: "ad-btn small", onClick: act("start") }, h(Icon, { name: "play" }), t.start)
        : h("button", { type: "button", className: "ad-btn quiet small", onClick: act("stop") }, h(Icon, { name: "stop" }), t.stopRunner),
      h("button", { type: "button", className: "ad-btn quiet small", onClick: act("repair") }, h(Icon, { name: "refresh" }), t.pair)),
    asking && h("div", { className: "ad-card-row", role: "group", "aria-label": t.switchAccess },
      h("span", { className: "ad-hint" }, t.fullOk),
      h("span", { className: "sp" }),
      h("button", { type: "button", className: "ad-btn small", disabled: switching, onClick: () => setAccess("full") }, t.useFull),
      h("button", { type: "button", className: "ad-btn quiet small", onClick: () => setAsking(false) }, t.keepEdit)));
}

function Sessions({ sessions, titles, t }) {
  const open = (thread) => store.set({ focus: thread, right: { ...store.get().right, open: true, panel: "threads" } });
  if (!sessions.length) return h("p", { className: "ad-hint" }, t.noSessions);
  return h("div", { className: "ad-mv-list" }, sessions.map((s) => {
    const tone = taskTone(s.status);
    return h("button", { key: s.thread, type: "button", className: "ad-mv-row", title: t.open, onClick: () => open(s.thread) },
      h("span", { className: "ad-helper", title: t.helpers[s.plugin] || s.plugin }, h(Icon, { name: HELPER_ICON[s.plugin] || "plug" })),
      h("span", { className: "n" }, titles[s.thread] || s.thread),
      s.pending > 0 && h("span", { className: "ad-mi hot", title: t.allow }, h(Icon, { name: "shield" }), s.pending),
      h("span", { className: "ad-mi", title: `${s.tools} ${t.toolsN}` }, h(Icon, { name: "wrench" }), s.tools),
      h("span", { className: "ad-mi", title: `${s.files} ${t.filesN}` }, h(Icon, { name: "file" }), s.files),
      h("span", { className: "ad-mi", title: `${s.commands} ${t.commandsN}` }, h(Icon, { name: "terminal" }), s.commands),
      h("span", { className: `ad-pill ${tone}` }, h("span", { className: `ad-dot ${tone}${s.status === "working" ? " live" : ""}`, "aria-hidden": true }), t.task[s.status] || s.status),
      h("span", { className: "ad-card-time" }, when(s.at)));
  }));
}

export function MachineView() {
  const t = words();
  const { status, local } = useStore(store);
  const resident = status?.resident || "default";
  const [titles, setTitles] = useState({});
  const [showLog, setShowLog] = useState(true);
  const [error, setError] = useState("");
  usePoll(loadLocal, 2000, []);
  usePoll(async () => { try { setTitles(Object.fromEntries(((await loadThreads(resident))?.threads || []).map((x) => [x.id, x.title]))); } catch { /* titles stay ids */ } }, 15000, [resident]);

  const [switching, setSwitching] = useState(false);
  const pick = async (helper) => {
    setSwitching(true);
    try { store.set({ status: await call("helper", { helper }) }); setError(""); await loadLocal(); } catch (e) { setError(e.message); } finally { setSwitching(false); }
  };
  const [asking, setAsking] = useState(false);
  // Going to full is confirmed first (the host refuses it without confirmFull); going back to edit is one press.
  const setAccess = async (access) => {
    setSwitching(true); setAsking(false);
    try { store.set({ status: await call("access", { access, confirmFull: access === "full" }) }); setError(""); await loadLocal(); } catch (e) { setError(e.message); } finally { setSwitching(false); }
  };
  const act = (action) => async () => { try { store.set({ status: await call(action) }); setError(""); } catch (e) { setError(e.message); } };
  const runner = { ...(status?.runner || { state: "unpaired" }), ...(local.machine?.runner || {}) };
  const info = local.machine?.info || null;
  const cloud = local.machine?.cloud || null;
  const tone = runnerTone(runner.state);
  const face = h("span", { className: "ad-avatar", "aria-hidden": true }, h(Icon, { name: "laptop" }));
  const meta = h("span", { className: "ad-meta-chip" }, h("span", { className: `ad-dot ${tone}`, "aria-hidden": true }), t.runner[runner.state] || runner.state);

  return h("section", { className: "ad-main", "aria-label": t.thisMachine },
    h(ChatHead, { face, name: t.thisMachine, meta }),
    h("div", { className: "ad-mv" },
      error && h("div", { className: "ad-error", role: "alert" }, error),
      local.wired === false && h("p", { className: "ad-info-text ad-mv-wide" }, t.notWired),
      h(Live, { runner, info, t, act, pick, switching, asking, setAsking, setAccess }),
      h("div", { className: "ad-mv-card" },
        h("span", { className: "ad-label" }, t.workspace),
        h("div", { className: "ad-mv-folder" }, h(Icon, { name: "folder" }), h("code", { title: info?.workspace || "" }, info?.workspace || "—")),
        h("div", { className: "ad-card-row" },
          h("button", { type: "button", className: "ad-btn quiet small", disabled: !info?.workspace, onClick: () => openInFiles().catch((e) => setError(e.message)) }, h(Icon, { name: "open" }), t.openFolder),
          h("span", { className: "sp" }),
          cloud && h("span", { className: "ad-mi", title: cloud.lastSeenAt ? `${t.lastSeen} ${ago(cloud.lastSeenAt)}` : "" },
            h("span", { className: `ad-dot ${cloud.online ? "ok" : "idle"}`, "aria-hidden": true }), cloud.online ? t.seen : t.unseen))),
      h("div", { className: "ad-mv-card" },
        h("div", { className: "ad-mv-tiles" },
          h("div", null, h("small", null, t.runningNow), h("b", { title: info?.running?.thread || "" }, info?.running ? titles[info.running.thread] || info.running.thread : t.idle)),
          h("div", null, h("small", null, t.queued), h("b", null, info ? info.queued : "—")),
          h("div", null, h("small", null, t.unsent), h("b", null, info ? info.unsent : "—")))),
      h("div", { className: "ad-mv-card ad-mv-wide" },
        h("span", { className: "ad-label" }, t.localSessions, local.sessions.length > 0 && h("span", { className: "ad-badge" }, local.sessions.length)),
        h(Sessions, { sessions: local.sessions, titles, t })),
      (runner.log || []).length > 0 && h("div", { className: "ad-mv-card ad-mv-wide" },
        h("button", { type: "button", className: "ad-fold ad-label", "aria-expanded": showLog, onClick: () => setShowLog((v) => !v) }, h(Icon, { name: "down" }), t.log),
        showLog && h("pre", { className: "ad-mv-log", "aria-live": "polite" }, runner.log.map((line) => line.text).join("\n")))));
}
