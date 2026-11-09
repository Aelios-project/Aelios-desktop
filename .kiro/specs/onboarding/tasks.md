# Tasks: onboarding

Written before any code. Nothing is done yet. Keep every file small and do one job. Write no person's name or private detail anywhere. Text in the repository is English.

- [ ] 1. Small checks that block the design
  - [ ] 1.1 In a real DSH 0.2.2-rc.1 window, draw a password field in a shell card and post it to a host action; confirm the value is not in DSH's logs
  - [ ] 1.2 Run `cf auth create <profile>` in device mode; record the exact printed link and code, and the OAuth scopes. Confirm they cover Workers, D1, Vectorize, Queues, AI Gateway and Workers AI
  - [ ] 1.3 Find how to list the AI Gateway built-in providers live (a `cf` command or the REST route)
  - [ ] 1.4 Deploy the resident on a free-plan account; record what happens with `BROWSER` and `IMAGES`, and decide the fallback
  - [ ] 1.5 Find how the Cloudflare MCP server accepts the `cf` token, and which tools are read-only
  - [ ] 1.7 Verify that the `cf` profile token can be handed to `wrangler` through `CLOUDFLARE_API_TOKEN` in the child's environment only, and which scopes it needs (script upload, the `assets` directory, Durable Object migrations). If it cannot, `wrangler login` is the fallback. Record whether a second browser approval is needed. If yes, the new-owner count becomes 5 everywhere (requirement 11, design table, task 9.1)
  - [ ] 1.6 Write the answers into `design.md` and remove them from the "Not checked" notes
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
  - [ ] 9.1 A test that counts cards per path and fails past the bound: existing resident 2, new default 4 (5 only if task 1.7 says so)
  - [ ] 9.2 One run in a real DSH: from installed plugin to the first line, on a test account
  - _Requirements: 11_

- [ ] 10. After the contest
  - [ ] 10.1 Update: compare deployed tag with the manifest; the Update card and the redeploy (requirement 10)
  - [ ] 10.2 Has Aelios, no resident: `identities.mjs`, the identity pick (A1)
  - [ ] 10.3 Codex sign-in `codex.mjs` (A2) and custom provider (A3)
  - [ ] 10.4 Service binding in both other repositories, each its own PR (A4)
  - [ ] 10.5 "Help me check" `explain.mjs`; test that a write tool name waits for approval and no secret reaches the model (A5)
  - _Requirements: 10, A1 to A5_
