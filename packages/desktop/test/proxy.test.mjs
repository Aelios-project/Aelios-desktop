import assert from "node:assert/strict";
import { test } from "node:test";
import { ProxyError, forward, forwardBytes, target } from "../host/proxy.mjs";

const BASE = "https://res.example";

test("allowed paths pass, with the resident prefix", () => {
  assert.equal(target(BASE, "default", "/web/messages?since=a%20b").href, `${BASE}/web/messages?since=a%20b`);
  assert.equal(target(BASE, "luna", "/web/thread/say", "POST").href, `${BASE}/r/luna/web/thread/say`);
  assert.equal(target(BASE, "default", "/web/residents").href, `${BASE}/web/residents`);
  assert.equal(target(BASE, "default", "/web/config").href, `${BASE}/web/config`);
  assert.equal(target(BASE, "luna", "/web/avatar", "POST").href, `${BASE}/r/luna/web/avatar`);
  assert.equal(target(BASE, "luna", "/web/waiting/permission", "POST").href, `${BASE}/r/luna/web/waiting/permission`);
  // The Waiting panel's X on an ask (client/panel-waiting.mjs act.settle).
  assert.equal(target(BASE, "luna", "/web/task/settle", "POST").href, `${BASE}/r/luna/web/task/settle`);
});

test("everything else is refused", () => {
  const bad = ["/web/runner/code", "/web/runner/register", "/web/secret", "/web/../x", "/web/%2e%2e/x", "/web/messages%2F..", "/other", "//evil.example/web/messages", "/web/messages#x", "/web/mess ages"];
  for (const p of bad) assert.throws(() => target(BASE, "default", p), ProxyError, p);
  assert.throws(() => target(BASE, "default", "/web/messages", "DELETE"), /method/);
  assert.throws(() => target(BASE, "Bad/Id", "/web/messages"), /resident/);
});

test("a cloud thread's file comes through the byte route, with the owner's key and no redirect", async () => {
  const seen = [];
  const ok = async (url, init) => { seen.push({ url: String(url), init }); return new Response(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), { status: 200, headers: { "content-type": "application/octet-stream" } }); };
  const path = `/web/thread/file?id=t_0123456789&path=${encodeURIComponent("notes/报告.pdf")}`;
  const out = await forwardBytes({ url: BASE, key: "k1", resident: "default" }, { path }, ok);
  assert.equal(seen[0].url, `${BASE}/web/thread/file?id=t_0123456789&path=notes%2F%E6%8A%A5%E5%91%8A.pdf`);
  assert.equal(seen[0].init.headers["x-web-key"], "k1");
  assert.equal(seen[0].init.redirect, "error");
  assert.equal(out.type, "application/octet-stream");
  assert.deepEqual([...Buffer.from(out.data, "base64")], [0x89, 0x50, 0x4e, 0x47]);
  assert.equal(target(BASE, "luna", "/web/thread/file?id=t_0123456789&path=a.txt").href, `${BASE}/r/luna/web/thread/file?id=t_0123456789&path=a.txt`);
  // Only byte routes come through this action, and a path that tries to climb out is refused.
  const nothing = async () => new Response("", { status: 200 });
  await assert.rejects(forwardBytes({ url: BASE, key: "k1", resident: "default" }, { path: "/web/messages" }, nothing), ProxyError);
  await assert.rejects(forwardBytes({ url: BASE, key: "k1", resident: "default" }, { path: "/web/secret" }, nothing), ProxyError);
  assert.throws(() => target(BASE, "default", "/web/../web/thread/file"), ProxyError);
});

test("forward adds the key, refuses redirects, and needs JSON", async () => {
  const seen = [];
  const ok = async (url, init) => { seen.push({ url: String(url), init }); return new Response(JSON.stringify({ rev: "1" }), { status: 200 }); };
  const out = await forward({ url: BASE, key: "k1", resident: "default" }, { path: "/web/messages" }, ok);
  assert.deepEqual(out, { status: 200, data: { rev: "1" } });
  assert.equal(seen[0].init.headers["x-web-key"], "k1");
  assert.equal(seen[0].init.redirect, "error");
  await assert.rejects(forward({ url: BASE, key: "k", resident: "default" }, { path: "/web/check" }, async () => new Response("<html>")), /JSON/);
});
