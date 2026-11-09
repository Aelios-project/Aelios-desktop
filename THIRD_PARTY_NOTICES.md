# Third-party notices

This repository is licensed under the GNU Affero General Public License v3.0 only (AGPL-3.0-only). See [LICENSE](LICENSE).

Nothing from a third party is copied into this repository yet. The runner has no dependencies.

Both licenses below can be combined into an AGPL-3.0 work. Their notices must stay with the code. This file is where they go.

## What to add when third-party code comes in

Add the entry in the same commit that adds the code. Each entry names the project, its license, its copyright line, and the files that use it. Each copied file keeps its original copyright line and says in its header where it came from and that it was changed.

### DeepSeek Harness (DSH), MIT

The desktop app (see `packages/desktop`) is a plugin that runs inside the owner's own DSH. While no DSH file is copied here, no notice is needed.

When DSH code, a DSH package, a DSH asset (icon, font, style) or a DSH binary is added to this repository or to a release file, put DSH's full MIT LICENSE text in this file with its copyright line (at the time of writing: "Copyright (c) 2026 DeepSeek"), copied from [the DSH repository](https://github.com/deepseek-ai/deepseek-harness/blob/master/LICENSE). A release file that contains DSH carries the same text inside it.

### DS Bot, Apache-2.0

When code is copied from [DS Bot](https://github.com/Fei2411/DS-Bot): put the Apache License 2.0 text in this file, add the lines of DS Bot's `NOTICE` that apply to the copied files, keep the original copyright line in each file, and mark each file as changed. DS Bot's `NOTICE` says some of its files follow DSH files; copying those brings the DSH notice above as well. Do not copy DS Bot's icons, text or graphics. By default only its ideas are used.

### Aelios-resident, AGPL-3.0

[Aelios-resident](https://github.com/Aelios-project/Aelios-resident) is AGPL-3.0 and has the same author. Styles and components copied from it are not third-party code, but each copied file says in its header where it came from.

## Carried bundles

`packages/desktop/bundles/` holds the prebuilt output of two projects, which the first-run wizard deploys:

- Aelios (`companion-memory-proxy`), AGPL-3.0-only. The source commit is named in `bundles/manifest.json`.
- Aelios-resident (`aelios-resident`), AGPL-3.0-only. The source commit is named in the manifest.

Both are AGPL-3.0-only and by the same author as this repository, so they are not third-party code. Each bundle
carries its own `LICENSE` file, and the manifest records a hash for every carried file.

## Runner and DSH

The runner can start the `dsh` command as a helper over ACP. That runs DSH as a separate program on your machine and does not include its code here.
