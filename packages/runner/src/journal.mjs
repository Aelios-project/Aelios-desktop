// A small local journal beside the state file: what was asked on each thread, how each turn ended, and the permission
// requests that wait for the owner. The runner writes it; `overview` and `permit` read and answer it. It holds no
// secret and no helper output, only short texts that the owner can already see in the resident
// (a permission request also keeps the shortened, redacted command it asks to run).
// shortcut: one JSON line per event, trimmed to the last KEEP lines when it grows past MAX_BYTES; move to a
// database if the owner ever needs a longer history here.
import { appendFileSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

const KEEP = 2000;
const MAX_BYTES = 1_000_000;
const clip = (text, size) => String(text ?? "").replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "").slice(0, size);

export class Journal {
  constructor(file, { holdMs = 10 * 60_000, pollMs = 1000 } = {}) { Object.assign(this, { file, holdMs, pollMs }); }

  add(entry) {
    try {
      if (statSync(this.file).size > MAX_BYTES) writeFileSync(this.file, this.lines().slice(-KEEP).map(line => JSON.stringify(line) + "\n").join(""), { mode: 0o600 });
    } catch { /* no file yet */ }
    appendFileSync(this.file, JSON.stringify({ at: Date.now(), ...entry }) + "\n", { mode: 0o600 });
  }

  lines() {
    let text = "";
    try { text = readFileSync(this.file, "utf8"); } catch { return []; }
    return text.split("\n").flatMap(line => { try { return line ? [JSON.parse(line)] : []; } catch { return []; } });
  }

  turn(work) { this.add({ t: "turn", thread: work.thread, workId: work.workId, kind: work.kind, text: clip(work.text, 2000) }); }
  end(work, status, summary) { this.add({ t: "end", thread: work.thread, workId: work.workId, status, summary: clip(summary, 1000) }); }

  /** The owner's answer to a held request. Returns false when no such request is waiting. */
  decide(id, allow, by = "you") {
    const view = this.lines();
    if (!view.some(line => line.t === "perm" && line.id === id) || view.some(line => line.t === "decision" && line.id === id)) return false;
    this.add({ t: "decision", id, allow: Boolean(allow), by });
    return true;
  }

  /** A request allowed without asking because it only looks at things: shown to the owner, decided by "auto". */
  auto(thread, info) {
    const id = this.#request(thread, info);
    this.add({ t: "decision", id, allow: true, by: "auto" });
  }

  #request(thread, info) {
    const id = "p_" + randomBytes(5).toString("hex");
    this.add({ t: "perm", id, thread, title: clip(info.title, 120), kind: clip(info.kind, 20), paths: info.paths.map(path => clip(path, 300)).slice(0, 5), ...(info.detail ? { detail: clip(info.detail, 400) } : {}) });
    return id;
  }

  /**
   * Writes the request down and waits for the owner. No answer in time, or a stopped turn, is a "no".
   * `on.held(id)` runs once the request is written, and `on.closed(id)` once it is settled, however it was.
   */
  async hold(thread, info, stopped = () => false, on = {}) {
    const id = this.#request(thread, info);
    on.held?.(id);
    try {
      const end = Date.now() + this.holdMs;
      for (;;) {
        const answer = this.lines().find(line => line.t === "decision" && line.id === id);
        if (answer) return answer.allow;
        if (stopped() || Date.now() >= end) { this.add({ t: "decision", id, allow: false, by: stopped() ? "stopped" : "timeout" }); return false; }
        await new Promise(resolve => setTimeout(resolve, this.pollMs));
      }
    } finally { on.closed?.(id); }
  }

  /** Turns per thread (newest last) with how each ended, and every request with its answer. */
  fold() {
    const turns = {}, perms = new Map();
    for (const line of this.lines()) {
      if (line.t === "turn") (turns[line.thread] ??= []).push({ workId: line.workId, kind: line.kind, at: line.at, text: line.text, end: null });
      else if (line.t === "end") { const turn = (turns[line.thread] ?? []).findLast(item => item.workId === line.workId); if (turn) turn.end = { status: line.status, summary: line.summary, at: line.at }; }
      else if (line.t === "perm") perms.set(line.id, { id: line.id, thread: line.thread, at: line.at, title: line.title, kind: line.kind, paths: line.paths, detail: line.detail ?? "", decided: null, by: "" });
      else if (line.t === "decision" && perms.has(line.id)) Object.assign(perms.get(line.id), { decided: line.allow ? "allowed" : "denied", by: line.by });
    }
    for (const list of Object.values(turns)) list.splice(0, Math.max(0, list.length - 30));
    return { turns, perms: [...perms.values()].slice(-100) };
  }
}
