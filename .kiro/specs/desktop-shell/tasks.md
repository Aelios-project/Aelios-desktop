# Tasks: desktop shell

Written before any code. Nothing is done yet. Keep every file small and do one job. Write no person's name or private detail anywhere. Text in the repository is English.

Known result, no task needed: a page placed by a plugin fills only the middle of the window. The shell draws its own components.

- [ ] 1. Small checks that block the design
  - [ ] 1.1 In DSH 0.2.2-rc.1, shadow `sidebar.workspaces` and the conversation cells with an empty component of our own; find what of DSH still shows (Open question 1)
  - [ ] 1.2 Find out if the ACP session id of `dsh --profile acp` is a DSH session id and whether the owner's window can read that session (Open question 2)
  - [ ] 1.3 Find which session events hold changed files and run commands, and choose the read API (Open question 3)
  - [ ] 1.4 Write the answers into `design.md` and remove them from "Open questions"
  - _Requirements: 1.3, 8.2, 8.3_

- [ ] 2. Runner changes the shell needs
  - [ ] 2.1 Add `aelios-runner status --json` and a stable exit code for "revoked" and "locked"
  - [ ] 2.2 Test that no receipt carries a tool call or a file list
  - [ ] 2.3 Decide how the shell gets the runner (publish or vendor) and write it in `design.md`
  - _Requirements: 2.3, 2.5, 8.1_

- [ ] 3. Plugin skeleton
  - [ ] 3.1 `packages/desktop/package.json` with `dsh.client`, `dsh.bundle.patch` and `engines.dsh` pinned to 0.2.2-rc.1
  - [ ] 3.2 `cordis.patch.yml`
  - [ ] 3.3 `host/index.mjs` and `client/index.mjs` that only register
  - _Requirements: 11.8_

- [ ] 4. Supervisor
  - [ ] 4.1 `host/supervisor.mjs`: states, start, stop, one restart per minute, dispose
  - [ ] 4.2 Map exit codes and output to `locked`, `crashed`, `revoked`
  - [ ] 4.3 `test/supervisor.test.mjs` with the fake cloud and fake helper
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 12.1, 12.2_

- [ ] 5. Connect and proxy
  - [ ] 5.1 `host/connect.mjs`: input checks, default folder, key in the credential store, pair arguments
  - [ ] 5.2 `host/proxy.mjs`: the allow-list and the forward with `x-web-key`
  - [ ] 5.3 `host/route.mjs`: status, connect, stop, unpair, `web/*`, details
  - [ ] 5.4 Tests: allowed paths pass; `..`, encoded slashes, other origins and `/web/runner/*` are refused; the key never reaches a response or a log
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 6.1, 6.2, 12.2_

- [ ] 6. Client base
  - [ ] 6.1 `client/api.mjs`: fetch and poll with `since`
  - [ ] 6.2 `client/theme.mjs`: all CSS variables with plain defaults
  - [ ] 6.3 `client/index.mjs`: shadow the left slot and the middle, mount the columns
  - [ ] 6.4 `client/connect-form.mjs`
  - [ ] 6.5 Test the poll: an unchanged answer changes nothing
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 6.3, 9.1_

- [ ] 7. The columns
  - [ ] 7.1 `client/left.mjs`: residents, pinned and recent threads
  - [ ] 7.2 `client/chat.mjs`: messages and input
  - [ ] 7.3 `client/panels.mjs`: the panel registry and switcher, with places for Board and Tools
  - [ ] 7.4 Copy only the small styles and components that are used from Aelios-resident, with the source in each file header
  - _Requirements: 1.1, 1.4, 6.1, 11.6_

- [ ] 8. Right panels
  - [ ] 8.1 `client/panel-threads.mjs`: list, open a thread, talk (`/web/thread/say`), stop (`/web/thread/stop`)
  - [ ] 8.2 `client/panel-waiting.mjs`: asks with options, notes, done, stuck; mark read
  - [ ] 8.3 Check that an ask answered in the panel leaves the list
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 9. Details from the DSH session
  - [ ] 9.1 `host/details.mjs`: find the session from the runner's state, fold it into a short list, read only
  - [ ] 9.2 The "Details" fold in the thread panel, and the one-line message when unreadable
  - [ ] 9.3 Test with a fake session log
  - _Requirements: 8.2, 8.3, 8.4, 8.6_

- [ ] 10. Four-step check
  - [ ] 10.1 A test that reads the setup script and fails above four steps
  - [ ] 10.2 Walk the steps by hand on a clean DSH and write the result in `packages/desktop/README.md`
  - [ ] 10.3 Confirm with the resident side who sends the first message (Open question 6)
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 11. The look
  - [ ] 11.1 `packages/desktop-skin-halloween`: sets the variables and ships its own icons
  - [ ] 11.2 Check contrast, focus ring, reduced motion, and that the shell works without the skin
  - [ ] 11.3 Confirm the Kiroween category (Open question 8)
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [ ] 12. VPS
  - [ ] 12.1 Write `packages/desktop/VPS.md`: runner only, and `dsh web` plus the shell
  - [ ] 12.2 Require HTTPS and DSH's own authentication for any outside access; say plain HTTP on a non-loopback address is unsafe
  - [ ] 12.3 Answer Open question 5 by running `dsh web` once with the shell, then update the page
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 13. Licenses and hygiene
  - [ ] 13.1 Add the check that fails when DSH files are copied in without the MIT block in `THIRD_PARTY_NOTICES.md`
  - [ ] 13.2 When (and only when) DSH files are first added, put DSH's full MIT LICENSE text and copyright line in `THIRD_PARTY_NOTICES.md` in that same commit
  - [ ] 13.3 If any DS Bot code is copied, add the Apache-2.0 text and the matching `NOTICE` lines in that same commit
  - [ ] 13.4 Scan the package for names, private addresses and secrets
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8_

- [ ] 14. Real-DSH check (opt-in)
  - [ ] 14.1 `AELIOS_REAL_DSH=1` test: plugin loads, columns register, no model request
  - [ ] 14.2 Update `packages/desktop/README.md`, `README.md` and `.kiro/steering/structure.md` to match
  - _Requirements: 12.3_
