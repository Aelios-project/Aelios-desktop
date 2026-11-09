// Claude Code and Codex through their ACP adapters (experimental plugs `claude` and `codex`). Each adapter is pinned in
// adapters.json (package, exact version, integrity), installed once by `aelios-runner install-adapter <name>` into
// <home>/adapters/<name>-<version>, and started from there with node. Never through npx, never a "latest".
// shortcut: the integrity covers the adapter package itself; its own dependencies come as npm resolves them at install
// time. Upgrade to a shipped lock file per adapter if that matters.
import { execFile } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

export const ADAPTERS = JSON.parse(readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "adapters.json"), "utf8"));
const VERSION = /^\d+\.\d+\.\d+$/, INTEGRITY = /^sha512-[A-Za-z0-9+/]+=*$/;

/** Throws when a pin is not exact: a range, a tag such as latest, or no sha512 integrity. */
export function checkPins(table) {
  for (const [name, pin] of Object.entries(table)) {
    if (typeof pin.package !== "string" || !pin.package) throw new Error(`adapter ${name}: no package`);
    if (!VERSION.test(pin.version ?? "")) throw new Error(`adapter ${name}: version must be exact (x.y.z), not "${pin.version}"`);
    if (!INTEGRITY.test(pin.integrity ?? "")) throw new Error(`adapter ${name}: integrity must be a sha512 hash`);
    if (typeof pin.bin !== "string" || !pin.bin || path.isAbsolute(pin.bin) || pin.bin.split("/").includes("..")) throw new Error(`adapter ${name}: bad bin path`);
  }
}

const pinOf = name => { const pin = ADAPTERS[name]; if (!pin) throw new Error(`unknown adapter "${name}"; use one of ${Object.keys(ADAPTERS).join(", ")}`); return pin; };
const dirOf = (home, name, pin) => path.join(home, "adapters", `${name}-${pin.version}`);
const binIn = (dir, pin) => path.join(dir, "node_modules", ...pin.package.split("/"), pin.bin);

/** How to start an installed adapter: `{command: node, args: [its bin], version}`. Throws when it is not installed. */
export function adapterLaunch(home, name) {
  const pin = pinOf(name), bin = binIn(dirOf(home, name, pin), pin);
  if (!existsSync(bin)) throw new Error(`the ${name} adapter ${pin.package}@${pin.version} is not installed; run "aelios-runner install-adapter ${name}"`);
  return { command: process.execPath, args: [bin], version: pin.version };
}

const npm = (args, cwd) => promisify(execFile)(process.platform === "win32" ? "npm.cmd" : "npm", args, { cwd, timeout: 10 * 60_000, maxBuffer: 16 * 1024 * 1024 });

/**
 * Installs the pinned adapter, then checks the installed package against the pinned integrity. Nothing is kept when
 * the check fails. `run(args, cwd)` runs npm (tests pass a fake).
 */
export async function installAdapter(home, name, run = npm) {
  const pin = pinOf(name), dir = dirOf(home, name, pin), temp = `${dir}.partial`;
  rmSync(temp, { recursive: true, force: true });
  mkdirSync(path.dirname(dir), { recursive: true, mode: 0o700 });
  try {
    await run(["install", "--prefix", temp, "--no-save", "--no-audit", "--no-fund", "--ignore-scripts", `${pin.package}@${pin.version}`], home);
    let installed;
    try { installed = JSON.parse(readFileSync(path.join(temp, "node_modules", ".package-lock.json"), "utf8")).packages?.[`node_modules/${pin.package}`]; } catch { installed = null; }
    if (installed?.version !== pin.version || installed?.integrity !== pin.integrity) throw new Error(`the installed ${pin.package} does not match the pin (version ${installed?.version ?? "?"}, integrity ${installed?.integrity ?? "?"})`);
    if (!existsSync(binIn(temp, pin))) throw new Error(`the installed ${pin.package} has no ${pin.bin}`);
    rmSync(dir, { recursive: true, force: true });
    renameSync(temp, dir);
    return binIn(dir, pin);
  } finally { rmSync(temp, { recursive: true, force: true }); }
}
