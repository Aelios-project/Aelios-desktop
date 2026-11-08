# Design: onboarding (first-run wizard)

## Verified facts (checked 2026-11-08)

DSH 0.2.2-rc.1, app at `/Applications/DeepSeek Harness.app`, read from the unpacked `app.asar`. Aelios and resident read from `origin/main` with `git show`; nothing was pulled or changed.

| Question | Answer | Evidence |
|---|---|---|
| `@deepseek-ai/dsh-authorization` exists | Yes, 0.2.2-rc.1, mounted in every profile as `ctx.authorization` | `package.json` in the asar; `dsh-base/cordis.patch.yml` lists it |
| `registerFlow`, `session.notify`, `session.prompt` | Yes. `notify` is one-way, with a message and optionally a link and a code. `prompt` kinds are `text`, `secret`, `select`. A flow must commit a record through `ctx.credentials` or the attempt fails with `NOT_COMMITTED` | package README, `lib/index.js` |
| Does the window draw a secret prompt | No. Only the DeepSeek account sign-in calls `authorization.begin`, and it passes an interaction that rejects every prompt. No stock card draws one. A plugin must supply its own interaction and its own card | `dsh-deepseek-account-platform/lib/index.js` line ~854 |
| `@deepseek-ai/dsh-credentials` | Yes. `ctx.credentials` gives `readRecord`, `modifyRecord`, `describeRecord`, `listRecords`, `deleteRecord`. The shell already uses it (`host/store.mjs`, key `aelios-desktop/connection`). The local store is `$DSH_HOME/.credentials.yaml`, plain text; it refuses to start if the file is readable by others | credentials README; `dsh-credentials-local/lib/index.js` line ~104 |
| `dsh-client-ui-user-questions` | Yes, but it draws an agent's question, answered through the model's tool call. It has no password field. A secret typed there would reach the model | package README |
| `dsh-client-ui-tool` | Yes. It draws tool-call cards in the transcript. Not a form | package README |
| Real window test | Not done: the checks are of the bundled code only. The existing connect form already uses `type: "password"` in the shell's own UI, so the same works for a secret card | `client/connect-form.mjs` |

Consequences. The wizard uses `ctx.credentials` and the shell's own cards. It does not register an authorization flow: `cf` keeps its own Cloudflare token, and Aelios runs its own Codex sign-in. `user-questions` is never used for a secret.

Cloudflare CLI, as installed here (`cf` 1.0.0-beta.12): `cf auth login|create` (device flow by default, `--no-browser` prints the link), `cf workers list|get|secrets`, `cf d1 create|list|migrations apply`, `cf vectorize create|get|info`, `cf queues create|list`, `cf ai-gateway gateways|custom-providers`, `cf ai-gateway gateways providers create|list|update` (provider keys), `cf mcp`. `cf deploy` takes a Build Output Specification project, not a `wrangler.toml`. So Worker upload and the Durable Object migrations use `npx wrangler@<pin> deploy`. Not checked: the OAuth scopes that `cf auth` asks for, and the exact text it prints in device mode.

## Where code goes

```
packages/desktop/
  bundles/                 aelios/ and resident/ prebuilt (see Bundles), manifest.json
  host/onboarding/
    state.mjs              saved progress (no secrets)
    steps.mjs              the step table and the per-path order
    run.mjs                runs one step, idempotent, reports a result
    cli.mjs                spawns cf / wrangler, secrets on stdin, redacts output
    cloudflare.mjs         auth profile, account, list Workers, detect Aelios and resident
    aelios.mjs             deploy Aelios, gateway config, health check
    resident.mjs           deploy resident, binding, web key
    models.mjs             the model card: lists, provider keys, custom provider
    codex.mjs              loopback catch for the Codex sign-in
    helpers.mjs            detect dsh, kiro-cli, claude; then existing pairing
    redact.mjs             removes held secrets from any text
    explain.mjs            "Help me check" (Workers AI + read-only MCP)
    route.mjs              host actions for the wizard
  client/onboarding/
    wizard.mjs             picks the card from state
    card-*.mjs             one file per card
    secret-field.mjs       the password field
```

`host/route.mjs` gets one line that hands actions starting with `onboarding.` to `host/onboarding/route.mjs`. `client/connect-form.mjs` stays as the "I have a resident" card.

## The flow

A resident never exists without Aelios, so the resident question comes first and an existing resident skips everything about Aelios.

```
start
 └─ Card R  "Do you run a resident?"
      ├─ yes ── address + web key (secret) ── check ── read its Aelios ──► Card H
      └─ no
           └─ Card A  "Do you run Aelios?"
                ├─ yes ── address + API key (secret) ── health check ── Cloudflare approval
                └─ no  ── Cloudflare approval (browser) ── detect Workers ──┐
                                                                            │ found: connect it, or go on
           └─ Card S  "Your assistant" (new Aelios only)  ◄─────────────────┘
                name · main model · memory pattern  ── deploys run behind it
 └─ Card H  helpers, folder, tier. Shows new keys once.  [Start]
      pair runner → start → first line
```

The deploy runs while Card S is open, so the wait is spent on the owner's choices.

### Step count (what the tests check)

| Path | Steps | Which |
|---|---|---|
| Has a resident (so Aelios too) | 2 | R (yes + address + key), H |
| New everything, defaults | 4 | R (no), A (no, then approve in the browser), S, H |
| Has Aelios, no resident | 4 | R (no), A (yes + key), approve in the browser, H |
| New, with BYOK or Codex | 4 | the same cards; the key is typed or the browser approved inside S |

A browser approval is counted with the click that opens it. Typing in a field of the same card is not a step.

## Cloudflare resources

Taken from `wrangler.toml` of Aelios (`origin/main`) and `wrangler.jsonc` of the resident (`origin/main`). The wizard creates exactly these and nothing else. A name below is the default; Aelios keeps its names, the resident keeps its own.

### Aelios

| Kind | Name | Created by | Notes |
|---|---|---|---|
| Worker | `companion-memory-proxy` | `wrangler deploy` | `keep_vars = true`; cron `10 20 * * *`; Workers AI binding `AI` (no resource) |
| D1 database | `companion_memory_proxy` (binding `DB`) | `cf d1 create` if missing | No id in git; the bundle step fills the real id into a temporary config |
| D1 migrations | `0001` to `0020` | `d1 migrations apply --remote` | Forward only, safe to re-run |
| Vectorize index | `memo-kb`, 1024 dimensions, cosine (binding `VECTORIZE`) | `cf vectorize create` if missing | Wrong dimensions and not empty: stop and ask. Empty: recreate (same rule as its `setup-cloudflare.mjs`) |
| Queue | `companion-memory` (producer `MEMORY_QUEUE`; consumer is the same Worker, batch 1, timeout 30) | `cf queues create` if missing | |
| Secret | `CHATBOX_API_KEY` (the generated password) | `wrangler secret put`, stdin | |
| Secret, optional | `CF_AIG_TOKEN` | same | Only for AI Gateway authenticated calls or unified billing |
| Gateway identity | a row in D1 `gateway_config` | Aelios admin API with the password | slug, names, main-model pattern, one key |

### Resident

| Kind | Name | Created by | Notes |
|---|---|---|---|
| Worker | `aelios-resident` | `wrangler deploy` | assets from `public/`; `keep_vars = true` |
| Durable Objects | `Resident`, `BoxHub` | the deploy (migrations `v1`, `v2`, `v3`) | SQLite-backed; no separate create |
| Bindings, no resource | `AI`, `BROWSER`, `IMAGES` | the deploy | Browser needs Workers Paid; Images has a free allowance. Not checked what the deploy does on a free plan: Task 1.4 |
| Secret | `WEB_KEY` (generated) | `wrangler secret put`, stdin | |
| Service binding | `AELIOS` to `companion-memory-proxy` (entrypoint) | the deploy config | Needs a change in both repos (see Open items). Without it: var `AELIOS_URL` and secret `AELIOS_API_KEY` |
| Variable, optional | `AELIOS_NAMESPACE` | deploy config | Only when the owner needs another space |

AI Gateway (model card, only when the owner picks BYOK or credits): a gateway in the account (the default one when it exists; one is created only when there is none), provider keys under it, and a custom provider when chosen. These belong to the account, not to the Workers. Update and a re-run never delete them.

No D1, Vectorize or Queue belongs to the resident.

## Idempotent steps and partial failure

Each step is `check → do → verify`. `check` asks Cloudflare whether the thing exists (by name) and returns `done` without acting. State is saved after each step in the DSH credentials record `aelios-desktop/onboarding`: step list, ids, addresses, and which step failed. It holds no secret.

| Step | check | do |
|---|---|---|
| auth | `cf auth whoami --profile <ours>` | `cf auth create <ours>` |
| d1 | `cf d1 list` by name | `cf d1 create` |
| migrations | `migrations list` is empty | `migrations apply` |
| vectorize | `cf vectorize get`; dimensions equal 1024 | `cf vectorize create`; or stop |
| queue | `cf queues list` by name | `cf queues create` |
| secret | `cf workers secrets list` has the name | generate, store in DSH credentials first, then put |
| deploy | deployed version tag equals the bundle's | `wrangler deploy --keep-vars` |
| gateway identity | admin API read has our slug | admin API write |
| health | `GET /health` answers | none |

Rules.
- A generated secret is written to DSH credentials before it is sent to Cloudflare. A re-run reads it back and does not make a new one. So a crash between the two never leaves a Cloudflare secret nobody knows.
- A step that fails stops the flow on its card. Earlier steps stay. Nothing is deleted. "Try again" runs the same step; the wizard restarts at the first step whose `check` is not `done`.
- "Start over" forgets the saved progress and the generated secrets only. It never deletes cloud resources. A person who wants them gone does it in Cloudflare.
- Order for a new install: auth, d1, migrations, vectorize, queue, secret, deploy Aelios, health, gateway identity, then the resident: secret, deploy, health, pairing.
- A step that touches an account resource the wizard did not create (a Worker with a found name) asks first.

## Bundles

The plugin carries Aelios and resident code as prebuilt output (`wrangler deploy --dry-run --outdir`), so the owner needs no `npm install` and no source build. `bundles/manifest.json` lists, for each bundle, the source commit, a version tag and a hash. A script `scripts/build-bundles.mjs` makes them from two named commits; `npm test` fails when the manifest and the files differ. Both projects are AGPL-3.0 with the same author as this one, so the files are carried with their license. The deploy runs `wrangler deploy` on the prebuilt entry with a temporary config that holds the real D1 id; the temporary config is deleted after.

## Secrets in the wizard

- The secret field is a password input in the shell's own UI. On submit it calls `onboarding.secret` once. The browser half clears the field and keeps nothing.
- The host half keeps held secrets in memory for `redact.mjs` and in DSH credentials. Every string that leaves `cli.mjs` (output, error) and every message sent to the browser half or the explainer passes through `redact`.
- `cli.mjs` starts children with a clean environment (`PATH`, `HOME`, the `cf` profile, nothing else), never puts a secret in `argv`, and passes it on stdin.
- Test: put a known secret through every step with a fake `cf`, fake `wrangler` and fake Aelios; the secret must not appear in any returned value, saved state or captured log.

## Main model card

- Cloudflare models: nothing to store. The list is read from the Aelios model catalog route (`/api/gateway/models`) after the deploy. Credits: the card links to the dashboard to buy credits and then runs a test call.
- BYOK, built-in: provider list read live from the account's AI Gateway when the card opens (`cf ai-gateway` first; the REST catalog if `cf` lacks a list command, Task 1.3). The key goes to `cf ai-gateway gateways providers create`.
- BYOK, custom: `cf ai-gateway custom-providers create` with name and base URL; then the key as above.
- Codex: `POST /api/gateway/chatgpt/login` returns an authorize link whose redirect is `http://127.0.0.1:1455/auth/callback`. `codex.mjs` listens on that port on 127.0.0.1 for 10 minutes, then posts the captured address to `/api/gateway/chatgpt/callback` and runs `/test`. Port busy: show the paste field.
- After each choice the wizard sends a test call and shows the answer's first line, or the redacted failure.

## "Help me check"

`explain.mjs` builds one message from the step name, the error code and the redacted output. It calls Workers AI (`glm-4.7-flash`, id looked up live) on the owner's account through the REST route with the `cf` token, and offers the Cloudflare MCP server's read tools. The host half owns the tool loop: a tool is called only if its name is on a read allowlist; any other tool name is turned into an approval card and waits. The answer is shown as text. It never changes state itself, and its text is never run. Not checked: how the MCP server accepts the `cf` token (Task 1.5).

## Update

The deployed version tag (`aelios-desktop bundle <semver>`, set at deploy through `--tag`) is compared with `manifest.json`. A card shows old and new tags, and the new D1 migration names. After approval it runs deploy, migrations, health. Vars and secrets are never rewritten.

## Open items (need a decision or a change in another repository)

1. Service binding trust. A binding gives no caller identity, and the Aelios front door wants an API key. Plan: Aelios adds a `WorkerEntrypoint` that calls its handler as the trusted resident; the resident adds an `AELIOS` binding with that entrypoint and uses it before `fetch`. This changes Aelios (`src/index.ts`, `wrangler.toml`) and the resident (`src/aelios.ts`, `wrangler.jsonc`, `env.d.ts`). Until then the wizard uses the URL and key path.
2. (Settled) An existing resident with a new Aelios does not happen: a resident only works with Aelios, so the wizard never deploys Aelios for an owner who already has a resident.
3. Where users get `cf`. It is an npm package in beta (`cf`). The wizard pins a tested version in `npx`.
