# Design: runner on acpx

What was read for this design: the runner on `main` (`helper.mjs`, `acp.mjs`, `plugins.mjs`, `runner.mjs`, `state.mjs`, `steps.mjs`), the merged code of #20 (`kiro-agent.mjs`, Kiro agent config by tier, permission simplification), #21 (200-character step titles) and #23 (interrupted turns, permission report retry), and the type declarations of `acpx@0.22.0` (`dist/runtime.d.ts`, `dist/agent-registry.d.ts`). No acpx code was run for this spec. Where the owner and Claude Code already ran something, it is marked "(run by Claude Code)". Anything else about acpx that is a guess is marked "check in task 1".

## Overview

```
Runner (queue, one turn at a time, cloud, receipts, journal)        unchanged
   |  new Turn({...}).run() / cancel()                              same contract
   v
turn.mjs (new, picks engine)  --engine "legacy"--> helper.mjs + acp.mjs   (kept one release)
   |  --engine "acpx"-->
   v
turn-acpx.mjs  (one turn: ensure session, start turn, read events, decide outcome)
   |-- launch.mjs        registry of helpers, launch identity, frozen per thread
   |-- stages.mjs        separate time limits
   |-- env-allow.mjs     environment allowlist
   |-- permit.mjs        permission callback (tier, hold, full command)
   |-- events.mjs        acpx events -> text / steps / thinking / usage
   |-- verdict.mjs       terminal state + ask.kind
   |-- recap.mjs         bounded recap for a helper switch
   |-- store.mjs         acpx session store under the runner home, modes, retention
   v
acpx/runtime (AcpRuntime)  -->  helper process (ACP over stdio)
```

`runner.mjs` keeps building `Turn` options. It calls a new `turn.mjs` factory instead of `new Turn` directly (one line), and passes the thread record to it.

## Which acpx entry point

`acpx/runtime` has two ways to get a runtime.

| | `createSharedAcpRuntime` | `createAcpRuntime` |
|---|---|---|
| Where it runs | A client of the acpx command line's local session owner (a separate process that outlives ours) | In our process |
| Session store | The owner's, `~/.acpx/` | Our choice: `createFileSessionStore({ stateDir })` |
| Env allowlist, `fs`/`terminal` switches, `onAcpMessage`, `processLifecycle` | Not in its options | In its options |
| Permission callback | Per turn (`onPermissionRequest`) | Per runtime and per turn |

The owner's note names `createSharedAcpRuntime`. From the declarations, the in-process `createAcpRuntime` is the one that can meet 5.1 (state under our home), 8.1 (env allowlist), 11.3 (no fs/terminal) and 7 (stage hooks). The shared one cannot take a `stateDir`. **Decided: `createAcpRuntime`, in the runner process, state under `~/.aelios-runner`.** Task 1 repeats the checks Claude Code ran (keep, reattach after restart, follow-up, cancel, permission callback) against `createAcpRuntime` with a `stateDir`. Reattach after a restart was already verified by Claude Code, so there is no fallback runtime; if the repeat fails, the result goes to the owner before code.

Runtime options the runner sets:

- `cwd`: the runner workspace (a turn also passes the thread folder through `ensureSession`).
- `sessionStore`: `createFileSessionStore({ stateDir: <home>/acpx })`.
- `agentRegistry`: ours (`launch.mjs`), never the built-in table.
- `permissionMode: "deny-all"`, `nonInteractivePermissions: "deny"`. Fail closed.
- `onPermissionRequest`: per turn, from `permit.mjs`.
- `agentProcessEnvAllow` / `agentProcessEnv`: from `env-allow.mjs`.
- `fs: false`, `terminal: false`, `elicitationModes: []`.
- `mcpServers: []` (as today).
- `processLifecycle`, `onAcpMessage`: feed `stages.mjs` and the redacted stderr log.

One runtime object lives as long as the runner. `Runner.stop()` calls `runtime.shutdown()`.

## Launch configuration (3)

`plugins.mjs` stays the one place that knows how to start a helper. `launch.mjs` gets `resolve(config, thread)`, which returns `{ name, argv }`: an argv array, never a string to split, and a per-thread name such as `kiro:<threadhash>`. `registryOf(config, thread)` turns that into the acpx registry entry for the configured helper only. acpx's `AcpAgentRegistry.resolve(name)` may return an argv array, so the array is handed over as it is: nothing is joined into a command string or quoted. The registry holds one entry, so an acpx name collision with its built-in table cannot happen.

| Plug | Command | Notes |
|---|---|---|
| `kiro` | `kiro-cli acp --agent <name>` | Not `kiro-cli-chat`. This is the v2 path already tested in #20 (`kiro-agent.mjs`). The agent name is `aelios-runner-<threadhash>`, with no tier, so the launch arguments do not change with the tier. Kiro always runs on auto (decided). |
| `dsh` | `dsh --profile acp` | Path from `onPath` or the macOS app path, as now. |

Both are registered as a custom agent command in our registry, never taken from acpx's built-in table.
| `claude`, `codex` (new plugs, experimental) | `node <home>/adapters/<pkg>@<version>/<bin>` | Installed by `aelios-runner install-adapter <name>` at a version in a table in the repo. Never `npx`. |
| `command` | `config.command` | As now. |

An adapter pin is a line in `adapters.json` (package, exact version, integrity). A test fails if any entry has a range, `latest`, or no integrity.

Because the launch is an argv array all the way to acpx, a path with spaces (the DSH app path) stays one item. A test checks it.

### Model per role (3.5, 3.6)

Role packs choose a model per role. Decided: the resident sends only a model id and a family per job. The runner reads no pack manifest; the role pack is one card stored in the cloud. The reference note is `role-packs.md`, which belongs in the Aelios-resident docs (it is not there yet; the owner sent it as a file). It is summarised here and not copied. What this spec takes from it:

- A role pack names an agent, an exact model id and a `modelFamily`. The model option is the ACP config option with `category: "model"`; its values are the only valid ids. There is no `model/list` method and no model argument on `session/new`. The old `session/set_model` is gone; the runner does not use it.
- Kiro is not part of model selection: it always runs on its auto model (see below). Claude (`claude-agent-acp`), Codex (`codex-acp`) and DSH all take `configId: "model"` through `session/set_config_option`.
- The runner policy for every helper except Kiro is exact match, no fuzzy match, no silent default. Reviewer and author must be in different families, taken from a runner-owned catalog. Kiro auto is its own family, `kiro-auto`.
- Not verified in the note (no agent was run): DSH role injection, pinned adapter behavior. The task 1 spike covers the ones that touch this spec.

This is its own PR (G) and needs two things first: a PROTOCOL change (optional `model` and `family` on the job) and a task in Aelios-resident that sends them. The runner reads the fields only after the resident advertises them; an old resident sends none, and the turn runs as today.

The runner receives a model id for the turn and does this before the prompt is written:

1. Read the session's config options from `session/new` or `session/load`. Find the option whose category is the model.
2. If there is no model option, or the id is not one of its values, end the turn as `failed` with `reason: "error"` and a message that starts with `model_selection_unsupported:`, such as `model "<id>" for role "<role>" not offered by <plug>; offered: <ids>`. The prompt is not written.
3. Otherwise send `session/set_config_option` and check the reply shows the new value. A reply that does not match is the same failure.

There is no default-model fallback on any path except Kiro. Role packs stay helper-agnostic and may carry a model. When a job goes to Kiro, the runner skips the steps above, drops the model instruction and runs on auto. It does not fail. It writes one line in the thread as a `notice` with `fyi: true`, so it is not chat noise: `Kiro runs on auto; the model in the role pack was not used (<model id>).` Kiro auto sends no thinking, so Kiro threads show no thinking blocks. The same check runs when a thread is resumed, because a resumed session keeps its earlier model. Whether acpx forwards `session/set_config_option` to the agent is a task 1 spike step. If it does not, the runner needs another way to reach the agent connection, and the spike result goes back to the owner before code is written.

## Stable launch identity (4)

The trap: if the arguments for a thread's helper change between turns, acpx quietly opens a new session and the earlier context is lost (found by Claude Code). On `main` (from #20) the Kiro argument `--agent aelios-runner-<tier>-<hash>` changes when the tier changes, and `full` uses `--trust-all-tools` with no agent. A tier change is normal (the tier is the lower of the machine's tier and the job's tier, per turn).

Two parts: make the launch stable, and catch every change that remains.

**Part 1. Tier moves out of the arguments.**

- Kiro: the agent name becomes `aelios-runner-<threadhash>` (thread id and folder hashed). The tier lives in the file's content, which `kiro-agent.mjs` already rewrites before every turn. A new process reads it at start. So `read` to `edit` on the same thread keeps the same arguments and loads the same session.

A running helper has already read the old file. So when the tier of a thread differs from the tier of its open session, the turn calls `runtime.close` for that session and then `ensureSession` again with `resumeSessionId`: the process restarts, reads the new file, and loads the same session. The session id is unchanged. A named test, `tier change keeps the session`, checks that the fake helper saw one `session/new` and one `session/load` in total (task 9.8).

After the session is open, the turn carries over the fail-closed mode check of `helper.mjs` (`checkAgent`) for Kiro at every tier: Kiro's current mode is compared with the runner-written agent the turn needs, and a mismatch or an unreadable mode fails the turn before the prompt. DSH and `command` have no expected mode and are not checked, as on `main`. Task 1 finds where the current mode is read and where acpx exposes it (task 9.9).
- `full` (decided): write a third config for `full` (all tools allowed) under the same name. No `--trust-all-tools`, so launch arguments never change with the tier. This needs a check against the real Kiro (task 3): that an `allowedTools: ["*"]` agent opens everything that `--trust-all-tools` opens. If real Kiro refuses it, `full` keeps the flag and Part 2 handles a move to or from `full` as a visible handoff with a recap.
- DSH and `command`: no tier in the arguments today, nothing to move.

This edits `kiro-agent.mjs` and `plugins.mjs`, which are already in `main` from #20 (`agentName(tier, cwd)` becomes a name without the tier).

**Part 2. Detect any other change.** At the first session the runner records, in the thread record in `state.json`:

```
launch: { plugin, command, args, adapterVersion, cwd, id }   // id = sha256 of the first five fields
```

Before every turn, `launch.mjs` builds the current identity and compares `id`.

| Case | What the runner does |
|---|---|
| Same | `ensureSession` with `resumeSessionId` = the saved id. If acpx cannot load it (`SESSION_RESUME_REQUIRED`), the turn calls `prepareFreshSession`, opens a new session, passes the recap seed as history, sends a `notice`, and records the new id (`how: "lost"` in the log). Never a silent new session, and never a dead thread. |
| Different | No call to `ensureSession` with the old key. Explicit handoff: settle the old session (12), open a new session with the new identity, send the recap, update the record, and put a `notice` in the receipt: "The helper setup changed, so this thread started a new helper session. Earlier context was passed as a short recap." |
| No record yet (old thread from the legacy engine) | Adopt: record the current identity, resume the saved session id. |

Which acpx fields make it open a new session (agent name, command, argv, cwd) is checked in task 1 and written back into this section. The test names are in tasks.md (task 4).

## Local state (5)

| Item | Decision |
|---|---|
| Where | `<home>/acpx/` where `<home>` is `AELIOS_RUNNER_HOME` or `~/.aelios-runner`. Set through `stateDir`. |
| Modes | Directories `0700`, files `0600`. `store.mjs` checks at start; if a mode is wider it narrows it; if that fails the engine refuses to start and says why. (acpx code uses these modes in places; whether its file store does is checked in task 1. The runner does not rely on it.) |
| What is in it | Whole conversations, including tool inputs and outputs. This can include secrets a tool printed. The README says so; `status` shows the size and path. It is never uploaded and never logged. |
| Retention (decided) | 30 days after the thread's last turn; total cap 500 MB, oldest thread first. Run at start and once a day. Both are config values. |
| Delete by hand | `aelios-runner forget <thread>` and `forget --all`. `unpair` deletes the store by default (decided). |
| Our own record | `state.json` keeps `sessionId`, `cwd`, `plugin`, `launch`, `asks` as now, plus a recap seed (the first prompt, up to 500 characters, redacted). |
| DSH after a restart | DSH has no `session/load`, but it resumes the same session with `session/resume` (as the legacy engine does today; checked with the fake helper's DSH face). Only a failed resume gives a new session with a recap built from the thread record and the journal (`how: "fresh-after-lost"`) and a `notice`. There is no separate DSH transcript store. |

shortcut: retention scans file times and does not read records, so a thread that is still in use but quiet for 30 days loses its saved conversation; the runner then opens a new session with a recap. Upgrade by touching the record on each turn if that hurts.

## Time limits (7)

acpx has one `timeoutMs`. The runner sets that to the turn cap and puts the other stages outside, in `stages.mjs`, using the lifecycle and message hooks.

| Stage | Starts when | Ends when | Default |
|---|---|---|---|
| spawn | `onBeforeSpawn` | `onSpawned` | 15 s |
| initialize | spawned | `initialize` response seen in `onAcpMessage` | 60 s |
| session new/load | `ensureSession` called | it resolves | 90 s |
| first update | prompt written (`promptStarted`) | first event | 120 s |
| inactivity | each event | the next event | off (when on: 300 s) |
| cancel ack | cancel sent | turn result is cancelled or the process exits | 10 s |
| turn cap | prompt written | result | optional; default 30 min (today's `turnTimeoutMs`) |

Inactivity is off by default, because a long silent tool call (a build, a test run) looks like a hang from the outside. When the owner turns it on, the timer is paused while any tool call is in progress (a `toolCallId` started without a final status) and while a permission request or question is held, and restarts from zero afterwards. How a stage timer stops an `ensureSession` that never returns (cancel the call, close the runtime, or kill the process) is a task 1 check (1.6); the stage PR builds on the answer. A stage that fires cancels the turn and reports its own name (7.3). After the cancel limit the process group is stopped, as `acp.mjs` does now. These are config values under `timeouts`; the defaults are above the 24 s cold start plus MCP time seen on Kiro. The spike checks that acpx itself waits that long for a first start (no shorter hidden limit) and that the version is locked to `0.22.0`. Tune them after the real-helper runs in task 12.

## Environment and streams (8)

`env-allow.mjs` builds three things from `process.env` and the config:

- Base allowlist: `PATH HOME USER LOGNAME SHELL LANG LC_* TERM TMPDIR TZ SSL_CERT_FILE SSL_CERT_DIR NODE_EXTRA_CA_CERTS SSH_AUTH_SOCK XDG_*` and the proxy set `HTTP_PROXY HTTPS_PROXY ALL_PROXY NO_PROXY http_proxy https_proxy all_proxy no_proxy`.
- Per plug: `kiro` adds `KIRO_*` and `AWS_*` only if the config asks; `dsh` adds `DEEPSEEK_*` and `DSH_*`; `claude` adds `ANTHROPIC_*`; `codex` adds `OPENAI_*`.
- Config `env` keys are passed as the owner wrote them.

acpx takes exact variable names, not patterns. So the runner expands every prefix (`LC_*`, `XDG_*`, `KIRO_*`, `AWS_*`, `DEEPSEEK_*`) against its own `process.env` and hands acpx the resulting exact names.

Decided: allowlist plus config `env`, no full inheritance. This is a behavior change: today a helper inherits the runner's whole environment. After this, a helper that needed an unlisted variable (a token for `gh`, a registry key) stops seeing it until the owner adds it to `env`. The migration note in tasks.md says so (with the expanded prefixes and `SSH_AUTH_SOCK`). The spike (task 1) also checks that acpx passes this environment, proxy names included, to the child. The runner's pairing token is never read from the environment, and a test proves it is absent.

Stdout belongs to JSON-RPC (acpx owns the pipe). Stderr goes to the log through `redact`; the last three lines are used in start-up errors as today.

## Terminal states and ask kinds (9, 10)

`verdict.mjs` is one pure function: `(signals) -> { state, status, reason?, askKind? }`. Signals are: the prompt result (`completed` with a stop reason, `cancelled`, `failed` with an error), whether the prompt was written, process exit, end of stream, which stage timer fired, whether permissions were denied, and the last text.

| State | Receipt `status` | `reason` | When |
|---|---|---|---|
| succeeded | `done` | | `end_turn`, final text, no marker that says otherwise |
| succeeded, blocked | `failed` | `error` | final line `BLOCKED:` (as today) |
| needs_input / question | `needs_you` | | final line `ASK:`; `ask.kind = question` |
| needs_input / permission | `needs_you` | | the tier refused something (denied list); `ask.kind = permission` |
| problem (a status report) | `failed` | `refused`, `token_limit` or `no_result` (new, in `reason.mjs`; sent only after the resident advertises them, otherwise `error` with the name in the message; Waiting shows it as stuck with that reason) | `refusal`, `max_tokens`, `max_turn_requests`, or no text result. Never waiting for an answer (9.6). The text is the report |
| cancelled | `cancelled` | | stop reason `cancelled`, or our cancel acknowledged |
| failed | `failed` | `needs_login`, `missing_key`, `helper_missing`, `permission_denied`, `workspace_denied`, `model_selection_unsupported` (in the message), `error` | start failed, ACP error, a model-selection failure, a stage limit before the prompt was written |
| outcome_unknown | `failed` | `interrupted` | the process died, the stream ended, or a stage limit fired after the prompt was written |

One-to-one with the resident's notifications (9.6): `done`, waiting for approval (`needs_you` + `permission`), waiting for an answer (`needs_you` + `question`, only from `ASK:`), `cancelled`, `failed`. This replaces the earlier `problem` row that sent `needs_you`: a status report must not read as a question.

`needs_input` is not terminal: while a permission request is held the turn is alive, and the existing hold path reports it. A turn that ends with a question is terminal and sends `needs_you`, as today.

The prompt is never sent again by the runner. After an `outcome_unknown`, the runner reads the git state of the folder (`git status -sb`, last commit line), puts it in the report, and only then does the owner decide. Only the owner's next message runs anything.

`ask.kind` is additive and optional (10.4): `permission` or `question`. It is built into the outcome from the start but sent on the wire only after the resident PR (task 13) is merged; until then the field is left out of the receipt. A test pins both behaviors.

Since resident #87 every finished machine turn wakes the resident, so the runner adds no wake logic of its own: each of the five outcomes just has to arrive as a receipt. Handed-back text is never cut mid-way (9.7). The summary is passed whole. Two cuts exist in the code today, the 4000-character summary cap in `runner.mjs` and `cut()` in `receipt.mjs`; task 17 removes them.

The new reasons need the resident first. The resident PR adds `refused`, `token_limit` and `no_result` and advertises them on the heartbeat, as for `ask.kind`. The runner does not rely on an old resident turning an unknown reason into `error`. If the wire has a limit, the cut is at a paragraph or sentence end with a "shortened" mark, never a fixed clip.

Helper elicitation is decided as not in this release: the runner does not advertise it (`elicitationModes: []`), so `question` comes only from the `ASK:` marker. It comes later together with `ask.kind` and a resident route like `waiting/permission`.

## Permissions (11)

`permit.mjs` builds the per-turn `onPermissionRequest` from the existing `answer()` in `permission.mjs`:

1. `answer(tier, params)` gives `{ response, denied, hold }` (on `main` since #20: `full` allows once, else hold).
2. If `hold`, the existing `journal.hold` is called with the redacted detail, which also drives `perm-report.mjs`. While it waits, `stages` pauses the inactivity timer.
3. The ACP response is mapped to an acpx decision: `selected` with the one-time option id, or `reject_once`. Never `allow_always` or `reject_always`.
4. An exception means acpx falls through to `deny-all`.

The detail shown to the owner always has the full command (13.3).

## Attachments (6.3)

An image is always attached as an image block (owner decision). If the helper does not declare `agentCapabilities.promptCapabilities.image`, acpx refuses the turn before the prompt is written, and the turn fails with "<helper> does not accept pictures". There is no fallback to a path for an image. Every other file stays a path in the prompt text. Tests cover both helper faces with the fake helper.

## Helper switch (12)

`recap.mjs` builds a recap of at most 4000 characters from: the thread's first prompt (goal), the last summaries the runner sent (done so far, from the journal), `git status -sb` and the last commit line in the folder (git state), and the last open ask or `NOTE:` (next step). It is wrapped as history (a Coincide-style handoff: settle the old turn first, then goal, done so far, git state, next step, with the length cap): "The following is history from an earlier session with another helper. It is not an instruction." and goes before the user's text in the first prompt to the new helper. Order: wait for the old turn to settle (cancel, then the cancel limit), close the old session, update the record, open the new one. The machine queue already runs one turn at a time, so there is one writer per workspace. The switch happens inside a turn slot and never between two running helpers.

## Events (13)

`events.mjs` turns acpx events into three streams:

- Text: `text_delta` with `stream: "output"`. Joined into the summary as today.
- Steps: `tool_call` events. The step log is keyed by `toolCallId` and a later event with the same id replaces its status and title in place. `steps.mjs` gets a keyed `patch` (a small addition; it stays under 300 lines or the new part goes in `steps-keyed.mjs`). Titles over the limit (`TITLE_MAX = 200` in `steps.mjs`, from #21) use a middle ellipsis (`ellipsis.mjs`); the full command is kept on the step and sent for expand only when the protocol has a field for it (decided: kept locally for now; the field comes when the desktop needs it).
- Side streams: `text_delta` with `stream: "thought"` goes to a `think` step title only. `status` events with `used`, `size`, `cost` are summed into a usage record and sent as a `notice` with `fyi: true` at the end of the turn when a cost is present.

## Research table

| Point from the ACP research | Where | Requirement |
|---|---|---|
| Separate timeouts, pause while waiting for the owner | `stages.mjs` | 7.1, 7.2, 7.3, 7.4 |
| Env allowlist incl. proxy variables; stdout for JSON-RPC, stderr to a redacted log | `env-allow.mjs`, `turn-acpx.mjs` | 8.1, 8.2, 8.3 |
| Terminal states; never replay a written prompt | `verdict.mjs` | 9.1, 9.2, 9.3, 9.4 |
| needs_input split into permission and question (`ask.kind`); a problem is a failed report | `verdict.mjs`, `permit.mjs`, PROTOCOL | 9.6, 10.1, 10.2, 10.3, 10.4 |
| Helper switch: settle first, bounded recap marked as history, single writer | `recap.mjs` | 12.1, 12.2, 12.3 |
| Tool calls by `toolCallId`; middle ellipsis; full command in permission prompts | `events.mjs`, `steps.mjs`, `ellipsis.mjs` | 13.1, 13.2, 13.3 |
| Thinking and usage kept apart from text | `events.mjs` | 13.4 |

## Migration and rollback (14)

- `config.engine` is `"legacy"` (default in the first code PR) or `"acpx"`. `turn.mjs` picks. Both engines write the same thread record fields; acpx adds `launch`.
- Switch on: set `"engine": "acpx"`, restart. The first turn of each existing thread adopts it (4.4, "no record yet"): same saved `sessionId`, reloaded through acpx, state under `<home>/acpx/`.
- Switch off: set `"engine": "legacy"`, restart. The legacy layer reads `sessionId` from `state.json` and loads it with `session/load` or `session/resume`. Sessions made by acpx are ordinary helper sessions, so this works for helpers that keep their own session (Kiro). Nothing in `<home>/acpx/` is needed to go back; `forget --all` removes it.
- The default flips to `acpx` in a later small PR. `acp.mjs`, `helper.mjs` and the legacy branch of `turn.mjs` are deleted one release after that, in a PR of its own.
- The environment allowlist is part of the acpx engine only. A rollback restores the old "inherit everything" behavior.

## Risks and limits

- acpx is a young library with a wide dependency tree (tsx, zod, commander and others come with it). Pinning and the update rule (2.5) limit the exposure; the size on disk is checked in task 1 (about 46 MB here).
- AGPL-3.0-only (runner) with MIT (acpx) is accepted by the owner; the notice is still added. About 46 MB of dependencies is accepted too.
- One process for all threads: a crash in acpx takes the runner down. `outcome_unknown` covers the turn; the runner is restarted by the owner's supervisor as today.
- Whole-machine queue: a follow-up in thread A still waits behind thread B (1.3).
- Real parallel threads (a folder per thread) are later work.

## Open questions

The seven earlier questions are decided and recorded above. The new ones are at the end of tasks.md.

## Spike results (task 1, acpx 0.22.0, PR A)

Run with `node packages/runner/test/spike-acpx.mjs` (both fake-helper faces). Every premise PR A relies on holds; these are the exact names and the refinements the code uses.

- Keep, reattach: `createAcpRuntime` with `createFileSessionStore({ stateDir })`. A new runtime on the same `stateDir` reloads the saved session (`session/load` on the Kiro face, `session/resume` on the DSH face). `ensureSession` for a new key starts the helper at once. For a saved session it is lazy: no process starts until the first turn (or a control call).
- acpx does not pool by launch fields. With `resumeSessionId` it reloads the same session even when the registry's argv, the agent name or the folder changed. Detecting a changed launch is therefore ours (`launch.mjs`). The runner puts the first 8 characters of the launch identity into the session key, so a changed launch is a new acpx session, never the old one reloaded under new arguments.
- `runtime.close({ handle, reason })` ends the helper process and keeps the record (`closed: true`, session id unchanged). The next turn starts a new process that reloads the session. The helper process otherwise stays alive between turns of one runtime.
- Lost session: `ensureSession` does not throw. The turn's `result` is `{ status: "failed", error: { code: "NO_SESSION", detailCode: "SESSION_RESUME_REQUIRED" } }`, and the prompt was not written (`promptStarted` never resolves). `prepareFreshSession({ handle })` then `ensureSession` without `resumeSessionId` opens a new session.
- Other error names used: `detailCode` `AGENT_DISCONNECTED` (helper died; after the prompt was written it is the "died in the middle" case), `AGENT_SPAWN_ENOENT` and the like (thrown by `ensureSession`), `UNSUPPORTED_PROMPT_CONTENT` (an image for a helper without `promptCapabilities.image`; acpx refuses before writing the prompt).
- Current mode: not in `getStatus`, not in the saved record (`acpx.current_mode_id` is only set by `current_mode_update`). It is in the reply to `session/new` or `session/load`, which `onAcpMessage` shows. The turn passes `assertActive` to `startTurn`; acpx calls it after the load and before the prompt, so a mismatch stops the turn with no prompt written. `onAcpMessage` is documented as best effort, so a mode that was not seen fails closed.
- Images: `agentCapabilities.promptCapabilities.image` is in the saved record after `ensureSession`. Owner decision for PR A: the runner does not read it. An image is always attached as an image block, and a refusal from acpx (`UNSUPPORTED_PROMPT_CONTENT`) fails the turn with `<helper> does not accept pictures`. Other files stay paths in the prompt text.
- Store modes: `<stateDir>/sessions/` is `0700` and the records are `0600`, set by acpx itself; `store.mjs` checks and narrows them anyway. The record names an `event_log` path under `~/.acpx/`, but nothing was written there in the spike.
- Client capabilities with `fs: false`, `terminal: false`: the `initialize` request carries `fs.readTextFile: false`, `fs.writeTextFile: false`, `terminal: false` (the legacy client sent `{}`).
- Permission callback: `request.raw` is the ACP request (`toolCall`, `options`). Returning `{ outcome: "selected", optionId }` or `{ outcome: "reject_once" }` works; a throwing callback is treated as a refusal.
- Stray non-JSON lines on the helper's stdout are skipped, and acpx prints one console error line for each. Helper stderr is not reachable through the runtime options; the start-up error text acpx gives is used instead.
- Not checked in PR A (they belong to later PRs): how a stage timer stops a hung `ensureSession` (1.6), `session/set_config_option` against real DSH (1.8), the environment allowlist and the first-start wait (1.9; the code shows no hidden limit on a session start, the runtime `timeoutMs` is unset), real Kiro and real DSH (12).
- Kiro `full` as an all-tools agent file (3.2) could not be checked against real Kiro from the build sandbox (it may not write `~/.kiro/agents`). It must be checked by hand before the default flips (task 12).
