# aelios-runner

Does a resident's work on one machine. It runs headless for a long time. A laptop and a VPS install the same way.

```
cloud resident <──(runner dials out)── runner ──(ACP, stdio)── helper: Kiro / DSH / any command that speaks ACP
```

The runner opens no port. It only sends requests to the cloud. The protocol is in [PROTOCOL.md](PROTOCOL.md). The cloud half lives in the Aelios-resident repository (`src/machine.ts`).

## Install

Needs Node 22 or newer. No dependencies.

```sh
cd packages/runner
npm link          # gives you the aelios-runner command; or skip it and use node bin/aelios-runner.mjs
```

Once the package is published you will be able to run it with `npx aelios-runner`. It is not published yet.

## Pair

On the resident's settings page (background help, then machines) press "generate pairing code". Give the code to the runner with `--code pc_…`. It works for 10 minutes and once only. Instead of a code you can give the resident's web key (`WEB_KEY`). It is used only at pairing, never written to disk. Pass it in the environment, or type it when asked.

```sh
aelios-runner pair --code pc_… \
  --url https://your-resident.workers.dev \
  --workspace /home/me/work \
  --access edit \
  --plugin kiro
```

| Option | Meaning |
|---|---|
| `--url` | The resident's address. Must be https (http://127.0.0.1 is fine for local tests). |
| `--code` | The pairing code from the settings page. Without it, the web key is needed. |
| `--resident` | Resident id. Default `default`. |
| `--workspace` | The fixed folder where the helper works. Absolute path. Each thread records it on first use and never changes it. |
| `--access` | The highest permission tier this machine allows: `read`, `edit` (also reads anywhere and any Kiro shell command, except push, deleting files, sudo and git config; file writes are still held), or `full` (everything). Default `read`. |
| `--plugin` | Which helper: `kiro`, `dsh`, or `command`. Default `kiro`. |

The config is in `~/.aelios-runner/config.json`. Credentials and thread records are in `state.json` beside it (readable only by you). Set `AELIOS_RUNNER_HOME` to move the folder.

## Pick a helper

Only this machine's config picks the helper. A cloud message cannot change it.

- `kiro`: runs `kiro-cli acp --agent <name>` with a config the runner writes into `~/.kiro/agents` before each turn (for `full` that config allows every tool; there is no `--trust-all-tools`). Run `kiro-cli login` on this machine first. The runner logs in to no account.
- `dsh`: runs `dsh --profile acp` (the DeepSeek Harness ACP server). It looks for `dsh` on `PATH`. On macOS, if it is not found, it tries `/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh`. DSH resumes sessions with `session/resume`. Set the provider and model in DSH's `acp` profile first.
- `claude` and `codex` (experimental): Claude Code and Codex through their ACP adapters, pinned in `adapters.json` (package, exact version, integrity). Install the pinned adapter once with `aelios-runner install-adapter claude` (or `codex`). It goes to `~/.aelios-runner/adapters/` and runs with node from there, never through `npx`. Raising a pin is a new launch, so the thread gets a new session with a recap. Signing in to Claude Code with a Claude subscription is disputed under Anthropic's terms. For long unattended runs use an API key.
- `command` (experimental): any other command that speaks ACP. In `config.json` write `"plugin": "command", "command": ["my-acp-helper", "arg"]`.
- Optional config: `bin` (another executable path), `args` (extra arguments), `env` (extra environment variables), `turnTimeoutMs` (longest single turn, default 30 minutes), `pollMs` (how often to fetch work, default 5 seconds), `backoffMaxMs` (longest wait between tries while the cloud is unreachable, default 60 seconds).

### The engine

`"engine"` in `config.json` picks how the runner talks to the helper: `"legacy"` (the default for now), or `"acpx"`, which runs the helper through [acpx](https://www.npmjs.com/package/acpx). The time limits, the environment allowlist and the session store below apply to `acpx` only.

- Turn it on: set `"engine": "acpx"` and restart `start`. Each thread keeps its saved session id and reloads it through acpx on its next turn.
- Go back: set `"engine": "legacy"` and restart. The legacy engine reads the same session ids from `state.json`. The helper gets the runner's whole environment again, and only the single turn limit applies. `forget --all` removes the acpx store, which going back does not need.

### Time limits (acpx engine)

`timeouts` in `config.json` sets a limit per stage, in milliseconds (`0` turns one off). A limit that runs out stops the turn and says which stage it was. A stage before the prompt is written ends `failed`; after it, the turn waits for you and is not sent again.

| Key | Stage | Default |
|---|---|---|
| `spawn` | the helper process starts | 15000 |
| `initialize` | the helper answers `initialize` | 60000 |
| `session` | the session opens or reloads | 90000 |
| `firstUpdate` | the first update after the prompt | 120000 |
| `inactivity` | the next update; paused while a tool call runs or a permission waits for you | 0 (off) |
| `cancel` | a cancelled helper stops, or it is killed | `killAfterMs`, else 10000 |
| `turn` | the whole turn after the prompt | `turnTimeoutMs`, else 30 minutes |

### The helper's environment (acpx engine)

With `"engine": "acpx"` a helper does not get the runner's whole environment. It gets:

- `PATH HOME USER LOGNAME SHELL LANG TERM TMPDIR TZ SSL_CERT_FILE SSL_CERT_DIR NODE_EXTRA_CA_CERTS SSH_AUTH_SOCK`;
- the proxies `HTTP_PROXY HTTPS_PROXY ALL_PROXY NO_PROXY` and their lowercase forms;
- every `LC_*` and `XDG_*` variable; for `kiro` also every `KIRO_*` and `AWS_*`; for `dsh` every `DEEPSEEK_*` and `DSH_*`;
- the keys in the config's `env`, as written.

acpx adds one exception of its own: every non-empty `ACPX_AUTH_<NAME>` in the runner's environment reaches the helper, also copied as `<NAME>`, and acpx lets nothing override either name. If the config's `env` sets one of those names, the runner refuses the turn with a message instead of letting the value be silently replaced. Unset the `ACPX_AUTH_` variable or drop the key.

Migration: a helper that needed another variable (a token for `gh`, a registry key) stops seeing it on the acpx engine. Add it to `env` in `config.json`. The legacy engine still passes the whole environment.

## Run

```sh
aelios-runner start      # runs in the foreground; Ctrl-C stops it. On a VPS use systemd or tmux
aelios-runner status     # pairing, queue, receipts not yet sent, the session store's path and size
aelios-runner unpair     # revoke the pairing and delete the session store (--keep-store keeps it)
aelios-runner forget <thread>   # delete one thread's saved helper sessions; forget --all deletes them all
```

When it stops, a turn that is running is handed back as `needs_you`. It is not redone on its own.

## What is saved on this machine

With `"engine": "acpx"` the runner keeps the helpers' sessions in `~/.aelios-runner/acpx/` (or `$AELIOS_RUNNER_HOME/acpx/`), folders `0700` and files `0600`. A session file holds the whole conversation, tool input and output included. **It can hold secrets a tool printed** (file contents, command output, tokens). The runner never uploads it and never writes it to its log.

- A thread's sessions are deleted 30 days after its last turn, and the store is kept under 500 MB, oldest thread first. The sweep runs when `start` begins and once a day. Change it with `"retention": { "days": 30, "maxMb": 500 }` in `config.json`.
- `forget <thread>` and `forget --all` delete by hand. Stop `start` first: `forget` refuses while it runs. `unpair` deletes the store unless you pass `--keep-store`.
- The runner's own thread record in `state.json` stays, but without the session to reload. So a thread whose sessions were deleted starts a new session with a recap and a notice. It never reloads the old one from the helper.
- The helper may keep its own copy (Kiro, for example, keeps its sessions under its own folder). `forget` does not touch that.

## What the permission tiers can and cannot block

The runner does not judge requests itself. The tier sets the helper's own configuration, and whatever the helper still asks about is held for you (in the resident's waiting list, or on this machine):

- `read`: Kiro approves reads, search and glob inside the workspace on its own. Everything else is held. `edit`: Kiro also runs the shell commands it counts as read-only (`ls`, `cat`, `git status` and the like) without asking. Writes, the network and paths outside the workspace are not approved by Kiro. `full`: everything is allowed, and Kiro starts with `--trust-all-tools`.
- For Kiro the runner writes the agent config (`aelios-runner-<tier>-<hash>.json` in `~/.kiro/agents`, outside the workspace) before every turn, so a thread cannot loosen it.
- Kiro's read-only check is its own, not ours. It is not a sandbox: it can read files outside the workspace through shell commands such as `cat`, except for the patterns the config denies. For real isolation, use a dedicated system account, or a VPS with no sensitive files. Helpers other than Kiro have no generated config yet, so every request they ask about is held.
- The helper speaks with markers at the start of a line: `NOTE:` (anywhere; goes in the receipt's `notice`, no stop), `BLOCKED:` (last line; the job ends as `failed` with a `Blocked:` summary), `ASK:` (last line; only the user can decide). With no marker it just carries on or finishes. The runner adds a short English convention with these rules to every task. Only `ASK:` and refused permission requests become "waiting for you". A reply that ends with a question mark does not count.

## Only one start at a time

One folder allows one `aelios-runner start` (locked by `runner.lock`). `aelios-runner unpair` first stops a running `start` (it cancels the running turn), then revokes the pairing. After a revoke, queued work and unsent receipts are dropped. When the server revokes the pairing, the runner stops and exits the same way.

## Tests

```sh
npm test                                                 # fake cloud + fake helper, Kiro and DSH each once
AELIOS_REAL_KIRO=1 node --test test/kiro-real.test.mjs   # real kiro-cli, only up to initialize, sends no prompt
```

## Known gaps

- Real DSH has not been connected. The DSH launch follows its ACP docs and `dsh --profile acp --help`, and was tested with a fake helper.
- Real Kiro was checked only up to initialize. Whether it sends `session/request_permission`, and what `--trust-all-tools` does, are untested.
- There is no local way to stop a thread yet. `Runner.cancel(thread)` is ready for one.
