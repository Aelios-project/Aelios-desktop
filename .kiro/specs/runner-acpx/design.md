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

The owner's note names `createSharedAcpRuntime`. From the declarations, the in-process `createAcpRuntime` is the one that can meet 5.1 (state under our home), 8.1 (env allowlist), 11.3 (no fs/terminal) and 7 (stage hooks). The shared one cannot take a `stateDir`. **Decided: `createAcpRuntime`, in the runner process, state under `~/.aelios-runner`.** Task 1 repeats the checks Claude Code ran (keep, reattach after restart, follow-up, cancel, permission callback) against `createAcpRuntime` with a `stateDir`. If it cannot reattach after a restart, the fallback is decided too: the shared runtime with state in `~/.acpx/` and a weaker 5.1 (requirement 5.7). The README then says where the state is.

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

`plugins.mjs` stays the one place that knows how to start a helper. It gets one new function, `registryOf(config)`, that returns the acpx registry `{ <name>: "<command string>" }` for the configured helper only. The registry holds one entry, so an acpx name collision with its built-in table cannot happen.

| Plug | Command | Notes |
|---|---|---|
| `kiro` | `kiro-cli acp --agent <name>` | Not `kiro-cli-chat`. This is the v2 path already tested in #20 (`kiro-agent.mjs`). The agent name is `aelios-runner-<threadhash>`, with no tier, so the launch arguments do not change with the tier. Kiro always runs on auto (decided). |
| `dsh` | `dsh --profile acp` | Path from `onPath` or the macOS app path, as now. |

Both are registered as a custom agent command in our registry, never taken from acpx's built-in table.
| `claude`, `codex` (new plugs, experimental) | `node <home>/adapters/<pkg>@<version>/<bin>` | Installed by `aelios-runner install-adapter <name>` at a version in a table in the repo. Never `npx`. |
| `command` | `config.command` | As now. |

An adapter pin is a line in `adapters.json` (package, exact version, integrity). A test fails if any entry has a range, `latest`, or no integrity.

The registry value is one command string, so paths with spaces (the DSH app path) are quoted by one helper with a test.

### Model per role (3.5, 3.6)

Role packs choose a model per role. Decided: the resident sends only a model id and a family per job. The runner reads no pack manifest; the role pack is one card stored in the cloud. The reference note is `role-packs.md`, which belongs in the Aelios-resident docs (it is not there yet; the owner sent it as a file). It is summarised here and not copied. What this spec takes from it:

- A role pack names an agent, an exact model id and a `modelFamily`. The model option is the ACP config option with `category: "model"`; its values are the only valid ids. There is no `model/list` method and no model argument on `session/new`. The old `session/set_model` is gone; the runner does not use it.
- Kiro is not part of model selection: it always runs on its auto model (see below). Claude (`claude-agent-acp`), Codex (`codex-acp`) and DSH all take `configId: "model"` through `session/set_config_option`.
- The runner policy for every helper except Kiro is exact match, no fuzzy match, no silent default. Reviewer and author must be in different families, taken from a runner-owned catalog. Kiro auto is its own family, `kiro-auto`.
- Not verified in the note (no agent was run): DSH role injection, pinned adapter behavior. The task 1 spike covers the ones that touch this spec.

The runner receives a model id for the turn and does this before the prompt is written:

1. Read the session's config options from `session/new` or `session/load`. Find the option whose category is the model.
2. If there is no model option, or the id is not one of its values, end the turn as `failed` with `reason: "error"` and a message that starts with `model_selection_unsupported:`, such as `model "<id>" for role "<role>" not offered by <plug>; offered: <ids>`. The prompt is not written.
3. Otherwise send `session/set_config_option` and check the reply shows the new value. A reply that does not match is the same failure.

There is no default-model fallback on any path except Kiro. Role packs stay helper-agnostic and may carry a model. When a job goes to Kiro, the runner skips the steps above, drops the model instruction and runs on auto. It does not fail. It writes one line in the thread: `Kiro runs on auto; the model in the role pack was not used (<model id>).` Kiro auto sends no thinking, so Kiro threads show no thinking blocks. The same check runs when a thread is resumed, because a resumed session keeps its earlier model. Whether acpx forwards `session/set_config_option` to the agent is a task 1 spike step. If it does not, the runner needs another way to reach the agent connection, and the spike result goes back to the owner before code is written.

## Stable launch identity (4)

The trap: if the arguments for a thread's helper change between turns, acpx quietly opens a new session and the earlier context is lost (found by Claude Code). On `main` (from #20) the Kiro argument `--agent aelios-runner-<tier>-<hash>` changes when the tier changes, and `full` uses `--trust-all-tools` with no agent. A tier change is normal (the tier is the lower of the machine's tier and the job's tier, per turn).

Two parts: make the launch stable, and catch every change that remains.

**Part 1. Tier moves out of the arguments.**

- Kiro: the agent name becomes `aelios-runner-<threadhash>` (thread id and folder hashed). The tier lives in the file's content, which `kiro-agent.mjs` already rewrites before every turn. A new process reads it at start. So `read` to `edit` on the same thread keeps the same arguments and loads the same session.
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
| Same | `ensureSession` with `resumeSessionId` = the saved id. If acpx cannot load it, the turn fails with a clear error (`how: "lost"` in the log); no silent new session. |
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
| DSH transcript | DSH has no `session/load`: the session resumes but old messages are not replayed. The first draft of this design kept only the recap seed, which is too thin. The runner now stores the DSH transcript itself in `<home>/transcripts/<thread>.jsonl` (mode `0600`): each prompt, each final text and the step titles, redacted, capped at 200 KB per thread (oldest entries drop first), same retention as the store. The recap for a new DSH session is built from it (`how: "fresh-after-lost"`, as today). Kiro keeps its own sessions and does not need it. |

shortcut: retention scans file times and does not read records, so a thread that is still in use but quiet for 30 days loses its saved conversation; the runner then opens a new session with a recap. Upgrade by touching the record on each turn if that hurts.

## Time limits (7)

acpx has one `timeoutMs`. The runner sets that to the turn cap and puts the other stages outside, in `stages.mjs`, using the lifecycle and message hooks.

| Stage | Starts when | Ends when | Default |
|---|---|---|---|
| spawn | `onBeforeSpawn` | `onSpawned` | 15 s |
| initialize | spawned | `initialize` response seen in `onAcpMessage` | 60 s |
| session new/load | `ensureSession` called | it resolves | 90 s |
| first update | prompt written (`promptStarted`) | first event | 120 s |
| inactivity | each event | the next event | 300 s |
| cancel ack | cancel sent | turn result is cancelled or the process exits | 10 s |
| turn cap | prompt written | result | optional; default 30 min (today's `turnTimeoutMs`) |

While a permission request or question is held, the inactivity timer is paused and restarts from zero when the answer is given. A stage that fires cancels the turn and reports its own name (7.3). After the cancel limit the process group is stopped, as `acp.mjs` does now. These are config values under `timeouts`; the defaults are above the 24 s cold start plus MCP time seen on Kiro. The spike checks that acpx itself waits that long for a first start (no shorter hidden limit) and that the version is locked to `0.22.0`. Tune them after the real-helper runs in task 12.

## Environment and streams (8)

`env-allow.mjs` builds three things from `process.env` and the config:

- Base allowlist: `PATH HOME USER LOGNAME SHELL LANG LC_* TERM TMPDIR TZ SSL_CERT_FILE SSL_CERT_DIR NODE_EXTRA_CA_CERTS XDG_*` and the proxy set `HTTP_PROXY HTTPS_PROXY ALL_PROXY NO_PROXY http_proxy https_proxy all_proxy no_proxy`.
- Per plug: `kiro` adds `KIRO_*` and `AWS_*` only if the config asks; `dsh` adds `DEEPSEEK_*` and `DSH_*`; `claude` adds `ANTHROPIC_*`; `codex` adds `OPENAI_*`.
- Config `env` keys are passed as the owner wrote them.

Decided: allowlist plus config `env`, no full inheritance. This is a behavior change: today a helper inherits the runner's whole environment. After this, a helper that needed an unlisted variable (a token for `gh`, a registry key) stops seeing it until the owner adds it to `env`. The migration note says so. The spike (task 1) also checks that acpx passes this environment, proxy names included, to the child. The runner's pairing token is never read from the environment, and a test proves it is absent.

Stdout belongs to JSON-RPC (acpx owns the pipe). Stderr goes to the log through `redact`; the last three lines are used in start-up errors as today.

## Terminal states and ask kinds (9, 10)

`verdict.mjs` is one pure function: `(signals) -> { state, status, reason?, askKind? }`. Signals are: the prompt result (`completed` with a stop reason, `cancelled`, `failed` with an error), whether the prompt was written, process exit, end of stream, which stage timer fired, whether permissions were denied, and the last text.

| State | Receipt `status` | `reason` | When |
|---|---|---|---|
| succeeded | `done` | | `end_turn`, final text, no marker that says otherwise |
| succeeded, blocked | `failed` | `error` | final line `BLOCKED:` (as today) |
| needs_input / question | `needs_you` | | final line `ASK:`; `ask.kind = question` |
| needs_input / permission | `needs_you` | | the tier refused something (denied list); `ask.kind = permission` |
| problem (a status report) | `failed` | `refused`, `token_limit` or `no_result` (new, in `reason.mjs`; Waiting shows it as stuck with that reason) | `refusal`, `max_tokens`, `max_turn_requests`, or no text result. Never waiting for an answer (9.6). The text is the report |
| cancelled | `cancelled` | | stop reason `cancelled`, or our cancel acknowledged |
| failed | `failed` | `needs_login`, `missing_key`, `helper_missing`, `permission_denied`, `workspace_denied`, `model_selection_unsupported` (in the message), `error` | start failed, ACP error, a model-selection failure, a stage limit before the prompt was written |
| outcome_unknown | `failed` | `interrupted` | the process died, the stream ended, or a stage limit fired after the prompt was written |

One-to-one with the resident's notifications (9.6): `done`, waiting for approval (`needs_you` + `permission`), waiting for an answer (`needs_you` + `question`, only from `ASK:`), `cancelled`, `failed`. This replaces the earlier `problem` row that sent `needs_you`: a status report must not read as a question.

`needs_input` is not terminal: while a permission request is held the turn is alive, and the existing hold path reports it. A turn that ends with a question is terminal and sends `needs_you`, as today.

The prompt is never sent again by the runner. After an `outcome_unknown`, the runner reads the git state of the folder (`git status -sb`, last commit line), puts it in the report, and only then does the owner decide. Only the owner's next message runs anything.

`ask.kind` is additive and optional (10.4): `permission` or `question`. It is built into the outcome from the start but sent on the wire only after the resident PR (task 13) is merged; until then the field is left out of the receipt. A test pins both behaviors.

Since resident #87 every finished machine turn wakes the resident, so the runner adds no wake logic of its own: each of the five outcomes just has to arrive as a receipt. Handed-back text is never cut mid-way (9.7). The summary is passed whole. If the wire has a limit, the cut is at a paragraph or sentence end with a "shortened" mark, never a fixed clip.

Helper elicitation is decided as not in this release: the runner does not advertise it (`elicitationModes: []`), so `question` comes only from the `ASK:` marker. It comes later together with `ask.kind` and a resident route like `waiting/permission`.

## Permissions (11)

`permit.mjs` builds the per-turn `onPermissionRequest` from the existing `answer()` in `permission.mjs`:

1. `answer(tier, params)` gives `{ response, denied, hold }` (on `main` since #20: `full` allows once, else hold).
2. If `hold`, the existing `journal.hold` is called with the redacted detail, which also drives `perm-report.mjs`. While it waits, `stages` pauses the inactivity timer.
3. The ACP response is mapped to an acpx decision: `selected` with the one-time option id, or `reject_once`. Never `allow_always` or `reject_always`.
4. An exception means acpx falls through to `deny-all`.

The detail shown to the owner always has the full command (13.3).

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
