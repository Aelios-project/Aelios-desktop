// Switch the permission (edit or full) of a saved connection: stop the runner, write the new tier into its config
// with `aelios-runner access` (nothing else in the config or the pairing changes), save it with the connection so a
// later pair again keeps it, and start the runner. If the runner refuses, it starts again with the old tier.
import { ConnectError, ensurePaired, oneLine } from "./connect.mjs";
import { ProxyError } from "./proxy.mjs";
import { runOnce } from "./runner.mjs";

export async function switchAccess({ access, confirmFull }, deps) {
  if (access !== "edit" && access !== "full") throw new ConnectError("The permission must be edit or full");
  if (access === "full" && confirmFull !== true) throw new ConnectError("Full permission needs your confirmation");
  const saved = await deps.store.get();
  if (!saved) throw new ProxyError("not connected", 409);
  if (access === saved.access) return;
  await deps.supervisor.stop();
  const { code, err } = await runOnce(deps.entry, ["access", access], { env: deps.env, node: deps.node });
  if (code !== 0) {
    await ensurePaired(deps); // the saved settings still name the old tier
    throw new ConnectError(oneLine(err) || "The permission could not be changed");
  }
  await deps.store.set({ ...saved, access });
  await ensurePaired(deps);
}
