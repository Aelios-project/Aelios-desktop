import assert from "node:assert/strict";
import { test } from "node:test";
import { cardsByLine } from "../client/threads-api.mjs";

test("cardsByLine: a thread's chip shows once, under the newest line that names it", () => {
  const a = { id: "l1", tasks: [{ id: "t1", thread: "th1" }, { id: "t2", thread: "th2" }] };
  const b = { id: "l2", tasks: [{ id: "t3", thread: "th1" }] };
  const c = { id: "l3" };
  const out = cardsByLine([a, b, c]);
  assert.deepEqual(out.l1.map((x) => x.id), ["t2"]);
  assert.deepEqual(out.l2.map((x) => x.id), ["t3"]);
  assert.equal(out.l3, undefined);
  assert.deepEqual(cardsByLine(), {});
});
