// How much room the window's own furniture takes at the top of the left column.
// The DSH desktop window is built with titleBarStyle "hiddenInset" and the traffic lights at (16, 18), so on macOS
// the page starts under them; a browser tab's chrome is outside the page and takes nothing.
export function shellTopInset(nav = globalThis.navigator, proc = globalThis.process) {
  const ua = nav?.userAgent || "";
  const electron = /Electron/i.test(ua) || Boolean(proc?.versions?.electron);
  if (!electron) return 0;
  const macOS = /Macintosh|Mac OS X/i.test(ua) || proc?.platform === "darwin";
  return macOS ? 30 : 0;
}
