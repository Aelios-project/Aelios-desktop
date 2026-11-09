// A permission report is retried a few times when the resident cannot be reached, failures are logged, and a
// "closed" never overtakes its "held" (perm-report.mjs).
import assert from "node:assert/strict";
import test from "node:test";
import { CloudError } from "../src/cloud.mjs";
import { PermReport } from "../src/perm-report.mjs";

const work = { workId: "w_1", token: "wt_1" };
const info = { title: "Run git push", kind: "other" };
function report(failures, log = [], retryMs = [1, 1, 1]) {
  const sent = [];
  const cloud = async () => ({ permission: async body => {
    sent.push(body.state);
    const next = failures.shift();
    if (next) throw next;
  } });
  return { sent, log, report: new PermReport({ cloud, journal: null, log: (...a) => log.push(a.join(" ")), retryMs }) };
}

test("a held report that fails with 503 is sent again, and closed goes after it", async () => {
  const { sent, log, report: r } = report([new CloudError("down", 503, ""), new CloudError("down", 0, "NETWORK")]);
  const hooks = r.on(work, info);
  hooks.held("p_0123456789");
  await hooks.closed("p_0123456789");
  assert.deepEqual(sent, ["held", "held", "held", "closed"]);
  assert.equal(log.length, 2, "each failure is logged");
  assert.match(log[0], /held p_0123456789.*trying again/);
});

test("a refusal that will not change (409) is logged once and not repeated; closed still goes", async () => {
  const { sent, log, report: r } = report([new CloudError("no", 409, "UNKNOWN_WORK")]);
  const hooks = r.on(work, info);
  hooks.held("p_0123456789");
  await hooks.closed("p_0123456789");
  assert.deepEqual(sent, ["held", "closed"]);
  assert.match(log[0], /giving up/);
});

test("it gives up after the last wait and says so", async () => {
  const down = () => new CloudError("down", 503, "");
  const { sent, log, report: r } = report([down(), down(), down(), down()], [], [1, 1]);
  await r.on(work, info).closed("p_0123456789");
  assert.equal(sent.length, 3);
  assert.match(log.at(-1), /giving up/);
});
