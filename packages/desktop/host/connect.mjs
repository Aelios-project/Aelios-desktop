// Connect: checks the form, pairs the runner with the web key, saves the connection.
import os from "node:os";
import path from "node:path";
import { runOnce, runnerStatus } from "./runner.mjs";

export const defaultWorkspace = () => path.join(os.homedir(), "AeliosWork");
const HELPERS = ["dsh", "kiro"];
const TIERS = ["read", "edit", "full"];

export class ConnectError extends Error {}

/** Returns the clean settings, or throws a ConnectError that is safe to show. */
export function validate(input) {
  const url = String(input.url ?? "").trim().replace(/\/+$/, "");
  if (!/^https:\/\//.test(url) && !/^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(url)) throw new ConnectError("The address must start with https://");
  try { new URL(url); } catch { throw new ConnectError("The address is not valid"); }
  const key = String(input.key ?? "").trim();
  if (!key) throw new ConnectError("The web key is empty");
  const plugin = input.helper ?? "dsh";
  const access = input.access ?? "edit";
  if (!HELPERS.includes(plugin)) throw new ConnectError("The helper must be dsh or kiro");
  if (!TIERS.includes(access)) throw new ConnectError("The permission must be read, edit or full");
  if (access === "full" && input.confirmFull !== true) throw new ConnectError("Full permission needs your confirmation");
  const workspace = String(input.workspace || defaultWorkspace());
  if (!path.isAbsolute(workspace)) throw new ConnectError("The folder must be an absolute path");
  const resident = String(input.resident || "default");
  if (!/^[a-z][a-z0-9-]{0,23}$/.test(resident)) throw new ConnectError("The resident id is not valid");
  return { url, key, plugin, access, workspace, resident };
}

export async function connect(input, { entry, store, supervisor, env = {}, node }) {
  const settings = validate(input);
  const opts = { env: { ...env, AELIOS_WEB_KEY: settings.key }, node };
  // A runner that is already paired must be unpaired first, or "pair" refuses.
  if ((await runnerStatus(entry, opts))?.paired) await runOnce(entry, ["unpair"], opts);
  const { code, err } = await runOnce(entry, pairArgs(settings), opts);
  if (code !== 0) throw new ConnectError(oneLine(err));
  await store.set(settings);
  supervisor.start();
}

const pairArgs = (s) => ["pair", "--url", s.url, "--resident", s.resident || "default", "--workspace", s.workspace, "--access", s.access, "--plugin", s.plugin];

// The runner's last "aelios-runner:" line; Node's own warnings on stderr (a proxy notice, say) are not the error.
const oneLine = (err) => {
  const lines = err.split("\n").map((line) => line.trim()).filter((line) => line.startsWith("aelios-runner:"));
  return (lines.pop() ?? "").replace(/^aelios-runner:\s*/, "") || "Pairing failed";
};

/**
 * Starts the runner for a saved connection, pairing it first with the saved settings when it is not paired.
 * Never throws: a pairing error becomes the runner's one-line error, which the This machine view shows.
 */
export async function ensurePaired({ entry, store, supervisor, env = {}, node }) {
  try {
    const saved = await store.get();
    if (!saved) return;
    const opts = { env: { ...env, AELIOS_WEB_KEY: saved.key }, node };
    const status = await runnerStatus(entry, opts);
    if (!status) return supervisor.fail("crashed", "The runner could not be started");
    if (!status.paired) {
      const { code, err } = await runOnce(entry, pairArgs(saved), opts);
      if (code !== 0) return supervisor.fail("unpaired", oneLine(err));
    }
    supervisor.start();
  } catch (e) { supervisor.fail("crashed", e.message); }
}

export async function disconnect({ entry, store, supervisor, env = {}, node }) {
  const connection = await store.get();
  await supervisor.stop();
  if (connection) await runOnce(entry, ["unpair"], { env: { ...env, AELIOS_WEB_KEY: connection.key }, node });
  await store.clear();
  supervisor.reset();
}
