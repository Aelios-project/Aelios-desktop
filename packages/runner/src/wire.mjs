// What the resident takes beyond the first version of aelios-runner/1, as its last heartbeat answer said (PROTOCOL.md,
// "accepts" and "limits"). A newer field or reason is sent only when its name is listed: an older resident answers 400,
// and the runner drops a receipt it can never get accepted. No list (an old resident) means the first version.
import { SUMMARY_MAX } from "./report.mjs";

/** The reasons that came later, each with the name that must be listed before it is sent. */
const LATER_REASONS = { refused: "reason.refused", token_limit: "reason.token_limit", no_result: "reason.no_result" };

export class Wire {
  constructor() { this.accepts = new Set(); this.summaryMax = SUMMARY_MAX; }

  /** Keep what a heartbeat answer says. A failed heartbeat never gets here, so the last answer stays. */
  learn(answer) {
    this.accepts = new Set(Array.isArray(answer?.accepts) ? answer.accepts.filter(name => typeof name === "string") : []);
    const max = answer?.limits?.summary;
    this.summaryMax = Number.isInteger(max) && max >= 200 ? max : SUMMARY_MAX; // shortcut: a nonsense limit is ignored, not clamped; upgrade if a resident ever sends one
  }

  has(name) { return this.accepts.has(name); }

  /** The heartbeat body's `engine`, only when the resident takes it. */
  beat(body, engine) { return this.has("heartbeat.engine") ? { ...body, engine } : body; }

  /** A `queued` receipt's `extra`: how many turns go first, only when the resident takes it. */
  queued(ahead) { return this.has("receipt.ahead") && Number.isInteger(ahead) && ahead >= 1 ? { ahead: Math.min(ahead, 99) } : {}; }

  /**
   * An outcome that names a `kind` (refused, token_limit, no_result) becomes a `failed` final with that reason when the
   * resident takes it; otherwise it stays what outcome.mjs made it (a question to the owner), and nothing new is sent.
   */
  verdict(outcome) {
    const { kind, ask, ...rest } = outcome;
    return kind && this.has(LATER_REASONS[kind]) ? { ...rest, status: "failed", reason: kind } : outcome;
  }
}
