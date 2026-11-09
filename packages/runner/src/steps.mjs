// Short progress lines for a working thread: one per tool call the helper starts, as a kind and a title ("read src/a.js",
// "ran npm test", "edited 2 files"). They go to the resident (PROTOCOL.md, `progress`) so the person can see the thread
// work without this machine's screen. Never file contents or command output: only what the helper says it is about to do,
// on one line, with secrets hidden (detail.mjs) and the workspace folder replaced. The last STEPS_KEPT are kept.
import path from "node:path";
import { describeInput } from "./detail.mjs";
import { middle } from "./ellipsis.mjs";

export const STEPS_KEPT = 10;
export const TITLE_MAX = 200;
const KIND = { read: "read", edit: "edit", delete: "edit", move: "edit", execute: "run", search: "search", fetch: "fetch", think: "think" };

export class StepLog {
  /** @param {{cwd: string, redact: (text: string) => string}} o */
  constructor({ cwd, redact }) { Object.assign(this, { cwd, redact }); this.steps = []; this.edited = new Set(); }

  #place(file) {
    if (typeof file !== "string" || !path.isAbsolute(file)) return "";
    const rel = path.relative(this.cwd, file);
    return rel && !rel.startsWith("..") && !path.isAbsolute(rel) ? rel : path.basename(file);
  }

  /** The title for a call of this kind (also used to re-title a call when an update brings a new title or input). */
  titleOf(kind, update) {
    const file = this.#place((Array.isArray(update.locations) ? update.locations : [])[0]?.path);
    // Only a command's own words are taken from rawInput: any other input can hold file contents, which never leave this machine.
    const raw = update.rawInput;
    const command = typeof raw === "string" ? raw : raw && typeof raw === "object" ? raw.command ?? raw.cmd : "";
    const said = (kind === "run" && describeInput(Array.isArray(command) ? command.join(" ") : typeof command === "string" ? command : "")) || describeInput(update.title);
    if (kind === "read") return `read ${file || said || "a file"}`;
    if (kind === "run") return `ran ${said || "a command"}`;
    if (kind === "search") return `searched ${said || "the project"}`;
    if (kind === "fetch") return `fetched ${said || "a page"}`;
    if (kind === "think") return "thinking";
    return said || "working";
  }

  /**
   * Takes one ACP `tool_call` update; returns the steps as they stand now (a new array), or null when nothing changed.
   * `distinct`: the update is a call of its own (keyed by id), so a title equal to the last one is still a new step.
   */
  add(update, { distinct = false } = {}) {
    const kind = KIND[update?.kind] ?? "other";
    const last = this.steps.at(-1);
    let title;
    if (kind === "edit") {
      // Edits in a row are one step: "edited a.js", then "edited 2 files".
      const file = this.#place((Array.isArray(update.locations) ? update.locations : [])[0]?.path);
      if (last?.kind !== "edit") this.edited = new Set();
      if (file) this.edited.add(file);
      title = this.edited.size > 1 ? `edited ${this.edited.size} files` : `edited ${file || "a file"}`;
      if (last?.kind === "edit") { if (last.title === title) return null; this.steps.pop(); }
    } else {
      title = this.titleOf(kind, update);
      if (!distinct && last?.kind === kind && last.title === title) return null;
    }
    title = this.redact(title).replace(/\s+/g, " ").trim();
    if (!title) return null;
    this.steps.push({ kind, title: middle(title, TITLE_MAX) });
    if (this.steps.length > STEPS_KEPT) this.steps.splice(0, this.steps.length - STEPS_KEPT);
    return this.steps.map(step => ({ ...step }));
  }
}

/** Sends the latest steps now and then, never more often than every `ms`; a lost one is replaced by the next, nothing is queued or replayed. */
export class Progress {
  constructor({ send, ms = 3000 }) { Object.assign(this, { send, ms }); this.last = 0; this.timer = null; this.latest = null; this.closed = false; }

  push(steps) {
    this.latest = steps;
    if (this.timer || this.closed) return;
    this.timer = setTimeout(() => this.#flush(), Math.max(0, this.last + this.ms - Date.now()));
    this.timer.unref?.();
  }

  async #flush() {
    this.timer = null;
    const steps = this.latest;
    this.latest = null;
    if (this.closed || !steps) return;
    this.last = Date.now();
    try { await this.send(steps); } catch { /* the next step sends the list again */ }
  }

  /** The turn is over: nothing more is sent (the final receipt says how it ended). */
  close() { this.closed = true; clearTimeout(this.timer); this.timer = null; }
}
