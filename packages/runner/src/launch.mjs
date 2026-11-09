// How a thread's helper is started as acpx sees it, and the identity that tells whether it is still the same helper.
// The registry is ours (never acpx's built-in table) and its entries are argv arrays, so nothing is split or quoted.
// The tier is not in any of it: a change of tier must not change the identity (kiro-agent.mjs keeps the tier in the file).
import { createHash } from "node:crypto";

const hash = (text, length) => createHash("sha256").update(text).digest("hex").slice(0, length);

/** @param {{plugin: string}} config  @param {string} thread  @param {{command: string, args: string[]}} launch (from plugins.mjs `launchOf`) */
export function resolve(config, thread, launch) {
  return { name: `${config.plugin}:${hash(thread, 12)}`, argv: [launch.command, ...launch.args] };
}

/** The one-entry registry for acpx: registry name -> argv. */
export const registryOf = (config, thread, launch) => {
  const { name, argv } = resolve(config, thread, launch);
  return { [name]: argv };
};

/** What the thread record keeps. `adapterVersion` is null until adapters exist (a later PR). */
export function identityOf(config, launch, cwd) {
  const parts = { plugin: config.plugin, command: launch.command, args: launch.args, adapterVersion: null, cwd };
  return { ...parts, id: hash(JSON.stringify(parts), 32) };
}

/** True when the thread record has an identity and it is the current one. */
export const sameLaunch = (record, current) => Boolean(record?.launch?.id) && record.launch.id === current.id;
