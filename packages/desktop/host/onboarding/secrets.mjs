// The wizard's own secrets in DSH credentials. A generated secret is written here before Cloudflare sees it,
// so a crash between the two never leaves a Cloudflare secret that nobody knows.
const PREFIX = "aelios-desktop/onboarding-secret/";
const NAME = /^[a-z][a-z0-9-]{0,39}$/;

export class Secrets {
  constructor(credentials) { this.credentials = credentials; this.queue = Promise.resolve(); }

  async get(name) {
    if (!NAME.test(name)) throw new Error("the secret name is not valid");
    await this.queue;
    const record = await this.credentials.readRecord(PREFIX + name);
    return record?.kind === "grant" ? String(record.payload?.value ?? "") || null : null;
  }

  // Writes run one after another so two quick steps cannot overwrite each other.
  set(name, value) {
    if (!NAME.test(name)) return Promise.reject(new Error("the secret name is not valid"));
    if (!value) return Promise.reject(new Error("the secret is empty"));
    const run = this.queue.then(() => this.credentials.modifyRecord(PREFIX + name, async () => ({
      kind: "grant", payload: { value: String(value) },
    })));
    this.queue = run.catch(() => {});
    return run;
  }

  delete(name) {
    const run = this.queue.then(() => this.credentials.modifyRecord(PREFIX + name, async () => null));
    this.queue = run.catch(() => {});
    return run;
  }
}
