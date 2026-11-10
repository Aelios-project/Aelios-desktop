// The engine name shown by `status` and at start-up: "legacy", or "acpx@<version>" read from the installed acpx package.
import { createRequire } from "node:module";

export function engineLabel(config) {
  if ((config.engine ?? "legacy") !== "acpx") return "legacy";
  try { return `acpx@${createRequire(import.meta.url)("acpx/package.json").version}`; }
  catch { return "acpx@unknown"; } // shortcut: an unreadable package.json shows "unknown", upgrade if that ever happens in practice
}
