// What a held permission request actually does, in a few words the owner can read before allowing it: the command or
// arguments from the helper's rawInput, on one line, cut short, with anything that looks like a secret hidden. The
// helper's title alone is not enough: it is the helper's own word for the action, not the action.
// The whole text is redacted before anything is cut, so a secret never loses the flag or quote that marks it. The patterns
// are written to run in linear time, so a long command needs no cut before redaction.
import { middle } from "./ellipsis.mjs";

export const DETAIL_MAX = 300;

const WORD = String.raw`(?:key|token|secret|passw(?:or)?d|passwd|credential|auth)`;
// A secret-looking name is a whole run of name characters that contains WORD. The run is matched atomically (a lookahead
// capture, then a backreference), and only from the start of a run, so a long run without a match is scanned once, not once
// per character. This matches the same text as `\b[\w.-]*WORD[\w.-]*` did: what follows the name is never a name character.
const NAME = n => String.raw`(?=[\w.-]*${WORD})(?=([\w.-]*))` + "\\" + n;
const VALUE = String.raw`("[^"]*"|'[^']*'|\S+)`;
const PATTERNS = [
  [/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{8,}/gi, "$1 [hidden]"], // first: "Authorization: Bearer x" must lose x, not just "Bearer"
  [new RegExp(String.raw`(?<![\w.-])(${NAME(2)}\s*[=:]\s*)${VALUE}`, "gi"), "$1[hidden]"], // KEY=value, token: value
  [new RegExp(String.raw`(?<![\w.-])([\w.]*)(--?${NAME(3)}[= ]\s*)${VALUE}`, "gi"), "$1$2[hidden]"], // --token abc, -p=abc, x-token abc
  [/\b(?:sk|pk|ghp|gho|ghs|github_pat|glpat|xox[abprs]|AKIA|AIza)[-_A-Za-z0-9]{12,}/g, "[hidden]"] // well-known key shapes
];

const SCHEME = /[a-z0-9+.-]/i, LETTER = /[a-z]/i, WORDCHAR = /\w/;
/** user:password@host, after a scheme as `\b[a-z][a-z0-9+.-]*://` would find it; the scheme is checked by walking back once. */
function hideUserinfo(line) {
  return line.replace(/:\/\/([^\s/:@]+):([^\s/@]+)@/g, (all, user, password, at) => {
    let start = at;
    while (start > 0 && SCHEME.test(line[start - 1])) start--;
    for (let p = start; p < at; p++) {
      const boundary = p === 0 || WORDCHAR.test(line[p - 1]) !== WORDCHAR.test(line[p]);
      if (boundary && LETTER.test(line[p])) return `://${user}:[hidden]@`;
    }
    return all;
  });
}

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

/** One redacted line for a request's rawInput, shortened in the middle to `max` (Infinity keeps it whole); "" when there is nothing to show. */
export function describeInput(rawInput, max = DETAIL_MAX) {
  let out;
  try { out = text(rawInput); } catch { return ""; }
  out = out.replace(/[\x00-\x1f\x7f]+/g, " ").replace(/\s+/g, " ").trim();
  for (const [pattern, to] of PATTERNS) out = out.replace(pattern, to);
  return middle(hideUserinfo(out), max);
}
