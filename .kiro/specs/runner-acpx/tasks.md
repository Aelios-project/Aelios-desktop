# Tasks: runner on acpx

Written before any code. Nothing is done yet. Order matters: each task leaves `npm test` green (also with `kiro-cli` and `dsh` off `PATH`). Every new file stays at or under 300 lines. New logic goes in a new module, not into `runner.mjs`, `helper.mjs` or `steps.mjs`.

Start condition: met. PRs #20, #21 and #23 are merged to `main` (and resident #87, #88), so the code PRs branch from `main` as it is. PR #22 (onboarding wizard, open) is out of scope; if it lands first and touches the runner, rebase.

## Code PRs, in order

The first code PR is only the swap: the acpx engine behind `config.engine`, default `"legacy"`. Every other topic is its own later PR. Mechanism PRs (they wait for Claude Code or Codex review) are marked.

| PR | Tasks | What it holds |
|---|---|---|
| A (mechanism) | 1, 2, 3, 4 (not 4.2), 5.1, 9 | The swap, with tier change (9.8), fail-closed mode check (9.9), lost session (9.10) and images (9.11) |
| B (mechanism) | 6 | Environment allowlist |
| C | 10 | Steps by tool call id, ellipsis, thinking and usage |
| D | 11 | Helper switch and recap |
| E (mechanism) | 7 | Stage timers |
| F (mechanism) | 8, 17 | New reasons, verdicts, and the code that cuts text today. Resident first (8.3b) |
| G (mechanism) | 11b | Model per role. PROTOCOL and resident task first (11b.0) |
| H (mechanism) | 5.2 to 5.5 | Retention and `forget` |
| I (mechanism) | 13 | `ask.kind` on the wire, with the resident |
| J | 4.2, 12, 14 | Adapters (experimental), real-helper checks, docs |
| K (mechanism) | 15 | Make acpx the default |
| L | 16 | Remove the legacy layer, one release after K |

In PR A the acpx turn reuses the outcome mapping of `helper.mjs`, `markers.mjs` and `reason.mjs` as they are. `verdict.mjs` replaces it in PR F. In PR A the helper gets the runner's environment as the legacy engine gives it (no allowlist yet), and there are no stage timers beyond the single turn limit of today. The acpx engine is not the default until K, so none of this is live before the later PRs land.

## PR A tasks

- [ ] 1. Spike and dependency (mechanism)
  - [ ] 1.1 Add `acpx` `0.22.0` to `packages/runner/package.json` (exact), `engines.node >=22.13.0`, update the lock file. Change the "No runtime dependencies" line in `.kiro/steering/tech.md`. Add acpx (MIT) to `THIRD_PARTY_NOTICES.md`
  - [ ] 1.2 Script `test/spike-acpx.mjs` (not part of `npm test`; run by hand): with `createAcpRuntime` and a `stateDir` in a temp folder, against `test/fake-agent.mjs`, check session keep, reattach after a runtime restart (already verified by Claude Code with `createAcpRuntime` and a `stateDir`, for both helper faces; repeat it here), follow-up queueing, cancel, permission callback, `fs:false`, `terminal:false`, `elicitationModes:[]`
  - [ ] 1.3 Write down in design.md: which fields make acpx open a new session (agent name, command, argv, cwd); file modes of its file store; what `onAcpMessage` shows for `initialize`; whether stderr is reachable
  - [ ] 1.4 Session close and loss: that `runtime.close` ends the helper process and keeps the saved session (9.8); the exact error acpx gives for a session it cannot reload (`SESSION_RESUME_REQUIRED`) and how `prepareFreshSession` is called (9.10). Write the real names into design.md
  - [ ] 1.5 Mode check: find where `helper.mjs` (`checkAgent`) reads the current session mode, and where the same value is readable through acpx. If acpx hides it, say so in design.md before any code
  - [ ] 1.6 Hung start: check how a stage timer stops an `ensureSession` that never returns (cancel the call, close the runtime, or kill the process). PR E builds on the answer
  - [ ] 1.7 Images: check what acpx does with an image for a helper without `promptCapabilities.image`, and where attachments enter the turn today (9.11)
  - [ ] 1.8 Model selection: check that acpx forwards `session/set_config_option` to the agent (against the fake agent, then real DSH; Kiro is not part of model selection), and that the reply is readable. The result gates PR G; report to the owner if it does not
  - [ ] 1.9 Environment and start-up: check that acpx passes an environment given to it (proxy names such as `ALL_PROXY`) to the child, and waits at least 60 s for a first start (Kiro cold start is about 24 s). Check the installed version is exactly `0.22.0`
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 2. Engine switch and the seam
  - [ ] 2.1 `src/turn.mjs` (new, < 40 lines): `makeTurn(options, config)` returns the legacy `Turn` or the acpx turn by `config.engine` (default `"legacy"`)
  - [ ] 2.2 `runner.mjs`: call `makeTurn` where it calls `new Turn` (one line). Pass `record` so the turn can read the launch identity
  - [ ] 2.3 Test `turn.test.mjs`: default is legacy; `"acpx"` gives the acpx class; an unknown value fails at config load
  - _Requirements: 1.2, 14.1, 14.2_

- [ ] 3. Kiro agent name without the tier (mechanism)
  - [ ] 3.1 `kiro-agent.mjs`: `agentName(threadId, cwd)` has no tier; the tier only changes file content
  - [ ] 3.2 Add the `full` config (all tools allowed) so `full` needs no `--trust-all-tools` (decided). Check by hand against real Kiro (`AELIOS_REAL_KIRO=1`) that it opens what the flag opens. If real Kiro refuses it, keep the flag and make a move to or from `full` a visible handoff with a recap (12); note it in design.md
  - [ ] 3.3 Tests in `kiro-agent.test.mjs`: same name for `read`, `edit`, `full` on one thread; different names for different threads; file content differs by tier; file mode `0600`
  - _Requirements: 4.3_

- [ ] 4. Launch registry and launch identity (mechanism)
  - [ ] 4.1 `src/launch.mjs`: `resolve(config, thread)` returns `{ name, argv }` (argv is an array, never a string; the name is per thread, such as `kiro:<threadhash>`); `registryOf(config, thread)` builds the one-entry registry for acpx from it; `identityOf(launch)`; `sameLaunch(record, current)`. The registry is ours, never the acpx table
  - [ ] 4.3 Tests in `launch.test.mjs`: `kiro` argv is `["kiro-cli","acp","--agent",<name>]` with no tier in the name, never `kiro-cli-chat`; `dsh` argv is `["dsh","--profile","acp"]`; both come from our registry, not acpx's table; a DSH path with spaces stays one argv item; two threads get two names; no argv item contains `npx`; identity is equal across tiers and different when binary, args or folder change
  - [ ] 4.4 Named test `tier change keeps the session` (see 9.8; runs against the fake helper and checks it saw `session/load`, not `session/new`). The second named test, `launch change is a visible handoff, never silent`, is 9.6
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 5.1 Store location and modes (mechanism): `src/store.mjs`: `openStore(home)` creates `<home>/acpx/` at `0700`, checks and narrows modes, refuses with a message when it cannot. Test in `store.test.mjs`: modes `0700`/`0600` on a fresh store; a wide mode is narrowed
  - _Requirements: 5.1, 5.2_

- [ ] 9. Permission callback and the acpx turn (mechanism)
  - [ ] 9.1 `src/permit.mjs`: build the `onPermissionRequest` from `permission.answer`, call `journal.hold`, map to `selected`/`reject_once`, never `*_always`. (Pausing the inactivity timer comes with PR E)
  - [ ] 9.2 `src/events.mjs`: map acpx events to text, steps, thought and usage (plain append; the keyed patch is PR C)
  - [ ] 9.3 `src/turn-acpx.mjs` (< 300 lines): ensure session with `resumeSessionId`, start the turn, collect events, map the outcome as `helper.mjs` does, cancel with a stop after the cancel limit, return the same outcome object as `helper.mjs`
  - [ ] 9.4 `src/runtime.mjs`: one `createAcpRuntime` for the runner with the options in the design; `Runner.stop()` calls shutdown
  - [ ] 9.5 Tests: run the existing runner and fixes tests with `engine: "acpx"` as a second pass over the same cases (loop over both engines in `rig.mjs`); `permit.test.mjs` (full allows once; `read` holds; exception denies; no `always` ids)
  - [ ] 9.6 Named test `launch change is a visible handoff, never silent`: change the binary path between two turns; assert one `session/new`, a recap in the first prompt marked as history, a `notice` in the receipt, and a new `launch.id` in the thread record. (The recap here is the small seed from the thread record; the full recap is PR D)
  - [ ] 9.7 Named test `a prompt that was written is never sent again`: kill the fake helper after the prompt; assert `interrupted` and exactly one prompt seen
  - [ ] 9.8 Tier change (4.3a): when the tier of the thread differs from the tier of the open session, the turn calls `runtime.close` for that session and then `ensureSession` again with `resumeSessionId`, so the helper process restarts and reads the new agent file; the session is kept. Named test `tier change keeps the session`: `read` then `edit` on one thread; the fake helper saw `session/load` once and `session/new` once in total, and the second process ran with the `edit` agent file
  - [ ] 9.9 Fail-closed mode check (11.4): carry over `helper.mjs` `checkAgent` for Kiro at every tier, not only `read` and `edit`. After the session is open, the turn compares Kiro's current mode with the runner-written agent the turn needs; on a mismatch or an unreadable mode it fails before the prompt with `reason: "error"` and a message. DSH and `command` are not checked. Tests: wrong mode fails for each of the three Kiro tiers; unreadable mode fails; right mode passes; the fake helper saw no prompt in the failing cases; a DSH-face helper that reports no mode still runs
  - [ ] 9.10 Lost session (4.5): on `SESSION_RESUME_REQUIRED` the turn calls `prepareFreshSession`, opens a new session, passes the recap seed as history, sends a `notice` ("The helper could not reload the session, so this thread started a new one. Earlier context was passed as a short recap."), and records the new session id. It never ends in a dead thread. Tests: fake helper that refuses `session/load` gives one new session, a notice, and a prompt that ran; the next turn resumes the new id
  - [ ] 9.11 Images (6.3, owner decision): the turn always attaches an image as an image block. When acpx refuses it (`UNSUPPORTED_PROMPT_CONTENT`, the helper does not declare `promptCapabilities.image`), the turn fails before the prompt with "<helper> does not accept pictures". Every other attachment stays a path in the prompt text. Tests: a helper that declares `image` gets the image block; a helper that does not fails the turn with the helper named and sees no prompt; a non-image file is a path for both faces
  - _Requirements: 4.3, 4.4, 4.5, 6.1, 6.2, 6.3, 9.3, 11.1, 11.2, 11.3, 11.4_

## Later PR tasks

- [ ] 6. Environment allowlist (PR B, mechanism)
  - [ ] 6.1 `src/env-allow.mjs`: `envFor(plugin, config, processEnv)` returns the final environment. Prefix names (`LC_*`, `XDG_*`, `KIRO_*`, `AWS_*`, `DEEPSEEK_*`) are expanded by the runner from `process.env`, because acpx takes exact names only. `SSH_AUTH_SOCK` is in the base list
  - [ ] 6.2 Tests in `env-allow.test.mjs`: all eight proxy names (upper and lower case) pass; `ALL_PROXY` reaches a Kiro helper; `LC_ALL`, `XDG_CONFIG_HOME` and `SSH_AUTH_SOCK` pass; a prefix name for another plug does not; a random secret variable does not; the runner's pairing token does not; config `env` keys pass
  - [ ] 6.3 Fake helper prints its environment names to a file; one end-to-end test checks the same
  - [ ] 6.4 README and the migration note: a helper that needed an unlisted variable stops seeing it until it is in `env`
  - _Requirements: 8.1, 8.2_

- [ ] 10. Steps by tool call id, ellipsis, thinking and usage (PR C)
  - [ ] 10.1 `src/steps-keyed.mjs`: a keyed patch layer used by `events.mjs`; `steps.mjs` is not grown
  - [ ] 10.2 `src/ellipsis.mjs`: middle ellipsis to the title limit; the full command is stored beside the short title
  - [ ] 10.3 Permission detail always uses the full command (check `journal.hold` input)
  - [ ] 10.4 Tests: a second update with the same `toolCallId` changes status in place and does not add a step; a long command is shortened in the middle and keeps both ends; the permission prompt has the full text; thought text never reaches the summary; usage events produce one `fyi` notice
  - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [ ] 11. Helper switch and recap (PR D)
  - [ ] 11.1 `src/recap.mjs`: build the recap (goal, done so far, git state, next step) from the thread record and the journal, cut at 4000 characters, redact, wrap as history. There is no DSH transcript store; a DSH session that cannot be resumed gets this recap and a notice
  - [ ] 11.2 Switch logic in `turn-acpx.mjs` (small function in `switch.mjs`): settle old turn, close old session, then open the new one
  - [ ] 11.3 Tests in `recap.test.mjs`: length bound, redaction of the folder and tokens, history wrapper present, git state included for a temp repo and omitted for a plain folder; a switch test with two fake helpers checks that the old one is closed before the new one starts
  - _Requirements: 12.1, 12.2, 12.3_

- [ ] 7. Time limits (PR E, mechanism)
  - [ ] 7.1 `src/stages.mjs`: a small controller with the stages in the design table; `enter(stage)`, `pause()`, `resume()`, `fired` promise that names the stage
  - [ ] 7.2 Config keys `timeouts.{spawn,initialize,session,firstUpdate,inactivity,cancel,turn}` with defaults; validate in `readConfig`. Inactivity is off by default
  - [ ] 7.3 The inactivity timer, when the owner turns it on, pauses while any tool call is in progress (a started `toolCallId` without a final status) and while a permission or question is held. `permit.mjs` calls `pause`/`resume`
  - [ ] 7.4 Stop a hung start the way task 1.6 found
  - [ ] 7.5 Tests in `stages.test.mjs` with fake timers: each stage fires and names itself; inactivity is off by default; with it on, it does not fire during a tool call or a held permission and restarts after; a stage that ends clears its timer; a fake helper that never answers `session/new` ends the turn with the stage name; turn cap off means no timer
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 8. Verdicts and new reasons (PR F, mechanism)
  - [ ] 8.0 Resident first: the resident PR (Aelios-resident) adds `refused`, `token_limit` and `no_result` and advertises them on the heartbeat (the same way as `ask.kind`, task 13). The runner does not rely on an old resident turning an unknown reason into `error`
  - [ ] 8.1 `src/verdict.mjs`: pure `verdict(signals)` as in the design table
  - [ ] 8.2 Table test `verdict.test.mjs`: one row per table line, plus: crash before the prompt is written is `failed` with its reason; crash after it is `interrupted`; a stage limit before and after the prompt; `cancelled` vs our cancel; denied list gives `permission`; `refusal`, `max_tokens` and no result give `failed` with reasons `refused`, `token_limit`, `no_result`, never `needs_you`; only `ASK:` gives `question`; the five outcomes map one-to-one to the five notifications
  - [ ] 8.3 Reuse `markers.mjs` and `reason.mjs`; do not copy their rules. `reason.mjs` gets the three new reasons, and sends them only when the resident has advertised them; otherwise it sends `error` and puts the specific name in the message text. Test both cases
  - [ ] 8.4 After `interrupted`, the report carries `git status -sb` and the last commit line; test with a temp repo (9.5)
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.6, 10.1_

- [ ] 17. Remove today's cuts (PR F)
  - [ ] 17.1 Find and remove the cut in `runner.mjs` (the 4000-character summary cap) and in `receipt.mjs` (`cut()`). Replace them with the rule of 9.7: no fixed clip; a wire limit cuts at a paragraph or sentence end and says the text was shortened
  - [ ] 17.2 Tests: a result of 20000 characters reaches the receipt whole when the wire allows; a result over the wire limit is cut at a paragraph end and carries the shortened mark; no other file cuts the summary (grep check in the test notes)
  - _Requirements: 9.7_

- [ ] 11b. Model per role (PR G, mechanism)
  - [ ] 11b.0 First, without code in the runner: PROTOCOL.md adds `model` and `family` on the job (optional; an old runner ignores them), and a task in Aelios-resident sends them. The runner reads them only after the resident advertises the field
  - [ ] 11b.1 `src/model.mjs`: `selectModel(session, wanted)` reads the model config option, exact-matches the id, sends `session/set_config_option`, verifies the reply; no fallback. `src/family.mjs`: runner-owned family catalog and the reviewer-versus-author check
  - [ ] 11b.2 Wire it into `turn-acpx.mjs` before the prompt is written, on new and resumed sessions
  - [ ] 11b.2b Kiro runs on auto: a job with a model goes to Kiro; the runner drops the model instruction, the turn runs, and the thread gets a `notice` with `fyi: true`: `Kiro runs on auto; the model in the role pack was not used (<model id>).`; test that the fake helper saw no `session/set_config_option`, the prompt was written, and the notice has `fyi: true`; a job with no model writes no notice; the family of a Kiro author or reviewer is `kiro-auto`
  - [ ] 11b.3 Tests in `model.test.mjs`: option found and set; **failure 1**: the agent lists no model option, turn fails with `model_selection_unsupported` and the fake helper saw no prompt; **failure 2**: the id matches no value (near matches such as a different case or a prefix also fail), same result and message lists the offered ids; reply with a different value fails; no default-model fallback on any non-Kiro path; same family fails before the prompt; unknown family fails
  - _Requirements: 3.5, 3.6, 3.8_

- [ ] 5b. Retention and forget (PR H, mechanism; tasks 5.2 to 5.5)
  - [ ] 5.2 `src/retention.mjs`: delete threads idle for N days; cap total size, oldest first; `forget(thread)`; `forgetAll()`
  - [ ] 5.3 `bin/aelios-runner.mjs`: `forget <thread>`, `forget --all`, `unpair` asks to delete the store; `status` shows path and size. Keep the CLI additions in `bin/forget.mjs` so the main file does not grow
  - [ ] 5.4 README: a short section "What is saved on this machine" including the secrets warning
  - [ ] 5.5 Tests in `retention.test.mjs`: age and size limits remove the right threads and keep others; `forget` removes one; `unpair` default removes the store
  - _Requirements: 5.3, 5.4, 5.5, 5.6_

- [ ] 13. `ask.kind` on the wire (PR I, mechanism, with the resident)
  - [ ] 13.1 PROTOCOL.md: optional `ask.kind` (`permission`, `question`) in the `ask` object; old residents ignore it
  - [ ] 13.2 `receipt.mjs`: send `kind` when the resident has advertised the field (version check on the heartbeat); otherwise leave it out
  - [ ] 13.3 Resident PR (Aelios-resident, separate repository) to read and show it
  - [ ] 13.4 Tests: with and without the advertised field
  - _Requirements: 10.4_

- [ ] 4.2 Adapters (PR J, experimental): `adapters.json` and `src/adapters.mjs` (plugs `claude`, `codex`): pinned package, version, integrity; started from a local install path. Test: `adapters.json` has no range, no `latest`, no missing integrity; no command contains `npx`
- [ ] 12. Real-helper checks (PR J, by hand, results written into this file)
  - [ ] 12.1 `AELIOS_REAL_KIRO=1`: one whole turn, a tier change `read` to `edit` (same session), a restart (reattach), a cancel, a permission hold
  - [ ] 12.2 Real DSH: one whole turn, a restart (the same session through `session/resume`), a cancel
  - [ ] 12.3 Tune the default time limits from the measured cold start times
  - [ ] 12.4 Check what is in `<home>/acpx/` after the run and note any secret that landed there
  - _Requirements: 7.4, 5.3, 15.1_
- [ ] 14. Docs (PR J)
  - [ ] 14.1 README: engine setting, state location, retention, environment allowlist, timeouts, how to go back
  - [ ] 14.2 Update `headless-runner` design.md module table (add the new modules, mark `acp.mjs` and `helper.mjs` as legacy)
  - _Requirements: 14.1, 14.2_

- [ ] 15. Make acpx the default (PR K, mechanism, after 12)
  - [ ] 15.1 Change the default of `config.engine` to `"acpx"`; add a one-line note in the README
  - [ ] 15.2 Test: a config without `engine` uses acpx; `"legacy"` still works
  - _Requirements: 14.3_

- [ ] 16. Remove the legacy layer (PR L, one release after 15)
  - [ ] 16.1 Delete `acp.mjs`, `helper.mjs`, the legacy branch of `turn.mjs` and their tests; keep `CONVENTION` (move it to `convention.mjs` in task 9 so this step is only a delete)
  - _Requirements: 14.1_

## Migration and rollback

- Turn on: set `"engine": "acpx"` in the config, restart the runner. Each existing thread adopts acpx on its next turn: same saved `sessionId`, reloaded through acpx (Kiro, `session/load`; DSH, `session/resume`). Only a session the helper cannot reload gets a new session with a recap (4.5).
- Turn off: set `"engine": "legacy"`, restart. The legacy layer reads the same `sessionId` from `state.json`. `<home>/acpx/` is not needed to go back and can be deleted with `aelios-runner forget --all` (once PR H is in).
- What a rollback changes: from PR B on, the helper environment is inherited whole again, and from PR E on, the stage time limits go back to the single turn limit.
- When PR B is on, a helper that needed an unlisted variable (a token for `gh`, a registry key) stops seeing it until the owner adds it to `env`. Prefix names such as `LC_*`, `XDG_*`, `KIRO_*`, `AWS_*` and `DEEPSEEK_*` are expanded by the runner, and `SSH_AUTH_SOCK` is passed.
- If acpx fails in the middle of a turn, the turn is `interrupted` (never replayed) and the owner decides.
- Until task 16 the legacy code is not touched, so a revert of any code PR is a plain `git revert`.

## Out of scope (later)

- Real parallel threads, one folder per thread.
- Answering an ACP question (elicitation) from the Waiting list.
- Sending the full command for expand to the resident.
- Claude Code and Codex as supported (not experimental) helpers.
- A DSH transcript store. A DSH session that cannot be resumed gets a recap from the thread record instead.

## Decided (owner answers)

The earlier questions are answered and moved into requirements.md: runtime (`createAcpRuntime`, 5.1; reattach after a restart is verified, so there is no fallback runtime), Kiro `full` without `--trust-all-tools` (4.6), environment allowlist plus config `env` (8.1), no helper elicitation in this release (10.3), retention 30 days and 500 MB with `unpair` deleting by default (5.4, 5.5), full command kept locally (13.2), packaging accepted (2.6).

- Role packs (3.5): the resident sends only a model id and family per job. The runner reads no pack manifest. This needs a PROTOCOL change and a resident task (11b.0). `role-packs.md` belongs in the Aelios-resident docs.
- Kiro (3.2, 3.8): `kiro-cli acp --agent <name>`, always on auto. A model in a role pack is dropped with one `fyi` notice in the thread; the job does not fail.
- Status reports (9.6): refusal, token limit and no result are `failed` with a reason, shown in Waiting as stuck, once the resident advertises the reasons. `ask.kind` has no `problem`.
- Review (PR #24): the owner accepted all twelve points of the Claude Code review and the PR split above.

## Open questions for the owner

None.
