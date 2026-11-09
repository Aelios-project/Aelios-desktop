// The command-line parts about what this machine keeps: `forget`, the store on `unpair`, the store in `status`, and the
// sweep while `start` runs. Kept out of aelios-runner.mjs so the main file stays short.
import { forget, forgetAll, storeInfo, sweep } from "../src/retention.mjs";

const DAY = 24 * 60 * 60_000;
export const STORE_NOTE = "The store holds whole helper conversations, tool input and output included, so it can hold secrets a tool printed. It never leaves this machine.";

/** aelios-runner forget <thread> | forget --all */
export function forgetCommand(home, args) {
  if (args[0] === "--all" && args.length === 1) { forgetAll(home); return "Deleted every saved helper session on this machine."; }
  if (args.length !== 1 || !args[0] || args[0].startsWith("-")) throw new Error("usage: aelios-runner forget <thread> | forget --all");
  const count = forget(home, args[0]);
  return count ? `Deleted ${count} saved session file(s) of thread ${args[0]}.` : `No saved sessions for thread ${args[0]}.`;
}

/** What `status` adds: where the store is and how big. */
export const storeStatus = home => ({ ...storeInfo(home), note: STORE_NOTE });

/** Unpair deletes the store unless asked to keep it. Returns the line to print. */
export function storeOnUnpair(home, args) {
  if (args.includes("--keep-store")) return `The saved helper sessions are kept in ${storeInfo(home).path}.`;
  forgetAll(home);
  return "The saved helper sessions on this machine are deleted (use --keep-store to keep them).";
}

/** Runs the retention sweep now and once a day while `start` runs. Returns a stop function. */
export function keepSwept(home, retention, log) {
  const run = () => { try { const gone = sweep(home, retention); if (gone) log(`retention: deleted ${gone} old session file(s)`); } catch (error) { log("retention failed", error.message); } };
  run();
  const timer = setInterval(run, DAY);
  timer.unref();
  return () => clearInterval(timer);
}
