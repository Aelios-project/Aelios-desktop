// A stand-in for aelios-runner. FAKE_MODE: run | crash | locked. FAKE_REVOKED=1 makes status say revoked.
// FAKE_LOG, when set, gets one JSON line per call: the arguments, and whether the web key was in the environment.
import { appendFileSync } from "node:fs";

const [command, ...args] = process.argv.slice(2);
if (process.env.FAKE_LOG) appendFileSync(process.env.FAKE_LOG, `${JSON.stringify({ command, args, key: process.env.AELIOS_WEB_KEY ?? null })}\n`);

if (command === "start") {
  const mode = process.env.FAKE_MODE || "run";
  if (mode === "locked") { console.error("aelios-runner: another aelios-runner (pid 1) is already using /x"); process.exit(1); }
  console.error("aelios-runner: dsh, access edit, folder /x");
  if (mode === "crash") process.exit(1);
  process.on("SIGTERM", () => process.exit(0));
  setInterval(() => {}, 1000);
} else if (command === "status") {
  console.log(JSON.stringify({ paired: process.env.FAKE_PAIRED !== "0", revoked: process.env.FAKE_REVOKED === "1" }));
} else if (command === "overview" && process.env.FAKE_WORKSPACE) {
  console.log(JSON.stringify({ workspace: process.env.FAKE_WORKSPACE, threads: {}, turns: {}, perms: [] }));
} else if (command === "pair" && process.env.FAKE_PAIR_FAIL) {
  console.error("aelios-runner: the resident did not accept the key");
  process.exit(1);
}
