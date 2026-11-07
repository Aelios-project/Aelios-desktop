# Requirements: desktop shell

## Introduction

The headless runner (`packages/runner`) already does a resident's work on one machine. This spec covers the half with a window: a plugin for DeepSeek Harness (DSH, MIT) that turns an installed DSH into the resident's desktop. It shows the resident's own web page, runs the runner in the background, and pairs with a one-time code.

The window does not copy the resident's front end. The resident's page already has the conversation, the thread view and the "waiting for you" list. The shell opens that page and adds only what a web page cannot do: start the runner and pair this machine.

Terms. The **resident** is the cloud Worker (Aelios-resident). The **shell** is the DSH plugin in `packages/desktop`. The **runner** is `packages/runner`. The **owner** is the person the resident works for. A **pairing code** is the one-time code (`pc_…`, 10 minutes, single use) from the resident's settings page.

Out of scope. A repackaged, renamed DSH application (own name, icon, installer, signing). It is listed in "Open questions" and not planned here.

Facts about DSH that this spec relies on, and the ones it could not confirm, are in `design.md` (section "What a DSH plugin can and cannot do") and in "Open questions" there.

## Requirements

### 1. The resident's own page is the window

**User story:** As the owner, I want the window to be my resident's page, so that conversation, threads and the waiting list are the ones I already use.

1. WHEN the shell is paired THEN it SHALL open the resident's web address in an embedded web view inside DSH.
2. The shell SHALL NOT contain a copy of the resident's front end.
3. IF DSH cannot embed the resident's page THEN the shell SHALL show a plain message with a button that opens the address in the system browser, and SHALL keep the runner running.
4. The embedded page SHALL get no Node or Electron access from the shell.
5. WHEN the window is closed and opened again THEN the shell SHALL return to the resident's page without asking for the address again.

### 2. The runner runs in the background

**User story:** As the owner, I want the runner to start with the window, so that I never open a terminal.

1. WHEN the shell starts and a pairing exists THEN it SHALL start `packages/runner` as a child process (`start`) on this machine.
2. The shell SHALL use the same config and state folder as headless mode (`AELIOS_RUNNER_HOME` or `~/.aelios-runner`), so one pairing serves both.
3. IF another `aelios-runner start` already holds the lock THEN the shell SHALL NOT start a second one and SHALL show "runner already running".
4. WHEN the runner exits with an error THEN the shell SHALL show the last error line and offer one button to start it again. It SHALL NOT restart it silently more than once in a minute.
5. WHEN the runner stops because the server revoked the pairing THEN the shell SHALL return to the pairing form.
6. WHEN DSH quits THEN the shell SHALL stop the runner and SHALL leave a running turn handed back as `needs_you`, as the runner already does.
7. The shell SHALL open no network port of its own.

### 3. The helper is DSH itself

**User story:** As the owner, I want the helper to be the DSH I already have, so that I install nothing else.

1. The shell SHALL pair with `--plugin dsh` unless the owner picks another helper in the form.
2. The form SHALL offer `dsh` and `kiro`. A `command` helper SHALL be set only by editing the runner config.
3. The shell SHALL NOT let any text from the cloud, the helper or a repository choose a helper, a folder or a permission.
4. The permission tier SHALL default to `edit`. `full` SHALL need a separate, plainly worded confirmation.

### 4. Pairing

**User story:** As the owner, I want to paste one code and be connected.

1. The form SHALL ask for the resident's address and the pairing code. The workspace folder SHALL be pre-filled with a default folder the shell creates, and the owner MAY change it.
2. WHEN the owner submits THEN the shell SHALL call `aelios-runner pair` with the answers and start the runner.
3. The shell SHALL accept `https` addresses, and `http://127.0.0.1` only for local tests.
4. The shell SHALL NOT write the pairing code or any key to its own files, logs or UI after use.
5. IF pairing fails THEN the shell SHALL show the runner's message and keep the form filled except the code.
6. The form SHALL link to the resident's settings page, opened in the web view.

### 5. Four steps or fewer

**User story:** As a new owner, I want to reach my resident's first message quickly.

1. From "DSH is installed" to "the first message from the resident is shown", the owner SHALL need at most four steps. The list is in `design.md` ("From install to the first message").
2. WHEN pairing succeeds THEN the shell SHALL open the resident's page without another click.
3. The shell SHALL NOT ask for a login, an account or a second confirmation of anything the owner already typed.
4. A test SHALL count the steps in the setup script and fail if there are more than four.

### 6. Waiting list and direct talk come from the resident's page

**User story:** As the owner, I want to see who waits for me and talk to a running thread.

1. The shell SHALL show the resident's waiting list and thread view by showing the resident's page, and SHALL NOT build its own.
2. The shell MAY show a count of open `ask` items in the window title or panel badge, read from the resident's own list endpoint.
3. Words the owner types into a running thread SHALL go to the thread through the resident's existing route, not through the shell and not through the resident's main conversation.

### 7. Stop and unpair

**User story:** As the owner, I want to stop things from the window.

1. The panel SHALL have a stop button for the runner and an unpair button.
2. WHEN the owner unpairs THEN the shell SHALL run `aelios-runner unpair` and return to the form.
3. WHEN the owner stops the runner THEN a running turn SHALL be handed back as `needs_you`.

### 8. A Halloween look, nothing of DSH's branding

**User story:** As the owner, I want the window to feel like my resident's, in Halloween style for the contest.

1. The shell's own panel, form and icons SHALL carry the resident's name and a Halloween look, and SHALL NOT show the DSH name or logo.
2. The look SHALL be a stylesheet and a few icons of the project's own. It SHALL NOT use third-party art or fonts without a license that allows it.
3. Text and controls SHALL keep a readable contrast and a visible focus ring, and animation SHALL stop under the reduced-motion setting.
4. The look SHALL change no behavior. Removing the stylesheet SHALL leave a working shell.
5. The shell cannot rename DSH's application, window frame or installer (see design). The spec SHALL NOT promise that.

### 9. Licenses and a clean public repository

**User story:** As a maintainer, I want the licenses right and no private data in the repository.

1. WHEN a commit first adds DSH code, a DSH package, a DSH asset or a DSH binary to this repository or to a release file THEN the same commit SHALL put DSH's full MIT LICENSE text and copyright line in `THIRD_PARTY_NOTICES.md`.
2. WHILE the shell only runs inside a DSH the owner installed and ships none of DSH's files, `THIRD_PARTY_NOTICES.md` SHALL say so, as it does now.
3. A release file that contains DSH SHALL carry the same notice inside it.
4. Code, docs, tests and fixtures SHALL contain no person's name, personal detail, private address or secret, and SHALL be in English.
5. Each source file SHALL stay small and do one job.

### 10. Tests

**User story:** As a maintainer, I want the shell tested without an account.

1. Tests SHALL run with `npm test` using the fake cloud and fake helper of the runner, with no DSH, account or network.
2. The supervisor (start, stop, crash, revoke, lock held) and the pairing form logic SHALL each have a test.
3. A test with the real DSH SHALL be opt-in (`AELIOS_REAL_DSH=1`) and SHALL send no model request.
