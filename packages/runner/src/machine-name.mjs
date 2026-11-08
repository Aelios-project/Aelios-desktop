// The computer's name, as the user sees it in the system settings. It is the label the resident shows for this machine.
import { execFileSync } from "node:child_process";
import os from "node:os";

let cached = null;

/** macOS: the Computer Name (`scutil --get ComputerName`); anywhere else, or when that fails, the host name. At most 60 characters. */
export function computerName() {
  if (cached) return cached;
  let name = "";
  if (process.platform === "darwin") {
    try { name = execFileSync("/usr/sbin/scutil", ["--get", "ComputerName"], { encoding: "utf8", timeout: 2000, stdio: ["ignore", "pipe", "ignore"] }); }
    catch { /* falls back to the host name */ }
  }
  name = (name || os.hostname()).replace(/[\x00-\x1f\x7f]/g, "").trim().slice(0, 60);
  return (cached = name || "Runner");
}
