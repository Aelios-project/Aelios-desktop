// Stops the reply that is running. The resident answers 200 "stopping" at once; the turn ends a moment later, so
// we read the messages again until `turn` is null. 409 means another turn runs now: nothing to report, just refresh.
const wait = (ms) => new Promise((done) => setTimeout(done, ms));

/** `refresh` reads the messages and gives back the turn that is still running (or null). */
export async function stopTurn({ turn, post, refresh, sleep = wait, tries = 10 }) {
  if (!turn?.requestId) return;
  try { await post({ requestId: turn.requestId }); } catch (e) { if (e.status !== 409) throw e; }
  for (let i = 0; i < tries; i += 1) {
    if (!(await refresh())) return;
    await sleep(1000);
  }
}
