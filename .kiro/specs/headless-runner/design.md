# Design: headless runner

## Overview

`packages/runner` is a Node 22 package with no dependencies. Its command is `aelios-runner` with four subcommands: `pair`, `start`, `status`, `unpair`. `start` runs a loop that heartbeats, claims work, runs it through an ACP helper, and sends receipts.

```
cloud resident <-- HTTPS, runner dials out -- Runner loop -- ACP over stdio -- helper process
                                                  |
                                      state.json (claims, threads, outbox)
```

## Modules (`packages/runner/src`)

| Module | Job |
|---|---|
| `runner.mjs` | The loop: heartbeat, poll, queue per thread, say / mail / cancel rules, outbox, restart recovery. |
| `helper.mjs` | One turn with a helper: start, initialize, open or resume the session, send the prompt, collect the answer, map it to a status. |
| `acp.mjs` | A small JSON-RPC 2.0 client over a child process's stdio. |
| `plugins.mjs` | How to start each helper (`kiro`, `dsh`, `command`). Nothing else differs between helpers. |
| `permission.mjs` | Answers `session/request_permission` by tier and workspace. |
| `cloud.mjs` | HTTP calls: pair, register, revoke, heartbeat, poll, receipt. Sorts errors into retry, drop and revoked. |
| `receipt.mjs` | Builds a receipt and cuts it to fit the size limit. |
| `state.mjs` | Config and state files (mode 0600) and the home folder. |
| `lock.mjs` | The one-`start`-per-folder lock. |

`bin/aelios-runner.mjs` parses the command line and wires these together.

## Decisions

1. **Dial out only.** The cloud cannot reach the machine, so "say" and "mail" are messages the cloud leaves and the runner fetches. This needs no open port, tunnel or firewall rule.
2. **Plugins only say how to start.** Sessions, cancel and permissions are shared in `helper.mjs`, so adding a helper is a few lines in `plugins.mjs`.
3. **One helper process per turn.** A turn starts the helper, opens or resumes the thread's session (`session/load` or `session/resume`, whichever the helper offers; a fresh session if it has none), runs the prompt, and closes it. A thread's session id is kept in `state.json`. This keeps a stuck helper from holding the machine, at the cost of start-up time.
4. **Local config decides the dangerous things.** Helper, workspace and tier come from `config.json`. A cloud message can only lower `access`.
5. **Idempotence by saving first.** The `claimKey`, the claimed work and each receipt are written to disk before the next step. A crash repeats a request but never repeats the work.
6. **Never redo on doubt.** If the runner restarts with a work that has no `final`, it sends `needs_you`. If a helper dies in the middle of a turn, it does the same.
7. **Questions are explicit.** Only a last line that starts with `ASK:` and a refused permission request become `needs_you`. A trailing question mark does not.
8. **Helper output is data.** It can write `ASK:`, so a "waiting for you" card means someone wants to ask, not that the question is right.

## Permissions

`permission.mjs` looks at the request's kind and `locations`. `read` allows read, search and think. `edit` adds in-workspace edits and `fetch`. `full` allows all. Outside `full`, any path outside the workspace (after resolving symlinks) is refused. The runner picks only an "allow once" option. If the helper offers none, the request is cancelled and recorded as denied.

Limit: the check sees only what the helper asks about. See `PROTOCOL.md`.

## Failure handling

| Event | What the runner does |
|---|---|
| 401 `UNAUTHORIZED` | Revoked. Cancel, drop queue and outbox, exit. |
| 403, 429, 5xx, no connection | Keep the receipt, retry with growing gaps. |
| 413 | Halve the text and resend. Give up if it did not shrink. |
| 409 `INVALID_TOKEN`, `UNKNOWN_WORK`, other 400 | Drop that receipt. |
| Turn over the time limit | Cancel, then `needs_you`. |
| Helper does not answer a cancel | Stop its process after `killAfterMs`. |
| Helper dies mid-turn | `needs_you`, not redone. |

## Testing

`test/fake-cloud.mjs` is an in-process cloud with the protocol's rules. `test/fake-agent.mjs` is an ACP helper that can be told to ask, stay silent, run long, or ask for a permission. `test/rig.mjs` joins them. Tests cover pairing, claim and replay, say / mail / cancel, receipts and size, permissions, locking and the command line. `test/kiro-real.test.mjs` is off by default and checks only that real `kiro-cli acp` answers `initialize`.
