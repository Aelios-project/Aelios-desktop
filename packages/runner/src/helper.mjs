// One turn with an ACP helper: start it, open (or reopen) the thread's session, send one prompt, answer permission
// requests by tier, and turn the end of the turn into a receipt outcome. One helper process per turn; the session
// outlives it (session/load or session/resume), so a later turn picks up the same conversation.
import { createHash } from "node:crypto";
import { AcpClosed, AcpConnection, AcpError, PROTOCOL_VERSION } from "./acp.mjs";
import { lastMarker, noticeOf, takeNotes } from "./markers.mjs";
import { answer } from "./permission.mjs";

const short = text => createHash("sha1").update(text).digest("hex").slice(0, 12);
/** Added to every prompt. How the helper tells the user something; a question mark means nothing. */
export const CONVENTION = [
  "How to talk to the user. Put each marker alone at the start of a line.",
  "Say nothing and carry on when a step can be undone and is inside the job. Never ask whether to continue.",
  "`NOTE: ...` anywhere: the user should know, but you keep going.",
  "`BLOCKED: ...` as your last line: an outside wall you cannot pass (missing permission, no network, a missing dependency).",
  "`ASK: ...` as your last line: only the user can decide (cannot be undone, costs money, a preference, a permission to give).",
  "When technically stuck: (a) try one really different way; (b) then look for a way around, or do the part that is not stuck; (c) only then BLOCKED for an outside wall, or ASK for what only the user can decide.",
  "A denied permission or a limit the user set is never worked around: stop and say BLOCKED, or ASK for the permission.",
  "Reply in the language of the job."
].join(" ");

export class Turn {
  /**
   * @param {{launch: object, cwd: string, sessionId?: string, prompt: string, tier: string, timeoutMs?: number,
   *          killAfterMs?: number, redact: (text: string) => string, onSession?: (sessionId: string, how: string) => Promise<void>|void}} o
   */
  constructor(o) {
    Object.assign(this, { timeoutMs: 30 * 60_000, killAfterMs: 10_000 }, Object.fromEntries(Object.entries(o).filter(([, value]) => value !== undefined)));
    this.cancelled = false; this.timedOut = false; this.collecting = false;
    this.current = ""; this.finished = []; this.denied = []; this.opened = null;
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
    else if (update.sessionUpdate === "tool_call" && this.current.trim()) { this.finished.push(this.current); this.current = ""; }
  }

  async #request(method, params) {
    if (method !== "session/request_permission") throw new AcpError("method not found", -32601);
    const { response, denied } = answer(this.tier, params, this.cwd);
    if (denied) this.denied.push(denied);
    return response;
  }

  async #open(capabilities) {
    const base = { cwd: this.cwd, mcpServers: [] };
    let how = "new";
    if (this.sessionId) {
      const method = capabilities.loadSession ? "session/load" : capabilities.sessionCapabilities?.resume ? "session/resume" : null;
      how = "fresh-after-lost";
      if (method) {
        try { await this.conn.request(method, { sessionId: this.sessionId, ...base }, 60_000); this.opened = this.sessionId; return method === "session/load" ? "loaded" : "resumed"; }
        catch (error) { if (!(error instanceof AcpError)) throw error; /* the helper says it has no such session */ }
      }
    }
    const created = await this.conn.request("session/new", base, 60_000);
    if (typeof created.sessionId !== "string" || !created.sessionId) throw new AcpError("helper gave no session id", -32603);
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
      const result = await this.conn.request("session/prompt", { sessionId: this.opened, prompt: [{ type: "text", text: `${this.prompt}\n\n${CONVENTION}` }] });
      return this.#outcome(String(result.stopReason ?? "end_turn"), how);
    } catch (error) {
      if (this.cancelled && !this.timedOut) return this.#cancelled(how);
      if (this.timedOut) return this.#stuck(how, "The helper did not finish within the time limit and was stopped.");
      if (error instanceof AcpClosed) {
        if (!this.opened) return { status: "failed", summary: this.redact(`The helper could not start or connect: ${error.message} ${stderrNote()}`), sessionId: null, how };
        return this.#stuck(how, `The helper process died in the middle of the turn (${this.redact(error.message)}). It will not be redone automatically. ${stderrNote()}`.trim());
      }
      return { status: "failed", summary: this.redact(`The helper reported an error: ${error.message}`), sessionId: this.opened, how };
    } finally {
      clearTimeout(this.timer); clearTimeout(this.killTimer);
      await this.conn.close();
    }
  }

  #text() { return (this.current.trim() || this.finished.at(-1)?.trim() || ""); }

  #cancelled(how) {
    const last = this.#text();
    return { status: "cancelled", summary: this.redact(last ? `Stopped. The last part before stopping: ${last}` : "Stopped."), sessionId: this.opened, how };
  }

  #stuck(how, why) {
    const key = "stuck:" + short(why + (this.opened ?? ""));
    return { status: "needs_you", summary: this.redact(why), sessionId: this.opened, how, ask: { key, question: this.redact(why + " Carry on?") } };
  }

  #outcome(stopReason, how) {
    const { notes } = takeNotes([...this.finished, this.current].join("\n"));
    const final = takeNotes(this.#text()).rest, notice = noticeOf(notes.map(note => this.redact(note)));
    const base = { sessionId: this.opened, how, ...(notice ? { notice } : {}) };
    if (this.timedOut) return this.#stuck(how, "The helper did not finish within the time limit and was stopped.");
    if (stopReason === "cancelled") return this.#cancelled(how);
    if (stopReason === "refusal" || stopReason === "max_tokens" || stopReason === "max_turn_requests") {
      const why = `The helper stopped in the middle (${stopReason}).${final ? " Last part: " + final : ""}`;
      return { ...base, status: "needs_you", summary: this.redact(why), ask: { key: "stop:" + short(stopReason + final), question: this.redact(why) } };
    }
    if (this.denied.length) {
      const list = this.denied.map(item => "- " + item).join("\n");
      const summary = this.redact(`${final || "(the helper left no text)"}\n\nSome actions were refused by this machine's permission tier (${this.tier}):\n${list}`);
      return { ...base, status: "needs_you", summary, ask: { key: "perm:" + short(list), question: this.redact(`The helper wanted to do the following, but this machine's tier is ${this.tier}, so it was refused:\n${list}`) } };
    }
    if (!final && notes.length) return { ...base, status: "done", summary: this.redact(notes.join("\n")) };
    if (!final) return { ...base, status: "needs_you", summary: "The turn ended, but the helper left no text result.", ask: { key: "silent:" + short(String(this.opened) + Date.now()), question: "The turn ended, but the helper left no text result. Ask again?" } };
    const said = lastMarker(final);
    if (said?.kind === "blocked") {
      const reason = this.redact(said.text || "(no reason given)");
      return { ...base, status: "failed", summary: `Blocked: ${reason}${said.body ? "\n\n" + this.redact(said.body) : ""}` };
    }
    if (said?.kind === "ask") {
      const question = this.redact(said.text || "(the helper wants you to decide, but wrote no question)");
      return { ...base, status: "needs_you", summary: this.redact(said.body || question), ask: { key: "q:" + short(final), question } };
    }
    return { ...base, status: "done", summary: this.redact(final) };
  }
}
