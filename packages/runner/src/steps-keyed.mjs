// Tool call steps keyed by `toolCallId` (acpx engine): a later update of the same call changes its step in place instead of
// adding one. Every id has its own record and, apart from edits in a row (one grouped step), its own step. The status and
// the full command stay on this machine (the wire step is only `kind` and `title`); the full command is kept for an expand
// view, which has no protocol field yet.
import { describeInput } from "./detail.mjs";
import { middle } from "./ellipsis.mjs";
import { TITLE_MAX } from "./steps.mjs";

const commandOf = raw => (typeof raw === "string" ? raw : raw && typeof raw === "object" ? raw.command ?? raw.cmd : undefined);

export class KeyedSteps {
  /** @param {import("./steps.mjs").StepLog} log */
  constructor(log) { this.log = log; this.byId = new Map(); }

  /** What this machine keeps about one call: `{status, command}`, or undefined. */
  of(toolCallId) { const record = this.byId.get(toolCallId); return record && { status: record.status, command: record.command }; }

  /** Takes a `tool_call` or `tool_call_update` event; returns the steps as they stand now, or null when the list did not change. */
  take(event) {
    const id = typeof event.toolCallId === "string" ? event.toolCallId : null;
    const record = id ? this.byId.get(id) : undefined;
    if (!record) return this.#add(id, event);
    if (event.status) record.status = String(event.status);
    record.event = { ...record.event, ...event };
    const command = this.#command(record.event);
    if (command) record.command = command;
    const { step } = record;
    if (!step || !this.log.steps.includes(step) || step.kind === "edit" || !(event.title || event.rawInput)) return null; // edits are grouped; keep the group title
    const title = this.#short(this.log.titleOf(step.kind, record.event));
    if (!title || title === step.title) return null;
    step.title = title;
    return this.log.steps.map(each => ({ ...each }));
  }

  #add(id, event) {
    // A new id is a new step even when its title equals the last one (the same command run again); edits still group.
    const steps = this.log.add(event, { distinct: Boolean(id) });
    if (id) this.byId.set(id, { step: steps ? this.log.steps.at(-1) : null, status: String(event.status ?? "pending"), command: this.#command(event), event: { ...event } });
    return steps;
  }

  #command(event) {
    if (event.kind !== "execute") return "";
    const command = commandOf(event.rawInput);
    return command === undefined ? "" : this.log.redact(describeInput(command, Infinity));
  }

  #short(title) { return middle(this.log.redact(title).replace(/\s+/g, " ").trim(), TITLE_MAX); }
}
