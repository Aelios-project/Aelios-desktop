// The color a status is drawn in, as one word the styles know: ok (green), warn (amber), bad (red), hot (the
// accent, for what waits on the person), info (violet) and idle (grey). Pure, so test/tones.test.mjs covers it.

const RUNNER = { running: "ok", starting: "warn", unpaired: "warn", locked: "warn", stopped: "bad", crashed: "bad", revoked: "bad" };

export const runnerTone = (state) => RUNNER[state] || "idle";

/** A runner the reader can start again with one press. */
export const runnerDown = (state) => ["stopped", "crashed", "revoked"].includes(state);

/** A waiting item: an open question is hot, a stuck one bad, a finished one ok, progress violet; expired is grey. */
export function waitTone(item) {
  if (!item || item.expired) return "idle";
  return { ask: "hot", stuck: "bad", done: "ok", note: "info" }[item.kind] || "idle";
}

/** A thread or task state. */
export const taskTone = (state) => ({ working: "warn", sent: "warn", needs_you: "hot", done: "ok", chosen: "ok", settled: "idle", failed: "bad", quiet: "bad", stopped: "idle" })[state] || "idle";
