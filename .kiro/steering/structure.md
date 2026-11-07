---
inclusion: always
---

# Structure

```
.kiro/
  steering/            product, tech, structure and code-style guidance
  specs/headless-runner/   requirements.md, design.md, tasks.md
  hooks/               automation: run the runner tests when its source changes
packages/
  runner/              headless mode (npm package "aelios-runner")
    bin/               the command line
    src/               acp, cloud, helper, lock, permission, plugins, receipt, runner, state
    test/              fake cloud, fake helper and the tests
    README.md          install and use
    PROTOCOL.md        the aelios-runner/1 wire protocol
  desktop/             README with the plan for the window mode; no code yet
README.md              what this is, how to install headless mode, pre-existing work
THIRD_PARTY_NOTICES.md licenses of third-party code that is copied in
```

New code goes in a new small module under the package it belongs to. Do not add to a big file.
