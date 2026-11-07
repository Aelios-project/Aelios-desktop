# Requirements: desktop shell

## Introduction

The headless runner (`packages/runner`) already does a resident's work on one machine. This spec covers the half with a window: a plugin for DeepSeek Harness (DSH, MIT) that turns an installed DSH into the resident's desktop, with its own three-column interface. It draws the interface itself from the resident's existing web routes, runs the runner in the background, and connects with the resident's address and web key.

Decision: the desktop is a plugin only, installed into the owner's own signed DSH. An own Electron app is not done: unsigned installers get system warnings or are blocked.

Known result from a trial: a page placed by a plugin fills only the middle part of the window, not the left column or the top. So the shell does not embed the resident's web page. It writes small components of its own and takes over the left column and the middle through DSH's slots (the way DS Bot does).

Terms. The **resident** is the cloud Worker (Aelios-resident). The **shell** is the DSH plugin in `packages/desktop`. The **runner** is `packages/runner`. The **owner** is the person the resident works for. A **thread** is one run of work with its own page. An **ask** is a question a thread puts to the owner. The **web key** is the resident's `WEB_KEY`. A **conversation record** is what the resident keeps about a thread: the owner's words, the helper's replies, and `ASK`, `NOTE` and `BLOCKED` entries. **Details** are a thread's tool calls, changed files and run commands.

Out of scope. An own Electron app. The board and the tools panels (only a place for them is reserved).

## Requirements

### 1. Three columns, drawn by the shell

**User story:** As the owner, I want a window laid out like a project workspace, so that I find my resident, my threads and what waits for me at a glance.

1. The shell SHALL show three columns: left, the list of residents with pinned and recent threads; middle, the conversation with the resident; right, a switchable panel.
2. The shell SHALL draw them with its own small components and SHALL NOT embed the resident's web page or contain a copy of its front end.
3. The shell SHALL take over DSH's own left column and middle area through slots, and SHALL leave the rest of DSH working when the shell is turned off.
4. The right panel SHALL be chosen from a registry. The shell SHALL register two panels, "Threads" and "Waiting for you", and SHALL keep a place for a board panel and a tools panel without building them.
5. WHEN the window is closed and opened again THEN the shell SHALL return to the same resident and panel without asking for the address again.

### 2. The runner runs in the background

**User story:** As the owner, I want the runner to start with the window, so that I never open a terminal.

1. WHEN the shell starts and a pairing exists THEN it SHALL start `packages/runner` as a child process (`start`) on this machine.
2. The shell SHALL use the same config and state folder as headless mode (`AELIOS_RUNNER_HOME` or `~/.aelios-runner`), so one pairing serves both.
3. IF another `aelios-runner start` already holds the lock THEN the shell SHALL NOT start a second one and SHALL show "runner already running".
4. WHEN the runner exits with an error THEN the shell SHALL show the last error line and offer one button to start it again. It SHALL NOT restart it silently more than once in a minute.
5. WHEN the runner stops because the server revoked the pairing THEN the shell SHALL return to the connect form.
6. WHEN DSH quits THEN the shell SHALL stop the runner and SHALL leave a running turn handed back as `needs_you`, as the runner already does.
7. The shell SHALL open no network port of its own.

### 3. The helper is DSH itself

**User story:** As the owner, I want the helper to be the DSH I already have, so that I install nothing else.

1. The shell SHALL pair with `--plugin dsh` unless the owner picks another helper in the form.
2. The form SHALL offer `dsh` and `kiro`. A `command` helper SHALL be set only by editing the runner config.
3. The shell SHALL NOT let any text from the cloud, the helper or a repository choose a helper, a folder or a permission.
4. The permission tier SHALL default to `edit`. `full` SHALL need a separate, plainly worded confirmation.

### 4. Connect

**User story:** As the owner, I want to give my resident's address and key once and be connected.

1. The form SHALL ask for the resident's address and the web key. The workspace folder SHALL be pre-filled with a default folder the shell creates, and the owner MAY change it.
2. WHEN the owner submits THEN the shell SHALL register the runner with the web key (`aelios-runner pair`, key passed in the environment) and start it.
3. The shell SHALL keep the web key only in DSH's credential store, and only the host half SHALL read it. The client half and the pages SHALL never see it.
4. The shell SHALL accept `https` addresses, and `http://127.0.0.1` only for local tests.
5. IF connecting fails THEN the shell SHALL show the message and keep the form filled except the key.
6. WHERE the key must not be typed on this machine (a runner-only install), the owner MAY use the one-time pairing code from the resident's settings page instead; then the shell has no web access and shows only runner state.

### 5. Four steps or fewer

**User story:** As a new owner, I want to reach my resident's first message quickly.

1. From "DSH is installed" to "the first message from the resident is shown", the owner SHALL need at most four steps. The list is in `design.md` ("From install to the first message").
2. WHEN connecting succeeds THEN the shell SHALL show the three columns without another click.
3. The shell SHALL NOT ask for an account or a second confirmation of anything the owner already typed.
4. A test SHALL count the steps in the setup script and fail if there are more than four.

### 6. All data comes from the resident's web routes

**User story:** As the owner, I want the same conversation and threads I see in my browser.

1. The shell SHALL read and write only through the resident's existing `/web/` routes: conversation (`/web/messages`, `/web/say`), threads (`/web/threads`, `/web/thread`), waiting (`/web/waiting`, `/web/waiting/seen`), choices (`/web/task/choose`) and the thread actions of requirement 7.
2. The host half SHALL forward requests from the client half and SHALL refuse any path outside a fixed list. It SHALL add the web key itself.
3. The client half SHALL poll with the `since` version the resident gives, and SHALL NOT re-read an unchanged conversation.
4. The shell SHALL add no route and no storage to the resident.

### 7. Talk to a thread, stop it

**User story:** As the owner, I want to open a thread and talk to it directly.

1. WHEN the owner opens a thread in the right panel THEN the panel SHALL show that thread's conversation record and an input.
2. WHEN the owner sends words from that input THEN the shell SHALL post them to `/web/thread/say`, so they go straight to the thread and not through the resident's main conversation.
3. The panel SHALL have a stop button that posts to `/web/thread/stop`.
4. An ask from a thread SHALL appear in "Waiting for you" with its options, and answering it SHALL use the resident's existing answer route.
5. WHEN the owner marks an item read THEN the shell SHALL post it to `/web/waiting/seen`.

### 8. Two places for a thread's record

**User story:** As the owner, I want my phone and the resident's web page to see the conversation, and my computer to keep the heavy details.

1. The conversation record SHALL be kept in the cloud (the runner's receipts: `summary`, `ask`, `notice`, blocked results). The runner SHALL NOT send tool calls, changed files or run commands to the cloud.
2. Details SHALL stay on this machine, in the DSH session of the thread.
3. The thread panel SHALL fill the conversation from the cloud. WHEN the owner expands "Details" THEN the shell SHALL read them from the DSH session on this machine.
4. IF the details cannot be read THEN the panel SHALL say so in one line and SHALL still show the conversation.
5. The phone and the resident's web page SHALL see only the conversation record.
6. The shell SHALL read the DSH session and SHALL NOT change it.

### 9. Halloween look, installable on its own

**User story:** As the owner, I want a Halloween look, and I want to change skins like other DSH themes.

1. The shell SHALL set all colors, radii and shadows through CSS variables, and SHALL work with its own default values.
2. A skin SHALL be a separate small package that only sets those variables (and its own icons). The Halloween look SHALL be the first skin and SHALL NOT be built into the shell.
3. The shell SHALL show the resident's name, not DSH's, in the parts it draws.
4. Text and controls SHALL keep a readable contrast and a visible focus ring, and animation SHALL stop under the reduced-motion setting.
5. A skin SHALL NOT use third-party art or fonts without a license that allows it.
6. The shell cannot rename DSH's application, window frame or installer (see design). The spec SHALL NOT promise that.

### 10. A VPS

**User story:** As the owner, I want the resident to work on a server too.

1. The shell SHALL document two ways to install on a VPS: the runner alone (no interface), or DSH's web server (`dsh web`) with the shell plugin, which gives the same three columns in a browser.
2. WHEN the web server is reachable from outside the machine THEN the documentation SHALL require HTTPS and SHALL require DSH's own browser authentication to stay on.
3. The shell SHALL NOT turn off, bypass or weaken DSH's authentication, host check or origin check.
4. The documentation SHALL say that plain HTTP on a non-loopback address is unsafe.

### 11. Licenses and a clean public repository

**User story:** As a maintainer, I want the licenses right and no private data in the repository.

1. WHEN a commit first adds DSH code, a DSH package, a DSH asset or a DSH binary to this repository or to a release file THEN the same commit SHALL put DSH's full MIT LICENSE text and copyright line in `THIRD_PARTY_NOTICES.md`.
2. WHILE the shell only runs inside a DSH the owner installed and ships none of DSH's files, `THIRD_PARTY_NOTICES.md` SHALL say so, as it does now.
3. A release file that contains DSH SHALL carry the same notice inside it.
4. WHEN a commit copies code from DS Bot (Apache-2.0) THEN the same commit SHALL add the Apache-2.0 text and DS Bot's `NOTICE` lines for that file to `THIRD_PARTY_NOTICES.md`, mark the file as changed, and keep the original copyright line. IF a license is unclear THEN only the idea SHALL be used, not the code.
5. The shell SHALL NOT copy DS Bot's icons, text or graphics.
6. The resident's front end is AGPL-3.0 and this repository is MIT. The shell SHALL copy none of its code or styles; it MAY follow its layout and design. Copying needs the resident's copyright holder to agree first.
7. Code, docs, tests and fixtures SHALL contain no person's name, personal detail, private address or secret, and SHALL be in English. (A copyright line that a copied file must keep is the one exception.)
8. Each source file SHALL stay small and do one job.

### 12. Tests

**User story:** As a maintainer, I want the shell tested without an account.

1. Tests SHALL run with `npm test` using the fake cloud and fake helper of the runner, with no DSH, account or network.
2. The supervisor (start, stop, crash, revoke, lock held), the route allow-list, the poll logic and the connect form logic SHALL each have a test.
3. A test with the real DSH SHALL be opt-in (`AELIOS_REAL_DSH=1`) and SHALL send no model request.
