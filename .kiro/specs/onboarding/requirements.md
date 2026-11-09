# Requirements: onboarding (first-run wizard)

## Introduction

Today the shell asks for a resident address and a web key (`client/connect-form.mjs`). That works only for a person who already runs Aelios and a resident. This spec covers the first-run wizard that takes the owner from "plugin installed" to "the resident's first line", including a person who has nothing deployed yet.

Terms. **Aelios** is the memory service (Worker `companion-memory-proxy`). The **resident** is `aelios-resident`. The **wizard** is a fixed flow of cards drawn by the shell's own UI. The **host half** is the shell's Node side, which runs deterministic scripts. A **step** is one card that needs the owner to act. **cf** is the Cloudflare CLI (npm package `cf`).

Decisions already taken. The wizard needs no model to finish. Every secret is typed into a secret card handled by shell code. The plugin carries the Aelios and resident code and deploys it; there is no GitHub fork. Boxes are not part of the wizard; they are added later in settings.

Scope for the contest. Two paths only: **existing resident** (close to today's connect form) and **new, one-click defaults** (Aelios and resident deployed and linked by address and key). Everything else is in "After the contest" at the end: Codex sign-in, custom providers, the service binding, "Help me check", and the path for an owner who has Aelios but no resident. Update stays in this spec but is scheduled after the contest.

Out of scope. Boxes. Telegram and other messengers. Deleting cloud resources.

## Requirements

### 1. A fixed flow, no model

**User story:** As the owner, I want the same short flow every time, so that setup does not depend on a model's mood or quota.

1. The wizard SHALL be a fixed sequence of cards drawn by the shell. The host half SHALL do the work with scripts.
2. The wizard SHALL NOT call a model to complete any step.
3. WHEN the shell starts with no saved connection THEN it SHALL open the wizard in place of the connect form.
4. WHEN the owner closes the window in the middle of the wizard THEN the next start SHALL continue at the same card.

### 2. Resident first, then Aelios

A resident works only with Aelios, so a resident that exists already has its Aelios. The wizard asks about the resident first.

1. The first card SHALL ask "Do you already run a resident?" with two answers.
2. WHEN the owner answers yes THEN the wizard SHALL ask for its address and web key (secret card), check it, read which Aelios it uses from the resident itself, and go straight to the helper card. It SHALL NOT ask for Aelios details and SHALL NOT change the resident's Aelios.
3. WHEN the owner answers no THEN the wizard SHALL go on to the Aelios card (below), then deploy a resident (requirement 3).

### 2a. Aelios: make one (only when there is no resident yet)

1. The Aelios card SHALL start Cloudflare authorization (requirement 4) and then deploy the bundled Aelios (requirement 6). (For contest scope the card does not ask "Do you already run Aelios?"; that branch is in "After the contest".)
2. WHEN Aelios was deployed by the wizard THEN the wizard SHALL show its address and a generated password once, and SHALL ask what the assistant is called.
3. The generated password SHALL also be stored in DSH credentials, and SHALL NOT be shown again by the shell except by a "generate a new one" action.

### 3. A new resident

1. WHEN the owner has no resident THEN the wizard SHALL deploy the bundled resident bound to the Aelios from requirement 2a (requirement 7) and SHALL show its address and a generated web key once.
2. There is no path with an existing resident and a new Aelios: a resident never exists without Aelios.
3. The resident SHALL reach Aelios by address and key: the Aelios address as a variable and the key as a secret. (The service binding is in "After the contest".)

### 4. Cloudflare authorization

1. The wizard SHALL authorize Cloudflare once, in the browser, through `cf auth` with a profile of its own, so the owner's other `cf` logins stay as they are.
2. The card SHALL show the link and the code that `cf` prints, and a button that opens the link. The wizard SHALL never ask for a global API key.
3. WHEN `cf` is not on the machine THEN the wizard SHALL say so and give the exact install command; it SHALL NOT install it silently.
4. After authorization the wizard SHALL list the account's Workers (by name and bindings). WHEN it finds a resident THEN it SHALL stop the new-install flow, say what it found, and switch to the existing-resident path (requirement 2). WHEN it finds only an Aelios THEN it SHALL stop and tell the owner that connecting to an existing Aelios comes after the contest ("After the contest").
5. In contest scope the wizard SHALL NOT deploy over, rekey or otherwise change a Worker it did not create. The card SHALL say plainly that going on would overwrite what is there, and SHALL NOT offer it. Deploying a second Worker next to a found one needs a different name and is also not offered in contest scope.

### 5. Main model (new Aelios only)

1. The card SHALL offer: (a) Cloudflare models, built-in or paid with Cloudflare credits (unified billing); (b) bring your own key from an AI Gateway built-in provider. Boxes SHALL be absent.
2. The default SHALL be (a), so the owner can press one button.
3. For (b) the wizard SHALL read the provider list from Cloudflare when the card opens, SHALL NOT hard-code it, and SHALL store the pasted key as an AI Gateway provider key.
4. The model choice SHALL be applied once both Aelios and the resident exist.

### 6. Which models read and write memory

1. WHEN the wizard deploys a new Aelios THEN the "your assistant" card SHALL show a model pattern, pre-filled with the main model chosen on the same card (for the default Cloudflare path, `glm-4.7-flash`). WHEN the owner changes the model and has not edited the pattern THEN the pattern SHALL follow the model.
2. The pattern SHALL be editable and SHALL NEVER be empty; the wizard SHALL refuse an empty one. It is saved in the Aelios gateway identity as its main-model list.
3. WHEN the owner edits the pattern so that it does not match the chosen main model THEN the card SHALL show one line: this model will not be remembered, with an "I know" button that confirms. It SHALL NOT block: an owner may limit memory to one model on purpose. Matching SHALL use Aelios's own rule for main models.
4. The wizard SHALL NOT change the pattern of an Aelios it did not deploy.

### 7. Helpers, pairing, first line

1. The wizard SHALL look for `dsh`, `kiro-cli` and `claude` on the machine and show what it found.
2. The owner SHALL confirm the helper, the folder and the permission tier on one card. The tier SHALL default to the lowest that the existing connect form defaults to. `full` SHALL need the same confirmation the connect form asks today.
3. WHEN the owner presses Start THEN the host half SHALL pair the runner (existing `ensurePaired`), start it, and the resident SHALL say its first line in the middle column.
4. The helper SHALL NOT receive a name, persona or secret from the wizard.

### 8. Secrets

1. A secret SHALL be typed only into a secret card (a password field). The browser half SHALL send it once to the host half and SHALL NOT keep it after the call.
2. A secret SHALL NOT pass through a model, a prompt, a log line, a command-line argument, an environment variable that a child can print, or an error message. One exception, in 8.7: the Cloudflare token for `wrangler`, given to that child process only.
3. The host half SHALL hand a secret to `cf` or `wrangler` on standard input or in a file that only the owner can read, and SHALL delete that file right after.
4. All child-process output SHALL pass through a redactor that removes every secret the wizard holds before it is stored or shown.
5. Secrets SHALL live in DSH credentials (`ctx.credentials`) and in Cloudflare secrets, nowhere else.
6. No secret SHALL exist that nobody knows. A secret step counts as done only WHEN the secret exists both locally and in Cloudflare. WHEN Cloudflare has it and the local copy is gone THEN the wizard SHALL go to a "set a new one" card and SHALL NOT claim success. Replacing a secret on a Worker needs the owner's explicit approval, as in requirement 4.5.
7. WHEN the wizard runs `wrangler` for the Worker upload THEN it SHALL give the `cf` profile's token to the `wrangler` child process only, through its environment (`CLOUDFLARE_API_TOKEN`, the variable `wrangler` reads for this). The token SHALL NOT be set in the host's own environment, written to a file, logged or printed, and the child's output SHALL pass through the redactor (8.4). This is the one exception to 8.2. Task 1.7 showed that it can be used this way. Only if the profile is kept in the keyring and cannot be read, the second browser approval SHALL be counted in the step table for that owner (design, Task 1.7).

### 9. Failure and re-run

1. WHEN a step fails THEN its card SHALL show the step name, a plain message, the redacted tail of the output, and a "Try again" button.
2. Re-running SHALL be safe: it SHALL skip what exists and finish what is missing (design: idempotent steps).

### 10. Update (scheduled after the contest)

Wizard installs have no fork, so Update is the only way they get new bundled code.

1. The settings sheet SHALL have an "Update" action for a deployment the wizard made.
2. WHEN the bundled code is newer than the deployed one THEN Update SHALL show what changes and, after approval, redeploy it.
3. Update SHALL keep every variable and secret, and SHALL apply only new D1 migrations.
4. Update SHALL NOT touch a Worker the wizard did not deploy.

### 11. Steps (the goal)

1. From an installed plugin to the resident's first line, an owner with a resident (so Aelios too) SHALL need **2** steps: the resident card, the helper card.
2. A new owner with the default choices SHALL need **4** steps: the resident card (no), the Aelios card with the Cloudflare approval, the "your assistant" card (name, model, pattern), the helper card that also shows the new keys.
3. Choosing bring-your-own-key from a built-in provider SHALL add typing inside the same card, not a new step.
4. Task 1.7 found that `wrangler` needs no browser approval of its own, so the new-owner count stays 4. WHEN a different finding makes it 5, every place that states it (PR text, this requirement, the design table, the test in task 9.1) SHALL change together.
5. The design SHALL list the count per path, and a test SHALL fail when a path grows past it.

### 12. House rules

1. Files SHALL be small and do one job. New code SHALL go in new modules under `host/onboarding/` and `client/onboarding/`.
2. All text in the repository SHALL be English. The user is "the owner" or "they". No names or personal details in code, tests or fixtures.
3. The shell SHALL NOT write anything outside its own folder, DSH credentials and the owner's chosen workspace.

## After the contest

Not scheduled before the contest. Kept here so the design leaves room for them.

### A1. Aelios: use mine (an owner who has Aelios but no resident)

1. The Aelios card SHALL ask "Do you already run Aelios?". WHEN yes THEN it SHALL ask for its address and API key (secret card) and call a read-only health check.
2. The card SHALL then read Aelios's read-only `GET /v1/hook/identities` with that key and let the owner pick an identity. Each identity SHALL be shown with its name and its main models.
3. The picked identity SHALL be used for the new resident (its `AELIOS_IDENTITY` variable). The wizard SHALL NOT change that Aelios.
4. This path counts 4 steps: the resident card (no), the Aelios card (yes, key, pick an identity), the Cloudflare approval, the helper card.

### A2. Codex sign-in

Run Aelios's own Codex sign-in. The shell catches the loopback redirect itself; if the port is busy it falls back to pasting. It adds a browser approval inside the same card.

### A3. Custom provider

Ask for a name, a base URL and a key; create the AI Gateway custom provider and store the key.

### A4. Service binding

WHEN Aelios is in the same Cloudflare account THEN the resident SHALL reach it through a service binding and SHALL NOT store an Aelios key.

### A5. "Help me check"

1. WHEN a step fails THEN the error card SHALL also offer "Help me check". The host half MAY ask Workers AI (glm-4.7-flash) on the owner's own account, together with the Cloudflare MCP server (`https://mcp.cloudflare.com/mcp`) used read-only, to explain the failure.
2. The explainer SHALL receive only the step name, the error code and the redacted output. It SHALL NOT receive a secret.
3. A call that changes anything SHALL be refused unless the owner approves that one call on a card. This SHALL be enforced in code, not in a prompt.
4. WHEN Workers AI or the MCP server is not available THEN the button SHALL say so and the plain message SHALL stay.
