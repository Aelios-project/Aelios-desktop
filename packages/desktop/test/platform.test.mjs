// The room the window's own buttons take at the top of the left column.
import assert from "node:assert/strict";
import { test } from "node:test";
import { shellTopInset } from "../client/platform.mjs";

const mac = { userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) DeepSeekHarness/1.0.0 Chrome/154.0.0.0 Electron/40.2.0 Safari/537.36" };
const macBrowser = { userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Safari/605.1.15" };
const winShell = { userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154.0.0.0 Electron/40.2.0 Safari/537.36" };

test("inset: the desktop window on macOS leaves room for the traffic lights", () => {
  assert.equal(shellTopInset(mac, {}), 30);
});

test("inset: a browser tab takes nothing, and Windows puts its buttons on the right", () => {
  assert.equal(shellTopInset(macBrowser, {}), 0);
  assert.equal(shellTopInset(winShell, {}), 0);
});

test("inset: the process versions are a second way to know it is Electron", () => {
  assert.equal(shellTopInset({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" }, { versions: { electron: "40.2.0" } }), 30);
  assert.equal(shellTopInset(undefined, undefined), 0);
});
