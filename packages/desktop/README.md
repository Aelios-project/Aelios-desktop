# Desktop app

The resident's desktop is a plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH), pinned to 0.2.2-rc.1. The plan is in `.kiro/specs/desktop-shell/`.

Three columns, each with one job. The left column says who and where: the residents and the group chats (a dot when one has news, a + to add one) and **This machine**, the one place the runner's state shows; its foot holds the settings and the way back to DSH. The middle column is the conversation (bubbles, the resident's thinking and tools as a small chip of icons and numbers, pictures, files, voice notes, stickers, a composer with `/` commands, and on hover each reply can be read aloud, kept in memory, copied, taken back or answered again), a group chat, or this machine's own view. The right column is the work: **Waiting** (what needs you, each card a title, one status word and a time, the rest on a click), **Threads** (the old Board folded in: one list, a helper icon on each card, and one thread opened in place with its timeline of messages, tool calls, plan and permission requests; the column widens by a button or by dragging its edge) and **Alarms** (a dot for a one-time alarm, a loop for a repeating one, edited in place). Counts are badges on the tabs. Settings, usage and tools live in a settings sheet with a section for each part of the resident: everything its web page offers, so the web page is never needed.

The UI is English; 中文 is one switch away in Settings → App, and every word is in `client/strings.mjs`.

**Not wired yet.** The local views (This machine, and a thread's local session in the thread view) call host actions that do not exist yet: `machine`, `sessions`, `session`, `permit`, `open` and `present`. Their shapes are at the top of `client/local-api.mjs`; until the host answers them, those views say so and show what the connection status already knows. Several web routes the new screens use also still need to be allowed in `host/proxy.mjs` (take-back, speak, command, task/settle, residents/remove, group/config, group/stop, group/remove, group/icon/remove, stickers/*, sites, sites/remove, telegram/connect, tasks/test, tasks/roles, tasks/roles/remove, tasks/github, runner, alarms/edit, alarms/remove, and thread/file for bytes); until then those buttons show the proxy's refusal. Both are left to the host and runner work.

It draws its own interface from the resident's `/web/` routes. It does not embed the resident's page. Styles and the Markdown reader are copied from Aelios-resident (AGPL-3.0, same author); each copied file says so in its header, naming the resident commit the copy came from. `npm test` fails when those headers disagree, so the two repositories cannot drift apart unnoticed.

The copy is from Aelios-resident main at `b118dfb` (2026-11-07). Against the earlier `fb4593a` only `public/index.html` and `public/waiting.js` changed, and both of those are the resident's own page: the waiting list moved from `waiting` to `waitList` because the name collided with the typing-dots function (#71). `public/app.css` and `public/markdown.js`, which this package copies from, are byte-identical between the two commits.

## Setup (from "DSH is installed" to the first message)

1. Add the plugin on DSH's Plugins page.
2. Type the resident's address and web key in the connect form and press Connect.
3. The runner is paired and started, and the columns appear.
4. The resident's first message shows in the middle.

## Preview without DSH

`preview/index.html` draws the plugin's real browser half (`client/index.mjs` `Main` and `Side`, with every style it injects) against a fake host route (`preview/fake-host.mjs`) and made-up data (`preview/fake-data.mjs`), so what the page shows is what DSH draws. React comes from a CDN in the preview; DSH hands it over in the plugin. Nothing reads a resident and nothing outside `preview/` is written.

```sh
cd packages/desktop
python3 -m http.server 8917        # then open http://127.0.0.1:8917/preview/index.html
```

The query picks the scene: `?panel=waiting|threads|alarms`, `?thread=t3` (one thread opened), `?wide=1`, `?view=machine`, `?sheet=resident|usage|web|…`, `?group=g1`. `?theme=light` or `?theme=dark` forces a palette; without it the page follows the same rule as the plugin: DSH's own `color-scheme` first, the system setting second (client/palette.mjs). `?desktop=1` draws the macOS window's traffic lights and the strip the shell leaves for them.

`preview/shots/` holds the images the interface was checked against, light and dark: `after-*` the conversation with Waiting, `thread-*` a thread opened with its tool calls and a permission request, `threads-*` the list, `alarms-*`, `machine-*`, `settings-*` the sheet; `before-*` is the previous slice and `reference-*` the resident's own page. Every image is fake data; none comes from a real resident.

## What was checked in a real DSH

- Loaded in DSH 0.2.2-rc.1 on macOS: the plugin is listed, the host half starts the runner when a connection exists, and the browser half registers `main` (key `aelios-desktop`) and `sidebar.panellist` (id `aelios-desktop`, order 5).
- Shadowing `sidebar.workspaces` with `priority: -100` mounts our cell in place of DSH's list.
- The look in this slice was drawn and measured in the preview against the resident's own page; it has not yet been seen inside a running DSH. A panel narrower than 980 px overlays the right column instead of squeezing both beside each other.
- The runner is found beside this package (`../runner`) or by `AELIOS_RUNNER_ENTRY`. Node comes from `PATH` or `AELIOS_NODE`.

## Develop

```sh
npm install        # esbuild, the build tool only
npm run build      # client/ -> client.js (committed; the test checks it is fresh)
npm test
```
