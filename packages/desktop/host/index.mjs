// The host half. It only wires the parts: the saved connection, the runner child, the route, the wizard.
import path from "node:path";
import { makeCli } from "./onboarding/cli.mjs";
import { loadBundles, makeDeployer } from "./onboarding/deploy.mjs";
import { Redactor } from "./onboarding/redact.mjs";
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
  const redactor = new Redactor();
  const cli = makeCli({ redactor });
  const deployer = makeDeployer({ wrangler: cli.wrangler });
  let bundles = null;
  try { bundles = loadBundles(path.join(import.meta.dirname, "..", "bundles")); } catch { bundles = null; } // a checkout without built bundles still loads; the wizard says it is not available
  const route = makeRoute({ entry, node, store, supervisor, credentials: ctx.credentials, cli, deployer, bundles, redactor });

  // Start the runner with DSH when a connection exists; stop it when DSH stops this plugin.
  ctx.effect(() => {
    void ensurePaired({ entry, node, store, supervisor }); // pairs with the saved settings when the runner is not paired
    return () => { void supervisor.stop(); };
  });
  ctx.effect(() => ctx.connection.fetch.register({ path: ROUTE, methods: ["POST"], requestBody: "buffered", fetch: route }));
}
