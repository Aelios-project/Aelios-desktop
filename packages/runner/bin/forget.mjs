// The command-line parts about what this machine keeps: `forget`, the store on `unpair`, the store in `status`, and the
// sweep while `start` runs. Kept out of aelios-runner.mjs so the main file stays short.
// Deleting a thread's files also marks the thread in state.json, so its next turn starts a new session with a recap
// instead of reloading the old one from the helper. `forget` takes the runner lock for that: state.json has one writer.
import { forget, forgetAll, markForgotten, storeInfo, sweep, threadHash } from "../src/retention.mjs";

const DAY = 24 * 60 * 60_000;
export const STORE_NOTE = "The store holds whole helper conversations, tool input and output included, so it can hold secrets a tool printed. It never leaves this machine.";

/** aelios-runner forget <thread> | forget --all. `exclusive(fn)` runs fn while holding the runner lock. */
export async function forgetCommand(home, args, state, exclusive) {
  const all = args[0] === "--all" && args.length === 1;
  if (!all && (args.length !== 1 || !args[0] || args[0].startsWith("-"))) throw new Error("usage: aelios-runner forget <thread> | forget --all");
  return exclusive(async () => {
    if (all) { forgetAll(home); await markForgotten(state, "all"); return "Deleted every saved helper session on this machine."; }
    const count = forget(home, args[0]);
    await markForgotten(state, [threadHash(args[0])]);
    return count ? `Deleted ${count} saved session file(s) of thread ${args[0]}.` : `No saved sessions for thread ${args[0]}.`;
  });
}

/** What `status` adds: where the store is and how big. */
export const storeStatus = home => ({ ...storeInfo(home), note: STORE_NOTE });

/** Unpair deletes the store unless asked to keep it. Returns the line to print. */
export async function storeOnUnpair(home, args, state) {
  if (args.includes("--keep-store")) return `The saved helper sessions are kept in ${storeInfo(home).path}.`;
  forgetAll(home);
  await markForgotten(state, "all");
  return "The saved helper sessions on this machine are deleted (use --keep-store to keep them).";
}

/** Runs the retention sweep now and once a day while `start` runs (the runner's own state file, so one writer). Resolves to a stop function after the first sweep. */
export function keepSwept(home, retention, state, log) {
  const run = async () => {
    try {
      const { deleted, threads } = sweep(home, retention);
      if (!deleted) return;
      await markForgotten(state, threads);
      log(`retention: deleted ${deleted} old session file(s)`);
    } catch (error) { log("retention failed", error.message); }
  };
  const timer = setInterval(run, DAY);
  timer.unref();
  return run().then(() => () => clearInterval(timer)); // the first sweep ends before the runner takes work
}
