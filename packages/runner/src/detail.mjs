// What a held permission request actually does, in a few words the owner can read before allowing it: the command or
// arguments from the helper's rawInput, on one line, cut short, with anything that looks like a secret hidden. The
// helper's title alone is not enough: it is the helper's own word for the action, not the action.
import { middle } from "./ellipsis.mjs";

export const DETAIL_MAX = 300;

const SECRET_NAME = String.raw`[\w.-]*(?:key|token|secret|passw(?:or)?d|passwd|credential|auth)[\w.-]*`;
const PATTERNS = [
  [/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{8,}/gi, "$1 [hidden]"], // first: "Authorization: Bearer x" must lose x, not just "Bearer"
  [new RegExp(String.raw`(\b${SECRET_NAME}\s*[=:]\s*)("[^"]*"|'[^']*'|\S+)`, "gi"), "$1[hidden]"], // KEY=value, token: value
  [new RegExp(String.raw`(--?${SECRET_NAME}[= ]\s*)("[^"]*"|'[^']*'|\S+)`, "gi"), "$1[hidden]"], // --token abc, -p=abc
  [/\b(?:sk|pk|ghp|gho|ghs|github_pat|glpat|xox[abprs]|AKIA|AIza)[-_A-Za-z0-9]{12,}/g, "[hidden]"], // well-known key shapes
  [/(\b[a-z][a-z0-9+.-]*:\/\/[^\s/:@]+:)[^\s/@]+@/gi, "$1[hidden]@"] // user:password@host
];

function text(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(part => (typeof part === "string" ? part : JSON.stringify(part))).join(" ");
  if (value && typeof value === "object") {
    const command = value.command ?? value.cmd;
    if (command !== undefined) return [text(command), text(value.args ?? "")].filter(Boolean).join(" ");
    return JSON.stringify(value);
  }
  return value === undefined || value === null ? "" : String(value);
}

/** One short, redacted line for a request's rawInput, shortened in the middle to `max`; "" when there is nothing to show. */
export function describeInput(rawInput, max = DETAIL_MAX) {
  let out;
  try { out = text(rawInput); } catch { return ""; }
  out = ends(out.replace(/[\x00-\x1f\x7f]+/g, " ").replace(/\s+/g, " ").trim());
  for (const [pattern, to] of PATTERNS) out = out.replace(pattern, to);
  return middle(out, max);
}

// The secret patterns slow down sharply on very long runs of name characters, so the text they scan is bounded.
// shortcut: a command over SCAN_MAX characters keeps its two ends, cut at spaces so no word is split, and loses its middle
// (also in the copy kept on this machine); upgrade to a linear-time scanner if such commands turn out to matter.
export const SCAN_MAX = 20_000;
function ends(line) {
  if (line.length <= SCAN_MAX) return line;
  const half = SCAN_MAX / 2, head = line.slice(0, half), tail = line.slice(-half);
  const cutHead = head.lastIndexOf(" "), cutTail = tail.indexOf(" ");
  return (cutHead > 0 ? head.slice(0, cutHead) : head) + " … " + (cutTail >= 0 ? tail.slice(cutTail + 1) : tail);
}
