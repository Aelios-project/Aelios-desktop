// Saved progress for the wizard: which path, which card, which steps are done and where it stopped.
// Same record rules as the connection store; it never holds a secret.
const KEY = "aelios-desktop/onboarding";

export class Progress {
  constructor(credentials) { this.credentials = credentials; this.queue = Promise.resolve(); }

  async get() {
    await this.queue;
    const record = await this.credentials.readRecord(KEY);
    return record?.kind === "grant" ? structuredClone(record.payload) : null;
  }

  set(value) {
    const run = this.queue.then(() => this.credentials.modifyRecord(KEY, async () => (
      value ? { kind: "grant", payload: structuredClone(value) } : null
    )));
    this.queue = run.catch(() => {});
    return run;
  }

  clear() { return this.set(null); }
}
