// The panels of the work column, in tab order, with the icon each tab shows, and the number each tab carries.
// Each needs a name in strings.mjs (panels.<id>). Settings, usage and tools are not panels: they live in the
// settings sheet. No React here, so test/panels.test.mjs can cover it.
export const PANEL_IDS = ["waiting", "threads", "alarms"];
export const PANEL_ICONS = { waiting: "inbox", threads: "threads", alarms: "alarm" };

/** What waits on the person (the accent badge), unread thread news or else threads at work, alarms set. A zero is no badge. */
export function tabCounts({ waiting, threads, alarms } = {}) {
  const unread = Object.values(waiting?.unread || {}).reduce((sum, n) => sum + (Number(n) || 0), 0);
  return {
    waiting: { n: (waiting?.items || []).length, hot: true }, // one rule with the web page: everything on the list
    // News on a thread (accent badge) comes before the plain count of threads at work.
    threads: unread ? { n: unread, hot: true } : { n: Number(threads?.open) || 0, hot: false },
    alarms: { n: alarms?.on === false ? 0 : (alarms?.alarms || []).filter((a) => a?.next).length, hot: false },
  };
}
