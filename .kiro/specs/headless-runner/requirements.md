# Requirements: headless runner

## Introduction

The headless runner lets a cloud resident do work on one machine. It runs without a window, on a laptop or a VPS. It dials out to the resident, takes jobs, runs them through an ACP helper, and sends receipts back. This document describes what is built. It was written after the first version of the code, to describe it and to list what is still open.

Terms: a **thread** is one ACP session with one fixed workspace. A **job**, **say**, **mail** and **cancel** are the four kinds of message sent to a thread. A **receipt** is the runner's reply for one message.

## Requirements

### 1. Pairing

**User story:** As a resident's owner, I want to pair a machine with my resident once, so that it can take work from then on.

1. WHEN the owner runs `aelios-runner pair` with a valid one-time code THEN the runner SHALL store a runner token and the chosen settings.
2. WHEN the owner gives the web key instead of a code THEN the runner SHALL use it once and SHALL NOT write it to disk.
3. IF the chosen helper cannot be started on this machine THEN the runner SHALL refuse to pair.
4. The runner SHALL keep its config and state readable only by the owner (mode 0600).

### 2. Taking work

**User story:** As a resident, I want the machine to fetch my jobs, so that I never need to reach into it.

1. The runner SHALL open no listening port and SHALL only send requests to the cloud.
2. WHEN the runner claims work THEN it SHALL send a saved `claimKey` so that a repeated claim returns the same work.
3. WHILE a turn is running or its local queue is not empty THE runner SHALL accept only `say`, `mail` and `cancel`.
4. The runner SHALL send a heartbeat each cycle.
5. WHEN the cloud answers 401 `UNAUTHORIZED` THEN the runner SHALL cancel the running turn, drop queued work and unsent receipts, and exit.

### 3. Running a thread

**User story:** As a resident, I want each thread to keep its own helper session and folder, so that work continues where it stopped.

1. WHEN a `job` arrives for a new thread THEN the runner SHALL open a new ACP session in the configured workspace.
2. WHEN a later message arrives for a known thread THEN the runner SHALL use the same session, resumed if it is no longer open.
3. The workspace of a thread SHALL be fixed at its first use.
4. The helper, workspace and permission tier SHALL come only from local config. Extra fields in a cloud message SHALL be ignored, and `access` SHALL only lower the tier.
5. WHEN a turn takes longer than the configured limit THEN the runner SHALL stop it and hand it back as `needs_you`.

### 4. Talking to a running thread

**User story:** As the owner, I want my words to reach a running thread directly, so that I can steer it without the resident repeating them.

1. WHEN a `say` arrives and the thread is running THEN the runner SHALL cancel the running turn, send the interrupted work a `cancelled` receipt, and send the words to the same session.
2. WHEN a `say` arrives and the thread is idle THEN the runner SHALL send the words to the session at once.
3. WHEN a `say` has `interrupt: false` THEN the runner SHALL treat it as `mail`.
4. WHEN a `mail` arrives while the thread is running THEN the runner SHALL send a `queued` receipt and deliver it after the current turn.
5. WHEN a `cancel` arrives THEN the runner SHALL cancel the running turn, drop the thread's queued work with `cancelled` receipts, and send the `cancel` a `done` receipt.

### 5. Receipts

**User story:** As a resident, I want every message to end with exactly one clear result, so that I can show it to the owner.

1. The runner SHALL send `started`, `queued` and one `final` receipt per work, each with a stable `receiptId`.
2. The runner SHALL write receipts to a local outbox before sending, and SHALL resend until accepted or refused for good.
3. WHEN the cloud answers 413 THEN the runner SHALL shorten the text and send again, and SHALL give up if it does not get smaller.
4. The runner SHALL cut every receipt to under 15,000 bytes before sending.
5. The runner SHALL replace the workspace path and tokens inside `summary`.
6. WHEN the runner restarts and a work has no `final` THEN it SHALL send `needs_you` and SHALL NOT run the work again.

### 6. Asking the owner

**User story:** As the owner, I want questions to appear in a "waiting for you" list, so that chat stays quiet.

1. WHEN the helper's reply ends with a line that starts with `ASK:` THEN the runner SHALL send `needs_you` with an `ask` holding that question.
2. WHEN a reply merely ends with a question mark THEN the runner SHALL treat the work as `done`.
3. WHEN a permission request is refused THEN the runner SHALL send `needs_you` and say what was refused.
4. WHEN a thread finishes with `done` THEN the runner SHALL send the keys of that thread's open asks in `resolve`.
5. The runner SHALL add a short English convention to each message to the helper. It explains `NOTE:`, `BLOCKED:` and `ASK:`, a ladder for getting unstuck, and the language rule, and it names no person. The markers are specified in the waiting-list spec (requirement 9).

### 7. Permissions

**User story:** As the owner, I want to limit what a helper may do, so that a bad job does little harm.

1. THE runner SHALL NOT classify permission requests itself. What a helper may do without asking SHALL be the helper's own configuration, which the runner generates from the tier.
2. WHILE the tier is `edit` THE runner SHALL start Kiro with a generated agent config that approves reads, search and glob, and the shell commands without an ask word. (The earlier `read` tier was removed: a config or job that says `read` runs as `edit`.) The config SHALL be written outside the workspace before every turn, and SHALL NOT approve writes or the network.
3. WHILE the tier is `full` THE runner SHALL allow every request, and for Kiro SHALL start it with `--trust-all-tools`.
4. IF a request still reaches the runner below the `full` tier THEN the runner SHALL hold it for the owner as it is, and tell the helper no until the owner answers.
5. The runner SHALL choose only "allow once" and SHALL NOT grant standing permission.
6. Documented limit: the runner cannot block what a helper does without asking, and it trusts Kiro's own read-only classifier.

### 8. One runner per folder

1. WHEN a second `start` is run in the same folder THEN it SHALL refuse to start.
2. WHEN a lock's owner is dead THEN a new `start` SHALL take over the lock.
3. WHEN `unpair` runs THEN the runner SHALL stop a running `start` first, then revoke the pairing.

### 9. Helpers

1. The runner SHALL support Kiro (`kiro-cli acp`) and DeepSeek Harness (`dsh --profile acp`).
2. The runner SHALL support any other ACP command through the `command` plugin, marked experimental.
3. The runner SHALL work with `kiro-cli` and `dsh` absent from `PATH`, apart from pairing with them.

## Not yet met

- A real Kiro or DSH has not run a whole job through the runner. Real Kiro was checked only up to `initialize`. Real DSH was not connected.
- The web page has no stop button for a running thread.
- The runner sends no `progress` events while a turn runs.
- The package is not published to npm.
