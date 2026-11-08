# Requirements: onboarding (first-run wizard)

## Introduction

Today the shell asks for a resident address and a web key (`client/connect-form.mjs`). That works only for a person who already runs Aelios and a resident. This spec covers the first-run wizard that takes the owner from "plugin installed" to "the resident's first line", including a person who has nothing deployed yet.

Terms. **Aelios** is the memory service (Worker `companion-memory-proxy`). The **resident** is `aelios-resident`. The **wizard** is a fixed flow of cards drawn by the shell's own UI. The **host half** is the shell's Node side, which runs deterministic scripts. A **step** is one card that needs the owner to act. **cf** is the Cloudflare CLI (npm package `cf`).

Decisions already taken. The wizard needs no model to finish. Every secret is typed into a secret card handled by shell code. The plugin carries the Aelios and resident code and deploys it; there is no GitHub fork. Boxes are not part of the wizard; they are added later in settings.

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

### 2a. Aelios: use mine or make one (only when there is no resident yet)

1. The Aelios card SHALL ask "Do you already run Aelios?" with two answers.
2. WHEN the owner answers yes THEN the wizard SHALL ask for its address and API key (secret card), call a read-only health check, and go on only when it answers.
3. WHEN the owner answers no THEN the wizard SHALL start Cloudflare authorization (requirement 4) and then deploy the bundled Aelios (requirement 6).
4. WHEN Aelios was deployed by the wizard THEN the wizard SHALL show its address and a generated password once, and SHALL ask what the assistant is called.
5. The generated password SHALL also be stored in DSH credentials, and SHALL NOT be shown again by the shell except by a "generate a new one" action.

### 3. A new resident

1. WHEN the owner has no resident THEN the wizard SHALL deploy the bundled resident bound to the Aelios from requirement 2a (requirement 7) and SHALL show its address and a generated web key once.
2. There is no path with an existing resident and a new Aelios: a resident never exists without Aelios.
3. WHEN Aelios is in the same Cloudflare account THEN the resident SHALL reach it through a service binding and SHALL NOT store an Aelios key. Otherwise it SHALL get the Aelios address and key as a variable and a secret.

### 4. Cloudflare authorization

1. The wizard SHALL authorize Cloudflare once, in the browser, through `cf auth` with a profile of its own, so the owner's other `cf` logins stay as they are.
2. The card SHALL show the link and the code that `cf` prints, and a button that opens the link. The wizard SHALL never ask for a global API key.
3. WHEN `cf` is not on the machine THEN the wizard SHALL say so and give the exact install command; it SHALL NOT install it silently.
4. After authorization the wizard SHALL list the account's Workers and, WHEN it finds an Aelios or a resident (by name and bindings), SHALL offer to connect it instead of deploying a second one.
5. WHEN the owner connects a found Worker THEN the wizard SHALL ask for its key. It MAY offer "set a new key on it", which SHALL need the owner's explicit approval because other clients of that Worker stop working.

### 5. Main model (new Aelios only)

1. The card SHALL offer: (a) Cloudflare models, built-in or paid with Cloudflare credits (unified billing); (b) bring your own key; (c) Codex subscription. Boxes SHALL be absent.
2. The default SHALL be (a), so the owner can press one button.
3. WHEN (b) THEN the owner SHALL choose "AI Gateway built-in provider" or "custom provider".
4. For a built-in provider the wizard SHALL read the provider list from Cloudflare when the card opens, SHALL NOT hard-code it, and SHALL store the pasted key as an AI Gateway provider key.
5. For a custom provider the wizard SHALL ask for a name, a base URL and a key, and SHALL create the AI Gateway custom provider and store the key.
6. WHEN (c) THEN the wizard SHALL run Aelios's own Codex sign-in. The shell SHALL catch the loopback redirect itself so the owner does not paste an address; if the port is busy it SHALL fall back to pasting.
7. The model choice SHALL be applied once both Aelios and the resident exist.

### 6. Which models read and write memory

1. WHEN the wizard deploys a new Aelios THEN the card SHALL show a model pattern with the default `*claude-opus-4*`, editable.
2. The wizard SHALL refuse an empty pattern. The pattern SHALL be saved in the Aelios gateway identity as its main-model list.
3. The wizard SHALL NOT change the pattern of an Aelios it did not deploy.

### 7. Helpers, pairing, first line

1. The wizard SHALL look for `dsh`, `kiro-cli` and `claude` on the machine and show what it found.
2. The owner SHALL confirm the helper, the folder and the permission tier on one card. The tier SHALL default to the lowest that the existing connect form defaults to. `full` SHALL need the same confirmation the connect form asks today.
3. WHEN the owner presses Start THEN the host half SHALL pair the runner (existing `ensurePaired`), start it, and the resident SHALL say its first line in the middle column.
4. The helper SHALL NOT receive a name, persona or secret from the wizard.

### 8. Secrets

1. A secret SHALL be typed only into a secret card (a password field). The browser half SHALL send it once to the host half and SHALL NOT keep it after the call.
2. A secret SHALL NOT pass through a model, a prompt, a log line, a command-line argument, an environment variable that a child can print, or an error message.
3. The host half SHALL hand a secret to `cf` or `wrangler` on standard input or in a file that only the owner can read, and SHALL delete that file right after.
4. All child-process output SHALL pass through a redactor that removes every secret the wizard holds before it is stored or shown.
5. Secrets SHALL live in DSH credentials (`ctx.credentials`) and in Cloudflare secrets, nowhere else.

### 9. Failure, re-run, "Help me check"

1. WHEN a step fails THEN its card SHALL show the step name, a plain message, the redacted tail of the output, and the buttons "Try again" and "Help me check".
2. Re-running SHALL be safe: it SHALL skip what exists and finish what is missing (design: idempotent steps).
3. WHEN the owner presses "Help me check" THEN the host half MAY ask Workers AI (glm-4.7-flash) on the owner's own account, together with the Cloudflare MCP server (`https://mcp.cloudflare.com/mcp`) used read-only, to explain the failure.
4. The explainer SHALL receive only the step name, the error code and the redacted output. It SHALL NOT receive a secret.
5. A call that changes anything SHALL be refused unless the owner approves that one call on a card. This SHALL be enforced in code, not in a prompt.
6. WHEN Workers AI or the MCP server is not available THEN the button SHALL say so and the plain message SHALL stay.

### 10. Update

1. The settings sheet SHALL have an "Update" action for a deployment the wizard made.
2. WHEN the bundled code is newer than the deployed one THEN Update SHALL show what changes and, after approval, redeploy it.
3. Update SHALL keep every variable and secret, and SHALL apply only new D1 migrations.
4. Update SHALL NOT touch a Worker the wizard did not deploy.

### 11. Steps (the goal)

1. From an installed plugin to the resident's first line, a returning owner (a resident exists, so Aelios does too) SHALL need 2 steps: the resident card, the helper card.
2. A new owner with the default choices SHALL need 3 steps: the first card with Cloudflare approval, the "your assistant" card (name, model, pattern), the helper card that also shows the new keys.
3. Choosing bring-your-own-key or Codex SHALL add typing or a browser approval inside the same card, not a new step.
4. An owner with Aelios but no resident SHALL need 4 steps: the resident card (no), the Aelios card with its key, the Cloudflare approval, the helper card.
5. The design SHALL list the count per path, and a test SHALL fail when a path grows past it.

### 12. House rules

1. Files SHALL be small and do one job. New code SHALL go in new modules under `host/onboarding/` and `client/onboarding/`.
2. All text in the repository SHALL be English. The user is "the owner" or "they". No names or personal details in code, tests or fixtures.
3. The shell SHALL NOT write anything outside its own folder, DSH credentials and the owner's chosen workspace.
