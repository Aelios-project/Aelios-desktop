// The runner: polls the resident for work addressed to threads, runs each through an ACP helper, and returns receipts.
// Nothing here listens on a port. Work, sessions and unsent receipts are on disk, so a restart or a dropped line
// never runs a job twice and never loses a result.
import { createHash, randomBytes } from "node:crypto";
import { mkdirSync, realpathSync } from "node:fs";
import { Cloud, CloudError } from "./cloud.mjs";
import { Turn } from "./helper.mjs";
import { readAttachments, saveAttachments } from "./inbox.mjs";
import { Progress } from "./steps.mjs";
import { computerName } from "./machine-name.mjs";
import { workspaceDenied } from "./reason.mjs";
import { launchOf } from "./plugins.mjs";
import { lowest, tierOf } from "./permission.mjs";
import { fit, shrink } from "./receipt.mjs";

const ID = /^[A-Za-z0-9_.:-]{1,64}$/;
const THREAD = /^[A-Za-z0-9_.:-]{1,160}$/;
const KINDS = ["job", "say", "mail", "cancel"];
const TEXT_MAX = 16_000;
const SUMMARY_MAX = 4000;
const safeId = id => (THREAD.test(id) ? id : "acp_" + createHash("sha1").update(id).digest("hex").slice(0, 24));

/** Remember a question that is open on a thread, so a later finished turn can close it. */
function remember(state, thread, key) {
  const entry = (state.threads[thread] ??= { asks: [] });
  if (!entry.asks.includes(key)) entry.asks.push(key);
}

function redactor(secrets, places) {
  return text => {
    let out = String(text);
    for (const place of places) if (place) out = out.split(place).join("[workspace]");
    for (const secret of secrets) if (secret) out = out.split(secret).join("[token]");
    return out.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "").trim().slice(0, SUMMARY_MAX);
  };
}

export class Runner {
  /** @param {{config: object, state: import("./state.mjs").StateFile, cloud?: Cloud, log?: Function, request?: Function}} o */
  constructor({ config, state, cloud, journal = null, log = () => {}, request = fetch }) {
    this.config = config; this.state = state; this.log = log; this.request = request; this.journal = journal;
    this.cloud = cloud ?? null;
    this.live = null; this.running = null; this.flushing = null; this.shuttingDown = false; this.revoked = false;
    this.error = ""; this.lastBeat = 0; this.failures = 0;
    this.pollMs = config.pollMs ?? 5000; this.heartbeatMs = config.heartbeatMs ?? 30_000; this.backoffMaxMs = config.backoffMaxMs ?? 60_000;
  }

  async #cloud() {
    if (this.cloud) return this.cloud;
    const { device } = await this.state.read();
    if (!device) throw new Error("not paired");
    return (this.cloud = new Cloud({ url: this.config.url, resident: this.config.resident, token: device.token, request: this.request }));
  }

  // ---- receipts -----------------------------------------------------------------------------------------------

  #receipt(work, type, extra = {}) {
    return fit({ receiptId: `${work.workId}:${type}`, workId: work.workId, token: work.token, type, ...extra });
  }

  async #queueReceipts(receipts, change = () => {}) {
    await this.state.update(state => {
      change(state);
      for (const receipt of receipts) if (!state.outbox.some(item => item.receiptId === receipt.receiptId)) state.outbox.push(receipt);
    });
    void this.flush().catch(() => {});
  }

  /** Sends what is waiting, oldest first. A receipt leaves the file only once the resident has accepted it. */
  flush() {
    this.flushing ??= (async () => {
      try {
        const cloud = await this.#cloud();
        for (let receipt of (await this.state.read()).outbox) {
          const id = receipt.receiptId;
          for (;;) {
            try { await cloud.receipt(receipt); break; }
            catch (error) {
              if (!(error instanceof CloudError) || error.revoked) throw error;
              if (error.retry) { this.error = "The cloud is unreachable for now. Receipts are kept and will be resent."; return; }
              const smaller = error.status === 413 ? shrink(receipt) : null; // too big: send a shorter one, do not lose the result
              if (!smaller) { this.log("receipt dropped", id, error.code || error.status); break; } // it will never be accepted
              await this.state.update(state => { state.outbox = state.outbox.map(item => (item.receiptId === id ? smaller : item)); });
              receipt = smaller;
            }
          }
          await this.state.update(state => { state.outbox = state.outbox.filter(item => item.receiptId !== id); });
        }
        this.error = "";
      } finally { this.flushing = null; }
    })();
    return this.flushing;
  }

  // ---- receiving work -----------------------------------------------------------------------------------------

  #valid(work) {
    return work && typeof work === "object" && ID.test(work.workId ?? "") && typeof work.token === "string" && work.token.length > 0 && work.token.length <= 200
      && typeof work.thread === "string" && THREAD.test(work.thread) && KINDS.includes(work.kind)
      && (work.kind === "cancel" || (typeof work.text === "string" && work.text.trim() && work.text.length <= TEXT_MAX))
      && (work.access === undefined || tierOf(work.access) !== null)
      && (work.kind === "cancel" || readAttachments(work.attachments) !== null);
  }

  async receive(raw) {
    const identifiable = raw && typeof raw === "object" && ID.test(raw.workId ?? "") && typeof raw.token === "string" && raw.token.length <= 200;
    if (!this.#valid(raw)) {
      this.log("work refused", raw?.workId);
      await this.#queueReceipts(identifiable ? [this.#receipt(raw, "final", { status: "failed", reason: "error", summary: "The runner could not read this message (bad format) and did not run it." })] : [], state => { state.claimKey = null; });
      return;
    }
    // Only what the protocol names is kept; anything else the cloud sent (a folder, a command, a helper) is dropped here.
    const work = { workId: raw.workId, token: raw.token, thread: raw.thread, kind: raw.kind, title: String(raw.title ?? "").slice(0, 200),
      ...(raw.kind === "cancel" ? {} : { text: raw.text, ...(raw.attachments?.length ? { attachments: readAttachments(raw.attachments) } : {}) }), ...(raw.access ? { access: raw.access } : {}), ...(raw.kind === "say" ? { interrupt: raw.interrupt !== false } : {}) };
    const receipts = [];
    let stop = false;
    await this.state.update(state => {
      state.claimKey = null;
      if (work.kind === "cancel") {
        const dropped = state.queue.filter(item => item.thread === work.thread);
        state.queue = state.queue.filter(item => item.thread !== work.thread);
        for (const item of dropped) receipts.push(this.#receipt(item, "final", { status: "cancelled", summary: "Stopped before it started." }));
        stop = Boolean(this.live && this.live.work.thread === work.thread);
        receipts.push(this.#receipt(work, "final", { status: "done", summary: stop ? "Stopped the turn that was running." : "This thread has no turn running." }));
      } else if (work.kind === "say" && work.interrupt) {
        let at = 0;
        while (state.queue[at]?.kind === "say" && state.queue[at].interrupt) at++; // says keep their order
        state.queue.splice(at, 0, work);
        stop = Boolean(this.live && this.live.work.thread === work.thread);
      } else {
        if (this.live || state.queue.length) receipts.push(this.#receipt(work, "queued"));
        state.queue.push(work);
      }
    });
    if (stop) this.#stopLive();
    await this.#queueReceipts(receipts);
    this.kick();
  }

  #stopLive() { if (!this.live) return; if (this.live.turn) this.live.turn.cancel(); else this.live.pendingCancel = true; }

  /** Stop the turn that is running on a thread (also the hook for a local "stop" later). */
  cancel(thread) { if (this.live && this.live.work.thread === thread) { this.#stopLive(); return true; } return false; }

  // ---- running work -------------------------------------------------------------------------------------------

  kick() { if (this.revoked) return; this.running ??= this.#drain().finally(() => { this.running = null; }); }

  async #drain() {
    for (;;) {
      if (this.shuttingDown || this.revoked) return;
      const work = await this.state.update(state => { const next = state.queue.shift() ?? null; state.current = next; return next; });
      if (!work) return;
      this.live = { work, turn: null, pendingCancel: false };
      try { await this.#execute(work); }
      catch (error) {
        this.log("execute failed", work.workId, error?.message);
        await this.#queueReceipts([this.#receipt(work, "final", { status: "needs_you", summary: "The runner hit an error handling this message. It will not be redone automatically.",
          ask: { key: "runner:" + work.workId, question: "The runner hit an error handling this message and the result is not confirmed. Try again?" } })], state => remember(state, work.thread, "runner:" + work.workId));
      } finally {
        this.live = null;
        await this.state.update(state => { state.current = null; });
      }
    }
  }

  async #execute(work) {
    const state = await this.state.read();
    this.journal?.turn(work);
    const record = state.threads[work.thread];
    let cwd = record?.cwd;
    if (!cwd) {
      try { mkdirSync(this.config.workspace, { recursive: true }); cwd = realpathSync(this.config.workspace); }
      catch (error) {
        if (!workspaceDenied(error)) throw error;
        this.journal?.end(work, "failed", "workspace");
        return this.#queueReceipts([this.#receipt(work, "final", { status: "failed", reason: "workspace_denied", summary: "The runner could not use its workspace folder. Check that the folder exists and this user may write to it." })]);
      }
    }
    const tier = lowest(tierOf(this.config.access) ?? "read", work.access ?? this.config.access ?? "read");
    const redact = redactor([state.device?.token, work.token], [cwd, this.config.workspace]);
    // Pictures and files come down now, into this thread's folder. If they cannot, the turn still runs and the helper is told which were lost.
    const files = work.attachments?.length ? await saveAttachments({ cloud: await this.#cloud(), work, cwd }).catch(() => ({ saved: [], failed: work.attachments.map(item => item.name) })) : null;
    const progress = new Progress({ send: async steps => (await this.#cloud()).progress({ workId: work.workId, token: work.token, steps }), ms: this.config.progressMs });
    const turn = new Turn({
      files, onStep: steps => progress.push(steps), launch: launchOf(this.config, tier), cwd, tier, redact, sessionId: record?.sessionId, prompt: work.text,
      timeoutMs: this.config.turnTimeoutMs, killAfterMs: this.config.killAfterMs,
      hold: this.journal && ((info, stopped) => this.journal.hold(work.thread, info, stopped)),
      onSession: async (sessionId, how) => {
        // The thread's folder and session are fixed from the first time it has one.
        await this.state.update(s => { s.threads[work.thread] = { ...s.threads[work.thread], sessionId, cwd, plugin: this.config.plugin, asks: s.threads[work.thread]?.asks ?? [] }; });
        await this.#queueReceipts([this.#receipt(work, "started", { sessionId: safeId(sessionId) })]);
        this.log("started", work.workId, how);
      }
    });
    this.live.turn = turn;
    if (this.live.pendingCancel || this.shuttingDown) turn.cancel();
    let outcome;
    try { outcome = await turn.run(); } finally { progress.close(); }
    if (this.shuttingDown && outcome.status === "cancelled") {
      outcome = { ...outcome, status: "needs_you", summary: "The runner was stopped and this turn did not finish. It will not be redone automatically.", ask: { key: "stopped:" + work.workId, question: "The runner was stopped and this turn did not finish. Do it again?" } };
    }
    const receipt = { status: outcome.status, summary: outcome.summary || "(no content)", ...(outcome.status === "failed" && outcome.reason ? { reason: outcome.reason } : {}) };
    await this.state.update(s => {
      if (outcome.status === "needs_you" && outcome.ask) remember(s, work.thread, outcome.ask.key);
      const entry = s.threads[work.thread];
      if (outcome.status === "done" && entry?.asks.length) { receipt.resolve = entry.asks; entry.asks = []; }
    });
    if (outcome.sessionId) receipt.sessionId = safeId(outcome.sessionId);
    if (outcome.ask) receipt.ask = outcome.ask;
    if (outcome.notice) receipt.notice = outcome.notice;
    this.journal?.end(work, receipt.status, receipt.summary);
    await this.#queueReceipts([this.#receipt(work, "final", receipt)]);
  }

  /** A turn that was running when the runner stopped has an unknown outcome. It is reported, never rerun. */
  async recover() {
    const state = await this.state.read();
    if (!state.current) return;
    const work = state.current;
    await this.#queueReceipts([this.#receipt(work, "final", { status: "needs_you", summary: "The runner restarted and the result of this turn is not confirmed. It will not be redone automatically. Please check the thread.",
      ask: { key: "restart:" + work.workId, question: "The runner restarted and the result of this turn is not confirmed. Do it again?" } })],
    s => { s.current = null; remember(s, work.thread, "restart:" + work.workId); });
  }

  /** Pairing was withdrawn: stop the running turn, drop what is waiting. Nothing is claimed or started again. */
  async #revoke() {
    this.revoked = true;
    await this.state.update(s => { if (s.device) s.device.revoked = true; s.queue = []; s.claimKey = null; s.outbox = []; });
    this.#stopLive();
    this.error = "The pairing was revoked. The runner has stopped and queued work will not run.";
    this.log(this.error);
  }

  // ---- the loop -----------------------------------------------------------------------------------------------

  async tick() {
    const state = await this.state.read();
    if (!state.device) return;
    if (state.device.revoked) { if (!this.revoked) await this.#revoke(); return; }
    try {
      const cloud = await this.#cloud();
      if (Date.now() - this.lastBeat >= this.heartbeatMs) {
        await cloud.heartbeat({ plugin: this.config.plugin, busy: this.live?.work.thread ?? null, label: this.config.label || computerName() });
        this.lastBeat = Date.now();
      }
      await this.flush();
      const busy = Boolean(this.live) || state.queue.length > 0;
      const claimKey = state.claimKey ?? await this.state.update(s => (s.claimKey ??= "ck_" + randomBytes(12).toString("hex")));
      const { work } = await cloud.poll({ claimKey, accept: busy ? ["say", "mail", "cancel"] : KINDS });
      if (work) await this.receive(work);
      this.kick();
      this.error = ""; this.failures = 0;
    } catch (error) {
      this.failures++;
      if (error.revoked) { await this.#revoke(); return; }
      this.error = error.retry ? "The cloud is unreachable for now." : `The cloud refused the request (${error.code || error.status || error.message}).`;
      this.log("tick", this.error);
    }
  }

  async start(signal) {
    await this.recover();
    if ((await this.state.read()).device?.revoked) await this.#revoke();
    this.kick(); // work left in the queue by an earlier run goes on
    while (!signal.aborted && !this.revoked) {
      await this.tick();
      await new Promise(resolve => {
        const done = () => { clearTimeout(timer); signal.removeEventListener("abort", done); resolve(); };
        const timer = setTimeout(done, Math.min(this.pollMs * 2 ** Math.min(this.failures, 10), this.backoffMaxMs)); // backs off while the resident is unreachable
        signal.addEventListener("abort", done, { once: true });
      });
    }
    await this.stop();
  }

  async stop() {
    this.shuttingDown = true;
    this.#stopLive();
    await this.running;
    await this.flush().catch(() => {}); // best effort; anything unsent stays on disk
  }
}
