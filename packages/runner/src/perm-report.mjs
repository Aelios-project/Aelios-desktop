// Tells the resident about a permission request this machine holds for its owner, and carries the owner's answer from
// the resident's Allow / Deny back into the journal (PROTOCOL.md, "permission"). A report that fails for a reason worth
// retrying (no answer, 429, 5xx) is sent again a few times with a growing wait, and every failure is logged. After the last
// try it is dropped: the request still waits in the journal, and the owner can answer it on this machine.
import { CloudError } from "./cloud.mjs";

const ID = /^p_[0-9a-f]{10}$/;
/** Waits before the 2nd, 3rd and 4th try. shortcut: a fixed short ladder, a resident that stays away longer loses the report; upgrade by re-sending open requests on the next heartbeat. */
export const RETRY_MS = [1000, 3000, 6000];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export class PermReport {
  /** @param {{cloud: () => Promise<import("./cloud.mjs").Cloud>, journal: import("./journal.mjs").Journal|null, log?: Function, retryMs?: number[]}} o */
  constructor({ cloud, journal, log = () => {}, retryMs = RETRY_MS }) { Object.assign(this, { cloud, journal, log, retryMs }); this.chain = Promise.resolve(); }

  async #deliver(body) {
    for (let attempt = 0; ; attempt++) {
      try { await (await this.cloud()).permission(body); return; }
      catch (error) {
        const again = attempt < this.retryMs.length && error instanceof CloudError && error.retry;
        this.log(`permission report ${body.state} ${body.id}`, again ? `failed (${error.message}), trying again` : `failed (${error?.message}), giving up`);
        if (!again) return;
        await sleep(this.retryMs[attempt]);
      }
    }
  }

  #send(body) {
    // One at a time and in order, so a "closed" never overtakes its "held" (it waits while the held one is retried).
    this.chain = this.chain.then(() => this.#deliver(body));
    return this.chain;
  }

  /** The hooks for Journal.hold: report the request when it is written, and its end when it is settled. */
  on(work, info) {
    const base = { workId: work.workId, token: work.token };
    return {
      held: id => { void this.#send({ ...base, id, state: "held", title: info.title, kind: info.kind, ...(info.detail ? { detail: info.detail } : {}) }); },
      closed: id => this.#send({ ...base, id, state: "closed" })
    };
  }

  /** The owner's buttons on the resident, as the poll brought them. A request already settled stays as it is. */
  apply(answers) {
    if (!this.journal || !Array.isArray(answers)) return;
    for (const item of answers.slice(0, 20)) if (item && ID.test(item.id ?? "") && typeof item.allow === "boolean") this.journal.decide(item.id, item.allow, "web");
  }
}
