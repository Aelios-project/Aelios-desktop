# Tasks: waiting list

Written before any code. Nothing is done yet. All work is in the Aelios-resident repository, on a branch of its own.

- [x] 1. Item model and builder
  - [x] 1.1 Create `src/waiting.ts` with `WaitingItem` and the pure `build` (kinds, id rule, order, sentence cut)
  - [x] 1.2 Add expiry at 7 days (ask) and drop at 14 days
  - [x] 1.3 Write `test/waiting.mjs` for 1.1 and 1.2
  - _Requirements: 1, 2.1, 2.2, 3.1, 3.2, 3.5, 3.6, 3.7_

- [x] 2. Storage and endpoints
  - [x] 2.1 Add the table `res_waiting_seen` and its 14-day cleanup
  - [x] 2.2 Add `GET /web/waiting`, `POST /web/waiting/seen` (the handlers are in `resident.ts`; no separate routes file was needed)
  - [x] 2.3 Wire the two routes in `src/index.ts` (two lines)
  - [x] 2.4 Collect asks from `res_machine_asks` and from cloud task cards that wait
  - [x] 2.5 Test that a resolved ask leaves the list and a read item stays gone
  - _Requirements: 1.2, 1.3, 3.3, 3.4, 4.2, 4.3_

- [x] 3. Stopped status and the cancel fix
  - [x] 3.1 Add `"stopped"` to `TaskStatus`; keep it out of `REPORTED`
  - [x] 3.2 In `src/machine.ts`, map a `cancelled` receipt to `stopped`
  - [x] 3.3 Make the receipt of a `cancel` work change no task
  - [x] 3.4 Add `"stopped"` cases wherever `TaskStatus` is switched on (page, find-tools, `machineRecord`)
  - [x] 3.5 Tests in `test/machine.mjs`: stopped by `cancelled`, stopped by an interrupting `say`, cancel receipt leaves the task alone
  - _Requirements: 1.6, 6.3, 6.4, 6.5, 6.6, 6.7_

- [x] 4. Stop button
  - [x] 4.1 Add `POST /web/thread/stop` that queues a `cancel` for a working thread
  - [x] 4.2 Add the button to the thread page and show "Stopped"
  - [x] 4.3 E2E: stop a slow thread; it shows "Stopped" and not "failed" or "done"
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 5. Push for asks
  - [x] 5.1 `askPush` in `src/waiting.ts` and `unpushed` in the store, once per item id (no separate push file)
  - [x] 5.2 Call it where an ask is stored and where a cloud task enters `needs_you`
  - [x] 5.3 Test: one push per ask, none for `done` or `stuck`, none when push is not set up
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 6. Page
  - [x] 6.1 Create `public/waiting.js` (load, mark read, answer, stop)
  - [x] 6.2 Wire it in `public/app.js` with one merge and one load call
  - [x] 6.3 Add the list view and the menu row with the open-ask count to `public/index.html`
  - [x] 6.4 Show option buttons, "Open thread", the time, and dimmed "Expired" rows
  - [x] 6.5 E2E: an ask appears, its option resolves it, the conversation gets no new line
  - _Requirements: 2.3, 2.4, 4.1, 4.3, 5.4, 8.4_

- [ ] 7. Two small fixes
  - [x] 7.1 Remove `res_machine_receipts` of removed work in `Machine.enqueue`; test it
  - [x] 7.2 Add `watchPairing()` to `public/machine.js` (3-second check, stop on online or code expiry)
  - [ ] 7.3 Page check: after pairing, the settings page shows the machine online without a reload
  - _Requirements: 7.1, 7.2_

- [x] 9. The helper's four ways to speak (Aelios-desktop, `packages/runner`)
  - [x] 9.1 Create `src/markers.mjs`: take out `NOTE:` lines, read `ASK:` / `BLOCKED:` from the last line
  - [x] 9.2 Map `BLOCKED:` to `failed` with a "Blocked:" summary; send notes as the final receipt's `notice`
  - [x] 9.3 Write the convention with the four-step ladder in the runner (`helper.mjs`)
  - [x] 9.4 Tests: each marker, notes anywhere, no marker with a question mark, blocked has no ask
  - [x] 9.5 Update `PROTOCOL.md`, `README.md` and the headless-runner spec
  - _Requirements: 9_

- [x] 10. Notes in the list (Aelios-resident)
  - [x] 10.1 Add `res_machine_notes`; store a final receipt's `notice` there
  - [x] 10.2 Give `build` the `note` kind; read, replace and expire like `done`
  - [x] 10.3 Test: a note shows, is not pushed, and goes away when read
  - _Requirements: 1.6, 2.2, 3.4, 3.5, 5.3_

- [ ] 8. Close out
  - [x] 8.1 Check file sizes (new files under 300 lines) and that `resident.ts` and `app.js` only gained wiring
  - [x] 8.2 Grep for names and personal details in code, docs and tests
  - [x] 8.3 Run `npm run typecheck`, `node test/waiting.mjs`, `node test/machine.mjs`, `node test/machine-e2e.mjs`
  - [ ] 8.4 Update `docs/testing.md` and both READMEs
  - _Requirements: 8_
