# Tasks: desktop shell

Written before any code. Nothing is done yet. Keep every file small and do one job. Write no person's name or private detail anywhere. Text in the repository is English.

- [ ] 1. Settle the open questions that block the design
  - [ ] 1.1 Install a plugin skeleton in DSH 0.2.2-rc.1 and find which shipped slot lets a full-width webview replace the conversation area (shadow with `priority: -100`, as DS Bot does); check the webview bridge, whether login is kept after restart, which Node runs host code, where plugins live
  - [ ] 1.2 Check the resident's response headers for framing
  - [ ] 1.3 Write the answers into `design.md` and remove them from "Open questions"
  - _Requirements: 1.1, 1.3, 2.1_

- [ ] 2. Runner changes the shell needs
  - [ ] 2.1 Add `aelios-runner status --json` and a stable exit code for "revoked" and "locked"
  - [ ] 2.2 Decide how the shell gets the runner (publish or vendor) and write it in `design.md`
  - [ ] 2.3 Tests in `packages/runner/test`
  - _Requirements: 2.3, 2.5_

- [ ] 3. Plugin skeleton
  - [ ] 3.1 `packages/desktop/package.json` with `dsh.client`, `dsh.bundle.patch` and `engines.dsh` pinned to 0.2.2-rc.1
  - [ ] 3.2 `cordis.patch.yml`
  - [ ] 3.3 `host/index.mjs` and `client/index.mjs` that only register
  - _Requirements: 9.5_

- [ ] 4. Supervisor
  - [ ] 4.1 `host/supervisor.mjs`: states, start, stop, one restart per minute, dispose
  - [ ] 4.2 Map exit codes and output to `locked`, `crashed`, `revoked`
  - [ ] 4.3 `test/supervisor.test.mjs` with the fake cloud and fake helper
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 10.1, 10.2_

- [ ] 5. Pairing
  - [ ] 5.1 `host/pair.mjs`: input checks, default folder, argument array
  - [ ] 5.2 `host/route.mjs`: status, pair, start, stop, unpair
  - [ ] 5.3 `test/pair.test.mjs`: address rules, the code never logged, failure keeps the form
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 7.2_

- [ ] 6. The panel and the window
  - [ ] 6.1 `client/pair-form.mjs`
  - [ ] 6.2 `client/status.mjs` with stop and unpair
  - [ ] 6.3 `client/frame.mjs`: open the resident's page, fallback to the system browser
  - [ ] 6.4 Optional badge: count of open asks from the resident's list endpoint
  - _Requirements: 1.1, 1.3, 1.4, 1.5, 4.6, 5.2, 6.1, 6.2, 6.3, 7.1, 7.3_

- [ ] 7. Four-step check
  - [ ] 7.1 A test that reads the setup script and fails above four steps
  - [ ] 7.2 Walk the steps by hand on a clean DSH and write the result in `packages/desktop/README.md`
  - [ ] 7.3 Confirm with the resident side who sends the first message (Open question 8)
  - _Requirements: 5.1, 5.3, 5.4_

- [ ] 8. The look
  - [ ] 8.1 `theme/halloween.css` and the project's own icons
  - [ ] 8.2 Check contrast, focus ring, reduced motion, and that the shell works without the file
  - [ ] 8.3 Confirm the Kiroween category (Open question 12)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 9. Licenses and hygiene
  - [ ] 9.1 Add the check that fails when DSH files are copied in without the MIT block in `THIRD_PARTY_NOTICES.md`
  - [ ] 9.2 When (and only when) DSH files are first added, put DSH's full MIT LICENSE text and copyright line in `THIRD_PARTY_NOTICES.md` in that same commit
  - [ ] 9.3 Scan the package for names, private addresses and secrets
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 10. Real-DSH check (opt-in)
  - [ ] 10.1 `AELIOS_REAL_DSH=1` test: plugin loads, panel registers, no model request
  - [ ] 10.2 Update `packages/desktop/README.md`, `README.md` and `.kiro/steering/structure.md` to match
  - _Requirements: 10.3_
