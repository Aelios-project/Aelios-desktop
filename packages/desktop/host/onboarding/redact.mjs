// Removes every secret the wizard holds from text that may be shown, stored or sent to a model.
// Short values are ignored: replacing three characters would shred ordinary words.
const MARK = "[redacted]";
const MIN = 4;
const MAX_DEPTH = 8;

export class Redactor {
  #values = new Set();

  constructor(values = []) { values.forEach((value) => this.add(value)); }

  get size() { return this.#values.size; }

  add(value) {
    const text = String(value ?? "");
    if (text.length >= MIN) this.#values.add(text);
    return this;
  }

  drop(value) { this.#values.delete(String(value ?? "")); }

  /** The longest first, so a secret that contains another is removed whole. */
  text(value) {
    let out = String(value ?? "");
    if (!this.#values.size) return out;
    for (const secret of [...this.#values].sort((a, b) => b.length - a.length)) out = out.split(secret).join(MARK);
    return out;
  }

  /** The same for a value that is about to be saved or returned: strings anywhere in it are cleaned. */
  value(input, depth = 0) {
    if (depth > MAX_DEPTH) return MARK;
    if (typeof input === "string") return this.text(input);
    if (Array.isArray(input)) return input.map((item) => this.value(item, depth + 1));
    if (input && typeof input === "object") {
      const out = {};
      for (const [key, item] of Object.entries(input)) out[key] = this.value(item, depth + 1);
      return out;
    }
    return input;
  }

  /** A child process may not carry a held secret in its arguments, where `ps` would show it. */
  guard(args) {
    for (const arg of args) {
      if (this.text(arg) !== String(arg)) throw new Error("a secret may not be passed as an argument");
    }
  }
}
