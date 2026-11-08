# runner <-> cloud protocol `aelios-runner/1`

This is the protocol between the runner and the resident (a Worker). The cloud half lives in the Aelios-resident repository (`src/machine.ts`). The runner's own tests run against `test/fake-cloud.mjs`. On the cloud side: a resident has one machine; `cancelled` shows on the thread page as "not done"; when the machine is offline, a job is refused on the spot and not queued.
It does not reuse the older `/desktop/v1`. The idea is borrowed from the job-taking protocol of agent-autoloop: dial out only, idempotent claim, one token per job, replayable receipts, and ask / notice / resolve inside the receipt.

## Principles

1. The runner only dials out. It opens no port. The cloud cannot reach the runner, so "talk to a thread" also means the cloud puts a message down and the runner comes to fetch it.
2. A job is **a message sent to a thread**. A thread is one ACP session with one fixed workspace. There are four kinds of message: `job`, `say`, `mail`, `cancel`.
3. The cloud gives only text and a thread id. **Which helper, which folder, and which permission are decided only by this machine's runner config.** Extra fields in a message (`cwd`, `agent`, `command`, ...) are never read. `access` can only lower the permission, never raise it.
4. Claiming is idempotent: the same `claimKey` again returns the same job.
5. Each job has its own `token`, valid for that job only. A receipt carries `workId` + `token`.
6. A receipt carries a `receiptId` and can be replayed: the same content returns `duplicate`; different content returns 409.
7. The helper does not know who the user is: the cloud puts no user name or persona in `text` / `instruction`. The runner passes the text to the helper as is, and adds only one English `ASK:` convention (see below).

## Addresses

For the resident `default` the prefix is empty. Otherwise it is `/r/<id>`. Below it is written `{P}`.

| Address | Called by | Credential |
|---|---|---|
| `POST {P}/web/runner/code` -> `{code, expiresAt}` | The settings page, to make a one-time pairing code (10 minutes) | Header `x-web-key` |
| `POST {P}/runner/v1/pair` `{label, code}` -> `{runnerId, token, protocol}` | Called once when pairing, with the pairing code | None (the code itself) |
| `POST {P}/web/runner/register` `{label}` -> `{runnerId, token, protocol}` | Same, using the web key instead of a code | Header `x-web-key` |
| `POST {P}/web/runner/revoke` `{runnerId}` -> `{ok}` | Unpair | Header `x-web-key` |
| `POST {P}/runner/v1/heartbeat` | The runner, once per cycle | `Authorization: Bearer <token>` |
| `POST {P}/runner/v1/poll` | The runner | Same |
| `POST {P}/runner/v1/receipt` | The runner | Same |
| `POST {P}/runner/v1/file` `{workId, key}` -> `{name, type, data}` | The runner, to fetch a picture or file that came with a message (`data` is base64, at most 4 MB of bytes) | Same |

A request body is a JSON object, at most 16 KB. On error the response is `{error, code}` plus a status code.
- 403: not a revoke (a firewall or WAF in front can also answer 403). Treat it as a temporary error, retry with longer and longer gaps, and keep the receipts.
- 401 `UNAUTHORIZED`: **only this one** means the pairing was revoked. **Revoked means stop**: the runner cancels the running turn, queued work no longer runs, unsent receipts are dropped, and it exits.
- 413: the receipt is too big. The runner cuts the text in half and sends again without losing the result. If it did not get smaller, it gives up on that receipt (so it never resends forever). Before sending, the runner also cuts the whole receipt to under 15,000 bytes (the long parts are `summary` and `ask.question`; `resolve` holds at most 50 items).
- 409 `INVALID_TOKEN` / `UNKNOWN_WORK`, and other 400: this receipt will never be accepted. The runner drops it.
- 429, 5xx, cannot connect: the runner keeps the receipt and resends next cycle.

How many runners a resident may have is decided by the cloud. The runner knows only its own token.

## heartbeat

```jsonc
// request
{ "plugin": "kiro", "busy": "thread-id or null", "label": "the computer's name" }
// response
{ "ok": true, "protocol": "aelios-runner/1" }
```

`label` is optional: the computer's name (macOS: the Computer Name; elsewhere the host name), at most 60 characters. The cloud shows it as the machine's name and updates it when it changes, so a machine paired before names existed gets its name without pairing again. Pairing sends the same name as `label`. A heartbeat with any field other than these three is refused (400). The cloud uses it to decide "online", and to renew the lease (5 minutes) on work the runner holds without a receipt yet. When a lease runs out, the cloud marks that work "state to be confirmed" and **does not send it again**.

## poll: claim work

```jsonc
// request
{ "claimKey": "ck_…", "accept": ["job", "say", "mail", "cancel"] }
// response
{ "work": null }
{ "work": { /* Work, see below */ } }
```

- `claimKey` is a random string the runner makes and saves to disk before each claim. The same `claimKey` again gets the **same** work back from the cloud (so a lost response loses nothing). Only after the work is received and saved does the runner switch to a new `claimKey`.
- `accept` is the kinds of message the runner will take this time. When idle it takes all. While a turn runs, or the local queue still holds work, it takes only `say`, `mail`, `cancel` (so two new jobs never run at once). The cloud may return only work whose kind is in `accept`. Messages in one thread come in the order they were put down.

### Work

```jsonc
{
  "workId": "w_…",          // 1 to 64 characters: letters, digits, _ . : -
  "token": "wt_…",          // the credential for this work only
  "thread": "t_…",          // thread id: one thread is one ACP session
  "kind": "job",            // job | say | mail | cancel
  "title": "…",             // optional, for logs only, not given to the helper
  "text": "…",              // body of job / say / mail, at most 16000 characters
  "access": "read",         // optional: read | edit | full. Can only be lower than the machine config
  "interrupt": true,        // say only: default true
  "attachments": [          // optional, at most 4: pictures and files the user sent with this message
    { "key": "…32 hex…", "name": "notes.pdf", "type": "application/pdf" }
  ]
}
```

| kind | From | What the runner does |
|---|---|---|
| `job` | The resident gives work | Queued. When its turn comes, it is sent to the thread's ACP session (a new one if none). |
| `say` | The user talks to the thread directly (**stop and restart**) | If `interrupt` is true (default) and the thread is running: first `session/cancel`, the interrupted work gets `cancelled`, then the words go at once into the **same** session. If the thread is idle, they are sent directly. `interrupt:false` acts like `mail`. The reply does not pass through the resident: this work's receipt is the thread's own words. |
| `mail` | The resident drops a letter in the thread's mailbox (**queued**) | No interrupt. If the thread is running it waits behind, with a `queued` receipt first. After the current turn ends it is sent to the same session in order. |
| `cancel` | Stop, do not carry on | Cancels the thread's running turn and drops work waiting in its local queue (each gets a `cancelled` receipt). The `cancel` itself gets `done`. |

## receipt

```jsonc
{
  "receiptId": "w_…:final",   // the same content always has the same id; the runner uses "<workId>:<type>"
  "workId": "w_…",
  "token": "wt_…",
  "type": "started",          // started | queued | final
  "sessionId": "…",           // optional, the ACP session id (opaque, at most 160 characters; replaced by a short digest if it fails the check)
  // only final carries the rest:
  "status": "done",           // done | failed | needs_you | cancelled
  "reason": "needs_login",    // failed only, optional: why. One of permission_denied, needs_login, missing_key, helper_missing, workspace_denied, error
  "summary": "…",             // at most 4000 characters; the runner replaces workspace paths and tokens that appear as is, and nothing else
  "ask":    { "key": "…", "question": "…", "options": ["…"], "recommend": "…" },
  "notice": { "text": "…", "fyi": true },
  "resolve": ["key", "…"]
}
```

- `started`: the helper session is made or resumed, and work begins. `queued`: this `mail` is waiting behind. `final`: this work is finished. A work has only one `final`.
- `reason` (only on a `failed` final; any other status with a `reason`, or a code not in the list, is refused with 400): what the runner knows about the failure. `needs_login` / `missing_key`: the helper said it needs a login or a key (ACP `auth_required`, or those words in its error). `permission_denied`: the helper was refused a permission. `helper_missing`: the helper program could not be started. `workspace_denied`: the workspace folder could not be made or used. `error`: anything else (a `BLOCKED:` line, an unreadable message, an unclassified helper error). The resident lists a failed thread in its waiting list only for `needs_login`, `missing_key` and `permission_denied`; without a `reason` (an older runner) it falls back to matching words in the summary.
- `status`: `done` finished; `failed` not done (the helper errored); `needs_you` the user must decide, **always with `ask`**; `cancelled` interrupted by `say` or stopped by `cancel`.
- **`ask`** is one item in the "waiting for you" list. `key` is a stable id for the same matter: while a `key` is open it is not asked again. The cloud lists it under "waiting for you" and does not post it into the chat. `options` and `recommend` are optional.
- **`notice`** only informs. `fyi:true` means no reply is needed.
- **`resolve`** is a list of `key`s: these questions have settled by themselves (the user answered, or a later turn finished), and the cloud closes the matching cards. When a thread finishes (`done`), the runner puts all of that thread's still-open `ask` keys into `resolve`.
- Sending the same `receiptId` again: same content returns `{ok:true, duplicate:true}`; different content returns 409 `RECEIPT_CONFLICT`.
- For work that already has a `final`, another `final` with different content returns 409 `TERMINAL_CONFLICT`. A `final` that arrives late after the lease ran out, with a matching `token`, is still accepted (reconciliation).

A receipt is written to a local outbox before it is sent, so a lost connection or a restart loses nothing, and a resend never makes the helper do the work again. The runner saves both "work it has claimed" and "receipts it has delivered" to disk. After a restart, work that is still running with no `final` gets `needs_you` ("state to be confirmed, not redone on its own") and does not run again.

## The runner's local rules (not in the protocol, but the cloud should know)

- Each thread has one fixed workspace, set on first use and never changed.
- Permission requests (`session/request_permission`) are answered by tier: `read` allows only read / search / think; `edit` adds edits inside the workspace, **and also allows `fetch` (network)**; `full` allows all. Only "allow once" is chosen, never a standing permission. A refused request makes the turn end as `needs_you`, and the `ask` says what was refused.
- Except in `full`, a request that carries paths (`locations`) with any path outside the workspace is refused. A symlink that points outside counts as outside.
- **The limit of this check: it blocks only requests the helper asks for, and only by the kind and paths the helper reports.** If the helper reads without asking (for example reading `~/.ssh` in `read` tier), or the request lists no path, the runner cannot see or stop it. An injected job could use this to read local files and carry them to the cloud. For real isolation, use a dedicated system account or a VPS with no sensitive files, and tighten the helper's own read and write limits.
- The helper has four ways to speak, each marker alone at the start of a line. Nothing: it carries on (the step can be undone and is inside the job). **`NOTE: ...`** anywhere in the turn: the user should know, no stop. The notes are taken out of the result and sent as the `notice` of the final receipt (`fyi: true`, at most 1000 characters). They arrive with the final receipt, not live. **`BLOCKED: ...`** as the last line: an outside wall. The receipt is `failed` with a summary that starts `Blocked: <reason>` and no `ask`. **`ASK: ...`** as the last line: only the user can decide. The receipt is `needs_you` with an `ask`. The runner adds an English convention after every message sent to the helper that explains these and a short ladder for getting unstuck (a different way, then a way around, then BLOCKED or ASK; do what can be undone and never ask whether to carry on). It holds no person's name or persona. Only `ASK:` and refused permission requests end as `needs_you`. A reply with no marker, even one that ends with a question mark, is treated as normally done.
- The helper's output and the text in the repository are only data. They cannot decide who gets the work, which folder, or which permission. Note that they can write an `ASK:` line, so a "waiting for you" card only shows that someone wants to ask, not that the question is right.

## Pictures and files in a message

A `job`, `say` or `mail` may carry `attachments`. The runner fetches each one with `POST {P}/runner/v1/file` and saves it in the thread's workspace under `.aelios-inbox/<workId>/<n>-<clean name>` (the name is cleaned by the runner, the write never leaves the workspace, at most 4 MB each). It gives them to the helper as ACP content blocks: pictures as `image` blocks when the helper says it takes images, everything else (and pictures otherwise) as `resource_link` blocks, and the saved paths are listed in the prompt text. A file that cannot be fetched is named in the prompt, and the turn still runs. A work whose `attachments` list is malformed is refused with a `failed` final. The cloud only sends attachments to threads on the machine; threads that run on the resident or on GitHub Actions do not take them.
