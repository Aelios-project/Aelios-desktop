# Tasks: onboarding

Written before any code. Task 1 (checks) is done; nothing else is. Keep every file small and do one job. Write no person's name or private detail anywhere. Text in the repository is English.

- [x] 1. Small checks that block the design
  - Checked 2026-11-09 with `cf` 1.0.0-beta.12, `wrangler` 4.158.0 and DSH 0.2.2-rc.1, on the owner's `wizard-test` profile. The account is a real one with other Workers in it; only names starting with `aelios-wizard-test-` were created, and all were deleted (one Worker, listed under 1.4). Output below is redacted: no token, account id or email.
  - [x] 1.1 In a real DSH 0.2.2-rc.1 window, draw a password field in a shell card and post it to a host action; confirm the value is not in DSH's logs
    - Finding: works, nothing leaks. The shell's connect form is a plain `<input type="password">` (`client/connect-form.mjs`) that posts to the host half through `ctx.connection.fetch.register` (`/api/aelios-desktop`). In the real install the record `aelios-desktop/connection` exists in `~/.dsh/.credentials.yaml` (mode 0600), so the form was used there. A script read that record's `key` and searched `~/.dsh/logs` and `~/.dsh/sessions` (412 files): 0 files contain it (only the count was printed).
    - Code: in `dsh-client-connection/lib/index.js` the fetch route is owner-only, the body goes straight to our handler, and nothing logs it. `dsh-client-ui-secret-mask` only masks sent chat messages and plays no part.
    - Not checked: a wizard card itself (not built yet). It is the same mechanism.
  - [x] 1.2 Run `cf auth create <profile>` in device mode; record the exact printed link and code, and the OAuth scopes. Confirm they cover Workers, D1, Vectorize, Queues, AI Gateway and Workers AI
    - Finding: yes. The text goes to stderr, not stdout. Captured from a real device request that was never approved (a throwaway profile name, nothing stored):
      ```
      Attempting to login via OAuth Device Authorization Grant...
      To authorize cf, please visit:

        https://dash.cloudflare.com/oauth2/device/verify

      and enter the code:

        <8 letters and digits>

      You have 5 minutes to approve this request.
      ```
      With `--no-browser` that is all it prints. Without it, `cf` also opens the browser at a link that holds the code (`verification_uri_complete`) and prints `Opening a link in your default browser: <link>`. The wizard reads the link and code from stderr and shows both on the card, in case the browser does not open.
    - Scopes: with no `--scopes`, `cf` asks for its whole default list. The `wizard-test` profile file holds 475 granted scopes, among them `account:read`, `user:read`, `workers:write`, `workers_scripts:write`, `d1:write`, `vectorize:write`, `queues:write`, `aig:read`, `aig:write`, `ai:read`, `ai:write`, `images:write`, `browser:write`, `offline` and `openid`. All six products are covered.
    - The token lives in `~/Library/Preferences/cloudflare/config/<profile>.json` on macOS (fields `oauth_token`, `refresh_token`, `expiration_time`, `scopes`), or an encrypted `.enc` file when the keyring is on. No `cf` command prints it. The access token lasts about an hour; any `cf` command with `--profile` refreshes it first.
  - [x] 1.3 Find how to list the AI Gateway built-in providers live (a `cf` command or the REST route)
    - Finding: no `cf` command does it, but a REST route does: `GET https://api.cloudflare.com/client/v4/accounts/<account>/ai-gateway/providers?per_page=100` (it is not in the public OpenAPI schema; the dashboard uses it). Answer 200 with 39 rows on this account (the default page size 30 cuts it short, so pass `per_page`). Each row has `slug`, `name`, `enable`, `beta`, `public` and `source` (`global` for built-in, `account` for the owner's custom providers; `adobe-firefly` had `enable: false`). Examples of slugs: `openai`, `anthropic`, `deepseek`, `groq`, `openrouter`, `google-ai-studio`, `grok`, `perplexity-ai`, `workers-ai`. The `cf` OAuth token is accepted as the bearer.
    - The models of a gateway: `GET https://gateway.ai.cloudflare.com/v1/<account>/<gateway>/compat/models` answers 200 with ids like `provider/model` plus `cost_in` and `cost_out`. It also accepted the `cf` token on a gateway with authentication on.
    - So the wizard reads both with `fetch` in the host half, the token read in-process as in 1.7. Fallback if the route ever disappears: the 24 names on https://developers.cloudflare.com/ai-gateway/usage/providers/, in a dated list in the plugin.
    - Storing a key: `cf ai-gateway gateways providers create` takes `--secret <value>`, which would put the key in `argv`. `--body @/dev/stdin` works instead (checked with `--dry-run` and a dummy value): `echo '{"provider_slug":"openai","secret":"..."}' | cf ai-gateway gateways providers create <gateway> --body @/dev/stdin --profile <ours>`. The help says the key goes to the gateway's Secrets Store. Not checked live: creating a gateway and a key would add resources for this check only.
  - [x] 1.4 Deploy the resident on a free-plan account; record what happens with `BROWSER` and `IMAGES`, and decide the fallback
    - Finding: the upload is accepted, with both bindings. The account has no Workers Paid subscription (its plans: Cloudflare Free, Teams Free, R2 Paid and Images Stream Basic). `wrangler deploy --name aelios-wizard-test-resident` of the resident at `d101b6b` (config unchanged) printed `Total Upload: 8744.12 KiB / gzip: 1832.74 KiB`, `Worker Startup Time: 103 ms` and the bindings `RESIDENT`, `BOXES`, `BROWSER`, `IMAGES`, `AI`, then `Uploaded aelios-wizard-test-resident` and `Deployed ... triggers`. The Durable Object bindings and the migrations `v1` to `v3` were accepted. It reads 19 asset files and uploads 18.
    - Limits that stay: Browser Run on Workers Free is 10 minutes a day with 3 concurrent browsers, then 429 until the next UTC day (https://developers.cloudflare.com/browser-run/faq/). Images binding: 5,000 unique transformations a month, then an error (https://developers.cloudflare.com/images/pricing/). The code already copes with both (`src/web/fetch.ts` takes `BROWSER` as optional; `pictures.ts` sends photos as they are when `IMAGES` fails). The comment in the resident's `wrangler.jsonc` ("Workers Paid includes 10 browser hours") is out of date for free accounts.
    - Decision: no fallback. The wizard deploys the resident as is. The Images result is slightly weaker than a clean free account because this account holds an Images subscription. Browser use at run time was not tried.
    - Created and deleted: Worker `aelios-wizard-test-resident` (with its Durable Object classes). Deleted with `wrangler delete --force`; the Workers list is back to the 8 it had before.
  - [x] 1.5 Find how the Cloudflare MCP server accepts the `cf` token, and which tools are read-only
    - Finding: the remote server `https://mcp.cloudflare.com/mcp` (the `cf mcp` command manages MCP portals and is not a server) accepts `Authorization: Bearer <the cf OAuth access token>` as is. A live `initialize`, `tools/list` and `tools/call whoami` all answered 200 (`whoami` returned the user id and email, not printed here). OAuth in the client and an API token also work, per https://github.com/cloudflare/mcp.
    - Tools (default code mode): `docs`, `search`, `execute`, `whoami`. Only `whoami` has `readOnlyHint: true`. `docs` and `search` read only, but the server marks them `readOnlyHint: false`; `execute` is marked destructive and can call any API method. With `?codemode=false` it registers one tool per API method (`get_*`, `post_*`, ...).
    - Consequence for A5: the read allowlist is by name in the host half, never by the server's hints: `docs`, `search`, `whoami`, and with `?codemode=false` the tools whose name starts with `get_`. `execute` and every other name waits for approval. The token carries write scopes, so the allowlist is the only brake.
  - [x] 1.7 Verify that the `cf` profile token can be handed to `wrangler` through `CLOUDFLARE_API_TOKEN` in the child's environment only, and which scopes it needs (script upload, the `assets` directory, Durable Object migrations). If it cannot, `wrangler login` is the fallback. Record whether a second browser approval is needed. If yes, the new-owner count becomes 5 everywhere (requirement 11, design table, task 9.1)
    - Finding: it works, and no second approval is needed, so the count stays 4. A small script read `oauth_token` from the profile file and started `npx wrangler@4.158.0` with only `PATH`, `HOME`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `WRANGLER_SEND_METRICS=false` and `CI=1`, with the output redacted. `wrangler whoami` said "logged in with an Account API Token ... read from the CLOUDFLARE_API_TOKEN environment variable". `wrangler deploy` of the resident then uploaded 18 assets, the script, the Durable Object migrations and the AI, Browser and Images bindings (see 1.4).
    - Scopes: nothing beyond the `cf` default list was needed. The deploy used `workers_scripts:write` (script, assets, migrations) and the account lookup (`account:read`, `user:read`). Setting `CLOUDFLARE_ACCOUNT_ID` avoids the memberships route.
    - Rules for the code: read the token in-process after a `cf auth whoami --profile <ours>` (it refreshes an expired token); never set `CLOUDFLARE_API_TOKEN` when running `cf` itself (`cf` then ignores the profile); never put the token in `argv` or the host's own environment. A keyring-backed profile (`.enc`) cannot be read this way; the wizard then falls back to `wrangler login` and the count becomes 5 for that owner only. Not checked: a token that expires during a long deploy (the deploy took about 25 seconds).
  - [x] 1.6 Write the answers into `design.md` and remove them from the "Not checked" notes
  - _Requirements: 4, 5, 8_

- [ ] 2. Bundles
  - [ ] 2.1 `scripts/build-bundles.mjs`: build Aelios and the resident from two named commits with `wrangler deploy --dry-run --outdir`
  - [ ] 2.2 `bundles/manifest.json` with commit, version tag and hash; a test fails when files and manifest differ
  - [ ] 2.3 The manifest lists everything in the design's "Bundles" list (assets, `run_worker_first`, migrations, cron, queue consumer, vars); a test fails when one is missing
  - [ ] 2.4 Carry each bundle's license; add both to `THIRD_PARTY_NOTICES.md`
  - _Requirements: 10, 12_

- [ ] 3. Host core
  - [ ] 3.1 `redact.mjs` and its test (a secret never leaves)
  - [ ] 3.2 `cli.mjs`: spawn `cf` or `npx wrangler@<pin>`, clean environment, secrets on stdin, output through `redact`
  - [ ] 3.3 `state.mjs`, `steps.mjs`, `run.mjs`: check, do, verify; saved progress in DSH credentials without secrets
  - [ ] 3.4 `route.mjs` and the one line in `host/route.mjs`
  - _Requirements: 1, 8, 9.2_

- [ ] 4. Cloudflare and Aelios
  - [ ] 4.1 `cloudflare.mjs`: auth profile, whoami, list Workers, detect Aelios and resident; a found resident switches to the existing-resident path, a found Aelios alone stops with an explanation, and nothing found is overwritten or rekeyed
  - [ ] 4.2 `aelios.mjs`: d1, migrations, vectorize (dimension rule), queue, secret, deploy, health, gateway identity with the model pattern (never empty; pre-filled from the chosen model; a mismatch shows the warning and "I know", never blocks)
  - [ ] 4.3 Secret rule test: local and Cloudflare both present is done; Cloudflare only goes to the "set a new one" card; "Start over" keeps the secrets. Fake `cf`, fake `wrangler` and fake Aelios for tests; test each step twice (second run does nothing) and a failure in the middle (re-run finishes)
  - _Requirements: 2, 4, 6_

- [ ] 5. Resident
  - [ ] 5.1 `resident.mjs`: web key, secrets, deploy, health, pairing code
  - [ ] 5.2 URL and key path (works today)
  - _Requirements: 3_

- [ ] 6. Models and helpers
  - [ ] 6.1 `models.mjs`: credits, BYOK built-in (live list), pattern check, test call
  - [ ] 6.2 `helpers.mjs`: detect `dsh`, `kiro-cli`, `claude`; reuse `ensurePaired`
  - _Requirements: 5, 6, 7_

- [x] 7. Settled: an existing resident keeps its Aelios; the wizard asks about the resident first and skips Aelios
  - _Requirements: 2.2_

- [ ] 8. Client cards
  - [ ] 8.1 `wizard.mjs`, `secret-field.mjs`, and one `card-*.mjs` per card (A, R, S, H, error)
  - [ ] 8.2 English strings in `client/strings.mjs`; the preview gets a fake host for the wizard
  - [ ] 8.3 Error card with "Try again"; the "set a new one" card
  - _Requirements: 1, 6, 8, 9, 11_

- [ ] 9. Step count and end to end
  - [ ] 9.1 A test that counts cards per path and fails past the bound: existing resident 2, new default 4 (task 1.7 found no second approval, so not 5)
  - [ ] 9.2 One run in a real DSH: from installed plugin to the first line, on a test account
  - _Requirements: 11_

- [ ] 10. After the contest
  - [ ] 10.1 Update: compare deployed tag with the manifest; the Update card and the redeploy (requirement 10)
  - [ ] 10.2 Has Aelios, no resident: `identities.mjs`, the identity pick (A1)
  - [ ] 10.3 Codex sign-in `codex.mjs` (A2) and custom provider (A3)
  - [ ] 10.4 Service binding in both other repositories, each its own PR (A4)
  - [ ] 10.5 "Help me check" `explain.mjs`; test that a write tool name waits for approval and no secret reaches the model (A5)
  - _Requirements: 10, A1 to A5_
