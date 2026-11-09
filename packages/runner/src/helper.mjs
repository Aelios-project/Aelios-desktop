// One turn with an ACP helper: start it, open (or reopen) the thread's session, send one prompt, answer permission
// requests by tier, and turn the end of the turn into a receipt outcome. One helper process per turn; the session
// outlives it (session/load or session/resume), so a later turn picks up the same conversation.
import { AcpClosed, AcpConnection, AcpError, PROTOCOL_VERSION } from "./acp.mjs";
import { CONVENTION } from "./convention.mjs";
import { cancelled, outcomeOf, stuck } from "./outcome.mjs";
import { promptBlocks } from "./inbox.mjs";
import { reasonOf, reasonOfStart } from "./reason.mjs";
import { answer } from "./permission.mjs";
import { StepLog } from "./steps.mjs";

export { CONVENTION };

export class Turn {
  /**
   * @param {{files?: {saved: object[], failed: string[]}|null, launch: object, cwd: string, sessionId?: string, prompt: string, tier: string, timeoutMs?: number, hold?: Function,
   *          killAfterMs?: number, redact: (text: string) => string, onSession?: (sessionId: string, how: string) => Promise<void>|void,
   *          onStep?: (steps: {kind: string, title: string}[]) => void}} o
   */
  constructor(o) {
    Object.assign(this, { timeoutMs: 30 * 60_000, killAfterMs: 10_000 }, Object.fromEntries(Object.entries(o).filter(([, value]) => value !== undefined)));
    this.cancelled = false; this.timedOut = false; this.collecting = false;
    this.current = ""; this.finished = []; this.denied = []; this.opened = null;
    this.stepLog = this.onStep ? new StepLog({ cwd: this.cwd, redact: this.redact }) : null;
  }

  /** Stop this turn. Safe at any moment: before the session exists the turn simply never sends its prompt. */
  cancel() {
    if (this.cancelled) return;
    this.cancelled = true;
    if (this.conn && this.opened) this.conn.notify("session/cancel", { sessionId: this.opened });
    // A helper that does not answer a cancel is stopped for good, so a stuck turn cannot hold the thread.
    this.killTimer = setTimeout(() => { void this.conn?.close(0); }, this.killAfterMs);
    this.killTimer.unref?.();
  }

  #update(method, params) {
    if (method !== "session/update" || !this.collecting) return; // replayed history while loading is not this turn's
    const update = params.update ?? {};
    if (update.sessionUpdate === "agent_message_chunk" && update.content?.type === "text") this.current += String(update.content.text ?? "");
    else if (update.sessionUpdate === "tool_call") {
      if (this.current.trim()) { this.finished.push(this.current); this.current = ""; }
      const steps = this.stepLog?.add(update);
      if (steps) this.onStep(steps);
    }
  }

  async #request(method, params) {
    if (method !== "session/request_permission") throw new AcpError("method not found", -32601);
    let { response, denied, hold } = answer(this.tier, params);
    if (hold?.detail) hold.detail = this.redact(hold.detail); // the folder and the pairing token stay off the owner's screen too
    // A request the helper asked about waits for the owner. Allowing it covers this one request only.
    if (hold && this.hold && await this.hold(hold, () => this.cancelled)) ({ response, denied } = answer("full", params));
    if (denied) this.denied.push(denied);
    return response;
  }

  #checkAgent(response) {
    if (this.launch.expectedAgent && response?.modes?.currentModeId !== this.launch.expectedAgent) {
      throw new Error("Kiro did not confirm the restricted agent. Check that its agents directory is readable by Kiro and try again.");
    }
  }

  async #open(capabilities) {
    const base = { cwd: this.cwd, mcpServers: [] };
    let how = "new";
    if (this.sessionId) {
      const method = capabilities.loadSession ? "session/load" : capabilities.sessionCapabilities?.resume ? "session/resume" : null;
      how = "fresh-after-lost";
      if (method) {
        let loaded;
        try { loaded = await this.conn.request(method, { sessionId: this.sessionId, ...base }, 60_000); }
        catch (error) { if (!(error instanceof AcpError)) throw error; /* the helper says it has no such session */ }
        if (loaded) {
          this.#checkAgent(loaded);
          this.opened = this.sessionId;
          return method === "session/load" ? "loaded" : "resumed";
        }
      }
    }
    const created = await this.conn.request("session/new", base, 60_000);
    if (typeof created.sessionId !== "string" || !created.sessionId) throw new AcpError("helper gave no session id", -32603);
    this.#checkAgent(created);
    this.opened = created.sessionId;
    return how;
  }

  /** @returns {Promise<{status: string, summary: string, sessionId: string|null, how: string, ask?: object}>} */
  async run() {
    this.conn = new AcpConnection(this.launch, { onNotification: (m, p) => this.#update(m, p), onRequest: (m, p) => this.#request(m, p) }).start();
    let how = "new";
    const stderrNote = () => this.redact(this.conn.stderr.trim().split("\n").slice(-3).join(" ")).slice(0, 300);
    try {
      const init = await this.conn.request("initialize", { protocolVersion: PROTOCOL_VERSION, clientCapabilities: {}, clientInfo: { name: "aelios-runner", version: "0.1.0" } }, 30_000);
      how = await this.#open(init.agentCapabilities ?? {});
      await this.onSession?.(this.opened, how);
      if (this.cancelled) return this.#cancelled(how);
      this.timer = setTimeout(() => { this.timedOut = true; this.cancel(); }, this.timeoutMs);
      this.timer.unref?.();
      this.collecting = true;
      const prompt = await promptBlocks(this.prompt, CONVENTION, this.files, Boolean(init.agentCapabilities?.promptCapabilities?.image));
      const result = await this.conn.request("session/prompt", { sessionId: this.opened, prompt });
      return this.#outcome(String(result.stopReason ?? "end_turn"), how);
    } catch (error) {
      if (this.cancelled && !this.timedOut) return this.#cancelled(how);
      if (this.timedOut) return this.#stuck(how, "The helper did not finish within the time limit and was stopped.");
      if (error instanceof AcpClosed) {
        if (!this.opened) return { status: "failed", summary: this.redact(`The helper could not start or connect: ${error.message} ${stderrNote()}`), reason: reasonOfStart(error, this.conn.stderr), sessionId: null, how };
        return this.#stuck(how, `The helper process died in the middle of the turn (${this.redact(error.message)}). It will not be redone automatically. ${stderrNote()}`.trim());
      }
      return { status: "failed", summary: this.redact(`The helper reported an error: ${error.message}`), reason: reasonOf(error.code, error.message), sessionId: this.opened, how };
    } finally {
      clearTimeout(this.timer); clearTimeout(this.killTimer);
      await this.conn.close();
    }
  }

  #cancelled(how) { return cancelled(this, how); }
  #stuck(how, why) { return stuck(this, how, why); }
  #outcome(stopReason, how) { return outcomeOf(this, stopReason, how); }
}
