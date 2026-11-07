# Desktop app (planned)

No code here yet. This folder holds the plan for the half of Aelios-desktop that has a window.

## Plan

- Base: [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (MIT). When its code is added, its license goes into `THIRD_PARTY_NOTICES.md`.
- Install, connect, and receive the resident's first message in four steps or fewer.
- The window belongs to the resident: its name, its look, nothing of DSH's own branding.
- It runs the same runner as headless mode, with the same `aelios-runner/1` protocol and the same ACP helpers (Kiro, DSH).
- It shows a "waiting for you" list for questions, finished jobs and stuck jobs, and lets you talk straight to a running thread.
- Stop button for a running thread.

## Not decided

- How the window starts and watches the runner.
- How pairing looks in the window.
