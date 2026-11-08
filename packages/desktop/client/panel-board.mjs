// The board: the work the resident handed to a cloud thread, and where it runs. /web/tasks answers the cards, the
// mode and the day's count; the words come from client/board.mjs.
import { createElement as h, useEffect, useState } from "react";
import { web } from "./api.mjs";
import { runsText, splitTasks, stateWord } from "./board.mjs";
import { store, useStore } from "./store.mjs";
import { words } from "./strings.mjs";

const POLL_MS = 15000;
const PILL = { working: "warn", sent: "warn", needs_you: "hot", done: "ok", failed: "bad", quiet: "bad" };

export function BoardPanel() {
  const t = words();
  const { status } = useStore(store);
  const resident = status?.resident || "default";
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try { setData(await web("/web/tasks", { resident })); setError(""); } catch (e) { setError(e.message); }
    };
    void load();
    const timer = setInterval(() => { if (!document.hidden) void load(); }, POLL_MS);
    return () => clearInterval(timer);
  }, [resident]);

  const card = (task) => h("div", { key: task.id, className: `ad-trow${task.status === "needs_you" ? " ask" : task.status === "middle" ? "" : ""}` },
    h("span", { className: "top-line" }, h("span", { className: "t" }, task.title || t.thread),
      h("span", { className: `ad-pill ${PILL[task.status] || ""}` }, stateWord(task.status))),
    task.summary && h("span", { className: "sub" }, h("span", null, task.summary)),
    h("span", { className: "sub" }, h("span", null, runsText(task.runs)), h("span", null, task.updatedAt ? new Date(task.updatedAt).toLocaleString([], { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "")),
    task.sessionUrl && h("span", { className: "ad-links" }, h("a", { className: "ad-btn quiet small", href: task.sessionUrl, target: "_blank", rel: "noopener noreferrer" }, t.open)));

  const { working, done } = splitTasks(data?.tasks);
  return h("div", { className: "ad-panel" },
    error && h("div", { className: "ad-error", role: "alert" }, error),
    data && !data.configured && h("p", { className: "ad-hint" }, t.tasksOff),
    data?.configured && h("p", { className: "ad-hint" }, `${runsText(data.mode)} · ${data.today ?? 0}/${data.limit ?? 0} ${t.today}`),
    working.map(card),
    done.length > 0 && h("p", { className: "ad-group" }, t.done),
    done.map(card),
    data && (data.tasks || []).length === 0 && h("div", { className: "ad-slot" }, t.noTasks));
}
