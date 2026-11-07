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
| `--access` | The highest permission tier this machine allows: `read`, `edit` (change files in the workspace), or `full` (everything). Default `read`. |
| `--plugin` | Which helper: `kiro`, `dsh`, or `command`. Default `kiro`. |

The config is in `~/.aelios-runner/config.json`. Credentials and thread records are in `state.json` beside it (readable only by you). Set `AELIOS_RUNNER_HOME` to move the folder.

## Pick a helper

Only this machine's config picks the helper. A cloud message cannot change it.

- `kiro`: runs `kiro-cli acp`. With `--access full` it adds `--trust-all-tools`. Run `kiro-cli login` on this machine first. The runner logs in to no account.
- `dsh`: runs `dsh --profile acp` (the DeepSeek Harness ACP server). It looks for `dsh` on `PATH`. On macOS, if it is not found, it tries `/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh`. DSH resumes sessions with `session/resume`. Set the provider and model in DSH's `acp` profile first.
- `command` (experimental): any command that speaks ACP, for example the Claude Code adapter `claude-agent-acp`. In `config.json` write `"plugin": "command", "command": ["claude-agent-acp"]`. Signing in with a Claude subscription is disputed under Anthropic's terms. For long unattended runs use an API key.
- Optional config: `bin` (another executable path), `args` (extra arguments), `env` (extra environment variables), `turnTimeoutMs` (longest single turn, default 30 minutes), `pollMs` (how often to fetch work, default 5 seconds).

## Run

```sh
aelios-runner start      # runs in the foreground; Ctrl-C stops it. On a VPS use systemd or tmux
aelios-runner status     # pairing, queue, receipts not yet sent
aelios-runner unpair     # revoke the pairing (the web key is needed again to re-pair)
```

When it stops, a turn that is running is handed back as `needs_you`. It is not redone on its own.

## What the permission tiers can and cannot block

The runner can only answer permission requests the helper **asks for**, and it only looks at the kind and paths the helper reports:

- `read`: read, search, think. `edit`: also edits inside the workspace, **and `fetch` (network)**. `full`: everything.
- Except in `full`, a request with any path outside the workspace is refused. A symlink that points outside counts as outside.
- It cannot block what a helper does without asking (for example its own tool reading `~/.ssh` with no prompt), or requests with no path. An injected task could use this to read local files and carry them to the cloud. For real isolation, use a dedicated system account, or a VPS with no sensitive files, and tighten the helper's own read and write limits.
- When the helper needs the user to decide, the last line of its reply must start with `ASK:` and hold one sentence. The runner adds an English line to every task that explains this. Only this marker and refused permission requests become "waiting for you". A reply that ends with a question mark does not count.

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
- Some run-time messages (receipt summaries and questions) are still in Chinese. They are shown to the resident's user.
