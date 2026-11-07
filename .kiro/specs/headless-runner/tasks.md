# Tasks: headless runner

Honest note: this list was written after the first version of the code. It records what exists and what does not. It is not a plan that came before the code.

## Done

- [x] 1. Project setup
  - [x] 1.1 Package `aelios-runner` with `bin`, `files`, `engines` (Node 22+), AGPL-3.0-only license
  - [x] 1.2 Root workspace so `npm test` at the root runs the runner tests
- [x] 2. ACP client (`src/acp.mjs`): JSON-RPC over stdio, requests, notifications, close
- [x] 3. Helper turn (`src/helper.mjs`)
  - [x] 3.1 initialize, session new / load / resume, prompt
  - [x] 3.2 cancel, with a forced stop if the helper does not answer
  - [x] 3.3 Turn time limit
  - [x] 3.4 `ASK:` rule and the English convention line
- [x] 4. Plugins (`src/plugins.mjs`): `kiro`, `dsh`, `command` (experimental)
- [x] 5. Permissions (`src/permission.mjs`): tiers, workspace check, symlinks, allow once
- [x] 6. Cloud client (`src/cloud.mjs`): pair, register, revoke, heartbeat, poll, receipt, error sorting
- [x] 7. Receipts (`src/receipt.mjs`): ids, redaction, size limit, 413 handling
- [x] 8. Runner loop (`src/runner.mjs`)
  - [x] 8.1 Idempotent claim with a saved `claimKey`
  - [x] 8.2 Per-thread queue; `job`, `say` (stop and restart), `mail` (queued), `cancel`
  - [x] 8.3 Outbox and resend
  - [x] 8.4 Revoke means stop
  - [x] 8.5 Restart recovery: `needs_you`, not redone
  - [x] 8.6 `resolve` of open asks when a thread finishes
- [x] 9. State and lock (`src/state.mjs`, `src/lock.mjs`): 0600 files, one `start` per folder
- [x] 10. Command line (`bin/aelios-runner.mjs`): `pair`, `start`, `status`, `unpair`
- [x] 11. Tests: fake cloud, fake helper, pairing, loop, permissions, lock, size limit, command line
- [x] 12. Docs: `README.md` and `PROTOCOL.md` in English
- [x] 13. Move into this repository with history (`git subtree split`)
- [x] 19. Run-time messages in receipts, errors and the helper convention are in English; the helper is told to reply in the language of the job

## Not done

- [ ] 14. Run a whole job through a real Kiro (only `initialize` has been checked)
- [ ] 15. Connect and run a whole job through a real DSH
- [ ] 16. Check what real Kiro does with `session/request_permission` and `--trust-all-tools`
- [ ] 17. Stop button on the resident's web page for a running thread (cloud side, in Aelios-resident)
- [ ] 18. `progress` events while a turn runs
- [ ] 20. A local command to stop one thread (`Runner.cancel(thread)` exists)
- [ ] 21. Claude Code through an ACP adapter, tested end to end (experimental)
- [ ] 22. Publish to npm
- [ ] 23. Desktop app with a window, based on DeepSeek Harness (`packages/desktop`)
