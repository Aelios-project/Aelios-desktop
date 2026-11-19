// In-memory stand-ins for the two DSH services the wizard saves into.
export class MemoryCredentials {
  records = new Map();
  async readRecord(key) { return this.records.get(key) ?? null; }
  async modifyRecord(key, change) {
    const next = await change(this.records.get(key));
    if (next == null) this.records.delete(key); else this.records.set(key, next);
    return next;
  }
}

export class MemoryProgress {
  value = null;
  async get() { return this.value && structuredClone(this.value); }
  async set(value) { this.value = value && structuredClone(value); }
  clear() { this.value = null; }
}
