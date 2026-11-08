// Answers a helper's session/request_permission by the access tier this machine allows, never by what the helper
// or the job text says. Only one-time choices are ever picked, so nothing stays allowed after the turn.
import { describeInput } from "./detail.mjs";
import { inside } from "./inside.mjs";
import { readOnly } from "./readonly.mjs";

export const TIERS = ["read", "edit", "full"];
export const tierOf = value => (TIERS.includes(value) ? value : null);
/** The job may ask for less than this machine allows, never more. */
export const lowest = (...tiers) => TIERS[Math.min(...tiers.map(tier => TIERS.indexOf(tier)).filter(i => i >= 0))];

const READ = new Set(["read", "search", "think"]);
const EDIT = new Set([...READ, "edit", "fetch"]);
/** The kinds a helper gives to running a command; the command itself decides (readonly.mjs). */
const COMMAND = new Set(["other", "execute"]);

/**
 * Only what the helper asks about is judged, and only by what it says: the kind of the operation and the paths it names.
 * Below "full", a request that names a path outside the working folder is always turned down, whatever its kind.
 * A refusal made by the tier alone may be held for the owner (`hold`); one for a path outside the folder never is.
 * In the edit tier, a command that only looks at things is allowed without asking (`auto`), judged from its rawInput.
 * @returns {{allow: boolean, why: string, hold?: boolean, auto?: boolean}}
 */
export function judge(tier, toolCall, cwd) {
  const kind = typeof toolCall?.kind === "string" ? toolCall.kind : "other";
  if (tier === "full") return { allow: true, why: "" };
  const files = (Array.isArray(toolCall?.locations) ? toolCall.locations : []).map(place => place?.path);
  if (files.some(file => !inside(cwd, file))) return { allow: false, why: "a path in the request is outside the workspace" };
  if (READ.has(kind)) return { allow: true, why: "" };
  if (tier === "edit" && COMMAND.has(kind) && readOnly(toolCall?.rawInput, cwd)) return { allow: true, why: "", auto: true };
  if (tier === "edit" && EDIT.has(kind)) {
    if (kind !== "edit" || files.length) return { allow: true, why: "" };
    return { allow: false, why: "the edit does not say where", hold: true };
  }
  return { allow: false, why: `tier ${tier} does not allow "${kind}"`, hold: true };
}

/** What the request does, when the helper says: its command or arguments, shortened and with secrets hidden. */
const detailOf = rawInput => { const detail = describeInput(rawInput); return detail ? { detail } : {}; };

/**
 * The reply for the helper, and what to tell the person when a request was turned down.
 * `auto` is set when the request was allowed because it only looks at things, so the journal can show it.
 * @returns {{response: object, denied: string|null, hold: {title: string, kind: string, paths: string[], detail?: string}|null, auto: object|null}}
 */
export function answer(tier, params, cwd) {
  const options = Array.isArray(params?.options) ? params.options : [];
  const pick = kind => options.find(option => option?.kind === kind && typeof option.optionId === "string");
  const { allow, why, hold, auto } = judge(tier, params?.toolCall, cwd);
  const title = String(params?.toolCall?.title ?? params?.toolCall?.kind ?? "an action").replace(/[\x00-\x1f\x7f]/g, " ").slice(0, 120);
  const paths = (Array.isArray(params?.toolCall?.locations) ? params.toolCall.locations : []).map(place => place?.path).filter(file => typeof file === "string");
  if (allow) {
    const choice = pick("allow_once");
    if (choice) return { response: { outcome: { outcome: "selected", optionId: choice.optionId } }, denied: null, hold: null, auto: auto ? { title, kind: String(params?.toolCall?.kind ?? "other"), paths, ...detailOf(params?.toolCall?.rawInput) } : null };
    return { response: { outcome: { outcome: "cancelled" } }, denied: `${title} (the helper offered no "allow once" option)`, hold: null, auto: null };
  }
  const choice = pick("reject_once");
  return { response: choice ? { outcome: { outcome: "selected", optionId: choice.optionId } } : { outcome: { outcome: "cancelled" } }, denied: `${title} (${why})`,
    hold: hold ? { title, kind: String(params?.toolCall?.kind ?? "other"), paths, ...detailOf(params?.toolCall?.rawInput) } : null, auto: null };
}
