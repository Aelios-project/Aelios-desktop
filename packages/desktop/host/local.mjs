// The local calls of client/local-api.mjs: machine, sessions, session, permit, open, present. They answer from the
// runner (its own `overview` and `permit` commands), the supervisor, and the helpers' session files, read-only.
import { spawn } from "node:child_process";
import { realpathSync, statSync } from "node:fs";
import path from "node:path";
import { makeOverview } from "./overview.mjs";
import { ProxyError } from "./proxy.mjs";
import { childEnv, runOnce } from "./runner.mjs";
import { sessionOf, summaryOf } from "./timeline.mjs";
import { readDsh } from "./transcript-dsh.mjs";
import { readKiro } from "./transcript-kiro.mjs";

const READERS = { dsh: readDsh, kiro: readKiro };
const REQUEST = /^p_[0-9a-f]{10}$/;
const OPENER = process.platform === "darwin" ? "open" : process.platform === "win32" ? "explorer" : "xdg-open";

export function makeLocal({ entry, node, supervisor, env = {}, read = READERS, launch = spawn }) {
  const overview = makeOverview({ entry, node, env });

  const sessionFor = (ov, thread) => sessionOf(ov, thread, ov.threads[thread]?.sessionId ? read[ov.threads[thread].plugin]?.(ov.threads[thread].sessionId) ?? [] : []);

  /**
   * The folder to show: the workspace itself, or a folder that is really inside it. For a file, the folder it is in:
   * the system opener would run a file it can run (a script, an app), and the workspace holds what the helper wrote.
   */
  function inside(workspace, target) {
    const root = realpathSync(workspace);
    const real = realpathSync(target ? path.resolve(root, String(target)) : root);
    const rel = path.relative(root, real);
    if (rel.startsWith("..") || path.isAbsolute(rel)) throw new ProxyError("That path is outside the workspace", 403);
    return statSync(real).isDirectory() ? real : path.dirname(real);
  }

  return {
    async machine() {
      const ov = await overview();
      const info = ov && { name: ov.name, plugin: ov.plugin, access: ov.access, workspace: ov.workspace, paired: ov.paired, queued: ov.queued, unsent: ov.unsent, threads: Object.keys(ov.threads).length, running: ov.running };
      return { runner: supervisor.detail(), info, cloud: null };
    },
    async sessions() {
      const ov = await overview();
      const rows = ov ? Object.keys(ov.threads).map((thread) => summaryOf(ov, thread, sessionFor(ov, thread))) : [];
      return { sessions: rows.sort((a, b) => b.at - a.at) };
    },
    async session({ thread }) {
      const ov = await overview();
      return { session: ov && Object.hasOwn(ov.threads, thread) ? sessionFor(ov, thread) : null };
    },
    async permit({ id, allow }) {
      if (!REQUEST.test(String(id))) throw new ProxyError("That is not a permission request", 400);
      const { code, err } = await runOnce(entry, ["permit", id, allow === true ? "allow" : "deny"], { env, node });
      overview.forget();
      if (code !== 0) throw new ProxyError(err.replace(/^aelios-runner:\s*/, "").trim().split("\n").pop() || "The request could not be answered", 409);
      return { ok: true };
    },
    async open({ path: target }) {
      const ov = await overview();
      if (!ov?.workspace) throw new ProxyError("No workspace yet", 409);
      const child = launch(OPENER, [inside(ov.workspace, target)], { detached: true, stdio: "ignore", env: childEnv(node) });
      child.on?.("error", () => {});
      child.unref?.();
      return { ok: true };
    },
    async present() { return { ok: true }; },
  };
}
