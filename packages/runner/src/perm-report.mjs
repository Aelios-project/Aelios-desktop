// Tells the resident about a permission request this machine holds for its owner, and carries the owner's answer from
// the resident's Allow / Deny back into the journal (PROTOCOL.md, "permission"). Best effort: a report that does not get
// through is not repeated, the request still waits in the journal, and the owner can answer it on this machine.
import { CloudError } from "./cloud.mjs";

const ID = /^p_[0-9a-f]{10}$/;

export class PermReport {
  /** @param {{cloud: () => Promise<import("./cloud.mjs").Cloud>, journal: import("./journal.mjs").Journal|null, log?: Function}} o */
  constructor({ cloud, journal, log = () => {} }) { Object.assign(this, { cloud, journal, log }); this.chain = Promise.resolve(); }

  #send(body) {
    // One at a time and in order, so a "closed" never overtakes its "held".
    this.chain = this.chain.then(async () => (await this.cloud()).permission(body)).catch(error => {
      if (!(error instanceof CloudError)) this.log("permission report", error?.message);
    });
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
