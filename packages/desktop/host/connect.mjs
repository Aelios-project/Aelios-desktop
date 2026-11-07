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
  return { url, key, plugin, access, workspace, resident: "default" };
}

export async function connect(input, { entry, store, supervisor, env = {}, node }) {
  const settings = validate(input);
  const opts = { env: { ...env, AELIOS_WEB_KEY: settings.key }, node };
  // A runner that is already paired must be unpaired first, or "pair" refuses.
  if ((await runnerStatus(entry, opts))?.paired) await runOnce(entry, ["unpair"], opts);
  const { code, err } = await runOnce(entry, ["pair", "--url", settings.url, "--workspace", settings.workspace, "--access", settings.access, "--plugin", settings.plugin], opts);
  if (code !== 0) throw new ConnectError(err.replace(/^aelios-runner:\s*/, "").trim().split("\n").pop() || "Pairing failed");
  await store.set(settings);
  supervisor.start();
}

export async function disconnect({ entry, store, supervisor, env = {}, node }) {
  const connection = await store.get();
  await supervisor.stop();
  if (connection) await runOnce(entry, ["unpair"], { env: { ...env, AELIOS_WEB_KEY: connection.key }, node });
  await store.clear();
  supervisor.reset();
}
