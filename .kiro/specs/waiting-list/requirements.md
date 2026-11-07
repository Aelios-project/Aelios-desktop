# Requirements: waiting list

## Introduction

A resident can run many threads at once, on a paired machine or in the cloud. Each thread may ask the owner a question, finish, or get stuck. Today these show up as cards inside threads and as notes in the conversation, so the owner has to open each thread to find out who is waiting.

The waiting list is one place, on the resident's web page, that shows every thread that needs the owner's attention or has news, in one fixed format. The helper decides which of its words go there: it works on alone when it can, tells the owner something when it should, reports a wall it cannot pass, and asks only when the owner must decide. It never writes into the conversation. The desktop app will later show the same list from the same data.

The work is done in the Aelios-resident repository (the cloud resident, which existed before the Kiroween submission period). This spec is kept here because it drives the Kiroween work. Nothing in it is implemented yet.

Terms. A **thread** is one run of work with its own page. An **ask** is a question a thread puts to the owner and keeps open until it is answered or resolved. An **item** is one row of the list. The **owner** is the person the resident works for.

Out of scope. The "activity" column (a feed the owner can edit the prompt of, written by the resident once a day in its own voice) is a separate feature with its own spec. It does not read or write the waiting list.

## Requirements

### 1. One list, three kinds of item

**User story:** As the owner, I want one list of what needs me, so that I do not open every thread to find out.

1. The resident SHALL provide a waiting list that holds items of four kinds: `ask`, `note`, `done` and `stuck`.
2. The list SHALL include threads on a paired machine and cloud tasks.
3. WHEN a thread puts an ask to the owner THEN the list SHALL show an `ask` item for it.
4. WHEN a thread finishes its work THEN the list SHALL show a `done` item for it.
5. WHEN a thread fails, or its result cannot be confirmed (for example the machine went silent), THEN the list SHALL show a `stuck` item for it.
6. WHEN a thread reports a note for the owner that needs no answer THEN the list SHALL show a `note` item (progress) for it.
7. WHEN a thread was stopped on purpose (by the owner's words or by a stop) THEN the list SHALL NOT show an item for it.
8. The list SHALL put `ask` items first, then the others, each group newest first.

### 2. A fixed format

**User story:** As the owner, I want every item to look the same, so that I can read the list fast.

1. Every item SHALL carry: an id, the kind, the thread id and title, one sentence of at most 120 characters, the answer options (may be empty), a recommended option (may be empty), the time it appeared, and whether it has expired.
2. The sentence of an `ask` item SHALL be the question. The sentence of a `note` item SHALL be the note's first sentence. The sentence of a `done` or `stuck` item SHALL be the first sentence of the thread's last result.
3. An item SHALL have a button for each option of its ask, and a way to open its thread.
4. WHEN the owner presses an option THEN the resident SHALL send it to the thread as the owner's answer, in the same way as typing it in the thread.
5. The format SHALL be defined once, in code, and used by the web page and any later client.

### 3. No duplicates, and items that go away

**User story:** As the owner, I want a question to appear once and disappear when it is settled.

1. An item SHALL be identified by its thread, its kind and its key (an ask's key, or a task id for `note`, `done` and `stuck`).
2. WHEN the same ask is put again THEN the list SHALL keep one item and update its text and time.
3. WHEN an ask is resolved (the owner answered, or a later receipt resolved it) THEN the list SHALL remove its item.
4. WHEN the owner opens the thread of a `note`, `done` or `stuck` item, or marks it read THEN the list SHALL remove that item.
5. WHEN a newer result arrives in a thread THEN the older `note`, `done` or `stuck` item of that thread SHALL be replaced by the new one.
6. WHILE an ask has been open for more than 7 days THE list SHALL mark it `expired`, show it as "Expired", and offer no option buttons.
7. WHEN an item has been expired or unread for more than 14 days THEN the list SHALL drop it.

### 4. Not in the chat

**User story:** As the owner, I want the conversation to stay a conversation.

1. The resident SHALL NOT add a message, note or card to the conversation when an item appears, changes or goes away.
2. The resident SHALL NOT start a turn of its own because of an item.
3. The list SHALL be read from its own endpoint and shown in its own place on the page.

### 5. Telling the owner

**User story:** As the owner, I want to hear about a question when I am away from the page.

1. WHEN a new `ask` item appears THEN the resident SHALL send a push notification, if push is set up, at most once per item id.
2. The push SHALL say the thread title and the question, and open the list.
3. A `note`, `done` or `stuck` item SHALL NOT send a push.
4. The page SHALL show the number of open asks on the entry to the list.

### 6. Stop a thread from the web page

**User story:** As the owner, I want to stop a running thread from the page, and have it shown as stopped, not as failed or finished.

1. WHILE a thread runs on a paired machine THE thread page SHALL show a stop button.
2. WHEN the owner presses it THEN the resident SHALL queue a `cancel` for that thread.
3. WHEN the machine reports the stopped turn as `cancelled` THEN the task SHALL get the status `stopped`, shown as "Stopped".
4. WHEN a turn is interrupted by the owner's words in the thread THEN the interrupted task SHALL also get `stopped`.
5. The receipt of the `cancel` itself SHALL NOT change the status of the task that was stopped, and SHALL NOT mark it done.
6. A `stopped` task SHALL NOT be counted as failed in the thread page, the thread cards or the waiting list.
7. IF the thread is not running when the cancel arrives THEN the resident SHALL leave the status of the thread's last task as it was.

### 7. Two small fixes

1. WHEN old finished machine work is removed after 7 days THEN the receipts of that work SHALL be removed in the same step, so `res_machine_receipts` does not grow without end.
2. WHILE the pairing code is shown on the settings page THE page SHALL check the machine every 3 seconds, and WHEN the machine is online THEN it SHALL show it online and hide the code, without a reload. It SHALL stop checking when the code expires.

### 8. Code shape

1. The list logic SHALL live in new modules. `src/resident.ts` and `public/app.js` SHALL only wire them in.
2. Each new file SHALL stay under 300 lines.
3. No person's name or personal detail SHALL appear in code, docs or tests.
4. Text from threads and helpers SHALL be shown as plain text and never as markup or as instructions.

### 9. The helper says what stage it is in

**User story:** As the owner, I want the helper to keep going when it can, and to speak up only in the right way.

The helper has four ways to speak. Each marker is on its own line, at the start of the line, in capitals.

| The helper says | When | In the list |
|---|---|---|
| Nothing, and carries on | The step can be undone and is inside the job | No item |
| `NOTE:` | The owner should know, but it need not stop | `note` (progress), no push |
| `BLOCKED:` | An outside wall: missing permission, no network, a missing dependency | `stuck` |
| `ASK:` | Only the owner can decide: cannot be undone, costs money, a preference, a permission to give | `ask`, with push |

1. WHEN a line starting with `NOTE:` appears anywhere in the helper's output of a turn THEN the runner SHALL take the line out of the result text and send the notes in the `notice` of the final receipt, with `fyi` true, cut to 1000 characters.
2. WHEN the last line of the reply, after the `NOTE:` lines are taken out, starts with `BLOCKED:` THEN the runner SHALL end the turn with the status `failed`, and the summary SHALL start with "Blocked:" and the reason, and SHALL carry no ask.
3. WHEN that last line starts with `ASK:` THEN the runner SHALL behave as before: `needs_you` with the question as an ask.
4. WHEN a reply has no marker, even if it ends with a question mark, THEN the runner SHALL treat the work as `done`.
5. The runner SHALL add to every message it sends to the helper a short English convention that explains the four ways to speak and this ladder, in order: (a) when stuck, try one really different way; (b) then look for a way around, or do the part that is not stuck; (c) say `BLOCKED:` only for an outside wall, and `ASK:` only for what only the owner can decide; (d) do what can be undone yourself, and never ask whether to carry on. The ladder is for technical stuckness only. A denied permission or a limit the user set is never worked around: the helper stops and says `BLOCKED:`, or asks for the permission with `ASK:`.
6. The convention SHALL live in the runner and not in any persona, because every helper needs it.
7. The convention SHALL name no person and SHALL end with the instruction to reply in the language of the job.

## Not covered here

- The activity column.
- Showing the list in the desktop app (it will read the same endpoint).
- Push for `note`, `done` and `stuck`.
- Live progress while a turn runs. Notes arrive with the final receipt.
