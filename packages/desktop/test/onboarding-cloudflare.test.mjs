import assert from "node:assert/strict";
import { test } from "node:test";
import { CloudflareError, authorize, findWorkers, parseDeviceText, profilePaths, readProfile, workerUrl } from "../host/onboarding/cloudflare.mjs";

const missing = () => Object.assign(new Error("missing"), { code: "ENOENT" });

test("cloudflare: the profile is a readable file, a keychain entry, or missing", async () => {
  const file = await readProfile("wizard", {
    platform: "darwin", home: "/home/owner",
    read: async () => JSON.stringify({ oauth_token: "token-value", expiration_time: 1 }),
  });
  assert.deepEqual([file.state, file.token], ["file", "token-value"]);
  assert.match(profilePaths("wizard", { platform: "darwin", home: "/home/owner" }).config, /Library\/Preferences\/cloudflare\/config\/wizard\.json$/);

  const keyring = await readProfile("wizard", { read: async () => { throw missing(); }, exists: async () => true });
  assert.equal(keyring.state, "keyring");
  const absent = await readProfile("wizard", { read: async () => { throw missing(); }, exists: async () => false });
  assert.equal(absent.state, "missing");
});

test("cloudflare: the device text gives the link and the code", () => {
  const text = "Attempting to login via OAuth Device Authorization Grant...\n\n  To authorize cf, please visit:\n\n  https://dash.cloudflare.com/oauth2/device/verify\n\n  and enter the code:\n\n  ABCD-1234\n\n  You have 5 minutes";
  assert.deepEqual(parseDeviceText(text), { link: "https://dash.cloudflare.com/oauth2/device/verify", code: "ABCD-1234" });
  assert.deepEqual(parseDeviceText("nothing yet"), { link: null, code: null });
});

test("cloudflare: workers are found by name and the address comes from the JSON", () => {
  const workers = [
    { name: "companion-memory-proxy", id: "one" },
    { name: "aelios-resident", id: "two", subdomain: { url: "https://res.example/" } },
  ];
  const found = findWorkers(workers);
  assert.equal(found.aelios.id, "one");
  assert.equal(workerUrl(found.resident), "https://res.example");
  assert.equal(workerUrl(found.aelios), null);
  assert.deepEqual(findWorkers([]), { aelios: null, resident: null });
});

test("cloudflare: authorize reports the link and code while the command runs", async () => {
  const events = [];
  const cli = {
    cf: async (args, options) => {
      assert.deepEqual(args, ["auth", "create", "aelios-desktop", "--no-browser"]);
      options.onText("To authorize cf, please visit: https://dash.cloudflare.com/oauth2/device/verify and enter the code: WXYZ-9876");
      return { code: 0 };
    },
  };
  const seen = await authorize(cli, { onEvent: (event) => events.push(event) });
  assert.equal(seen.code, "WXYZ-9876");
  assert.equal(events.length, 1);

  const failing = { cf: async () => ({ code: 1, tail: "denied" }) };
  await assert.rejects(authorize(failing), CloudflareError);
});
