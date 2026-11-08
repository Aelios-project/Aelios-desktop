// Starts, watches and stops `aelios-runner start` as a child process.
// States: unpaired, stopped, starting, running, crashed, locked (another runner holds the lock), revoked.
import { spawn } from "node:child_process";
import { childEnv, nodeBin, runnerStatus } from "./runner.mjs";

const LOG_LINES = 40;

const KILL_AFTER_MS = 5000;
const RESTART_GAP_MS = 60000;

export class Supervisor {
  constructor({ entry, node = nodeBin(), env = {}, onChange = () => {}, now = Date.now, killAfterMs = KILL_AFTER_MS }) {
    Object.assign(this, { entry, node, env, onChange, now, killAfterMs });
    this.state = "unpaired";
    this.error = "";
    this.child = null;
    this.lastRestart = 0;
    this.stopping = false;
    this.since = 0;
    this.log = [];
  }

  snapshot() { return { state: this.state, error: this.error }; }

  /** What the This machine view shows: the state, since when, the process, and the runner's last lines. */
  detail() { return { ...this.snapshot(), since: this.since || null, pid: this.child?.pid ?? null, log: this.log }; }

  #set(state, error = "") { if (state !== this.state) this.since = this.now(); this.state = state; this.error = error; this.onChange(this.snapshot()); }

  /** A failure that stops the runner before it starts (pairing, for one): a short line for the owner. */
  fail(state, error) { this.#set(state, String(error).slice(0, 200)); }

  start({ auto = false } = {}) {
    if (this.child) return;
    this.stopping = false;
    if (auto) this.lastRestart = this.now();
    this.#set("starting");
    const child = spawn(this.node, [this.entry, "start"], { env: childEnv(this.node, this.env), stdio: ["ignore", "ignore", "pipe"] });
    this.child = child;
    let last = "";
    let buffer = "";
    child.stderr.on("data", (chunk) => {
      buffer += chunk;
      const lines = buffer.split("\n");
      buffer = lines.pop();
      for (const line of lines.filter(Boolean)) { last = line; this.log = [...this.log, { at: this.now(), text: line }].slice(-LOG_LINES); }
      if (this.state === "starting" && last) this.#set("running");
    });
    child.on("error", (e) => { this.child = null; this.#set("crashed", e.message); });
    child.on("close", (code) => { this.child = null; void this.#exited(code, last || buffer); });
  }

  async #exited(code, last) {
    if (this.stopping || code === 0) return this.#set("stopped");
    if (/already using/.test(last)) return this.#set("locked", last);
    const status = await runnerStatus(this.entry, { env: this.env, node: this.node });
    if (status && !status.paired) return this.#set("unpaired");
    if (status?.revoked) return this.#set("revoked");
    this.#set("crashed", last);
    // One quiet restart a minute at most; after that the owner presses Start.
    if (this.now() - this.lastRestart >= RESTART_GAP_MS) this.start({ auto: true });
  }

  /** SIGTERM first so a running turn is handed back as needs_you; SIGKILL if it is still there later. */
  async stop() {
    const child = this.child;
    if (!child) return;
    this.stopping = true;
    await new Promise((resolve) => {
      const timer = setTimeout(() => child.kill("SIGKILL"), this.killAfterMs);
      timer.unref?.();
      child.once("close", () => { clearTimeout(timer); resolve(); });
      child.kill("SIGTERM");
    });
  }

  reset() { this.#set("unpaired"); }
}
