// What a held permission request actually does, in a few words the owner can read before allowing it: the command or
// arguments from the helper's rawInput, on one line, cut short, with anything that looks like a secret hidden. The
// helper's title alone is not enough: it is the helper's own word for the action, not the action.

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

/** One short, redacted line for a request's rawInput; "" when there is nothing to show. */
export function describeInput(rawInput) {
  let out;
  try { out = text(rawInput).slice(0, 4000); } catch { return ""; }
  out = out.replace(/[\x00-\x1f\x7f]+/g, " ").replace(/\s+/g, " ").trim();
  for (const [pattern, to] of PATTERNS) out = out.replace(pattern, to);
  return out.length > DETAIL_MAX ? out.slice(0, DETAIL_MAX - 1) + "…" : out;
}
