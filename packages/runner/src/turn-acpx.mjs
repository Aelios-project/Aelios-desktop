// One turn through acpx: the same contract as helper.mjs (`new Turn(o).run()` and `cancel()`, the same outcome objects),
// with acpx doing the process, the JSON-RPC and the session. The prompt is written once and never again: a lost session is
// only retried when acpx says it could not load it, which happens before the prompt is written.
import { createHash, randomUUID } from "node:crypto";
import { CONVENTION } from "./convention.mjs";
import { takeEvent, usageLine } from "./events.mjs";
import { NOTICES, joinNotice, seedOf, withRecap } from "./handoff.mjs";
import { promptBlocks } from "./inbox.mjs";
import { identityOf, registryOf, resolve, sameLaunch } from "./launch.mjs";
import { cancelled, outcomeOf, stuck } from "./outcome.mjs";
import { makePermit } from "./permit.mjs";
import { reasonOf } from "./reason.mjs";
import { buildRecap, gitState } from "./recap.mjs";
import { closeOld } from "./switch.mjs";
import { StepLog } from "./steps.mjs";
import { KeyedSteps } from "./steps-keyed.mjs";
import { OPENING, Stages, limitsOf, stageMessage } from "./stages.mjs";

const hash = text => createHash("sha256").update(text).digest("hex").slice(0, 12);
const MODE_MESSAGE = "Kiro did not confirm the restricted agent. Check that its agents directory is readable by Kiro and try again.";

export class AcpxTurn {
  /** The options of helper.mjs `Turn`, plus `engine` (runtime.mjs), `config`, `thread`, `record` (the thread record, or undefined) and `journal` (for the recap). */
  constructor(o) {
    Object.assign(this, Object.fromEntries(Object.entries(o).filter(([, value]) => value !== undefined)));
    this.cancelled = false; this.timedOut = false; this.modeBad = false; this.handle = null; this.live = null;
    this.current = ""; this.finished = []; this.denied = []; this.opened = null;
    this.stepLog = this.onStep ? new StepLog({ cwd: this.cwd, redact: this.redact }) : null;
    this.keyed = this.stepLog && new KeyedSteps(this.stepLog);
    // `timeoutMs` and `killAfterMs` are the config's turnTimeoutMs and killAfterMs; `timeouts` refines them per stage.
    this.limits = limitsOf({ turnTimeoutMs: this.timeoutMs, killAfterMs: this.killAfterMs, timeouts: this.config?.timeouts });
    this.stages = new Stages(this.limits, name => this.#ranOut(name));
  }

  /** Stop this turn. Safe at any moment: before the prompt is written it is simply never written. */
  cancel() {
    if (this.cancelled) return;
    this.cancelled = true;
    void this.live?.cancel().catch(() => {});
    // A helper that does not answer a cancel is stopped for good, so a stuck turn cannot hold the thread.
    if (!this.limits.cancel) return; // 0: the cancel limit is off
    this.killTimer = setTimeout(() => void this.#kill(), this.limits.cancel);
    this.killTimer.unref?.();
  }

  /** A stage ran out. Before the prompt is written nothing needs a cancel, so the helper is stopped at once. */
  #ranOut(name) {
    this.stage = name;
    this.limitText = stageMessage(name, this.limits[name]);
    if (!OPENING.has(name)) this.timedOut = true;
    this.cancel();
    if (OPENING.has(name)) void this.#kill();
  }

  /** How a stopped turn ends: a stage before the prompt fails with its name, a stage after it waits for the owner, a cancel is cancelled. */
  #stopped(how) {
    if (this.stage && OPENING.has(this.stage)) return { status: "failed", summary: this.limitText, reason: "error", sessionId: this.opened, how };
    if (this.timedOut) return stuck(this, how, this.limitText);
    return cancelled(this, how);
  }

  /** Close the helper. While the session is still opening acpx has no handle to close, so the process is stopped by pid. */
  async #kill() {
    const { runtime, pids } = this.engine;
    if (this.handle) await runtime.close({ handle: this.handle, reason: "cancel limit" }).catch(() => {});
    else if (pids.has(this.slot?.sessionKey)) try { process.kill(pids.get(this.slot.sessionKey), "SIGKILL"); } catch { /* already gone */ }
    if (!this.handle) { this.gaveUp = true; this.release?.(null); } // run() stops waiting for the open either way
  }

  /** The handle, or null when a cancel gave up on an open the helper never answered. */
  #open(key, name, resume) {
    this.slot = { sessionKey: key, agent: name };
    this.stages.start("session");
    const opening = this.engine.runtime.ensureSession({ ...this.slot, mode: "persistent", cwd: this.cwd, ...(resume ? { resumeSessionId: resume } : {}) });
    // When run() has stopped waiting, a late failure is not news and a late session is closed, so no helper is left behind.
    opening.then(handle => { if (this.gaveUp) void this.engine.runtime.close({ handle, reason: "cancelled while opening" }).catch(() => {}); }, () => {});
    const done = () => { for (const stage of OPENING) this.stages.stop(stage); };
    return Promise.race([opening, new Promise(resolve => { this.release = resolve; })]).finally(done);
  }

  /** The recap for a new session of this thread (recap.mjs). */
  async #recap() {
    return buildRecap({ seed: this.record?.seed, thread: this.thread, journal: this.journal, git: await gitState(this.cwd), redact: this.redact });
  }

  /** The prompt as acpx takes it: the text, and every picture as an image block. Other files stay paths in the text. */
  async #prompt(history) {
    const blocks = await promptBlocks(this.prompt, CONVENTION, this.files, true);
    const images = blocks.filter(block => block.type === "image").map(block => ({ mediaType: block.mimeType, data: block.data }));
    return { text: withRecap(history, blocks[0].text), attachments: images };
  }

  async #turn(prompt) {
    const { modes } = this.engine, expected = this.launch.expectedAgent, session = this.opened;
    const permit = makePermit({ tier: this.tier, redact: this.redact, denied: this.denied, hold: this.hold && this.#paused(this.hold), stopped: () => this.cancelled });
    const turn = this.live = this.engine.runtime.startTurn({
      handle: this.handle, text: prompt.text, ...(prompt.attachments.length ? { attachments: prompt.attachments } : {}), mode: "prompt", requestId: randomUUID(), onPermissionRequest: permit,
      // Runs after the session is loaded and before the prompt is written: the place for the fail-closed checks.
      assertActive: () => {
        if (this.cancelled) throw new Error("cancelled before the prompt was written");
        if (expected && modes.get(session) !== expected) { this.modeBad = true; throw new Error(MODE_MESSAGE); }
      }
    });
    let written = false;
    turn.promptStarted.then(() => { written = true; this.stages.start("firstUpdate"); this.stages.start("turn"); this.stages.watch(); }, () => {});
    try { for await (const event of turn.events) { this.stages.update(event); takeEvent(this, event); } } catch { /* the result carries the failure */ }
    return { result: await turn.result, written };
  }

  /** While the owner is asked, the inactivity limit is paused. */
  #paused(hold) {
    return async (...args) => { this.stages.pause(); try { return await hold(...args); } finally { this.stages.resume(); } };
  }

  /** @returns {Promise<{status: string, summary: string, sessionId: string|null, how: string, ask?: object}>} */
  async run() {
    const { config, thread, record, engine } = this, plugin = config.plugin;
    const identity = identityOf(config, this.launch, this.cwd);
    const { name } = resolve(config, thread, this.launch);
    const key = `${hash(thread)}:${identity.id.slice(0, 8)}`; // a changed launch is a new key, never a silent new session under the old one
    engine.register(registryOf(config, thread, this.launch));
    let resume = this.sessionId, how = "new", handoff = null, history = null;
    const watch = engine.watch = event => { // the helper process of this turn, as acpx starts it
      if (event === "spawning") this.stages.start("spawn");
      else if (event === "spawned") { this.stages.stop("spawn"); this.stages.start("initialize"); }
      else if (event === "initialized") this.stages.stop("initialize");
    };
    try {
      if (resume && record?.launch && !sameLaunch(record, identity)) { // changed setup: close the old helper, start a new session with a recap
        await closeOld(engine, `${hash(thread)}:${record.launch.id.slice(0, 8)}`, `${record.launch.plugin}:${hash(thread)}`, "launch changed");
        resume = undefined; handoff = NOTICES.changed; history = await this.#recap(); how = "handoff";
      } else if (resume && engine.tiers.get(key) && engine.tiers.get(key) !== this.tier) { // the helper reads its agent file at start: restart it, keep the session
        await closeOld(engine, key, name, "tier change");
      }
      engine.tiers.set(key, this.tier);
      if (resume) how = plugin === "dsh" ? "resumed" : "loaded";
      this.handle = await this.#open(key, name, resume);
      if (!this.handle) return this.#stopped(how);
      this.opened = this.handle.backendSessionId ?? resume;
      const extras = () => ({ launch: identity, ...(record?.seed ? {} : { seed: seedOf(this.prompt, this.redact) }) });
      await this.onSession?.(this.opened, how, extras());
      if (this.cancelled) return this.#stopped(how);
      let attempt = await this.#turn(await this.#prompt(history));
      if (attempt.result.status === "failed" && attempt.result.error?.detailCode === "SESSION_RESUME_REQUIRED" && !attempt.written && resume && !this.cancelled) {
        // acpx could not reload the saved session. Nothing was written, so a new session is safe; it gets the recap.
        await engine.runtime.prepareFreshSession({ handle: this.handle });
        this.handle = await this.#open(key, name, undefined);
        if (!this.handle) return this.#stopped(how);
        this.opened = this.handle.backendSessionId; how = "fresh-after-lost"; handoff = NOTICES.lost;
        await this.onSession?.(this.opened, how, extras());
        attempt = await this.#turn(await this.#prompt(await this.#recap()));
      }
      const outcome = this.#outcome(attempt, how, plugin);
      const fyi = [handoff && outcome.sessionId ? handoff : "", usageLine(this.usage)].filter(Boolean).join("\n");
      return fyi ? { ...outcome, notice: joinNotice(fyi, outcome.notice) } : outcome;
    } catch (error) {
      return this.#failed(error, how, plugin);
    } finally { this.stages.stopAll(); clearTimeout(this.killTimer); if (engine.watch === watch) engine.watch = null; }
  }

  #outcome({ result, written }, how, plugin) {
    if (this.modeBad) return { status: "failed", summary: MODE_MESSAGE, reason: "error", sessionId: this.opened, how };
    if (this.cancelled) return this.#stopped(how);
    if (result.status === "completed") return outcomeOf(this, String(result.stopReason ?? "end_turn"), how);
    if (result.status === "cancelled") return cancelled(this, how);
    return this.#failed(Object.assign(new Error(result.error?.message ?? "the helper failed"), result.error), how, plugin, written);
  }

  /** An error from acpx (thrown, or in the result of a turn). `written` says whether the prompt had been written. */
  #failed(error, how, plugin, written = false) {
    const text = this.redact(String(error.message));
    if (this.cancelled) return this.#stopped(how);
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
