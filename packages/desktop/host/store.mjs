// The saved connection: address, web key, resident and runner choices. It lives in DSH's credential
// store, and only the host half reads it. The client half never sees the key.
const KEY = "aelios-desktop/connection";

export class Store {
  constructor(credentials) { this.credentials = credentials; this.queue = Promise.resolve(); }

  async get() {
    await this.queue;
    const record = await this.credentials.readRecord(KEY);
    return record?.kind === "grant" ? structuredClone(record.payload) : null;
  }

  // Writes run one after another so two quick calls cannot overwrite each other.
  set(value) {
    const run = this.queue.then(() => this.credentials.modifyRecord(KEY, async () => (
      value ? { kind: "grant", payload: structuredClone(value) } : null
    )));
    this.queue = run.catch(() => {});
    return run;
  }

  clear() { return this.set(null); }
}
