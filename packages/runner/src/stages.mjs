// Time limits per stage of an acpx turn (config `timeouts`). Each stage has its own timer; the first one that fires names
// itself, and the turn stops with that name instead of a generic failure. 0 turns a limit off.
// Inactivity (no update from the helper) is off by default: a long silent build or test run is not a hang. When it is on,
// it is paused while a tool call is in progress or a permission request waits for the owner.

export const STAGE_DEFAULTS = { spawn: 15_000, initialize: 60_000, session: 90_000, firstUpdate: 120_000, inactivity: 0, cancel: 10_000, turn: 30 * 60_000 };
/** The stages before the prompt is written: a limit there means nothing was sent to the helper. */
export const OPENING = new Set(["spawn", "initialize", "session"]);
const LABEL = { spawn: "starting the helper process", initialize: "initialize", session: "opening the session", firstUpdate: "the first update after the prompt", inactivity: "the next update (inactivity)", cancel: "cancel", turn: "the whole turn" };
const DONE = new Set(["completed", "failed", "cancelled"]);

/** Throws when config `timeouts` is not an object of known stages with whole milliseconds >= 0. */
export function checkTimeouts(timeouts) {
  if (timeouts === undefined) return;
  if (!timeouts || typeof timeouts !== "object" || Array.isArray(timeouts)) throw new Error("config timeouts must be an object");
  for (const [name, ms] of Object.entries(timeouts)) {
    if (!(name in STAGE_DEFAULTS)) throw new Error(`config timeouts.${name} is not a stage; use ${Object.keys(STAGE_DEFAULTS).join(", ")}`);
    if (!Number.isSafeInteger(ms) || ms < 0) throw new Error(`config timeouts.${name} must be a whole number of milliseconds, 0 or more (0 is off)`);
  }
}

/** The limits for a config: the defaults, then the older `turnTimeoutMs` / `killAfterMs`, then `timeouts`. */
export function limitsOf(config) {
  const older = { ...(config.turnTimeoutMs !== undefined ? { turn: config.turnTimeoutMs } : {}), ...(config.killAfterMs !== undefined ? { cancel: config.killAfterMs } : {}) };
  return { ...STAGE_DEFAULTS, ...older, ...(config.timeouts ?? {}) };
}

/** The message for a stage that ran out, for example: `The helper did not get past initialize in 60 s, so the turn was stopped.` */
export const stageMessage = (name, ms) => `The helper did not get past ${LABEL[name]} in ${ms >= 1000 ? `${Math.round(ms / 1000)} s` : `${ms} ms`}, so the turn was stopped.`;

export class Stages {
  /** @param {Record<string, number>} limits  @param {(name: string) => void} onFire  called once, for the first stage that runs out */
  constructor(limits, onFire) { Object.assign(this, { limits, onFire }); this.timers = new Map(); this.fired = null; this.holds = 0; this.open = new Set(); this.watching = false; }

  start(name) {
    this.stop(name);
    const ms = this.limits[name];
    if (!ms || this.fired) return;
    const timer = setTimeout(() => { if (this.fired) return; this.fired = name; this.stopAll(); this.onFire(name); }, ms);
    timer.unref?.();
    this.timers.set(name, timer);
  }

  stop(name) { clearTimeout(this.timers.get(name)); this.timers.delete(name); }
  stopAll() { for (const name of [...this.timers.keys()]) this.stop(name); }
  running(name) { return this.timers.has(name); }

  /** The prompt was written: from now on every update restarts the inactivity limit. */
  watch() { this.watching = true; this.#idle(); }

  /** An update from the helper. A tool call keeps inactivity paused until it reports a final status. */
  update(event) {
    this.stop("firstUpdate");
    if (event?.type === "tool_call" && typeof event.toolCallId === "string") {
      if (DONE.has(String(event.status))) this.open.delete(event.toolCallId); else this.open.add(event.toolCallId);
    }
    this.#idle();
  }

  /** A permission request or a question waits for the owner (pause), or was answered (resume). */
  pause() { this.holds++; this.stop("inactivity"); }
  resume() { this.holds = Math.max(0, this.holds - 1); this.#idle(); }

  #idle() {
    if (!this.watching) return;
    if (this.holds || this.open.size) this.stop("inactivity"); else this.start("inactivity");
  }
}
