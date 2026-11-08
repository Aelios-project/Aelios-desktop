import assert from "node:assert/strict";
import { test } from "node:test";
import { createMessages } from "../client/api.mjs";
import { bundleClient } from "../scripts/build-client.mjs";
import { readFileSync } from "node:fs";

test("messages: an unchanged answer gives null; a change gives the lines; all is read again after a minute", async () => {
  const paths = [];
  const answers = [{ rev: "1", data: [{ id: 1 }] }, { rev: "1", same: true }, { rev: "2", data: [{ id: 1 }, { id: 2 }] }, { rev: "2", data: [{ id: 1 }, { id: 2 }] }];
  let t = 0;
  const read = createMessages(async (p) => { paths.push(p); return answers.shift(); }, () => t);
  assert.deepEqual(await read(), [{ id: 1 }]);
  assert.equal(await read(), null);
  assert.equal((await read()).length, 2);
  t = 61000;
  await read();
  assert.deepEqual(paths, ["/web/messages", "/web/messages?since=1", "/web/messages?since=1", "/web/messages"]);
});

test("client.js is what a fresh build gives", async () => {
  assert.equal(readFileSync(new URL("../client.js", import.meta.url), "utf8"), await bundleClient());
});
