# Design: desktop shell

## Overview

```
 DSH (signed, owner-installed): desktop app, or `dsh web` in a browser
 ┌────────────────────────────────────────────────────────────────┐
 │ shell plugin (packages/desktop)                                │
 │  client half: left column | middle: chat + right panel         │
 │        │ fetch /api/aelios-desktop/*  (polls with ?since=)     │
 │  host half: route allow-list ── forwards to the resident       │
 │             supervisor ── child: aelios-runner start          │
 │             details reader ── DSH session of a thread          │
 └────────────────────────────────────────────────────────────────┘
   resident's /web/* routes  <── https, x-web-key (host half only)
   runner ── aelios-runner/1 (dials out) ──> cloud resident
   runner ── ACP stdio ──> helper: dsh --profile acp
```

Decision: plugin only, in the owner's own DSH. An own Electron app is not done: unsigned installers get system warnings or are blocked.

The shell draws its own interface. It does not embed the resident's web page, because a plugin's page fills only the middle of the window (known result from a trial), not the left column or the top. Data comes from the resident's existing `/web/` routes. The host half holds the web key; the client half never sees it.

## What a DSH plugin can and cannot do

Read from the DSH repository (`deepseek-ai/deepseek-harness`, branch `master`) on 2026-11-07, from the earlier plugin for the older protocol, and from DS Bot. "Unverified" means no document or code was read that settles it. DSH on this machine is 0.2.2-rc.1.

**DS Bot, the reference.** DS Bot is a DSH plugin that replaces DSH's main interface with a multi-bot chat. The original repository is `Fei2411/DS-Bot` (Apache-2.0; `Fei2411/DeepSeek-Bot` is the same repository under an older name). `QingJ01/DS-Bot-App` and `Simon202410/deepseek-bot` are forks with the same license. Paths below are in `Fei2411/DS-Bot` on `main`.

### Can

1. Ship a client half. A package declares `dsh.client` (`platform`, `immediately`, `inject`). Source: DSH `docs/subsystems/client-modules.md`.
2. Add UI through slots with `ctx.slots.register()`; reusing a shipped cell's key replaces its presentation. Source: DSH `docs/subsystems/slots.md`.
3. Take over the window by shadowing shipped slots. DS Bot registers its components with `priority: -100` through `ctx.slots.inject(name, () => ctx.slots.register(...))`: `ds-bot/src/client/index.js` lines 954 to 957 (`BOT_PRIORITY`, `shadow`); the left bot list in `sidebar.workspaces` (line 1042); brand and settings cells (lines 1043 to 1049); the conversation cells (lines 1063 to 1104).
4. Run host code with `ctx.effect`, `ctx.provide`, and add an HTTP route for its client half with `ctx.connection.fetch.register`. Source: the earlier plugin's `index.js`. Keep a secret in `ctx.credentials`, also from the earlier plugin.
5. Start child processes from host code. `ds-bot/src/host/local-agents/acp.js` line 4 imports `spawn`, line 31 starts one child per ACP route, lines 177 to 178 send `SIGTERM` and then `SIGKILL` after 5 seconds.
6. Register locale strings (`ctx.locale.register`).
7. Be installed from the Plugins page, or listed in a plugin index (npm or Git source with an `engines.dsh` range). Source: DSH `docs/user/guide/plugin-market.md`. The index bundle is experimental and off by default.
8. Run inside the owner's signed DSH, so install raises no system warning (the owner confirmed this with DSH and the DS Bot plugin).
9. Run in `dsh web` too. The plugin has a `dsh.client` platform of `web` (DS Bot's `ds-bot/package.json`), and DS Bot ships a Docker setup for it (`docker/`).
10. Read a DSH session. A session is an append-only log of typed events; turns and steps carry the tool calls (DSH `docs/subsystems/session.md`). `ctx.sessionProjections` serves log-derived state per session, and the session-query service reads sessions by id (DSH `docs/subsystems/session-projection.md`, `session-query.md`). Which events hold file changes and commands was not read (Open question 3).

### Cannot (or not as hoped)

1. Place a page anywhere but the middle. Known result from a trial: a page placed by a plugin fills only the middle, not the left column or the top. So no embedded page; the shell draws its own components.
2. As a plugin alone, rename the application, change its icon, window frame or installer (DSH `apps/desktop/packaging/README.md`). That is accepted.
3. Rely on a stable plugin API. The earlier plugin pinned `engines.dsh` to `>=0.2.1-rc.3 <0.3.0` and stopped working when the protocol changed; DSH is in release candidates.
4. Be sure which Node version runs host code (not documented in the files read).

## Version to pin

The newest DSH release is `dsh-v0.2.2-rc.1` (2026-11-04), a prerelease; there is no stable 0.2.x release. DS Bot's original repository pins exactly `0.2.2-rc.1` (README, `app/package.json`). So `engines.dsh` is pinned to 0.2.2-rc.1 and the tests run only against it. Widen the range only after a test run on the next release.

## The three columns

The shell owns the middle area (known), so the middle and right columns are drawn inside it. The left column goes in `sidebar.workspaces` (precedent, line 1042 of DS Bot's `index.js`). The top of the window stays DSH's.

| Column | Content | Data |
|---|---|---|
| Left | Resident list, pinned threads, recent threads | `/web/threads`, `/web/pin` |
| Middle | Conversation with the resident, input | `/web/messages?since=`, `/web/say` |
| Right | One panel from a registry: Threads, Waiting for you; places kept for Board and Tools | below |

Panel registry: `{ id, title, icon, component }`. The shell registers `threads` and `waiting`. A later panel registers itself the same way and needs no change in the shell.

- Threads panel. A list from `/web/threads`. Opening one calls `/web/thread?id=` and shows its conversation record and an input. The input posts to `/web/thread/say` (words go to the thread, stop and restart). A stop button posts to `/web/thread/stop`. "Details" is a fold; it reads from this machine (next section).
- Waiting panel. Items from `/web/waiting` (`ask`, `note`, `done`, `stuck`), asks first. An ask shows its options; choosing uses the existing answer route (`/web/task/choose` for cloud tasks, `/web/thread/say` for a machine thread). Read items go to `/web/waiting/seen`.

Polling. The conversation and the lists are fetched with the `since` version the resident returns; an unchanged answer is `{ same }` and costs nothing to read. No server push is used. shortcut: polling, not a stream; move to a stream if the resident offers one.

The look follows the resident's page. Its front end is AGPL-3.0 with the same author, and this repository is AGPL-3.0-only, so small parts of its styles and components may be copied; each file header names the source (requirement 11.6).

## Where a thread's record lives

| Part | Where | Seen by |
|---|---|---|
| The owner's words, the helper's replies, `ASK`, `NOTE`, `BLOCKED` | Cloud: the runner's receipts (`summary`, `ask`, `notice`, a `Blocked:` result) | Desktop, phone, the resident's web page |
| Tool calls, changed files, run commands | This machine: the DSH session of the thread | Desktop only |

The runner already sends only the conversation level. The receipt has `summary` (4000 characters at most), `ask`, `notice`, `resolve` and an optional `sessionId` (`packages/runner/PROTOCOL.md`). A test locks this: the runner sends no tool call or file list.

Reading details. The host half finds the thread's DSH session and returns a short list: tool name, one line of what it did, changed file paths, commands. Steps:

1. The thread's `sessionId` comes from the runner's own state on this machine (the runner records it per thread; the receipt also carries it).
2. The host half opens that session in DSH (Can 10) and folds its events into the list. It only reads.
3. The panel shows the list under "Details". If the session cannot be found, it shows one line and keeps the conversation.

What is not known, and so is not promised: whether the ACP session id the helper reports is the same as the DSH session id; whether a session made under the `acp` profile is visible to the profile the owner's window runs; and which event types hold file changes and commands. These are Open questions 2 and 3. If the details cannot be read, requirement 8.4 applies.

## Components

New code goes in small files under `packages/desktop`. Each does one job; none grows past a few hundred lines.

```
packages/desktop/
  package.json            DSH manifest: dsh.client, dsh.bundle.patch, engines.dsh = 0.2.2-rc.1
  cordis.patch.yml        adds the plugin
  host/index.mjs          apply(ctx): wires the parts below, nothing else
  host/supervisor.mjs     start, stop, watch the runner child
  host/connect.mjs        checks input, builds `aelios-runner pair` arguments, stores the key
  host/proxy.mjs          the allow-list and the forward to the resident, adds x-web-key
  host/details.mjs        reads a DSH session into a short details list
  host/route.mjs          /api/aelios-desktop: status, connect, stop, unpair, web/*, details
  client/index.mjs        shadows the slots, mounts the columns
  client/api.mjs          fetch + poll with `since`
  client/left.mjs         resident list, pinned and recent threads
  client/chat.mjs         middle: messages and input
  client/panels.mjs       right column: the panel registry and its switcher
  client/panel-threads.mjs
  client/panel-waiting.mjs
  client/connect-form.mjs
  client/theme.mjs        CSS variables and their defaults; no colors elsewhere
  test/                   supervisor, proxy allow-list, poll, connect, step count
packages/desktop-skin-halloween/   a separate package: sets the variables, own icons
```

### Proxy (`host/proxy.mjs`)

The client calls `/api/aelios-desktop/web/<path>`. The host half checks the path against a fixed list and forwards to the resident with `x-web-key`. The list: `check`, `messages`, `say`, `threads`, `thread`, `thread/say`, `thread/stop`, `waiting`, `waiting/seen`, `task/choose`, `pin`. Everything else is refused, including `/web/runner/*` (the runner is handled by the supervisor only). The path must start with one slash, hold no `..`, no encoded slash and no control character, and the target origin must equal the stored address. The same checks were used in the earlier plugin's proxy.

### Supervisor (`host/supervisor.mjs`)

States: `unpaired`, `stopped`, `starting`, `running`, `crashed`, `locked` (another runner holds the lock), `revoked`.

- Start: spawn `node <runner>/bin/aelios-runner.mjs start` with the runner's home folder in the environment. Read output line by line for the last error line.
- `locked`: the runner refuses a second `start` through `runner.lock`; the supervisor reports `locked`.
- `crashed`: one automatic restart per minute at most, then wait for the button.
- `revoked`: the runner exits on 401 `UNAUTHORIZED`; the supervisor maps that to `revoked` and the shell returns to the connect form.
- Dispose (DSH quits): send `SIGTERM`, then `SIGKILL` after 5 seconds. The runner hands a running turn back as `needs_you`.

shortcut: the runner has no machine-readable status, so the supervisor parses its text output and exit code. Replace with `aelios-runner status --json` once the runner has it.

### Connect (`host/connect.mjs`)

Input: address, web key, folder, helper (`dsh` or `kiro`), tier. It checks the address (https, or http on 127.0.0.1), makes the default folder, stores the key in `ctx.credentials`, and runs `aelios-runner pair --url … --workspace … --access … --plugin …` with the key in the environment (the runner reads `AELIOS_WEB_KEY` from the environment and never writes it). It uses an argument array, never a shell string.

shortcut: this keeps the web key on the owner's machine. The resident has no narrower credential for a window (only the web key and the Mini App session). Switch if the resident adds a device token.

## From install to the first message

Counted from "DSH is installed". The resident already exists and is online.

| # | Step | Where |
|---|---|---|
| 1 | Add the plugin on DSH's Plugins page. | DSH |
| 2 | Type the resident's address and web key in the connect form; press Connect. Folder, helper (`dsh`) and tier (`edit`) are pre-filled. | Shell, left column |
| 3 | The shell registers and starts the runner and shows the three columns. | Automatic |
| 4 | The resident's first message shows in the middle. | Automatic |

Two actions and two arrivals: four steps, so the target holds. The one-time pairing code of the earlier plan is no longer on the path, because the window needs the web key anyway and the key can register the runner. The code remains only for a runner-only install.

Two things can break it: a folder the owner must pick differently (one more field, not one more step), and the first message, which needs the resident to say something once connected (Open question 6). If the resident says nothing, step 4 becomes "say hello", and the claim "first message from the resident" is false.

## A VPS

Two installs.

1. Runner only. No interface, smallest. Install `packages/runner`, pair with the one-time code, run under a service manager. This is the headless mode already.
2. DSH web plus the shell. `dsh web` serves DSH in a browser, the shell plugin gives the same three columns there, and DS Bot's Docker setup (`docker/`: Dockerfile, compose file, entrypoint; its README says the container is the sandbox boundary) is the model. Not read in detail.

What DSH's web server gives for protection (DSH `docs/subsystems/web-server.md`):

- `dsh web` binds loopback by default. `--host` takes one concrete address and warns at startup when a non-loopback bind serves plain HTTP.
- The carrier itself has no authentication. DSH's Connection plugin adds Host and Origin checks and browser-session authentication for every Host API route and stream. `--trusted-host` sets which browser Host is accepted. `--public-url` changes only the advertised address.
- The login uses a fresh process token added to the application URL; the cookie it sets is `Secure` when the carrier serves TLS.
- TLS is served only when a certificate and key are configured.

Rules for the shell: it never turns these off, never bypasses them, and its documentation says that a web server reachable from outside must use HTTPS (the TLS option, or a reverse proxy that does it) and keep DSH's authentication on. Without them anyone who reaches it could operate the machine. What is not known: whether the process token survives a restart, whether there is a password login for a long-running server, and how a reverse proxy mount works (Open question 5).

## The look

Direction: Halloween. A dark ground, one warm accent, soft glow, a small set of icons. Boundaries:

- The shell defines every color, radius and shadow as a CSS variable in `client/theme.mjs`, with plain defaults. Nothing else holds a color.
- A skin is a separate package that only sets those variables and ships its own icons, so it installs and changes on its own, as DSH themes do. The Halloween look is the first skin and is not inside the shell. How DSH loads a theme (DS Bot calls `installTheme()` at `index.js` line 1040) was not read; the skin may need that route.
- No third-party art or fonts unless the license allows it; no DSH marks in the parts the shell draws.
- Contrast, focus ring and reduced motion as in requirement 9.
- Whether it fits a Kiroween category (the costume category was named by the owner) is Open question 8.

## Licenses

DSH is MIT: its license text and copyright line must travel with any copy or substantial part of it. The DSH `LICENSE` begins "MIT License" and "Copyright (c) 2026 DeepSeek".

| Situation | Notice needed in `THIRD_PARTY_NOTICES.md` |
|---|---|
| The shell runs inside the owner's own DSH and ships none of its files (the plan) | No. The file keeps saying so. |
| A commit adds DSH code, a DSH package, a DSH asset (icon, font, CSS) or a copied DSH type file | Yes, in the same commit: the full MIT text and the copyright line. |
| A release file includes DSH | Yes, in the file as well. |
| A commit copies code from DS Bot (Apache-2.0) | Yes, in the same commit: the Apache-2.0 text, DS Bot's `NOTICE` lines for that file, a changed-file note in the file, the original copyright line kept. DS Bot's own `NOTICE` says some of its files follow DSH files, so those bring the DSH notice too. |
| The resident's front end (AGPL-3.0, same author) | Copy only small used parts; the file header names the source. |

By default nothing is copied from DS Bot; its ideas (shadowing slots, spawn and stop) are used with a citation here. A check in `npm test` can fail the build when a file under `packages/desktop` imports a vendored DSH path and `THIRD_PARTY_NOTICES.md` has no "MIT License" block.

## Errors

| Case | What the owner sees |
|---|---|
| Resident unreachable | The runner backs off by itself; the shell shows "waiting for the cloud" and keeps the last data. |
| Wrong web key | The connect form with the message; the key field is empty. |
| Runner crashed | Last error line and a Start button. |
| Another runner is running | "Runner already running". |
| Pairing revoked | Back to the connect form. |
| Details cannot be read | One line under "Details"; the conversation stays. |
| DSH not found when the helper is `dsh` | The runner's own message, shown as is. |

## Testing

`npm test` (Node's built-in runner) with the runner's fake cloud and fake helper: supervisor states (start, stop, crash, revoke, lock held); the proxy allow-list (allowed paths pass; `..`, encoded slashes, other origins and `/web/runner/*` are refused); poll with `since` (an unchanged answer changes nothing); the connect inputs; a check that the runner sends no tool call or file list; and a count of the setup steps. A real-DSH test is opt-in with `AELIOS_REAL_DSH=1` and sends no model request.

## Answered since the first draft

- Can a plugin take the main area? Only the middle holds a page (trial). The shell draws its own components and shadows slots (Can 3).
- Can host code spawn a child process? Yes (Can 5).
- Which DSH to pin? 0.2.2-rc.1.
- How does `dsh web` protect a public server? Host and Origin checks plus browser-session authentication, TLS only when configured.

## Open questions

Not settled. Do not treat any of these as fact.

1. Does `sidebar.workspaces` (left) plus the conversation cells (middle) let the shell replace their content entirely with its own components, or do some DSH parts stay? DS Bot shadows the cells but still renders DSH sessions in them.
2. Is the ACP session id that the `dsh --profile acp` helper reports the same as the DSH session id? Is a session made under the `acp` profile visible to the profile the owner's window runs? If not, details cannot be read this way.
3. Which DSH session events hold changed files and run commands, and which read API should the host half use (`ctx.sessionProjections`, the session-query service, or `ctx.agents`)?
4. Which Node version runs plugin host code? The runner needs Node 22 or newer.
5. For `dsh web` on a server: does the process token survive a restart? Is there a password or other persistent login? How does a reverse-proxy mount work with the token and the secure cookie? DS Bot's Docker setup was not read in detail.
6. After connecting, who sends the resident's first message? That change would be in the resident repository.
7. (Answered) The resident lists its residents at `GET /web/residents`; the shell uses it for the left column.
8. Which Kiroween categories does this entry go in? Confirm before the look is described as a costume entry.
9. Is it acceptable that the web key is stored on the owner's machine (in DSH's credential store)? The resident has no narrower credential.
10. How does DSH load a theme or skin from a separate plugin (DS Bot's `installTheme()`)?
11. How does the shell get the runner? It is not on npm and is not published without the owner's say-so. Choices: publish it, or vendor it into the plugin package.
12. `aelios-runner status` already prints JSON (`paired`, `revoked`, ...). The shell reads it. What is missing is a stable exit code for "revoked" and "locked"; the shell reads the lock message and the status instead.
13. Real DSH has not been connected to the runner yet (the runner README says so). The default helper is untested against the real thing.
