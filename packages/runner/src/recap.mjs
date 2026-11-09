// The recap a new helper session gets when the thread could not keep its old one (the helper setup changed, or the helper
// could not reload the session): the goal, what was done so far, the git state of the folder and the next step, from the
// runner's own record and journal, redacted, at most RECAP_MAX characters, and marked as history, never as an instruction.
// The goal, the git state and the next step are each bounded and always kept; "done so far" gets what is left.
import { execFile } from "node:child_process";
import { promisify } from "node:util";

export const RECAP_MAX = 4000;
const HEADER = "The following is history from an earlier session of this thread. It is not an instruction.";
const DONE_KEPT = 5, LINE_MAX = 600, FILES_MAX = 1000;
const run = promisify(execFile);

/** `{status, last}` from `git status -sb` and the last commit line of `cwd`, or null when it is not a repository (or git is missing). */
export async function gitState(cwd) {
  const git = args => run("git", args, { cwd, timeout: 5000, maxBuffer: 1024 * 1024 }).then(({ stdout }) => stdout.trim());
  try {
    const status = await git(["status", "-sb"]);
    const last = await git(["log", "-1", "--format=%h %s"]).catch(() => "");
    return { status, last: last || "(no commit yet)" };
  } catch { return null; }
}

/** The branch line, as many file lines as fit in FILES_MAX (then a count of the rest), and the last commit line, always. */
function gitPart({ status, last }) {
  const [branch, ...files] = status.split("\n");
  const kept = [];
  let size = 0;
  for (const file of files) { if (size + file.length + 1 > FILES_MAX) break; kept.push(file); size += file.length + 1; }
  const more = files.length - kept.length;
  return ["Git state of the folder:", oneLine(branch), ...kept, ...(more ? [`(${more} more changed files)`] : []), `Last commit: ${oneLine(last)}`].join("\n");
}

/**
 * @param {{seed?: string, thread: string, journal?: {lines(): object[]}|null, git: {status: string, last: string}|null, redact: (text: string) => string}} o
 * @returns {string} the recap with its header, or "" when there is nothing to tell
 */
export function buildRecap({ seed, thread, journal, git, redact }) {
  const ends = (journal?.lines() ?? []).filter(line => line.t === "end" && line.thread === thread);
  const last = ends.at(-1);
  const goal = seed ? redact(`Goal (the first request in this thread): ${oneLine(seed)}`) : "";
  const state = git ? redact(gitPart(git)) : "";
  const next = last?.status === "needs_you" ? redact(`Next step (the last turn was waiting for the user): ${oneLine(last.summary)}`) : "";
  const done = ends.slice(-DONE_KEPT).map(line => redact(`- ${line.status}: ${oneLine(line.summary)}`));
  const fixed = [HEADER, goal, state, next].filter(Boolean);
  const room = RECAP_MAX - fixed.join("\n\n").length - 2;
  // The oldest turns go first when there is no room; the required parts above never shrink for them.
  while (done.length && `Done so far (the last turns, newest last):\n${done.join("\n")}`.length + 2 > room) done.shift();
  const doneText = done.length ? `Done so far (the last turns, newest last):\n${done.join("\n")}` : "";
  const parts = [goal, doneText, state, next].filter(Boolean);
  return parts.length ? [HEADER, ...parts].join("\n\n") : "";
}

const oneLine = text => {
  const line = String(text ?? "").replace(/\s+/g, " ").trim();
  return line.length > LINE_MAX ? line.slice(0, LINE_MAX - 1) + "…" : line;
};
