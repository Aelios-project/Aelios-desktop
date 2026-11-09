// One turn through acpx: the same contract as helper.mjs (`new Turn(o).run()` and `cancel()`, the same outcome objects),
// with acpx doing the process, the JSON-RPC and the session. The prompt is written once and never again: a lost session is
// only retried when acpx says it could not load it, which happens before the prompt is written.
import { createHash, randomUUID } from "node:crypto";
import { CONVENTION } from "./convention.mjs";
import { takeEvent } from "./events.mjs";
import { NOTICES, joinNotice, seedOf, withRecap } from "./handoff.mjs";
import { promptBlocks } from "./inbox.mjs";
import { identityOf, registryOf, resolve, sameLaunch } from "./launch.mjs";
import { cancelled, outcomeOf, stuck } from "./outcome.mjs";
import { makePermit } from "./permit.mjs";
import { reasonOf } from "./reason.mjs";
import { StepLog } from "./steps.mjs";

const hash = text => createHash("sha256").update(text).digest("hex").slice(0, 12);
const MODE_MESSAGE = "Kiro did not confirm the restricted agent. Check that its agents directory is readable by Kiro and try again.";
const LIMIT = "The helper did not finish within the time limit and was stopped.";

export class AcpxTurn {
  /** The options of helper.mjs `Turn`, plus `engine` (runtime.mjs), `config`, `thread` and `record` (the thread record, or undefined). */
  constructor(o) {
    Object.assign(this, { timeoutMs: 30 * 60_000, killAfterMs: 10_000 }, Object.fromEntries(Object.entries(o).filter(([, value]) => value !== undefined)));
    this.cancelled = false; this.timedOut = false; this.modeBad = false; this.handle = null; this.live = null;
    this.current = ""; this.finished = []; this.denied = []; this.opened = null;
    this.stepLog = this.onStep ? new StepLog({ cwd: this.cwd, redact: this.redact }) : null;
  }

  /** Stop this turn. Safe at any moment: before the prompt is written it is simply never written. */
  cancel() {
    if (this.cancelled) return;
    this.cancelled = true;
    void this.live?.cancel().catch(() => {});
    // A helper that does not answer a cancel is stopped for good, so a stuck turn cannot hold the thread.
    this.killTimer = setTimeout(() => { if (this.handle) void this.engine.runtime.close({ handle: this.handle, reason: "cancel limit" }).catch(() => {}); }, this.killAfterMs);
    this.killTimer.unref?.();
  }

  #open(key, name, resume) {
    return this.engine.runtime.ensureSession({ sessionKey: key, agent: name, mode: "persistent", cwd: this.cwd, ...(resume ? { resumeSessionId: resume } : {}) });
  }

  async #closeOpen(key, name, reason) {
    const { runtime, modes } = this.engine;
    const known = await runtime.findSession({ sessionKey: key, agent: name }).catch(() => undefined);
    if (!known) return;
    await runtime.close({ handle: known, reason }).catch(() => {});
    modes.delete(known.backendSessionId);
  }

  /** The prompt as acpx takes it: the text, and every picture as an image block. Other files stay paths in the text. */
  async #prompt(history) {
    const blocks = await promptBlocks(this.prompt, CONVENTION, this.files, true);
    const images = blocks.filter(block => block.type === "image").map(block => ({ mediaType: block.mimeType, data: block.data }));
    return { text: withRecap(history, blocks[0].text), attachments: images };
  }

  async #turn(prompt) {
    const { modes } = this.engine, expected = this.launch.expectedAgent, session = this.opened;
    const permit = makePermit({ tier: this.tier, redact: this.redact, denied: this.denied, hold: this.hold, stopped: () => this.cancelled });
    const turn = this.live = this.engine.runtime.startTurn({
      handle: this.handle, text: prompt.text, ...(prompt.attachments.length ? { attachments: prompt.attachments } : {}), mode: "prompt", requestId: randomUUID(), onPermissionRequest: permit,
      // Runs after the session is loaded and before the prompt is written: the place for the fail-closed checks.
      assertActive: () => {
        if (this.cancelled) throw new Error("cancelled before the prompt was written");
        if (expected && modes.get(session) !== expected) { this.modeBad = true; throw new Error(MODE_MESSAGE); }
      }
    });
    let written = false;
    turn.promptStarted.then(() => { written = true; }, () => {});
    try { for await (const event of turn.events) takeEvent(this, event); } catch { /* the result carries the failure */ }
    return { result: await turn.result, written };
  }

  /** @returns {Promise<{status: string, summary: string, sessionId: string|null, how: string, ask?: object}>} */
  async run() {
    const { config, thread, record, engine } = this, plugin = config.plugin;
    const identity = identityOf(config, this.launch, this.cwd);
    const { name } = resolve(config, thread, this.launch);
    const key = `${hash(thread)}:${identity.id.slice(0, 8)}`; // a changed launch is a new key, never a silent new session under the old one
    engine.register(registryOf(config, thread, this.launch));
    let resume = this.sessionId, how = "new", handoff = null, history = null;
    try {
      if (resume && record?.launch && !sameLaunch(record, identity)) { // changed setup: close the old helper, start a new session with a recap
        await this.#closeOpen(`${hash(thread)}:${record.launch.id.slice(0, 8)}`, `${record.launch.plugin}:${hash(thread)}`, "launch changed");
        resume = undefined; handoff = NOTICES.changed; history = record.seed ?? ""; how = "handoff";
      } else if (resume && engine.tiers.get(key) && engine.tiers.get(key) !== this.tier) { // the helper reads its agent file at start: restart it, keep the session
        await this.#closeOpen(key, name, "tier change");
      }
      engine.tiers.set(key, this.tier);
      if (resume) how = plugin === "dsh" ? "resumed" : "loaded";
      this.handle = await this.#open(key, name, resume);
      this.opened = this.handle.backendSessionId ?? resume;
      const extras = () => ({ launch: identity, ...(record?.seed ? {} : { seed: seedOf(this.prompt, this.redact) }) });
      await this.onSession?.(this.opened, how, extras());
      if (this.cancelled) return cancelled(this, how);
      this.timer = setTimeout(() => { this.timedOut = true; this.cancel(); }, this.timeoutMs);
      this.timer.unref?.();
      let attempt = await this.#turn(await this.#prompt(history));
      if (attempt.result.status === "failed" && attempt.result.error?.detailCode === "SESSION_RESUME_REQUIRED" && !attempt.written && resume && !this.cancelled) {
        // acpx could not reload the saved session. Nothing was written, so a new session is safe; it gets the recap.
        await engine.runtime.prepareFreshSession({ handle: this.handle });
        this.handle = await this.#open(key, name, undefined);
        this.opened = this.handle.backendSessionId; how = "fresh-after-lost"; handoff = NOTICES.lost;
        await this.onSession?.(this.opened, how, extras());
        attempt = await this.#turn(await this.#prompt(record?.seed ?? ""));
      }
      const outcome = this.#outcome(attempt, how, plugin);
      return handoff && outcome.sessionId ? { ...outcome, notice: joinNotice(handoff, outcome.notice) } : outcome;
    } catch (error) {
      return this.#failed(error, how, plugin);
    } finally { clearTimeout(this.timer); clearTimeout(this.killTimer); }
  }

  #outcome({ result, written }, how, plugin) {
    if (this.modeBad) return { status: "failed", summary: MODE_MESSAGE, reason: "error", sessionId: this.opened, how };
    if (this.timedOut) return stuck(this, how, LIMIT);
    if (this.cancelled) return cancelled(this, how);
    if (result.status === "completed") return outcomeOf(this, String(result.stopReason ?? "end_turn"), how);
    if (result.status === "cancelled") return cancelled(this, how);
    return this.#failed(Object.assign(new Error(result.error?.message ?? "the helper failed"), result.error), how, plugin, written);
  }

  /** An error from acpx (thrown, or in the result of a turn). `written` says whether the prompt had been written. */
  #failed(error, how, plugin, written = false) {
    const text = this.redact(String(error.message));
    if (this.cancelled && !this.timedOut) return cancelled(this, how);
    if (this.timedOut) return stuck(this, how, LIMIT);
    if (error.detailCode === "UNSUPPORTED_PROMPT_CONTENT") return { status: "failed", summary: `${plugin} does not accept pictures. Send the picture another way, or use a helper that does.`, reason: "error", sessionId: this.opened, how };
    const spawn = String(error.detailCode ?? "").startsWith("AGENT_SPAWN");
    if (spawn || (error.detailCode === "AGENT_DISCONNECTED" && !written)) {
      const reason = /ENOENT|EACCES|EPERM/.test(String(error.detailCode)) ? "helper_missing" : reasonOf(undefined, error.message);
      return { status: "failed", summary: `The helper could not start or connect: ${text}`, reason, sessionId: this.opened, how };
    }
    if (error.detailCode === "AGENT_DISCONNECTED") return stuck(this, how, `The helper process died in the middle of the turn (${text}). It will not be redone automatically.`);
    return { status: "failed", summary: `The helper reported an error: ${text}`, reason: reasonOf(undefined, error.message), sessionId: this.opened, how };
  }
}
