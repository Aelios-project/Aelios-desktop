// One thread's local session as the thread view wants it (see client/local-api.mjs): the turns the runner journal
// remembers, each with the helper's items from its own session file, and the permission requests in time order.
// Pure but for the transcript readers, which are passed in.
const TASK = { done: "done", needs_you: "needs_you", failed: "failed", cancelled: "cancelled" };

/** Items of the group that belongs to journal turn i: groups and journal turns are matched from the end. */
function itemsFor(groups, count, i) { return groups[groups.length - count + i] ?? []; }

export function sessionOf(ov, thread, groups) {
  const record = ov.threads[thread];
  if (!record) return null;
  const journal = ov.turns[thread] || [];
  const perms = ov.perms.filter((p) => p.thread === thread);
  const base = journal.length ? journal : groups.map((items) => ({ kind: "job", at: items.find((x) => x.at)?.at ?? Date.now(), text: "", end: null }));
  const turns = base.map((turn, i) => {
    const next = base[i + 1]?.at ?? Infinity;
    const items = (journal.length ? itemsFor(groups, base.length, i) : groups[i] ?? []).map((x) => ({ ...x, at: x.at ?? turn.at }));
    for (const p of perms) if (p.at >= turn.at && p.at < next) items.push({ type: "perm", id: p.id, at: p.at, title: p.title, kind: p.kind, paths: p.paths, decided: p.decided, by: p.by });
    items.sort((a, b) => a.at - b.at);
    return { kind: turn.kind, at: turn.at, text: turn.text, end: turn.end, items };
  });
  return { plugin: record.plugin, cwd: record.cwd, turns };
}

/** The row of the This machine list. */
export function summaryOf(ov, thread, session) {
  const items = session.turns.flatMap((t) => t.items);
  const tools = items.filter((x) => x.type === "tool");
  const last = session.turns.at(-1);
  return {
    thread, plugin: session.plugin, at: last?.end?.at ?? last?.at ?? 0, status: last ? (last.end ? TASK[last.end.status] || "done" : "working") : "done", turns: session.turns.length,
    tools: tools.length, files: new Set(tools.flatMap((x) => x.diffs.map((d) => d.path))).size, commands: tools.filter((x) => x.kind === "execute").length,
    pending: ov.perms.filter((p) => p.thread === thread && !p.decided).length,
  };
}
