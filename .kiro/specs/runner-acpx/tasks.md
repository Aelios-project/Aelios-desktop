# Tasks: runner on acpx

Written before any code. Nothing is done yet. Order matters: each task leaves `npm test` green (also with `kiro-cli` and `dsh` off `PATH`). Every new file stays at or under 300 lines. New logic goes in a new module, not into `runner.mjs`, `helper.mjs` or `steps.mjs`.

Start condition: PRs #20, #23 (and #22 where it touches the runner) are merged to `main`. The code PRs branch from `main` after them. #21 is merged.

Mechanism PRs (they wait for Claude Code or Codex review): 1 (dependency), 4, 5, 6 (launch, state, env), 9 (permissions), 13 (PROTOCOL field), 15 (default flip). Small PRs may be merged after a normal review.

- [ ] 1. Spike and dependency (mechanism)
  - [ ] 1.1 Add `acpx` `0.22.0` to `packages/runner/package.json` (exact), `engines.node >=22.13.0`, update the lock file. Change the "No runtime dependencies" line in `.kiro/steering/tech.md`. Add acpx (MIT) to `THIRD_PARTY_NOTICES.md`
  - [ ] 1.2 Script `test/spike-acpx.mjs` (not part of `npm test`; run by hand): with `createAcpRuntime` and a `stateDir` in a temp folder, against `test/fake-agent.mjs`, check session keep, reattach after a runtime restart, follow-up queueing, cancel, permission callback, `fs:false`, `terminal:false`, `elicitationModes:[]`
  - [ ] 1.3 Write down in design.md: which fields make acpx open a new session (agent name, command, argv, cwd); file modes of its file store; what `onAcpMessage` shows for `initialize`; whether stderr is reachable
  - [ ] 1.4 If 1.2 fails for `createAcpRuntime`, stop and ask the owner (open question 1)
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 2. Engine switch and the seam
  - [ ] 2.1 `src/turn.mjs` (new, < 40 lines): `makeTurn(options, config)` returns the legacy `Turn` or the acpx turn by `config.engine` (default `"legacy"`)
  - [ ] 2.2 `runner.mjs`: call `makeTurn` where it calls `new Turn` (one line). Pass `record` so the turn can read the launch identity
  - [ ] 2.3 Test `turn.test.mjs`: default is legacy; `"acpx"` gives the acpx class; an unknown value fails at config load
  - _Requirements: 1.2, 14.1, 14.2_

- [ ] 3. Kiro agent name without the tier (mechanism)
  - [ ] 3.1 `kiro-agent.mjs`: `agentName(threadId, cwd)` has no tier; the tier only changes file content
  - [ ] 3.2 Add the `full` config (all tools allowed) so `full` needs no `--trust-all-tools`. Check by hand against real Kiro (`AELIOS_REAL_KIRO=1`) that it opens what the flag opens. If not, keep the flag and note it in design.md (open question 2)
  - [ ] 3.3 Tests in `kiro-agent.test.mjs`: same name for `read`, `edit`, `full` on one thread; different names for different threads; file content differs by tier; file mode `0600`
  - _Requirements: 4.3_

- [ ] 4. Launch registry and launch identity (mechanism)
  - [ ] 4.1 `src/launch.mjs`: `registryOf(config)` (one entry, ours, never the acpx table), `identityOf(launch)`, `sameLaunch(record, current)`, command string quoting
  - [ ] 4.2 `adapters.json` and `src/adapters.mjs` (new plugs `claude`, `codex`, experimental): pinned package, version, integrity; started from a local install path
  - [ ] 4.3 Tests in `launch.test.mjs`: `kiro` command is `kiro-cli acp ...`, never `kiro-cli-chat`; DSH path with spaces is quoted; `adapters.json` has no range, no `latest`, no missing integrity; no command contains `npx`; identity is equal across tiers and different when binary, args, version or folder change
  - [ ] 4.4 Named tests `tier change keeps the session` and `launch change is a visible handoff, never silent` (see task 9 for the second; the first runs here against the fake helper and checks it saw `session/load`, not `session/new`)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 5. Session store and retention (mechanism)
  - [ ] 5.1 `src/store.mjs`: `openStore(home)` creates `<home>/acpx/` at `0700`, checks and narrows modes, refuses with a message when it cannot
  - [ ] 5.2 `src/retention.mjs`: delete threads idle for N days; cap total size, oldest first; `forget(thread)`; `forgetAll()`
  - [ ] 5.3 `bin/aelios-runner.mjs`: `forget <thread>`, `forget --all`, `unpair` asks to delete the store; `status` shows path and size. Keep the CLI additions in `bin/forget.mjs` so the main file does not grow
  - [ ] 5.4 README: a short section "What is saved on this machine" including the secrets warning
  - [ ] 5.5 Tests in `store.test.mjs`, `retention.test.mjs`: modes `0700`/`0600` on a fresh store; a wide mode is narrowed; age and size limits remove the right threads and keep others; `forget` removes one; `unpair` default removes the store
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 6. Environment allowlist (mechanism)
  - [ ] 6.1 `src/env-allow.mjs`: `envFor(plugin, config, processEnv)` returns the allow list and the explicit overlay
  - [ ] 6.2 Tests in `env-allow.test.mjs`: all eight proxy names (upper and lower case) pass; `ALL_PROXY` reaches a Kiro helper; a random secret variable does not; the runner's pairing token does not; config `env` keys pass; per-plug names pass only for that plug
  - [ ] 6.3 Fake helper prints its environment names to a file; one end-to-end test checks the same
  - _Requirements: 8.1, 8.2_

- [ ] 7. Time limits
  - [ ] 7.1 `src/stages.mjs`: a small controller with the stages in the design table; `enter(stage)`, `pause()`, `resume()`, `fired` promise that names the stage
  - [ ] 7.2 Config keys `timeouts.{spawn,initialize,session,firstUpdate,inactivity,cancel,turn}` with defaults; validate in `readConfig`
  - [ ] 7.3 Tests in `stages.test.mjs` with fake timers: each stage fires and names itself; inactivity does not fire while paused and restarts after resume; a stage that ends clears its timer; turn cap off means no timer
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 8. Verdicts and ask kinds
  - [ ] 8.1 `src/verdict.mjs`: pure `verdict(signals)` as in the design table
  - [ ] 8.2 Table test `verdict.test.mjs`: one row per table line, plus: crash before the prompt is written is `failed` with its reason; crash after it is `interrupted`; a stage limit before and after the prompt; `cancelled` vs our cancel; denied list gives `permission`; `refusal` gives `problem`
  - [ ] 8.3 Reuse `markers.mjs` and `reason.mjs`; do not copy their rules
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 10.1_

- [ ] 9. Permission callback and the acpx turn (mechanism)
  - [ ] 9.1 `src/permit.mjs`: build the `onPermissionRequest` from `permission.answer`, call `journal.hold`, pause and resume the inactivity timer, map to `selected`/`reject_once`, never `*_always`
  - [ ] 9.2 `src/events.mjs`: map acpx events to text, steps, thought and usage; step log patched by `toolCallId`
  - [ ] 9.3 `src/turn-acpx.mjs` (< 300 lines): ensure session with `resumeSessionId`, start the turn, run stages, collect events, call `verdict`, cancel with a stop after the cancel limit, return the same outcome object as `helper.mjs`
  - [ ] 9.4 `src/runtime.mjs`: one `createAcpRuntime` for the runner with the options in the design; `Runner.stop()` calls shutdown
  - [ ] 9.5 Tests: run the existing runner and fixes tests with `engine: "acpx"` as a second pass over the same cases (loop over both engines in `rig.mjs`); `permit.test.mjs` (full allows once; `read` holds; exception denies; no `always` ids); `events.test.mjs` (see task 10)
  - [ ] 9.6 Named test `launch change is a visible handoff, never silent`: change the binary path between two turns; assert one `session/new`, a recap in the first prompt marked as history, a `notice` in the receipt, and a new `launch.id` in the thread record
  - [ ] 9.7 Named test `a prompt that was written is never sent again`: kill the fake helper after the prompt; assert `interrupted` and exactly one prompt seen
  - _Requirements: 4.4, 4.5, 6.1, 6.2, 9.3, 11.1, 11.2, 11.3_

- [ ] 10. Steps by tool call id, ellipsis, thinking and usage
  - [ ] 10.1 `src/steps-keyed.mjs`: a keyed patch layer used by `events.mjs`; `steps.mjs` is not grown
  - [ ] 10.2 `src/ellipsis.mjs`: middle ellipsis to the title limit; the full command is stored beside the short title
  - [ ] 10.3 Permission detail always uses the full command (check `journal.hold` input)
  - [ ] 10.4 Tests: a second update with the same `toolCallId` changes status in place and does not add a step; a long command is shortened in the middle and keeps both ends; the permission prompt has the full text; thought text never reaches the summary; usage events produce one `fyi` notice
  - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [ ] 11. Helper switch and recap
  - [ ] 11.1 `src/recap.mjs`: build the recap (goal, done so far, git state, next step), cut at 4000 characters, redact, wrap as history
  - [ ] 11.2 Switch logic in `turn-acpx.mjs` (small function in `switch.mjs`): settle old turn, close old session, then open the new one
  - [ ] 11.3 Tests in `recap.test.mjs`: length bound, redaction of the folder and tokens, history wrapper present, git state included for a temp repo and omitted for a plain folder; a switch test with two fake helpers checks that the old one is closed before the new one starts
  - _Requirements: 12.1, 12.2, 12.3_

- [ ] 12. Real-helper checks (by hand, results written into this file)
  - [ ] 12.1 `AELIOS_REAL_KIRO=1`: one whole turn, a tier change `read` to `edit` (same session), a restart (reattach), a cancel, a permission hold
  - [ ] 12.2 Real DSH: one whole turn, a restart (new session with recap), a cancel
  - [ ] 12.3 Tune the default time limits from the measured cold start times
  - [ ] 12.4 Check what is in `<home>/acpx/` after the run and note any secret that landed there
  - _Requirements: 7.4, 5.3, 15.1_

- [ ] 13. `ask.kind` on the wire (mechanism, with the resident)
  - [ ] 13.1 PROTOCOL.md: optional `ask.kind` (`permission`, `question`, `problem`) in the `ask` object; old residents ignore it
  - [ ] 13.2 `receipt.mjs`: send `kind` when the resident has advertised the field (version check on the heartbeat); otherwise leave it out
  - [ ] 13.3 Resident PR (Aelios-resident, separate repository) to read and show it
  - [ ] 13.4 Tests: with and without the advertised field
  - _Requirements: 10.4_

- [ ] 14. Docs
  - [ ] 14.1 README: engine setting, state location, retention, environment allowlist, timeouts, how to go back
  - [ ] 14.2 Update `headless-runner` design.md module table (add the new modules, mark `acp.mjs` and `helper.mjs` as legacy)
  - _Requirements: 14.1, 14.2_

- [ ] 15. Make acpx the default (mechanism, after 12)
  - [ ] 15.1 Change the default of `config.engine` to `"acpx"`; add a one-line note in the README
  - [ ] 15.2 Test: a config without `engine` uses acpx; `"legacy"` still works
  - _Requirements: 14.3_

- [ ] 16. Remove the legacy layer (one release after 15)
  - [ ] 16.1 Delete `acp.mjs`, `helper.mjs`, the legacy branch of `turn.mjs` and their tests; keep `CONVENTION` (move it to `convention.mjs` in task 9 so this step is only a delete)
  - _Requirements: 14.1_

## Migration and rollback

- Turn on: set `"engine": "acpx"` in the config, restart the runner. Each existing thread adopts acpx on its next turn: same saved `sessionId`, reloaded through acpx (Kiro), or a new session with a recap (DSH).
- Turn off: set `"engine": "legacy"`, restart. The legacy layer reads the same `sessionId` from `state.json`. `<home>/acpx/` is not needed to go back and can be deleted with `aelios-runner forget --all`.
- What a rollback changes: the helper environment is inherited whole again, and the stage time limits go back to the single turn limit.
- If acpx fails in the middle of a turn, the turn is `interrupted` (never replayed) and the owner decides.
- Until task 16 the legacy code is not touched, so a revert of tasks 2 to 11 is a plain `git revert` of those PRs.

## Out of scope (later)

- Real parallel threads, one folder per thread.
- Answering an ACP question (elicitation) from the Waiting list.
- Sending the full command for expand to the resident.
- Claude Code and Codex as supported (not experimental) helpers.

## Open questions for the owner

1. Entry point: the declarations show that `createSharedAcpRuntime` has no `stateDir` and no env allowlist, and keeps state in `~/.acpx/`. This spec recommends `createAcpRuntime` (in process). If the spike (task 1) shows it cannot reattach after a restart, do you accept the shared runtime with state in `~/.acpx/`?
2. Kiro `full` tier: replace `--trust-all-tools` with an all-tools agent file so the launch never changes with the tier? If real Kiro does not accept that, do you accept a visible handoff with a recap when a thread moves to or from `full`?
3. Environment allowlist: it removes variables a helper may use today (for example a token for `gh`). Do you accept allowlist-only with a config `env` to add names, or want a looser default (all except known secrets)?
4. Questions from helpers (ACP elicitation): leave them off in this release (only `ASK:`), or build the resident route to answer them now?
5. Retention: 30 days and 500 MB as defaults, with `forget`. Right numbers? Should `unpair` delete the store by default?
6. The full command of a step for expand: add a protocol field now, or keep it local until the desktop needs it?
7. Does `AGPL-3.0-only` with an MIT dependency and about 46 MB of installed dependencies fit the plan for `npx aelios-runner`?
