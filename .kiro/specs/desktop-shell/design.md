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

Read from the DSH repository (`deepseek-ai/deepseek-harness`, branch `master`) on 2026-11-07, and from the earlier plugin for the older protocol. "Unverified" means no document or code was read that settles it. DSH on this machine is 0.2.2-rc.1.

### Can

1. Ship a client half. A package declares `dsh.client` (`platform`, `immediately`, `inject`) and DSH composes it into the boot graph. Source: `docs/subsystems/client-modules.md`.
2. Add UI through slots: `ctx.slots.register()` into a declared slot; reusing a shipped cell's key replaces its presentation. Source: `docs/subsystems/slots.md`.
3. Open a page in a Browser tab: `ctx.sidebarRight.openTab('browser', { params: { url } })`. On Desktop the tab is an Electron `<webview>`, HTTP(S) only, no Node or Electron access injected into the page. Source: `packages/client/ui-sidebar-browser/README.md`. This is the main route for "open the resident's page".
4. Change which shipped entries are on, through a bundle patch (`dsh.bundle.patch`, `cordis.patch.yml`, for example `- id: ui-sidebar-browser` with `disabled: false`). Source: the same README, and the earlier plugin's `package.json` and `cordis.patch.yml`.
5. Run host code with `ctx.effect` (start and dispose), `ctx.provide`, and add an HTTP route for its client half with `ctx.connection.fetch.register`. Source: the earlier plugin's `index.js`. The client half reaches it with a plain `fetch` to `/api/...`.
6. Register its own locale strings (`ctx.locale.register`) and a layout panel (`ctx.layout.selectPanel`). Source: the earlier plugin's `client.js`.
7. Be installed from the Plugins page, and be listed in a plugin index: one JSON file that names an npm package or a Git repository (url, commit, path) with an `engines.dsh` range. Source: `docs/user/guide/plugin-market.md`. The "Custom plugin indexes" bundle is experimental and off by default.
8. Run inside the owner's signed DSH. The plugin adds no new signature step, because it is not part of the signed app bundle. Basis: the packaging guide treats signing as a property of the DSH installer (`apps/desktop/packaging/README.md`). Where plugins are stored on disk is unverified.

### Cannot (or not as hoped)

1. Rename the application, change its icon, window frame or installer. The packaging guide says native application and installer names are unchanged, and unsigned local builds even carry a "DSH Local Build" label. Source: `apps/desktop/packaging/README.md`. So "nothing of DSH's branding" holds only inside the shell's own panel.
2. Give the embedded page a bridge to the host. The Browser tab is sandboxed and gets no Node or Electron access. The earlier plugin worked around this with a proxied document in an iframe and a message channel; that is the 3000-line path this design avoids. The shell does not need a bridge: the runner talks to the cloud itself.
3. Embed a site that refuses framing in the Web build. The Browser README says to use the explicit external-browser action in that case. Whether the resident's page is allowed in the Desktop `<webview>` is unverified (Open questions 2 and 3).
4. Rely on a stable plugin API. The earlier plugin pins `engines.dsh` to `>=0.2.1-rc.3 <0.3.0` and stopped working when the protocol changed; DSH is in release candidates. The shell must pin a range and test against it.
5. Be sure of spawning a child process. Host code is Node, but no document read says whether it is sandboxed or which Node version runs it (Open question 4).

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

The client half registers one panel. Before pairing it shows the form. After pairing it calls `ctx.sidebarRight.openTab('browser', { params: { url } })` with the resident's address, or, if the main area can be used (Open question 1), places the page there. The resident's page then shows conversation on the left and threads and the waiting list on the right, as it does in a normal browser. The shell adds a status line (runner state) and the stop and unpair buttons.

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

## Open questions

Not settled. Do not treat any of these as fact.

1. Can a plugin put the resident's page in the main area, or only in a sidebar tab? `docs/subsystems/slots.md` says `root` is the only built-in declaration and shows `root [AppFrame]`, but its cardinality and whether a plugin may take it over were not read.
2. Does the Desktop `<webview>` of the Browser tab keep cookies and storage after a restart (so the resident's login survives)? Not read.
3. Does the resident's site allow being framed or shown in a `<webview>`? Its response headers were not checked. The earlier plugin used a proxied document in an iframe instead; the reason is not written down.
4. Can host code spawn a child process, and which Node runs it? The runner needs Node 22 or newer. The earlier plugin declares `node >=22` but spawns nothing that was read.
5. Where are plugins installed on disk, and can they be added from a Git URL by hand on a normal release, or only through the experimental plugin index bundle?
6. How does the shell get the runner? It is not on npm and is not published without the owner's say-so. Choices: publish it, or vendor it into the plugin package.
7. The runner has no machine-readable status. Add `aelios-runner status --json`? (A small change in `packages/runner`.)
8. After pairing, who sends the resident's first message? That change would be in the resident repository, not here.
9. Does the plugin API match across the DSH 0.2.x release candidates? Which range goes in `engines.dsh`?
10. Real DSH has not been connected to the runner yet (the runner README says so). The default helper is untested against the real thing.
11. A fully renamed app (own name, icon, installer) needs a repackaged DSH, own signing and notarization, and a notice in the release file. Do we want that? It is outside this spec.
12. Which Kiroween categories does this entry go in? Confirm before the look is described as a costume entry.
13. Is it acceptable that the pairing code is briefly in the child's arguments (see shortcut above)?
