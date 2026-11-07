# Desktop app (first slice)

The resident's desktop is a plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH), pinned to 0.2.2-rc.1. The plan is in `.kiro/specs/desktop-shell/`.

This slice has: the plugin skeleton, the connect form (address and web key, kept in DSH's credential store), the runner started in the background, the left column (residents) and the middle column (the conversation). The right column (threads, waiting for you) is the next slice.

It draws its own interface from the resident's `/web/` routes. It does not embed the resident's page. Styles and the Markdown reader are copied from Aelios-resident (AGPL-3.0, same author); each copied file says so in its header.

## Setup (from "DSH is installed" to the first message)

1. Add the plugin on DSH's Plugins page.
2. Type the resident's address and web key in the connect form and press Connect.
3. The runner is paired and started, and the columns appear.
4. The resident's first message shows in the middle.

## Not checked yet

- The plugin has not been loaded in a real DSH. The slot names (`main`, `sidebar.panellist`, `sidebar.workspaces`) and the `dsh.client` manifest follow an earlier plugin and DS Bot. Whether the left column can be replaced completely is open (spec, Open question 1).
- The runner is found beside this package (`../runner`) or by `AELIOS_RUNNER_ENTRY`. Node comes from `PATH` or `AELIOS_NODE`.

## Develop

```sh
npm install        # esbuild, the build tool only
npm run build      # client/ -> client.js (committed; the test checks it is fresh)
npm test
```
