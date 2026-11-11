import assert from "node:assert/strict";
import { test } from "node:test";
import { createMessages } from "../client/api.mjs";
import { stopTurn } from "../client/stop.mjs";
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

test("messages: the running turn is kept, also when the lines are unchanged", async () => {
  const turn = { requestId: "r1", stopping: false };
  const answers = [{ rev: "1", data: [], turn }, { rev: "1", same: true, turn }, { rev: "2", data: [], turn: null }];
  const read = createMessages(async () => answers.shift());
  assert.equal(read.turn, null);
  await read();
  assert.deepEqual(read.turn, turn);
  await read();
  assert.deepEqual(read.turn, turn);
  await read();
  assert.equal(read.turn, null);
});

test("stop: posts the turn's id, then reads again until the turn is gone", async () => {
  const posts = [];
  const turns = [{ requestId: "r1", stopping: true }, null];
  await stopTurn({ turn: { requestId: "r1" }, post: async (b) => { posts.push(b); }, refresh: async () => turns.shift(), sleep: async () => {} });
  assert.deepEqual(posts, [{ requestId: "r1" }]);
  assert.equal(turns.length, 0);
});

test("stop: 409 is quiet and the messages are read again; other errors come through; no turn does nothing", async () => {
  let reads = 0;
  const refresh = async () => { reads += 1; return null; };
  await stopTurn({ turn: { requestId: "r1" }, post: async () => { throw Object.assign(new Error("another turn"), { status: 409 }); }, refresh });
  assert.equal(reads, 1);
  await assert.rejects(stopTurn({ turn: { requestId: "r1" }, post: async () => { throw Object.assign(new Error("bad"), { status: 400 }); }, refresh }), /bad/);
  await stopTurn({ turn: null, post: async () => { throw new Error("no"); }, refresh });
  assert.equal(reads, 1);
});

test("stop: gives up after the tries when the turn does not end", async () => {
  let reads = 0;
  await stopTurn({ turn: { requestId: "r1" }, post: async () => {}, refresh: async () => { reads += 1; return { requestId: "r1" }; }, sleep: async () => {}, tries: 3 });
  assert.equal(reads, 3);
});

test("client.js is what a fresh build gives", async () => {
  assert.equal(readFileSync(new URL("../client.js", import.meta.url), "utf8"), await bundleClient());
});
