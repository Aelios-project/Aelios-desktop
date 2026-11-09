// Answers a helper's session/request_permission. The runner judges nothing: what a helper may do without asking is
// the helper's own configuration (for Kiro, kiro-agent.mjs). Whatever still asks is held for the owner, who decides
// from the resident's Waiting list or on this machine. The one exception is the access tier `full`, which allows all.
// Only one-time choices are ever picked, so nothing stays allowed after the turn.
import { describeInput } from "./detail.mjs";

export const TIERS = ["read", "edit", "full"];
export const tierOf = value => (TIERS.includes(value) ? value : null);
/** The job may ask for less than this machine allows, never more. */
export const lowest = (...tiers) => TIERS[Math.min(...tiers.map(tier => TIERS.indexOf(tier)).filter(i => i >= 0))];

/** What the request does, when the helper says: its command or arguments, shortened and with secrets hidden. */
const detailOf = rawInput => { const detail = describeInput(rawInput); return detail ? { detail } : {}; };

/**
 * The reply for the helper, and what to hold for the person when the tier is not `full`.
 * @returns {{response: object, denied: string|null, hold: {title: string, kind: string, paths: string[], detail?: string}|null}}
 */
export function answer(tier, params) {
  const options = Array.isArray(params?.options) ? params.options : [];
  const pick = kind => options.find(option => option?.kind === kind && typeof option.optionId === "string");
  const title = String(params?.toolCall?.title ?? params?.toolCall?.kind ?? "an action").replace(/[\x00-\x1f\x7f]/g, " ").slice(0, 120);
  if (tier === "full") {
    const choice = pick("allow_once");
    if (choice) return { response: { outcome: { outcome: "selected", optionId: choice.optionId } }, denied: null, hold: null };
    return { response: { outcome: { outcome: "cancelled" } }, denied: `${title} (the helper offered no "allow once" option)`, hold: null };
  }
  const paths = (Array.isArray(params?.toolCall?.locations) ? params.toolCall.locations : []).map(place => place?.path).filter(file => typeof file === "string");
  const choice = pick("reject_once");
  return { response: choice ? { outcome: { outcome: "selected", optionId: choice.optionId } } : { outcome: { outcome: "cancelled" } },
    denied: `${title} (the helper asked, and tier ${tier} does not allow it unasked)`,
    hold: { title, kind: String(params?.toolCall?.kind ?? "other"), paths, ...detailOf(params?.toolCall?.rawInput) } };
}
