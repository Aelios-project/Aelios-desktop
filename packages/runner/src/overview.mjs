// What `aelios-runner overview` prints for a local app: the status, which session each thread uses, the turns the
// journal remembers, and the permission requests with their answers. The pairing token is never part of it.
import { computerName } from "./machine-name.mjs";

export function overview(config, state, journal) {
  const { turns, perms } = journal.fold();
  return {
    name: config.label || computerName(), paired: Boolean(state.device), revoked: Boolean(state.device?.revoked), plugin: config.plugin, access: config.access, workspace: config.workspace,
    queued: state.queue.length, unsent: state.outbox.length, running: state.current ? { thread: state.current.thread } : null,
    threads: Object.fromEntries(Object.entries(state.threads).map(([id, t]) => [id, { sessionId: t.sessionId ?? null, cwd: t.cwd ?? null, plugin: t.plugin ?? config.plugin }])),
    turns, perms
  };
}
