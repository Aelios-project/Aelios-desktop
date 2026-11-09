# Requirements: runner on acpx

Status: design only. No code is written by this spec. PRs #20, #21 and #23 are merged, so the spec refers to the code in `main`: `kiro-agent.mjs` and the simplified `permission.mjs` (#20), the 200-character step titles (#21), the `interrupted` reason and the `perm-report.mjs` retry (#23). The resident side has #87 (a wake-up on every finished machine turn) and #88. PR #22 (the onboarding wizard) is open and out of scope.

## Introduction

The runner talks to coding helpers (Kiro, DeepSeek Harness, Claude Code, Codex) over ACP. Today it has its own client for that: `src/acp.mjs` (spawn, JSON-RPC), `src/helper.mjs` (initialize, session new/load/resume, prompt, cancel, permission answers, timeout), and `src/plugins.mjs` (how to start each helper). That layer is about 370 lines and each new helper brings new edge cases: session reuse, cancel, timeouts, environment, stuck processes.

[acpx](https://github.com/openclaw/acpx) (MIT, npm package `acpx`) already does the helper side of this: process start and stop, ACP JSON-RPC, saved sessions, a queue inside one session, cancel, a permission callback and an event stream. The owner decided to use it as a library, pinned to one version, and to replace only the layer that talks to helpers. Claude Code installed `acpx` 0.22.0 and ran it against the runner's fake-helper tests. Session keep, reattach after a restart, follow-up queueing in one thread, cancel and handing permission requests to our callback all worked.

Everything on the cloud side stays as it is: pairing, receipts, progress, `perm-report.mjs` (with its retry from #23), the Waiting list, the journal, the outbox, the lock.

Terms. A **helper** is the coding program the runner drives. A **thread** is one conversation of the resident, with one folder and one helper session. A **turn** is one prompt and its answer. A **tier** is the access level: `read`, `edit` or `full`. The **owner** is the person who runs this machine and the resident.

## What stays the same (the contract)

The rest of the runner calls `new Turn({...}).run()` and `turn.cancel()` and reads one outcome object (`status`, `summary`, `sessionId`, `how`, `ask`, `notice`, `reason`). That contract does not change, so `runner.mjs` changes only where it builds the turn.

## Requirements

### 1. Scope

1.1 The runner SHALL replace only these parts with acpx: helper process start and stop, ACP JSON-RPC, session open and reuse, the queue inside one session, cancel, the permission callback, and the event stream.
1.2 The runner SHALL NOT change pairing, the claim, receipts, progress, `perm-report.mjs`, the Waiting list, the journal, the outbox, the lock or the PROTOCOL wire format, except the one additive field in 10.4.
1.3 The runner's own whole-machine queue SHALL stay: one turn at a time across all threads, in one shared folder. A follow-up in a thread SHALL still wait behind turns of other threads. acpx queues only inside one session.
1.4 Real parallel threads (a folder per thread) SHALL be out of scope and listed as later work.

### 2. Dependency

2.1 `acpx` SHALL be an npm dependency with the exact version `0.22.0` (no `^`, no `~`). It SHALL NOT be vendored or copied into the repository.
2.2 The runner SHALL import only `acpx/runtime`. It SHALL NOT use the acpx command line, its queue-owner process, or its flows.
2.3 `engines.node` SHALL be `>=22.13.0` (acpx's own floor). The steering line "No runtime dependencies" SHALL be changed to "one runtime dependency: acpx, pinned" in the same PR as the dependency.
2.4 `THIRD_PARTY_NOTICES.md` SHALL list acpx (MIT) and say its own dependencies come with it through npm.
2.5 Raising the version SHALL be its own PR that runs the whole test suite and the real-helper checks (task 12).
2.6 Packaging (decided): `AGPL-3.0-only` with the MIT dependency is accepted, and about 46 MB of installed dependencies is accepted for `npx aelios-runner`.

### 3. Launch configuration

3.1 The runner SHALL NOT use acpx's built-in agent table. It SHALL pass its own registry, built from `plugins.mjs`. Resolving a helper SHALL return an argv array (never a command string to be split), and the registry name SHALL be per thread (for example `kiro:<threadhash>`).
3.2 Both Kiro and DSH SHALL be connected through acpx's custom agent command (the registry entry), never through its built-in table. The exact launches are:
- `kiro`: `kiro-cli acp --agent <name>` (the v2 path already tested in #20's `kiro-agent.mjs`), with an agent name that is stable per thread and has no tier in it (4.3), so acpx never silently opens a new session. Kiro always runs on its auto model (decided: the owner never picks a model for Kiro). acpx's table says `kiro-cli-chat`, which is wrong for this runner.
- `dsh`: `dsh --profile acp`, with the macOS app path fallback as the runner does today.
- `command` (any ACP helper, experimental) stays as it is.
3.5 Per-role model (decided): a role pack picks a model per role (decided: the resident sends only a model id and a family per job; the runner reads no pack manifest. The role pack is one card stored in the cloud. The reference note `role-packs.md` belongs in the Aelios-resident docs and is summarised in design.md). This needs a PROTOCOL change (optional `model` and `family` on the job) and a resident task, both before the runner code; the runner reads the fields only after the resident advertises them. The runner SHALL select the model through ACP `session/set_config_option` on the model option (`category: "model"`) before the prompt is written, and SHALL check the returned value. Role packs stay helper-agnostic and may carry a model. Kiro is the one exception (3.8).
3.6 For every helper except Kiro: if the agent does not list a model option, or the requested model id is not exactly one of its values (no fuzzy match), the turn SHALL fail before the prompt with `model_selection_unsupported` and a clear message that names the role, the id and the ids offered. The runner SHALL NOT fall back to the default model, because a reviewer could end up on the writer's model unnoticed.
3.8 Kiro runs on auto (decided). When a job goes to Kiro, the runner SHALL drop the model instruction and run on Kiro's auto model. It SHALL NOT fail. It SHALL write one line in the thread as a `notice` with `fyi: true` (not a chat message): `Kiro runs on auto; the model in the role pack was not used (<model id>).` A job with no model request writes no line. Kiro auto sends no thinking, so Kiro threads show no thinking blocks (13.4).
3.9 A review job SHALL carry the author's model family. If the reviewer's family is the same, or either family is unknown, the turn SHALL fail before the prompt. Families come from a runner-owned catalog, never from guessing at model ids. Kiro auto counts as its own family, `kiro-auto`.
3.7 The acpx version SHALL be locked (2.1). Environment variables, proxy names included, SHALL reach the helper child, and the first-start wait SHALL be long enough for Kiro's cold start of about 24 s. Both are verified in the task 1 spike.
3.3 A Claude Code or Codex adapter SHALL be a pinned version that the runner starts from a local install path. The runner SHALL NOT start an adapter through `npx` or any command that fetches the latest version at run time.
3.4 The helper binary is chosen only by this machine's config. Text from the cloud, the repository or the helper SHALL NOT choose a helper, a folder or a tier.

### 4. Sessions and stable launch identity

4.1 One thread SHALL have one acpx session. The session key SHALL be derived from the thread id and the machine, never from text.
4.2 Each thread SHALL record a launch identity (helper, binary, adapter version, arguments, folder) the first time it opens a session. Every later turn SHALL compare it before the session is opened.
4.3 A change of tier SHALL NOT change the launch identity. In particular, the Kiro `--agent` name SHALL NOT contain the tier (`kiro-agent.mjs` on `main` names it `aelios-runner-<tier>-<hash>`; see the design for the change).
4.3a When the tier of a thread changes between turns, the runner SHALL close the open helper process with `runtime.close` and call `ensureSession` again with the saved session id, so the helper reads the new agent file and the session is kept. A named test SHALL prove it (15.3).
4.4 When the launch identity differs for any other reason (binary moved, adapter pin raised, folder changed, config edited), the runner SHALL NOT let acpx open a new session silently. It SHALL do an explicit handoff (12) and send a `notice` that says earlier context was passed as a recap.
4.5 The runner SHALL pass the saved session id to acpx as a resume target, so a session that cannot be reloaded is an error the runner sees, not a quiet new session. On that error (`SESSION_RESUME_REQUIRED`) the runner SHALL call `prepareFreshSession`, open a new session, pass a recap as history, send a `notice`, and record the new session id. A thread SHALL never end up dead because a session was lost.
4.6 Kiro `full` (decided): the runner SHALL NOT use `--trust-all-tools`. It SHALL generate an all-tools agent file, so launch arguments never change with the tier. This file is the `full` tier's agent file. If real Kiro refuses that file, a thread that moves to or from `full` SHALL get a visible handoff with a recap (12).
4.7 DSH has no `session/load`, but it resumes its session with `session/resume`, as the legacy engine does today. The helper keeps its own context, so a resumed DSH session needs no recap. Only a resume that fails takes the 4.5 path (`how: "fresh-after-lost"`).

### 5. Local state

5.1 The runtime SHALL be `createAcpRuntime`, running in the runner process (decided). Its session store SHALL live under the runner's home, in `<home>/acpx/` (`~/.aelios-runner/acpx/`, or `$AELIOS_RUNNER_HOME/acpx/`). It SHALL NOT use `~/.acpx/`. (Reattach after a restart was verified by Claude Code, so there is no fallback runtime. Task 1 repeats the check for `createAcpRuntime`; if it fails, the report goes to the owner.)
5.2 Directories SHALL be mode `0700` and files `0600`. The runner SHALL check this at start and fix or refuse (with a message) if it cannot.
5.3 The store holds the whole conversation, including tool inputs and outputs. These can contain secrets (file contents, command output, tokens printed by a tool). The runner SHALL say this in the README and in `status`, SHALL NOT upload the store, and SHALL NOT put its contents in logs.
5.4 Retention: a thread's records SHALL be deleted 30 days after its last turn, and the whole store SHALL be capped at 500 MB (oldest thread first). Both limits SHALL be config values. The owner SHALL have `aelios-runner forget <thread>` and `aelios-runner forget --all`.
5.5 `unpair` SHALL delete the store by default (decided). It MAY offer to keep it.
5.6 The runner's own thread record in `state.json` (session id, folder, plugin, launch identity, a short recap seed) SHALL stay, because DSH needs it and because a lost acpx store must not lose the thread.
5.8 After a restart a DSH thread resumes the same session through acpx (`session/resume`; checked by Claude Code with the fake helper's DSH face, both after a runtime restart and when adopting a legacy session id). Only when that resume fails does it get a new session with a recap built from the thread record (5.6) and the journal (12.2), and a `notice` (4.5). The runner SHALL NOT keep a separate DSH transcript store.

### 6. Queue, cancel, say

6.1 `job`, `say`, `mail` and `cancel` SHALL behave as today (PROTOCOL). `say` stops the running turn and starts the new one; `mail` waits.
6.2 Cancel SHALL ask the helper to stop through acpx. If the helper does not acknowledge within the cancel limit (7.1), the runner SHALL stop the process and report `cancelled`, as it does today.

6.3 An image SHALL always be sent as an image block (owner decision; the runner does not branch on the helper's capability). If the helper does not declare `agentCapabilities.promptCapabilities.image`, acpx refuses the turn before the prompt is written (`UNSUPPORTED_PROMPT_CONTENT`), and the turn SHALL fail with a clear message that names the helper ("<helper> does not accept pictures"). There SHALL be no silent fallback to a path for an image. Every other file SHALL stay a path in the prompt text. There SHALL be a test for each case (image accepted, image refused).

### 7. Timeouts

7.1 The runner SHALL have separate limits, each a config value with a default: spawn, initialize, session new/load, first update after the prompt is written, cancel acknowledgement, inactivity between updates, and an optional turn cap.
7.2 The inactivity limit SHALL be off by default. When the owner turns it on, it SHALL be paused while any tool call is in progress and while a permission request or a question is waiting for the owner, and restarted when it is answered. A silent long tool call is not a hang.
7.5 A stage limit SHALL be able to stop a start that never returns (a hung `ensureSession`). Task 1 checks how.
7.3 A limit that is hit SHALL end the turn with a message that names the stage (for example "initialize did not answer in 60 s"). It SHALL NOT be reported as a generic failure.
7.4 Defaults SHALL be larger than a cold start of the slowest supported helper. (A local Kiro box failed because the model trial waited 30 s while a cold start with MCP servers took about 24 s plus the trial.)

### 8. Environment and streams

8.1 A helper SHALL get its environment by allowlist: process essentials, the proxy variables (`HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, `NO_PROXY` and their lowercase forms), locale, certificate variables, `SSH_AUTH_SOCK`, the variables that helper's plug lists, and the keys in the config's `env`. acpx takes exact names only, so the runner SHALL expand prefix patterns (`LC_*`, `XDG_*`, `KIRO_*`, `AWS_*`, `DEEPSEEK_*`) from its own `process.env` into exact names before it calls acpx. The migration note SHALL say that a variable not listed stops reaching the helper. Nothing else from the runner's environment SHALL pass (decided: allowlist plus config `env`, no full inheritance).
8.2 The runner's pairing token and device credential SHALL never be in a helper's environment.
8.3 Helper stdout is reserved for JSON-RPC. Helper stderr SHALL go to the runner log, redacted, and the last lines SHALL be used in error messages as today.

### 9. Terminal states

9.1 Every turn SHALL end in exactly one of: `succeeded`, `cancelled`, `failed` (with a reason), or `outcome_unknown`. `needs_input` is not terminal.
9.2 The state SHALL be decided from the prompt's stop reason, acpx errors, process exit and end-of-stream, in one function, with a table test.
9.3 After a crash or a lost connection once the prompt was written, the state SHALL be `outcome_unknown`. It SHALL be sent as `failed` with `reason: "interrupted"` (already in `main` from #23). The runner SHALL NOT send that prompt again by itself.
9.4 A prompt that was never written (a failure before it) MAY be reported as `failed` with its real reason, and the owner decides whether to ask again.
9.5 After a helper crash the runner SHALL NOT send a prompt that was already written again. It SHALL mark the outcome `outcome_unknown`, read the git state of the folder (`git status -sb`, last commit), put that in the report, and only then leave the decision to the owner.
9.6 Terminal states SHALL map one-to-one to the resident's notifications: `done`, waiting for approval (permission), waiting for an answer (question), `cancelled`, `failed`. A status report (a refusal, a token limit, no result, stuck) SHALL NOT be labelled as waiting for an answer: it is `failed` with a reason (`refused`, `token_limit` or `no_result`, added to `reason.mjs`; the runner sends them only after the resident advertises them, resident first, and until then sends `error` with the specific name in the message; it SHALL NOT rely on an old resident turning an unknown reason into `error`), shown in Waiting as stuck with that reason, and its text is the report. It is never `needs_you`. Only an `ASK:` line is waiting for an answer.
9.7 Text handed back to the resident SHALL never be cut mid-way. There SHALL be no fixed clip of the result. If a size limit of the wire forces a cut, the runner SHALL cut at a paragraph or sentence end and say that the text was shortened. The cuts in the code today (the 4000-character summary cap in `runner.mjs` and `cut()` in `receipt.mjs`) SHALL be removed in their own task.

### 10. Needs input

10.1 Input the helper waits for SHALL be one of two kinds: `permission` (a tool needs approval) or `question` (the helper asks the owner something with an `ASK:` line). A helper that stopped and cannot go on (refusal, token limit, no result, stuck) is not waiting for input: it ends as `failed` (9.6).
10.2 A permission request SHALL go through the existing hold, journal and `perm-report.mjs` path with the full command shown (13.3).
10.3 Helper elicitation (decided): not in this release. The runner SHALL NOT advertise elicitation support to helpers, so a question arrives only as the `ASK:` marker. Elicitation comes later, together with `ask.kind`.
10.4 An `ask` in a receipt SHALL carry an optional `kind` (`permission`, `question`). A resident that does not know the field ignores it. This is a PROTOCOL change and goes in its own PR with the resident side.

### 11. Permissions

11.1 The permission callback SHALL answer by tier exactly as `permission.mjs` does on `main` (since #20): `full` allows once; any other tier holds the request for the owner (Allow / Deny). Only one-time choices SHALL be picked.
11.2 Anything that does not reach the callback or makes it throw SHALL be denied (acpx mode `deny-all`, non-interactive policy `deny`). The runner SHALL fail closed.
11.4 The fail-closed mode check of `helper.mjs` (`checkAgent`) SHALL be carried over for Kiro at every tier: after the session is open, Kiro's current mode is compared with the runner-written agent the turn needs, and a mismatch or an unreadable mode fails the turn before the prompt. Helpers the runner writes no agent for (DSH, `command`) have no expected mode and are not checked, as on `main`.
11.3 The runner SHALL turn off acpx's file and terminal callbacks (`fs: false`, `terminal: false`). The client declares neither capability today, so the helper does its own work in its own sandbox.

### 12. Helper switch

12.1 When the configured helper changes, or 4.4 applies, the runner SHALL first stop or settle the old turn, and only then start the new helper.
12.2 The new helper SHALL get a bounded recap, marked as history, with: the goal, what is done so far, the git state of the folder, and the next step. The recap SHALL be at most 4000 characters, built by the runner from its own record and `git status`, and SHALL be redacted.
12.3 There SHALL be one writer per workspace at any time.

### 13. Events and steps

13.1 Tool calls SHALL be keyed by `toolCallId` and patched in place when an update arrives (status, output), not appended as a new step.
13.2 Step titles longer than the limit SHALL be shortened with a middle ellipsis. The full command SHALL be kept locally for expand (decided). A protocol field for it comes later, when the desktop needs it.
13.3 A permission prompt SHALL always show the full command, never the shortened title.
13.4 Thinking and usage (credits) events SHALL be kept apart from text. They SHALL NOT enter the summary. Usage MAY be reported as a `notice` with `fyi: true`.

### 14. Migration and rollback

14.1 The old layer SHALL stay in the repository, behind `config.engine` (`"legacy"` or `"acpx"`), for one release after acpx becomes the default.
14.2 Going back SHALL need only `engine: "legacy"` in the config and a restart. Thread records SHALL keep the plain `sessionId` that the legacy layer uses.
14.3 The default SHALL change to `acpx` in a separate small PR after the real-helper checks pass.

### 15. Tests

15.1 `npm test` SHALL need no account, network or quota, as now. It SHALL pass twice: normally, and with `kiro-cli` and `dsh` off `PATH`.
15.2 The fake helper SHALL keep working for both engines. Every new module SHALL have a test for its branches.
15.3 The tier-change and launch-change cases of 4.3a and 4.4 SHALL have named tests (`tier change keeps the session`, `launch change is a visible handoff, never silent`).
