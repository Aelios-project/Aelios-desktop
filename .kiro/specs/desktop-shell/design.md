# Design: desktop shell

## Overview

```
 DSH desktop app (signed, owner-installed)
 ┌───────────────────────────────────────────────────────────┐
 │ shell plugin (packages/desktop)                           │
 │  client half  ── panel: pair form / status / web view ──┐ │
 │        ▲  /api/aelios-desktop                           │ │
 │  host half ── supervisor ── child: aelios-runner start  │ │
 └─────────────────────────────────────────────────────────┼─┘
                                                           ▼
        resident's own web page  <── https ──>  cloud resident
        runner ── aelios-runner/1 (dials out) ──> cloud resident
        runner ── ACP stdio ──> helper: dsh --profile acp
```

The shell has two halves, as DSH plugins do: a host half (Node) and a client half (browser code). The host half owns the runner process. The client half owns the panel. The resident's page is shown, never copied.

## What a DSH plugin can and cannot do

Read from the DSH repository (`deepseek-ai/deepseek-harness`, branch `master`) on 2026-11-07, from the earlier plugin for the older protocol, and from DS Bot (below). "Unverified" means no document or code was read that settles it. DSH on this machine is 0.2.2-rc.1.

**DS Bot, the reference.** DS Bot is a DSH plugin that replaces DSH's main interface with a multi-bot chat (bot list on the left, conversation in the middle). The original repository is `Fei2411/DS-Bot` (Apache-2.0; `Fei2411/DeepSeek-Bot` is the same repository under an older name). `QingJ01/DS-Bot-App` and `Simon202410/deepseek-bot` are GitHub forks of it with the same license; the Electron app (`app/`) is already in the original. Paths below are in `Fei2411/DS-Bot` on `main`, read on 2026-11-07. A fork's `app/README.md` still says DSH 0.2.0-rc.2 or 0.2.1-rc.2; the original's `README.md` badge and `app/package.json` say 0.2.2-rc.1, so the forks are stale.

### Can

1. Ship a client half. A package declares `dsh.client` (`platform`, `immediately`, `inject`) and DSH composes it into the boot graph. Source: `docs/subsystems/client-modules.md`.
2. Add UI through slots: `ctx.slots.register()` into a declared slot; reusing a shipped cell's key replaces its presentation. Source: `docs/subsystems/slots.md`.
3. Open a page in a Browser tab: `ctx.sidebarRight.openTab('browser', { params: { url } })`. On Desktop the tab is an Electron `<webview>`, HTTP(S) only, no Node or Electron access injected into the page. Source: `packages/client/ui-sidebar-browser/README.md`. This is the main route for "open the resident's page".
4. Change which shipped entries are on, through a bundle patch (`dsh.bundle.patch`, `cordis.patch.yml`, for example `- id: ui-sidebar-browser` with `disabled: false`). Source: the same README, and the earlier plugin's `package.json` and `cordis.patch.yml`.
5. Run host code with `ctx.effect` (start and dispose), `ctx.provide`, and add an HTTP route for its client half with `ctx.connection.fetch.register`. Source: the earlier plugin's `index.js`. The client half reaches it with a plain `fetch` to `/api/...`.
6. Register its own locale strings (`ctx.locale.register`) and a layout panel (`ctx.layout.selectPanel`). Source: the earlier plugin's `client.js`.
7. Be installed from the Plugins page, and be listed in a plugin index: one JSON file that names an npm package or a Git repository (url, commit, path) with an `engines.dsh` range. Source: `docs/user/guide/plugin-market.md`. The "Custom plugin indexes" bundle is experimental and off by default.
8. Run inside the owner's signed DSH. The plugin adds no new signature step, because it is not part of the signed app bundle. Basis: the packaging guide treats signing as a property of the DSH installer (`apps/desktop/packaging/README.md`). Where plugins are stored on disk is unverified.
9. Take over the main area by shadowing shipped slots. DS Bot does not replace `root`. It registers its own components into the shipped slots with `priority: -100` (lower renders first), through `ctx.slots.inject(name, () => ctx.slots.register(...))`: `ds-bot/src/client/index.js` lines 954 to 957 (`BOT_PRIORITY`, `shadow`), line 1042 (`sidebar.workspaces`, the bot list), lines 1043 to 1049 (brand mark, brand name, footer, settings), lines 1063 to 1104 (`conversation.chat.node`, `conversation.composer`, `conversation.input.*`). This is the proof that a plugin can own the whole window.
10. Draw its own Electron webviews inside DSH Desktop. DS Bot keeps them in a body-level layer (`ds-bot/src/client/browser-pane.js` lines 4 to 5) and notes that this needs "a webview bridge: DSH Desktop's, or the desktop app's" (`index.js` line 304). The bridge name and API are not documented in the DSH files read.
11. Start child processes from host code. `ds-bot/src/host/local-agents/acp.js` line 4 imports `spawn` from `node:child_process` and starts one child per ACP route (line 31), with `SIGTERM` then `SIGKILL` after 5 seconds on stop (lines 177 to 178). `dsh-update.js`, `claude.js` and `codex.js` do the same. So spawning a runner is not new. It also shows a plugin that talks ACP to other agents.

### Cannot (or not as hoped)

1. As a plugin alone, rename the application, change its icon, window frame or installer. The packaging guide says native application and installer names are unchanged, and unsigned local builds even carry a "DSH Local Build" label. Source: `apps/desktop/packaging/README.md`. So "nothing of DSH's branding" holds only inside the shell's own screens. A plugin cannot give the app its own name and icon; that is accepted.
2. Give the embedded page a bridge to the host. The Browser tab is sandboxed and gets no Node or Electron access. The earlier plugin worked around this with a proxied document in an iframe and a message channel; that is the 3000-line path this design avoids. The shell does not need a bridge: the runner talks to the cloud itself.
3. Embed a site that refuses framing in the Web build. The Browser README says to use the explicit external-browser action in that case. Whether the resident's page is allowed in the Desktop `<webview>` is unverified (Open questions 2 and 3).
4. Rely on a stable plugin API. The earlier plugin pins `engines.dsh` to `>=0.2.1-rc.3 <0.3.0` and stopped working when the protocol changed; DSH is in release candidates. The shell must pin a range and test against it.
5. Be sure which Node version runs host code. Spawning works (Can 11); the version is not documented in the files read.

## Decision: plugin only

The desktop is a plugin installed into the owner's own DSH. DSH is signed and notarized, so install and use raise no system warning (confirmed by the owner with DSH and the DS Bot plugin). Not doing: our own Electron app like DS Bot's `app/`. DS Bot App and the DS Bot installer are unsigned (their READMEs say so), and an unsigned download is warned about or blocked by the system.

## The main area

The resident's page should fill the main area. Two ways, from DS Bot's precedent:

1. Shadow the shipped cells that make the main area (Can 9), and put the resident's page in a webview of our own (Can 10). No copy of the resident's front end.
2. If a webview cannot be placed there, open it in a Browser tab (Can 3) and keep the shell's panel as a small bot-list-free sidebar.

DS Bot draws its own chat (`conversation.chat.node` and the rest). We must not: the resident's page already has that. So the shell shadows only what it needs to make room, and which slot that is stays Open question 1. The first task is a spike that finds it.

## Running the runner

Precedent exists (Can 11): spawn with `node:child_process`, stop with `SIGTERM`, then `SIGKILL` after 5 seconds if it has not exited. The supervisor below does the same for `aelios-runner start`.

## Version to pin

The newest DSH release is `dsh-v0.2.2-rc.1` (2026-11-04), a prerelease; there is no stable 0.2.x release. DS Bot's original repository pins exactly `0.2.2-rc.1` (README badge and install line, `app/package.json`). The DSH on this machine is also 0.2.2-rc.1. So: pin `engines.dsh` to 0.2.2-rc.1 and test only against it. Widen the range only after a test run on the next release. The earlier plugin's `>=0.2.1-rc.3 <0.3.0` is too wide for release candidates.

## Docker and NAS

DS Bot's `docker/` keeps a `dsh web` server with the plugin always on, on a NAS. Our headless mode is different: it is the runner alone, with no window. If an always-on box is wanted, the same idea is the runner in a container.

## Borrowing from DS Bot

DS Bot is Apache-2.0 (`LICENSE`, and a `NOTICE` that begins "Copyright 2026 Fei2411 and the DS Bot contributors"). Its own `NOTICE` says some of its files follow DSH files (`app/src/host-process.mjs`, `app/src/host.mjs`, `app/scripts/prepare-runtime.mjs` and others), so copying those also brings DSH's MIT notice.

- Ideas and structure (shadow slots, spawn and stop, the profile boot): free to use. Cite them here.
- Code: copy nothing by default. If a file is copied, it needs the Apache-2.0 text and DS Bot's `NOTICE` lines for that file in `THIRD_PARTY_NOTICES.md`, a note at the top of the file that it was changed, and the original copyright line kept.
- DS Bot's own rule 3 (`AGENTS.md`) says its interface is original material. Do not copy its icons, text or graphics.

## Components

New code goes in small files under `packages/desktop`. Each does one job.

```
packages/desktop/
  package.json            DSH manifest: dsh.client, dsh.bundle.patch, engines.dsh
  cordis.patch.yml        adds the plugin and turns the Browser entry on
  host/index.mjs          apply(ctx): wires supervisor and route, nothing else
  host/supervisor.mjs     start, stop, watch the runner child; pure state machine + spawn
  host/pair.mjs           builds the `aelios-runner pair` arguments, validates input
  host/route.mjs          /api/aelios-desktop: status, pair, start, stop, unpair
  client/index.mjs        registers the panel and the title badge
  client/pair-form.mjs    the form (address, code, folder, helper, tier)
  client/status.mjs       runner state line and the stop, unpair buttons
  client/frame.mjs        opens the resident's page in the Browser tab
  theme/halloween.css     the look; optional
  theme/icons/            the project's own icons
  test/                   supervisor, pair and step-count tests
```

### Supervisor (`host/supervisor.mjs`)

States: `unpaired`, `stopped`, `starting`, `running`, `crashed`, `locked` (another runner holds the lock), `revoked`.

- Start: spawn `node <runner>/bin/aelios-runner.mjs start` with the runner's home folder in the environment. Read the child's output line by line for the last error line.
- `locked`: the runner already refuses a second `start` through `runner.lock`. The supervisor reads that refusal and reports `locked`.
- `crashed`: one automatic restart per minute at most, then wait for the button.
- `revoked`: the runner exits when the server answers 401 `UNAUTHORIZED`. The supervisor maps that exit to `revoked` and the panel returns to the form.
- Dispose (DSH quits): send the child a stop signal and wait for it. The runner hands a running turn back as `needs_you` on its own.

shortcut: the runner has no machine-readable status, so the supervisor parses its text output and exit code. Replace this with `aelios-runner status --json` once the runner has it (see tasks).

### Pairing (`host/pair.mjs`)

Input: address, code, folder, helper (`dsh` or `kiro`), tier (`read`, `edit`, `full`). It checks the address (https, or http on 127.0.0.1), makes the folder when it is the default one, and builds the argument list for `aelios-runner pair --code … --url … --workspace … --access … --plugin …`. It uses an argument array, never a shell string. The code lives only in that call.

shortcut: the code is in the child's arguments for the moment the command runs, so another local user could read it in the process list. It works once and for 10 minutes. Move it to stdin if the runner gains a stdin option.

### The window

The client half registers one panel. Before pairing it shows the form. After pairing it places the resident's page in the main area (see "The main area"), or, if that fails the spike, calls `ctx.sidebarRight.openTab('browser', { params: { url } })` with the resident's address. The resident's page then shows conversation on the left and threads and the waiting list on the right, as it does in a normal browser. The shell adds a status line (runner state) and the stop and unpair buttons.

Login. The resident's page asks for its web key once, itself. Whether the web view keeps that login after a restart is Open question 2. The shell never reads or stores the web key.

## From install to the first message

Counted from "DSH is installed". The resident already exists and is online.

| # | Step | Where |
|---|---|---|
| 1 | Add the plugin on DSH's Plugins page (paste the Git or npm spec, or pick it from an index). | DSH |
| 2 | On the resident's settings page, background help, machines: press "generate pairing code". | Resident's page |
| 3 | In the shell's panel: paste the address and the code, press Connect. The folder, the helper (`dsh`) and the tier (`edit`) are pre-filled. | Shell |
| 4 | The shell starts the runner and opens the resident's page; the resident's first message shows. | Automatic |

Three actions and one arrival, so the target of four holds. Two things can break it: a folder the owner must pick differently (one more field, not one more step), and the first message, which needs the resident to say something after pairing (Open question 8). If the resident says nothing, step 4 becomes "say hello", and the claim "first message from the resident" is false.

Steps 2 and 3 can fold into one if the panel opens the settings page for the owner (the form links to it).

## The look

Direction: Halloween, from the project's own stylesheet and icons. A dark ground, one warm accent, soft glow, a small set of icons. Boundaries:

- Applied to the shell's own panel only. The resident's page keeps its own look; the shell does not inject CSS into it.
- Colors come from CSS variables in `theme/halloween.css`; the panel works without the file.
- No third-party art or fonts unless their license allows it; no DSH marks.
- Contrast, focus ring and reduced motion as in requirement 8.
- Whether it fits a Kiroween category (the costume category was named by the owner) is Open question 12.

## Licenses

DSH is MIT: its license text and copyright line must travel with any copy or substantial part of it. The DSH `LICENSE` begins "MIT License" and "Copyright (c) 2026 DeepSeek".

| Situation | Notice needed in `THIRD_PARTY_NOTICES.md` |
|---|---|
| The shell runs inside the owner's own DSH and ships none of its files (now, and the plan for the first version) | No. The file keeps saying so. |
| A commit adds DSH code, a DSH package, a DSH asset (icon, font, CSS) or a DSH type file that is copied in | Yes, in the same commit: the full MIT text and the copyright line. |
| A release file includes DSH (an installer that bundles DSH, a repackaged app) | Yes, in the file as well as in the repository. |

A check in `npm test` can fail the build when a file under `packages/desktop` imports a vendored DSH path and `THIRD_PARTY_NOTICES.md` has no "MIT License" block.

## Errors

| Case | What the owner sees |
|---|---|
| Page cannot be embedded | Message and a button to open it in the system browser. |
| Runner crashed | Last error line and a Start button. |
| Another runner is running | "Runner already running". |
| Pairing revoked | Back to the form. |
| Resident unreachable | The runner backs off by itself; the panel shows "waiting for the cloud". |
| DSH not found when the helper is `dsh` | The runner's own message, shown as is. |

## Testing

`npm test` (Node's built-in runner) with the runner's fake cloud and fake helper: supervisor state changes (start, stop, crash, revoke, lock held), pairing arguments and address checks, and a count of the setup steps. A real-DSH test is opt-in with `AELIOS_REAL_DSH=1` and sends no model request.

## Answered since the first draft

- Can a plugin take the main area? Yes, by shadowing shipped slots (Can 9). Which slot holds a full-width page is still open (question 1).
- Can host code spawn a child process? Yes (Can 11).
- Which DSH to pin? 0.2.2-rc.1 (section "Version to pin").
- Can a plugin draw its own webview in DSH Desktop? Yes (Can 10), through a bridge.

## Open questions

Not settled. Do not treat any of these as fact.

1. Which shipped slot lets a full-width page replace the conversation area? `docs/subsystems/slots.md` shows `root [AppFrame]` then `main[key=conversation]`. DS Bot shadows the `conversation.*` cells, not `main`. The spike (task 1) decides.
2. What is the webview bridge DS Bot mentions (`index.js` line 304)? Is it a documented DSH API or an internal one? Does it keep cookies after a restart? DS Bot's app gives each bot its own storage `partition`, but that is its own shell.
3. Does the resident's site allow being framed or shown in a webview? Its response headers were not checked.
4. Which Node version runs plugin host code? The runner needs Node 22 or newer.
5. Where are plugins installed on disk, and can they be added from a Git URL by hand on a normal release? DS Bot's README installs by npm name (`dsh plugin --profile web add ds-bot`) and mentions the Plugins page; a Git spec was not checked for DSH Desktop.
6. How does the shell get the runner? It is not on npm and is not published without the owner's say-so. Choices: publish it, or vendor it into the plugin package.
7. The runner has no machine-readable status. Add `aelios-runner status --json`? (A small change in `packages/runner`.)
8. After pairing, who sends the resident's first message? That change would be in the resident repository, not here.
9. Real DSH has not been connected to the runner yet (the runner README says so). The default helper is untested against the real thing.
10. Which Kiroween categories does this entry go in? Confirm before the look is described as a costume entry.
11. Is it acceptable that the pairing code is briefly in the child's arguments (see shortcut above)?
