// Tool call steps keyed by `toolCallId` (acpx engine): a later update of the same call changes its step in place instead of
// adding one. The status and the full command stay on this machine (the wire step is only `kind` and `title`); the full
// command is kept for an expand view, which has no protocol field yet.
import { describeInput } from "./detail.mjs";
import { middle } from "./ellipsis.mjs";
import { TITLE_MAX } from "./steps.mjs";

const commandOf = raw => (typeof raw === "string" ? raw : raw && typeof raw === "object" ? raw.command ?? raw.cmd : undefined);

export class KeyedSteps {
  /** @param {import("./steps.mjs").StepLog} log */
  constructor(log) { this.log = log; this.byId = new Map(); this.local = new WeakMap(); }

  /** What this machine keeps about one call: `{status, command}`, or undefined. */
  of(toolCallId) { const step = this.byId.get(toolCallId); return step && this.local.get(step); }

  /** Takes a `tool_call` or `tool_call_update` event; returns the steps as they stand now, or null when the list did not change. */
  take(event) {
    const id = typeof event.toolCallId === "string" ? event.toolCallId : null;
    const step = id ? this.byId.get(id) : undefined;
    if (!step) return this.#add(id, event);
    const local = this.local.get(step);
    if (event.status) local.status = String(event.status);
    const command = this.#command(event);
    if (command) local.command = command;
    if (!this.log.steps.includes(step) || step.kind === "edit" || !(event.title || event.rawInput)) return null; // edits are grouped; keep the group title
    const title = this.#short(this.log.titleOf(step.kind, { ...local.event, ...event }));
    local.event = { ...local.event, ...event };
    if (!title || title === step.title) return null;
    step.title = title;
    return this.log.steps.map(each => ({ ...each }));
  }

  #add(id, event) {
    const steps = this.log.add(event);
    const step = this.log.steps.at(-1);
    if (id && step) {
      this.byId.set(id, step);
      if (!this.local.has(step)) this.local.set(step, { status: String(event.status ?? "pending"), command: this.#command(event), event: { ...event } });
    }
    return steps;
  }

  #command(event) {
    if (event.kind !== "execute" && this.byId.get(event.toolCallId)?.kind !== "run") return "";
    const command = commandOf(event.rawInput);
    return command === undefined ? "" : this.log.redact(describeInput(command, Infinity));
  }

  #short(title) { return middle(this.log.redact(title).replace(/\s+/g, " ").trim(), TITLE_MAX); }
}
