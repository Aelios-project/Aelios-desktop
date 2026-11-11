// Picking the model a job asks for (PROTOCOL.md, "job.model"). Exact match on the ACP model option, checked before the
// prompt is written, and the reply must show the new value. No fuzzy match and no fallback to the default model: a
// reviewer must never end up on the writer's model unnoticed. Used by both engines (helper.mjs, turn-acpx.mjs).
// The resident's failure reasons have no code for this, so the turn ends `failed` with reason `error` and the summary
// starts with MODEL_FAILED.
export const MODEL_FAILED = "model_selection_unsupported";

const isModel = option => option && typeof option === "object" && option.type === "select" && (option.category === "model" || option.id === "model");

/** The model option of an ACP `configOptions` list: the one in the model category first, else the one named model. */
export const modelOption = list => (Array.isArray(list) ? list : []).filter(isModel).sort((a, b) => (b.category === "model") - (a.category === "model"))[0] ?? null;

/** Every value an option offers; values may be grouped. */
export const idsOf = option => (option?.options ?? []).flatMap(item => (Array.isArray(item?.options) ? item.options : [item])).map(item => item?.value).filter(value => typeof value === "string");

/** The summary of a refused selection, or null when `wanted` is exactly one of the offered ids (`ids` null: no model option). */
export function refusal(ids, wanted, plug) {
  if (ids === null) return `${MODEL_FAILED}: ${plug} lists no model option, so model "${wanted}" cannot be set. The prompt was not sent.`;
  return ids.includes(wanted) ? null : `${MODEL_FAILED}: model "${wanted}" is not offered by ${plug}; offered: ${ids.join(", ") || "none"}. The prompt was not sent.`;
}

/** Whether a `session/set_config_option` reply shows `wanted` as the model now. */
export const confirmed = (reply, wanted) => modelOption(reply?.configOptions)?.currentValue === wanted;

const unconfirmed = (wanted, plug, reply) => `${MODEL_FAILED}: ${plug} did not confirm model "${wanted}" (it reports "${modelOption(reply?.configOptions)?.currentValue ?? "nothing"}"). The prompt was not sent.`;
const refused = (wanted, plug, error) => `${MODEL_FAILED}: ${plug} would not set model "${wanted}": ${error?.message ?? error}. The prompt was not sent.`;

/** Legacy engine: `options` are the configOptions from session/new or session/load. @returns {Promise<string|null>} a failure summary, or null when the model is set */
export async function selectOnConnection(conn, sessionId, options, wanted, plug) {
  const option = modelOption(options), no = refusal(option ? idsOf(option) : null, wanted, plug);
  if (no) return no;
  try {
    const reply = await conn.request("session/set_config_option", { sessionId, configId: option.id, value: wanted }, 30_000);
    return confirmed(reply, wanted) ? null : unconfirmed(wanted, plug, reply);
  } catch (error) { return refused(wanted, plug, error); }
}

/** acpx engine: the same, through the runtime. */
export async function selectOnRuntime(runtime, handle, wanted, plug) {
  try {
    const no = refusal((await runtime.getStatus({ handle })).models?.availableModelIds ?? null, wanted, plug);
    if (no) return no;
    const reply = await runtime.setConfigOption({ handle, key: "model", value: wanted });
    return confirmed(reply, wanted) ? null : unconfirmed(wanted, plug, reply);
  } catch (error) { return refused(wanted, plug, error); }
}

/** The outcome of a turn that stopped because the model could not be set. */
export const modelFailure = (t, how, text) => ({ status: "failed", reason: "error", summary: t.redact(text), sessionId: t.opened, how });
