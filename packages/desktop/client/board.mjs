// The tasks the resident handed to a cloud thread, as the board panel shows them: what it is, where it stands,
// and when it last moved. Shape from Aelios-resident src/cloud-tasks.ts (AGPL-3.0, same author; main at b118dfb).
// Pure, so test/board.test.mjs can cover the split.

const WORKING = new Set(["sent", "working"]);
const FINISHED = new Set(["done", "failed", "quiet", "stopped", "cancelled"]);

/** Working first (newest first), then the rest (newest first). */
export function splitTasks(tasks = []) {
  const at = (t) => new Date(t?.updatedAt || t?.createdAt || 0).getTime();
  const list = [...tasks].filter(Boolean).sort((a, b) => at(b) - at(a));
  return { working: list.filter((t) => WORKING.has(t.status)), done: list.filter((t) => FINISHED.has(t.status) || !WORKING.has(t.status)) };
}

/** One line for where it runs. */
export function runsText(runs) {
  return { local: "Runs at the resident", linux: "Runs on GitHub Actions", machine: "Runs on a machine", external: "Runs elsewhere" }[runs] || "";
}

/** The state a card shows, in words. */
export function stateWord(status) {
  return { sent: "Sent out", working: "Working", done: "Done", failed: "Failed", quiet: "No reply", stopped: "Stopped", needs_you: "Needs you", cancelled: "Stopped" }[status] || status || "";
}
