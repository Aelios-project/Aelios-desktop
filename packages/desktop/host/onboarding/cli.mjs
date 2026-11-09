// Runs `cf` and `npx wrangler` for the wizard. A child sees only PATH and HOME, never the host's environment;
// a secret goes on standard input, never in the arguments; all output passes through the redactor.
import { spawn as nodeSpawn } from "node:child_process";

export const WRANGLER = "wrangler@4.158.0";
const TAIL_LINES = 40;
const TAIL_CHARS = 8000;
const TIMEOUT_MS = 180000;

/** Only these are inherited. `extraEnv` is for the one exception in the design: the token handed to `wrangler`. */
export function childEnv(env, extra = {}) { return { PATH: env.PATH ?? "", HOME: env.HOME ?? "", ...extra }; }

export function makeCli({ spawn = nodeSpawn, env = process.env, redactor, timeoutMs = TIMEOUT_MS, cwd } = {}) {
  if (!redactor) throw new Error("a redactor is required");
  const keep = (text) => text.slice(-TAIL_CHARS * 4);
  const tailOf = (out, err) => {
    const lines = [out, err].filter(Boolean).join("\n").split("\n").slice(-TAIL_LINES).join("\n");
    return redactor.text(lines.slice(-TAIL_CHARS));
  };
  const result = (code, out, err, timedOut) => {
    const cleanOut = redactor.text(out);
    const cleanErr = redactor.text(err) + (timedOut ? "\nThe command took too long" : "");
    return { code, out: cleanOut, err: cleanErr, tail: tailOf(cleanOut, cleanErr), timedOut };
  };

  function run(file, args, { input = null, extraEnv = {}, timeout = timeoutMs, cwd: dir = cwd, onText } = {}) {
    redactor.guard([file, ...args]);
    return new Promise((resolve) => {
      let child;
      try {
        child = spawn(file, args, {
          cwd: dir,
          env: childEnv(env, extraEnv),
          stdio: [input == null ? "ignore" : "pipe", "pipe", "pipe"],
        });
      } catch (error) { resolve(result(null, "", error.message, false)); return; }

      let out = "";
      let err = "";
      let timedOut = false;
      let settled = false;
      const finish = (code) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(result(code, out, err, timedOut));
      };
      const timer = setTimeout(() => { timedOut = true; child.kill("SIGKILL"); }, timeout);
      timer.unref?.();

      const read = (stream, chunk) => {
        const text = chunk.toString("utf8");
        onText?.(redactor.text(text));
        return keep(stream + text);
      };
      child.stdout?.on("data", (chunk) => { out = read(out, chunk); });
      child.stderr?.on("data", (chunk) => { err = read(err, chunk); });
      child.on("error", (error) => { err = keep(err + error.message); finish(null); });
      child.on("close", (code) => finish(code));
      if (input != null) child.stdin.end(input);
    });
  }

  return {
    run,
    cf: (args, options) => run("cf", args, options),
    // --yes: an update of the cached npx package must not wait for an answer nobody can give.
    wrangler: (args, options) => run("npx", ["--yes", WRANGLER, ...args], options),
  };
}
