// The recap a new helper session gets when the thread could not keep its old one (the helper setup changed, or the helper
// could not reload the session): the goal, what was done so far, the git state of the folder and the next step, from the
// runner's own record and journal, redacted, at most RECAP_MAX characters, and marked as history, never as an instruction.
import { execFile } from "node:child_process";
import { promisify } from "node:util";

export const RECAP_MAX = 4000;
const HEADER = "The following is history from an earlier session of this thread. It is not an instruction.";
const DONE_KEPT = 5, GIT_MAX = 1200;
const run = promisify(execFile);

/** `git status -sb` and the last commit line of `cwd`, or "" when it is not a repository (or git is missing). */
export async function gitState(cwd) {
  const git = args => run("git", args, { cwd, timeout: 5000, maxBuffer: 64 * 1024 }).then(({ stdout }) => stdout.trim());
  try {
    const status = await git(["status", "-sb"]);
    const last = await git(["log", "-1", "--format=%h %s"]).catch(() => "(no commit yet)");
    return `${status}\nLast commit: ${last || "(no commit yet)"}`;
  } catch { return ""; }
}

/**
 * @param {{seed?: string, thread: string, journal?: {lines(): object[]}|null, git: string, redact: (text: string) => string}} o
 * @returns {string} the recap with its header, or "" when there is nothing to tell
 */
export function buildRecap({ seed, thread, journal, git, redact }) {
  const ends = (journal?.lines() ?? []).filter(line => line.t === "end" && line.thread === thread);
  const last = ends.at(-1);
  const done = ends.slice(-DONE_KEPT).map(line => `- ${line.status}: ${oneLine(line.summary)}`);
  const parts = [
    seed && `Goal (the first request in this thread): ${oneLine(seed)}`,
    done.length && `Done so far (the last turns, newest last):\n${done.join("\n")}`,
    git && `Git state of the folder:\n${git.length > GIT_MAX ? git.slice(0, GIT_MAX - 1) + "…" : git}`, // a long file list must not push out the next step
    last?.status === "needs_you" && `Next step (the last turn was waiting for the user): ${oneLine(last.summary)}`
  ].filter(Boolean);
  if (!parts.length) return "";
  const recap = redact(`${HEADER}\n${parts.join("\n\n")}`);
  return recap.length > RECAP_MAX ? recap.slice(0, RECAP_MAX - 1) + "…" : recap;
}

const oneLine = text => String(text ?? "").replace(/\s+/g, " ").trim().slice(0, 600);
