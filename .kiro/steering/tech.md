---
inclusion: always
---

# Tech

- Language: plain JavaScript as ES modules (`.mjs`), Node 22.13 or newer. One runtime dependency: `acpx`, pinned to an exact version. Prefer the Node standard library for everything else.
- Helpers: any command that speaks ACP (Agent Client Protocol) over stdio. Supported: Kiro (`kiro-cli acp`), DeepSeek Harness (`dsh --profile acp`). Claude Code through an adapter is experimental. A helper is chosen only by local config.
- Cloud protocol: `aelios-runner/1`, described in `packages/runner/PROTOCOL.md`. The runner only dials out and opens no port. Claims are idempotent, receipts are replayable, and a revoke (401 `UNAUTHORIZED`) means stop.
- Permissions: `read`, `edit`, `full`. The runner answers a helper's permission request by tier and refuses paths outside the workspace.

## Tests

- Run `npm test` in the repository root, or in `packages/runner`. It uses Node's built-in test runner with a fake cloud and a fake ACP helper, so it needs no account, network or quota.
- `AELIOS_REAL_KIRO=1 node --test packages/runner/test/kiro-real.test.mjs` starts the real `kiro-cli acp` and checks `initialize` only.
- Run the tests twice when you change helper start-up: once normally, and once with `kiro-cli` and `dsh` removed from `PATH`. Both must pass.

## Release

The runner is ready for `npx aelios-runner` but is not published to npm. Do not publish without being asked.
