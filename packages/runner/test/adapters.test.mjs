// Pinned ACP adapters for Claude Code and Codex (src/adapters.mjs, experimental plugs `claude` and `codex`).
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { ADAPTERS, adapterLaunch, checkPins, installAdapter } from "../src/adapters.mjs";
import { identityOf } from "../src/launch.mjs";
import { binOf, launchOf } from "../src/plugins.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const withHome = async fn => { const home = mkdtempSync(path.join(os.tmpdir(), "adapters-")); try { return await fn(home); } finally { rmSync(home, { recursive: true, force: true }); } };

/** A stand-in for npm: writes the package and npm's lock record, with the integrity given. */
const fakeNpm = (name, integrity = ADAPTERS[name].integrity, version = ADAPTERS[name].version) => async args => {
  const prefix = args[args.indexOf("--prefix") + 1], pin = ADAPTERS[name];
  const pkg = path.join(prefix, "node_modules", ...pin.package.split("/"));
  mkdirSync(path.dirname(path.join(pkg, pin.bin)), { recursive: true });
  writeFileSync(path.join(pkg, pin.bin), "// adapter");
  writeFileSync(path.join(prefix, "node_modules", ".package-lock.json"), JSON.stringify({ packages: { [`node_modules/${pin.package}`]: { version, integrity } } }));
};

test("every pin is exact: a version x.y.z, a sha512 integrity, no range, no latest", () => {
  checkPins(ADAPTERS);
  assert.deepEqual(Object.keys(ADAPTERS).sort(), ["claude", "codex"]);
  for (const bad of [{ version: "^1.2.3" }, { version: "latest" }, { version: "1.2" }, { integrity: undefined }, { integrity: "sha1-abc" }, { bin: "../x.js" }]) {
    assert.throws(() => checkPins({ x: { ...ADAPTERS.claude, ...bad } }), /adapter x/);
  }
});

test("no command anywhere starts npx", () => {
  for (const dir of ["src", "bin"]) for (const file of readdirSync(path.join(ROOT, dir))) {
    assert.ok(!/["'`]npx["'`\s]/.test(readFileSync(path.join(ROOT, dir, file), "utf8")), `${dir}/${file} mentions an npx command`);
  }
  assert.ok(!readFileSync(path.join(ROOT, "adapters.json"), "utf8").includes("npx"));
});

for (const name of ["claude", "codex"]) {
  test(`[${name}] not installed: a clear message; installed: node with the pinned bin, and the version in the launch identity`, () => withHome(async home => {
    const config = { plugin: name, home };
    assert.throws(() => binOf(config), new RegExp(`aelios-runner install-adapter ${name}`));
    const bin = await installAdapter(home, name, fakeNpm(name));
    assert.equal(bin, path.join(home, "adapters", `${name}-${ADAPTERS[name].version}`, "node_modules", ...ADAPTERS[name].package.split("/"), ADAPTERS[name].bin));
    const launch = launchOf(config, "edit", "/w", "t_main");
    assert.deepEqual([launch.command, launch.args], [process.execPath, [bin]]);
    assert.equal(launch.adapterVersion, ADAPTERS[name].version);
    const identity = identityOf(config, launch, "/w");
    assert.equal(identity.adapterVersion, ADAPTERS[name].version);
    assert.notEqual(identityOf(config, { ...launch, adapterVersion: "0.0.1" }, "/w").id, identity.id, "a raised pin is a new launch (a visible handoff)");
    assert.deepEqual(adapterLaunch(home, name).args, [bin]);
  }));

  test(`[${name}] an install that does not match the pin is refused and leaves nothing`, () => withHome(async home => {
    await assert.rejects(installAdapter(home, name, fakeNpm(name, "sha512-AAAA")), /does not match the pin/);
    await assert.rejects(installAdapter(home, name, fakeNpm(name, undefined, "9.9.9")), /does not match the pin/);
    assert.deepEqual(readdirSync(path.join(home, "adapters")), []);
    assert.throws(() => adapterLaunch(home, name), /not installed/);
  }));
}

test("install-adapter asks npm for the exact pin, without scripts", () => withHome(async home => {
  let seen;
  await installAdapter(home, "claude", async (args, cwd) => { seen = args; await fakeNpm("claude")(args, cwd); });
  assert.ok(seen.includes(`${ADAPTERS.claude.package}@${ADAPTERS.claude.version}`) && seen.includes("--ignore-scripts"));
  assert.ok(existsSync(adapterLaunch(home, "claude").args[0]));
  await assert.rejects(installAdapter(home, "gemini", fakeNpm("claude")), /unknown adapter/);
}));
