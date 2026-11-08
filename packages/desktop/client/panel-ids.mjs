// The panels of the work column, in tab order, with the icon each tab shows, and the number each tab carries.
// Each needs a name in strings.mjs (panels.<id>). Settings, usage and tools are not panels: they live in the
// settings sheet. No React here, so test/panels.test.mjs can cover it.
export const PANEL_IDS = ["waiting", "threads", "alarms"];
export const PANEL_ICONS = { waiting: "inbox", threads: "threads", alarms: "alarm" };

/** What waits on the person (the accent badge), threads at work, alarms set. A zero is no badge. */
export function tabCounts({ waiting, threads, alarms } = {}) {
  return {
    waiting: { n: Number(waiting?.open) || 0, hot: true },
    threads: { n: Number(threads?.open) || 0, hot: false },
    alarms: { n: alarms?.on === false ? 0 : (alarms?.alarms || []).filter((a) => a?.next).length, hot: false },
  };
}
