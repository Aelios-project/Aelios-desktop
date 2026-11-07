# Desktop app (first slice)

The resident's desktop is a plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH), pinned to 0.2.2-rc.1. The plan is in `.kiro/specs/desktop-shell/`.

This slice has: the plugin skeleton, the connect form (address and web key, kept in DSH's credential store), the runner started in the background, the left column (residents, then the threads at work and the recent ones, covering DSH's whole sidebar with a button that hands it back), the middle column (the conversation, with the resident's thinking and tool calls, its pictures and the files it hands over, and a composer that sends pictures), and the right column (Threads and Waiting, with places kept for a board and tools).

It draws its own interface from the resident's `/web/` routes. It does not embed the resident's page. Styles and the Markdown reader are copied from Aelios-resident (AGPL-3.0, same author); each copied file says so in its header, naming the resident commit the copy came from. `npm test` fails when those headers disagree, so the two repositories cannot drift apart unnoticed.

The copy is from Aelios-resident main at `b118dfb` (2026-11-07). Against the earlier `fb4593a` only `public/index.html` and `public/waiting.js` changed, and both of those are the resident's own page: the waiting list moved from `waiting` to `waitList` because the name collided with the typing-dots function (#71). `public/app.css` and `public/markdown.js`, which this package copies from, are byte-identical between the two commits.

## Setup (from "DSH is installed" to the first message)

1. Add the plugin on DSH's Plugins page.
2. Type the resident's address and web key in the connect form and press Connect.
3. The runner is paired and started, and the columns appear.
4. The resident's first message shows in the middle.

## Preview without DSH

`preview/index.html` draws the three columns with fake data, using the very style modules the browser half ships (`client/style-*.mjs`, `client/theme.mjs`), so what the page shows is what DSH draws. `preview/panels.html` does the same for the right column alone: the thread list, one thread opened, and the two panels kept for later slices. Neither page reads the resident, and nothing outside `preview/` is written.

```sh
cd packages/desktop
python3 -m http.server 8917        # then open http://127.0.0.1:8917/preview/index.html
```

`?theme=light` or `?theme=dark` forces a palette; without it the page follows the same rule as the plugin: DSH's own `color-scheme` first, the system setting second (client/palette.mjs).

`preview/shots/` holds the images the interface was checked against: `before-*` is the previous slice, `after-*` this one, `panels-*` the right column, and `reference-*` the resident's own page rendered from its public `app.css` and markup with the same fake conversation. Every image is fake data; none comes from a real resident.

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
