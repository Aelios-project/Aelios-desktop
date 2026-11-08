// The runner's `overview` (status, thread → session, journal turns, permission requests), asked for through the
// runner's own command and kept for a moment, since the This machine view asks every two seconds.
import { runOnce } from "./runner.mjs";

export function makeOverview({ entry, node, env = {}, ttlMs = 1500, now = Date.now }) {
  let at = 0;
  let value = null;
  let pending = null;
  async function load() {
    const { code, out } = await runOnce(entry, ["overview"], { env, node });
    try { value = code === 0 ? JSON.parse(out) : null; } catch { value = null; }
    at = now();
    return value;
  }
  const get = () => (now() - at < ttlMs ? Promise.resolve(value) : (pending ??= load().finally(() => { pending = null; })));
  get.forget = () => { at = 0; };
  return get;
}
