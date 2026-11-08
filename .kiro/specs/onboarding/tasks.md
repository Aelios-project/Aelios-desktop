# Tasks: onboarding

Written before any code. Nothing is done yet. Keep every file small and do one job. Write no person's name or private detail anywhere. Text in the repository is English.

- [ ] 1. Small checks that block the design
  - [ ] 1.1 In a real DSH 0.2.2-rc.1 window, draw a password field in a shell card and post it to a host action; confirm the value is not in DSH's logs
  - [ ] 1.2 Run `cf auth create <profile>` in device mode; record the exact printed link and code, and the OAuth scopes. Confirm they cover Workers, D1, Vectorize, Queues, AI Gateway and Workers AI
  - [ ] 1.3 Find how to list the AI Gateway built-in providers live (a `cf` command or the REST route)
  - [ ] 1.4 Deploy the resident on a free-plan account; record what happens with `BROWSER` and `IMAGES`, and decide the fallback
  - [ ] 1.5 Find how the Cloudflare MCP server accepts the `cf` token, and which tools are read-only
  - [ ] 1.6 Write the answers into `design.md` and remove them from the "Not checked" notes
  - _Requirements: 4, 5, 8, 9_

- [ ] 2. Bundles
  - [ ] 2.1 `scripts/build-bundles.mjs`: build Aelios and the resident from two named commits with `wrangler deploy --dry-run --outdir`
  - [ ] 2.2 `bundles/manifest.json` with commit, version tag and hash; a test fails when files and manifest differ
  - [ ] 2.3 Carry each bundle's license; add both to `THIRD_PARTY_NOTICES.md`
  - _Requirements: 10, 12_

- [ ] 3. Host core
  - [ ] 3.1 `redact.mjs` and its test (a secret never leaves)
  - [ ] 3.2 `cli.mjs`: spawn `cf` or `npx wrangler@<pin>`, clean environment, secrets on stdin, output through `redact`
  - [ ] 3.3 `state.mjs`, `steps.mjs`, `run.mjs`: check, do, verify; saved progress in DSH credentials without secrets
  - [ ] 3.4 `route.mjs` and the one line in `host/route.mjs`
  - _Requirements: 1, 8, 9.2_

- [ ] 4. Cloudflare and Aelios
  - [ ] 4.1 `cloudflare.mjs`: auth profile, whoami, list Workers, detect Aelios and resident
  - [ ] 4.2 `aelios.mjs`: d1, migrations, vectorize (dimension rule), queue, secret, deploy, health, gateway identity with the model pattern (never empty)
  - [ ] 4.3 Fake `cf`, fake `wrangler` and fake Aelios for tests; test each step twice (second run does nothing) and a failure in the middle (re-run finishes)
  - _Requirements: 2, 4, 6_

- [ ] 5. Resident
  - [ ] 5.1 `resident.mjs`: web key, secrets, deploy, health, pairing code
  - [ ] 5.2 URL and key path first (works today); service-binding path after task 7.1
  - _Requirements: 3_

- [ ] 6. Models, helpers, help
  - [ ] 6.1 `models.mjs`: credits, BYOK built-in (live list), BYOK custom, test call
  - [ ] 6.2 `codex.mjs`: loopback catch on 127.0.0.1:1455 with a paste fallback
  - [ ] 6.3 `helpers.mjs`: detect `dsh`, `kiro-cli`, `claude`; reuse `ensurePaired`
  - [ ] 6.4 `explain.mjs`: Workers AI plus read-only MCP; test that a write tool name waits for approval and that no secret reaches the model
  - _Requirements: 5, 7, 9_

- [ ] 7. Changes in other repositories (each its own PR, reviewed before merge)
  - [ ] 7.1 Aelios: a `WorkerEntrypoint` for the resident; resident: the `AELIOS` binding and its use before `fetch`
  - [ ] 7.2 Decide with the owner: rewire an existing resident to a newly deployed Aelios, or leave it
  - _Requirements: 3.4_

- [ ] 8. Client cards
  - [ ] 8.1 `wizard.mjs`, `secret-field.mjs`, and one `card-*.mjs` per card (A, R, S, H, error)
  - [ ] 8.2 English strings in `client/strings.mjs`; the preview gets a fake host for the wizard
  - [ ] 8.3 Error card with "Try again" and "Help me check"
  - _Requirements: 1, 8, 9, 11_

- [ ] 9. Update
  - [ ] 9.1 Compare deployed tag with the manifest; the Update card and the redeploy
  - _Requirements: 10_

- [ ] 10. Step count and end to end
  - [ ] 10.1 A test that counts cards per path and fails past 3
  - [ ] 10.2 One run in a real DSH: from installed plugin to the first line, on a test account
  - _Requirements: 11_
