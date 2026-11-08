// The MCP server rows: host, state in words, and what is worth showing.
import assert from "node:assert/strict";
import { test } from "node:test";
import { hostOf, mcpRows, mcpState } from "../client/mcp.mjs";

test("mcp: the host is what the row shows beside the name", () => {
  assert.equal(hostOf("https://mcp.example.com/sse?x=1"), "mcp.example.com");
  assert.equal(hostOf("not a url"), "not a url");
  assert.equal(hostOf(null), "");
});

test("mcp: states read in words", () => {
  assert.equal(mcpState("ready"), "connected");
  assert.equal(mcpState("authenticating"), "waiting for you to sign in");
  assert.equal(mcpState("odd"), "odd");
  assert.equal(mcpState(), "");
});

test("mcp: rows keep the order and carry the tool count", () => {
  const rows = mcpRows([
    { id: "1", name: "Playwright", url: "https://a.example/sse", state: "ready", tools: 12, hasKey: true },
    { id: "2", url: "https://b.example/mcp", state: "error", error: "refused", tools: 0 },
  ]);
  assert.deepEqual(rows.map((r) => [r.id, r.name, r.host, r.word, r.tools]), [["1", "Playwright", "a.example", "connected", 12], ["2", "b.example", "b.example", "not connected", 0]]);
  assert.equal(rows[1].error, "refused");
  assert.deepEqual(mcpRows(), []);
});
