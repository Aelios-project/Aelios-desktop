// The host half. It only wires the parts: the saved connection, the runner child, the route.
import { runnerEntry, nodeBin } from "./runner.mjs";
import { ensurePaired } from "./connect.mjs";
import { makeRoute, ROUTE } from "./route.mjs";
import { Store } from "./store.mjs";
import { Supervisor } from "./supervisor.mjs";

export const inject = ["connection", "credentials"];

export function apply(ctx) {
  const entry = runnerEntry();
  const node = nodeBin();
  const store = new Store(ctx.credentials);
  const supervisor = new Supervisor({ entry, node });
  const route = makeRoute({ entry, node, store, supervisor });

  // Start the runner with DSH when a connection exists; stop it when DSH stops this plugin.
  ctx.effect(() => {
    void ensurePaired({ entry, node, store, supervisor }); // pairs with the saved settings when the runner is not paired
    return () => { void supervisor.stop(); };
  });
  ctx.effect(() => ctx.connection.fetch.register({ path: ROUTE, methods: ["POST"], requestBody: "buffered", fetch: route }));
}
