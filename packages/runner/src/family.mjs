// Model families, for the advice that a reviewer from another family gives a second view. The catalog is owned here:
// the resident sends a family name, and a family is never worked out from a model id. A family that is not listed is
// not an error; it just gets no advice. Kiro always runs on auto, which is its own family.
export const KIRO_FAMILY = "kiro-auto";
const KNOWN = new Set(["anthropic", "openai", "google", "deepseek", "xai", "meta", "mistral", "qwen", KIRO_FAMILY]);

export const FAMILY = /^[a-z][a-z0-9-]{0,39}$/; // the same shape the resident accepts

/** The family a job runs in: Kiro is always its own, whatever the card says. */
export const familyOf = (plugin, family) => (plugin === "kiro" ? KIRO_FAMILY : family);

/** One line of advice, or "" when the families differ, either is unknown, or there is no earlier job to compare with. */
export function sameFamilyNotice(before, now) {
  return before && before === now && KNOWN.has(now)
    ? `This job runs on the same model family (${now}) as the previous job on this machine. A different family gives a review a second view. Advice only; the job ran.`
    : "";
}
