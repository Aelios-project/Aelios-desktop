# Design: waiting list

## Overview

The list is a read model. It is computed when asked for, from data the resident already keeps. Only two small things are stored: which `done` / `stuck` items the owner has read, and which asks were already pushed.

```
res_machine_asks ─┐
res_tasks (cards) ─┼─> src/waiting.ts: build(items) ──> GET /web/waiting ──> public/waiting.js ──> page
res_waiting_seen ─┘                                           ^
                                                  POST /web/waiting/seen
```

The Aelios-resident code that this touches (read from main on 2026-11-07): `src/machine.ts` (`res_machine_asks`, receipts, `expire`), `src/cloud-tasks.ts` (`TaskStatus`, `card`, `waiting`), `src/index.ts` (the `/web/...` routes), `src/resident.ts` (push), `public/app.js`, `public/machine.js`.

## Data

An item, defined once in `src/waiting.ts`:

```ts
type WaitingItem = {
  id: string;            // `${thread}:${kind}:${key}`
  kind: "ask" | "done" | "stuck";
  thread: string;
  title: string;
  line: string;          // one sentence, at most 120 characters
  options: string[];     // ask only
  recommend: string;     // ask only, may be empty
  at: number;
  expired: boolean;      // ask only
};
```

Sources:

| Kind | Source | Key |
|---|---|---|
| `ask` on a machine thread | `res_machine_asks` rows (thread, key, question, options, recommend, at) | the ask's key |
| `ask` on a cloud task | the task card where `waiting` is true, with its `choices` | the task id |
| `done` | the newest task of a thread with status `done` | the task id |
| `stuck` | the newest task of a thread with status `failed`, or one closed by an expired lease | the task id |

`stopped` tasks give no item. A thread whose newest task is `needs_you` gives an `ask`, never a `done` or `stuck`.

New table:

```sql
CREATE TABLE IF NOT EXISTS res_waiting_seen (id TEXT PRIMARY KEY, at INTEGER NOT NULL)
```

It holds the ids of `done` and `stuck` items the owner has read, and the ids of asks already pushed (with the prefix `push:`). Rows older than 14 days are deleted when the list is read.

## Build

`build(asks, cards, seen, now)` in `src/waiting.ts` is a pure function. It maps the sources to items, applies the id rule (one item per id, newest wins), drops read items, marks asks older than 7 days `expired` with empty options, drops anything older than 14 days, and sorts asks first, then newest first. Because it is pure, it is tested without a Worker.

The sentence is cut at the first sentence end or 120 characters, whichever comes first. It is plain text.

## Endpoints

Both are under `/web/` and need the web key like the other web routes. They are added to `src/index.ts` as two lines that call a handler in a new file `src/waiting-routes.ts`.

| Route | Does |
|---|---|
| `GET /web/waiting` | Returns `{ items, open }`, where `open` is the number of unexpired asks. |
| `POST /web/waiting/seen` `{ id }` | Marks one `done` or `stuck` item read. `{ all: true }` marks all of them. |

An option button calls the existing answer route of the thread (`/web/thread/say` for a machine thread, the existing choice route for a cloud task). No new answer path is added.

## Push

When an ask is stored (`machine.ts`, the receipt path) or a cloud task enters `needs_you`, the resident calls `pushAsk(item)` from a new file `src/waiting-push.ts`. It checks `res_waiting_seen` for `push:<id>`, sends through the existing `sendPush`, and records the id. It follows the existing push setting: no push set up, no push. The push body is the title and the question, and its link opens the list.

## Stopped, and the cancel bug

Today `machine.ts` turns a `cancelled` receipt into the task status `failed`. A `cancel` work is also tied to a task, so its own `done` receipt would mark that task done.

Changes:

1. Add `"stopped"` to `TaskStatus` in `src/cloud-tasks.ts`. It is not in `REPORTED`, so it starts no turn and no note.
2. In `machine.ts`, a `cancelled` receipt of a `job`, `say` or `mail` sets `stopped`.
3. A receipt for a work of kind `cancel` is stored and acknowledged, and changes no task. The stopped task takes its status from its own `cancelled` receipt only.
4. `POST /web/thread/stop` `{ id }` queues a `cancel` work if the thread has a task in `working`, and does nothing otherwise.
5. The thread page shows "Stopped" for `stopped`. `machineRecord` gets a "stopped" wording, so the model's record is correct.

`stopped` appears in `TaskStatus` switches in the page and in find-tools. Each switch is listed in tasks.md and gets a case.

## The two small fixes

- In `Machine.enqueue`, the same statement that deletes work older than `KEPT_MS` also runs `DELETE FROM res_machine_receipts WHERE work_id NOT IN (SELECT work_id FROM res_machine_work)`.
- `public/machine.js` gets `watchPairing()`. After a code is made it checks `/web/runner` every 3 seconds, stops when the machine is online or the code has expired, and calls `loadMachine()` to refresh. It clears its timer when the settings page closes.

## Page

A new file `public/waiting.js` holds the state and actions (an Alpine mixin like `machine.js`): load, mark read, answer, stop. `public/app.js` adds one line to merge it and one call to load the list when the page opens and when a thread changes. `public/index.html` gets one section: a row on the main menu with the open-ask count, and the list view. Rows show the title, the sentence, option buttons for asks, the time, and an "Open thread" link. Expired rows are dimmed and say "Expired".

## Boundaries

- The list never writes to the conversation tables and never starts a model turn.
- The activity column is a separate feature. It may link to the list but shares no table or endpoint with it.
- Text from threads is escaped by the page's existing text binding, never inserted as HTML.

## Testing

- `test/waiting.mjs`: the pure `build` (kinds, order, dedupe, resolve, expiry at 7 and 14 days, stopped gives nothing, sentence cut).
- `test/machine.mjs`: a `cancelled` receipt gives `stopped`; a `cancel` work's receipt changes no task; receipts are removed with old work.
- `test/machine-e2e.mjs`: an ask shows in `/web/waiting`, an option answer resolves it, the stop button stops a slow thread and shows "Stopped", and the conversation has no new line from any of it.
- A page check for the pairing refresh, using the e2e Worker.
