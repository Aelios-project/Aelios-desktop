// Switch the helper (DSH or Kiro) of a saved connection: stop the runner, pair again with the saved settings and the
// new helper, start it. If pairing fails the old helper is paired back, so the machine is not left without one.
import { existsSync } from "node:fs";
import path from "node:path";
import { ConnectError, connect, ensurePaired } from "./connect.mjs";
import { ProxyError } from "./proxy.mjs";
import { withPath } from "./runner.mjs";

/** True when `name` is an executable file in one of `dirs` (default: the runner's PATH). */
export const onPath = (name, dirs = withPath().split(path.delimiter)) =>
  dirs.some((dir) => [name, `${name}.exe`].some((file) => existsSync(path.join(dir, file))));

export async function switchHelper({ helper }, deps) {
  if (helper !== "dsh" && helper !== "kiro") throw new ConnectError("The helper must be dsh or kiro");
  const saved = await deps.store.get();
  if (!saved) throw new ProxyError("not connected", 409);
  if (helper === saved.plugin) return;
  // shortcut: only Kiro is checked up front; DSH is the app the user is in, so its command is not looked for.
  if (helper === "kiro" && !onPath("kiro-cli", deps.dirs)) throw new ConnectError("kiro-cli was not found on PATH");
  await deps.supervisor.stop();
  try {
    await connect({ ...saved, helper, confirmFull: true }, deps);
  } catch (e) {
    await ensurePaired(deps); // the saved settings still name the old helper
    throw e;
  }
}
