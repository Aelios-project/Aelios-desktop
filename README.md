# Aelios-desktop

Aelios-desktop is the local half of a cloud AI resident. The resident ([Aelios-resident](https://github.com/Aelios-project/Aelios-resident)) runs in the cloud and works fine without it. Aelios-desktop adds hands on one machine: it lets the resident hand work to a coding helper that runs in a folder you choose, and it brings back questions, results and stuck jobs.

Built for Kiroween 2026. The `.kiro` folder at the root holds the steering files, the spec and the hook used to build it.

## Two ways to run

One program, two ways to run it. Both talk to the helper over [ACP](https://agentclientprotocol.com) (Agent Client Protocol) and speak `aelios-runner/1` to the cloud resident.

| Mode | Where | State |
|---|---|---|
| Headless | A laptop or a VPS, no window | Works. It lives in [`packages/runner`](packages/runner). |
| Desktop app | A window on your computer, built on DeepSeek Harness (MIT) | Planned. See [`packages/desktop`](packages/desktop). |

Helpers that work through ACP today: Kiro (`kiro-cli acp`) and DeepSeek Harness (`dsh --profile acp`). Claude Code through an ACP adapter is experimental.

## Install the headless mode

Needs Node 22 or newer. There are no dependencies.

```sh
git clone https://github.com/Aelios-project/Aelios-desktop.git
cd Aelios-desktop/packages/runner
npm link                      # gives you the `aelios-runner` command

aelios-runner pair --code pc_… --url https://your-resident.workers.dev \
  --workspace /home/me/work --access edit --plugin kiro
aelios-runner start
```

Get the pairing code on the resident's settings page. The package is ready for `npx aelios-runner` but is not published to npm yet. Full options are in [`packages/runner/README.md`](packages/runner/README.md), and the wire protocol is in [`packages/runner/PROTOCOL.md`](packages/runner/PROTOCOL.md).

Run the tests with `npm test` in the repository root. They use a fake cloud and a fake helper, so they need no account.

## How it relates to Aelios-resident

Aelios-resident is a Cloudflare Worker with one Durable Object. It holds the conversation and sends jobs. The runner dials out to it, takes jobs, runs them through the helper, and sends back receipts. The cloud never reaches into the machine. The machine's own config decides which helper, which folder and which permission tier. The cloud sends text and a thread id only.

```
cloud resident <── runner dials out ── aelios-runner ── ACP (stdio) ── Kiro / DSH
```

## Pre-existing work

For the Kiroween rules, this is what was there before the submission period (2026-10-30 to 2026-12-04) and what is new.

- **Aelios-resident** is the cloud resident. It existed before the submission period and is not part of this submission. The repository is [Aelios-project/Aelios-resident](https://github.com/Aelios-project/Aelios-resident).
- **The runner** was first written on 2026-11-07, inside Aelios-resident, in [PR #65](https://github.com/Aelios-project/Aelios-resident/pull/65) (commit `feba81c`, the ACP runner with Kiro and DSH plugs) and [PR #67](https://github.com/Aelios-project/Aelios-resident/pull/67) (squashed into `e46f199` on main, the `aelios-runner/1` protocol). It was then moved here with its history, using `git subtree split --prefix=runner`. The commits in `packages/runner` keep their original dates and messages (`bf5f186` and `04b93f2` are the same two changes before the squash).
- **The cloud half of the protocol** (`src/machine.ts` and the matching changes in Aelios-resident, PR #67) was also written on 2026-11-07, inside the submission period. The runner needs it to work. The rest of Aelios-resident existed before the period.
- **Changes after the move:** the code was changed in one way only. Every message the runner sends (receipt text, errors, comments, test fixtures) was translated from Chinese to English, and the task line sent to the helper now ends with "Reply in the language of the job." The docs were translated too, and `packages/runner/package.json` got its name, license, `files`, `bin` and `engines` fields.
- The desktop app plan, the `.kiro` folder, and the root files are new in this repository.
- **The desktop interface** copies styles and components from Aelios-resident (AGPL-3.0, same author). Each copied file says in its header where it came from. This repository is AGPL-3.0-only for that reason and so that nobody can take it closed-source or sell it without sharing their changes.

## License

AGPL-3.0-only. See [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
