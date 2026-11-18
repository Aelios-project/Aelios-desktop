// What a job's `model` and `family` mean on this machine (PROTOCOL.md, "job.model"). They are read only when the
// resident's heartbeat lists `job.model`; the machine's own config still decides the helper, folder and tier.
import { FAMILY, familyOf, sameFamilyNotice } from "./family.mjs";

const MODEL = /^[^\s\u0000-\u001f]{1,200}$/;

/** The fields to keep on a received work: valid ones only, and nothing when the resident does not take `job.model`. */
export function readPick(raw, wire) {
  if (!wire.has("job.model")) return {};
  return { ...(typeof raw.model === "string" && MODEL.test(raw.model) ? { model: raw.model } : {}), ...(typeof raw.family === "string" && FAMILY.test(raw.family) ? { family: raw.family } : {}) };
}

/**
 * What to do with the job's model: `model` is what the turn must set before its prompt (never for Kiro, which runs on
 * auto), `notice` the fyi lines to put in front of the receipt's notice.
 * shortcut: the wire carries one family, not the author's, so "the author" is the previous job on this machine in
 * another thread; upgrade when the resident sends the author's family with a review.
 */
export async function plan(stateFile, work, plugin) {
  const family = familyOf(plugin, work.family), lines = [];
  if (plugin === "kiro" && work.model) lines.push(`Kiro runs on auto; the model in the role pack was not used (${work.model}).`);
  if (!family) return { model: plugin === "kiro" ? undefined : work.model, notice: lines.join("\n") };
  const before = await stateFile.update(state => { const last = state.lastJob; state.lastJob = { thread: work.thread, family }; return last; });
  // Only a job that carries a role (a model or a family) is compared; Kiro alone is not a pair.
  if (work.model || work.family) lines.push(before?.thread !== work.thread ? sameFamilyNotice(before?.family, family) : "");
  return { model: plugin === "kiro" ? undefined : work.model, notice: lines.filter(Boolean).join("\n") };
}
