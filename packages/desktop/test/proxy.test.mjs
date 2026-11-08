import assert from "node:assert/strict";
import { test } from "node:test";
import { ProxyError, forward, target } from "../host/proxy.mjs";

const BASE = "https://res.example";

test("allowed paths pass, with the resident prefix", () => {
  assert.equal(target(BASE, "default", "/web/messages?since=a%20b").href, `${BASE}/web/messages?since=a%20b`);
  assert.equal(target(BASE, "luna", "/web/thread/say", "POST").href, `${BASE}/r/luna/web/thread/say`);
  assert.equal(target(BASE, "default", "/web/residents").href, `${BASE}/web/residents`);
  assert.equal(target(BASE, "default", "/web/config").href, `${BASE}/web/config`);
  assert.equal(target(BASE, "luna", "/web/avatar", "POST").href, `${BASE}/r/luna/web/avatar`);
  assert.equal(target(BASE, "luna", "/web/waiting/permission", "POST").href, `${BASE}/r/luna/web/waiting/permission`);
});

test("everything else is refused", () => {
  const bad = ["/web/runner/code", "/web/runner/register", "/web/secret", "/web/../x", "/web/%2e%2e/x", "/web/messages%2F..", "/other", "//evil.example/web/messages", "/web/messages#x", "/web/mess ages"];
  for (const p of bad) assert.throws(() => target(BASE, "default", p), ProxyError, p);
  assert.throws(() => target(BASE, "default", "/web/messages", "DELETE"), /method/);
  assert.throws(() => target(BASE, "Bad/Id", "/web/messages"), /resident/);
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
