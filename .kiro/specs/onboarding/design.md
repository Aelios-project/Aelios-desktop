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
| A password field in the real window | Works. The connect form (`type: "password"`, posted to the host half) was used in the real 0.2.2-rc.1 install; its key is in `.credentials.yaml` (0600) and in none of the 412 files under `~/.dsh/logs` and `~/.dsh/sessions`. The fetch route is owner-only and logs no body. Checked 2026-11-09 (Task 1.1) | `client/connect-form.mjs`; `dsh-client-connection/lib/index.js` |

Consequences. The wizard uses `ctx.credentials` and the shell's own cards. It does not register an authorization flow: `cf` keeps its own Cloudflare token. `user-questions` is never used for a secret.

Cloudflare CLI, as installed here (`cf` 1.0.0-beta.12): `cf auth login|create` (device flow by default, `--no-browser` prints the link), `cf workers list|get|secrets`, `cf d1 create|list|migrations apply`, `cf vectorize create|get|info`, `cf queues create|list`, `cf ai-gateway gateways|custom-providers`, `cf ai-gateway gateways providers create|list|update` (provider keys), `cf mcp`. `cf deploy` takes a Build Output Specification project, not a `wrangler.toml`. So Worker upload and the Durable Object migrations use `npx wrangler@<pin> deploy`. Checked 2026-11-09 (Task 1.2): in device mode it prints to stderr `To authorize cf, please visit:`, the link `https://dash.cloudflare.com/oauth2/device/verify`, `and enter the code:`, an 8-character code and `You have 5 minutes to approve this request.`; without `--no-browser` it also opens the browser at a link that holds the code. With no `--scopes` it asks for its whole default list (475 scopes were granted), which covers Workers, D1, Vectorize, Queues, AI Gateway, Workers AI, Images and Browser. The profile file `~/Library/Preferences/cloudflare/config/<profile>.json` holds `oauth_token`, `refresh_token`, `expiration_time` and `scopes`.

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
    upload.mjs             Worker upload with its login (see "Worker upload login")
    aelios.mjs             deploy Aelios, gateway config, health check
    resident.mjs           deploy resident, binding, web key
    models.mjs             the model card: lists, provider keys, pattern check
    helpers.mjs            detect dsh, kiro-cli, claude; then existing pairing
    identities.mjs         reads /v1/hook/identities (after the contest)
    redact.mjs             removes held secrets from any text
    route.mjs              host actions for the wizard
  client/onboarding/
    wizard.mjs             picks the card from state
    card-*.mjs             one file per card
    secret-field.mjs       the password field
```

`host/route.mjs` gets one line that hands actions starting with `onboarding.` to `host/onboarding/route.mjs`. `client/connect-form.mjs` stays as the "I have a resident" card.

## The flow

A resident never exists without Aelios, so the resident question comes first and an existing resident skips everything about Aelios. For the contest there are two paths.

```
start
 └─ Card R  "Do you run a resident?"
      ├─ yes ── address + web key (secret) ── check ── read its Aelios ──► Card H
      └─ no
           └─ Card A  Cloudflare approval (browser) ── detect Workers ──┐
                                                                         │ found resident: existing-resident path
                                                                         │ found Aelios only: stop (after the contest)
                                                                         │ never overwrite or rekey
           └─ Card S  "Your assistant"  ◄──────────────────────────────┘
                name · main model · memory pattern (follows the model)  ── deploys run behind it
 └─ Card H  helpers, folder, tier. Shows new keys once.  [Start]
      pair runner → start → first line
```

The deploy runs while Card S is open, so the wait is spent on the owner's choices. After the contest, Card A also asks "Do you run Aelios?" (see the last section).

### Step count (what the tests check)

| Path | Steps | Which |
|---|---|---|
| Existing resident (so Aelios too) | 2 | R (yes + address + key), H |
| New, default choices | 4 | R (no), A (approve in the browser), S, H |
| New, built-in provider key | 4 | the same cards; the key is typed inside S |
| After the contest: has Aelios, no resident | 4 | R (no), A (yes + key + pick identity), approve in the browser, H |

A browser approval is counted with the click that opens it. Typing in a field of the same card is not a step. Task 1.7 found that `wrangler` needs no second approval (see "Worker upload login"), so the count stays 4. For an owner whose `cf` profile is kept in the keyring (an `.enc` file the host cannot read) the fallback adds one step for that owner only.

### Worker upload login

`wrangler deploy` has its own login store (`wrangler login`), separate from the `cf` profile. A second browser approval would add a step. Rule 8.2 (no token in an environment variable) has one exception, for this step only. Verified in Task 1.7 (2026-11-09):
The host half starts `wrangler deploy` as a child process with `CLOUDFLARE_API_TOKEN` set in that child's environment only (the variable `wrangler` reads for this). The token is read in-process from the `cf` profile, never set in the host's environment, never logged or printed, and the child's output goes through the redactor. The second browser approval is not needed.

Checked: `wrangler` 4.158.0, started with only `PATH`, `HOME`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `WRANGLER_SEND_METRICS=false` and `CI=1`, accepted the `cf` OAuth access token (`wrangler whoami` reported an API token from the environment), and `wrangler deploy` of the resident uploaded its assets, script, Durable Object migrations and `AI`, `BROWSER` and `IMAGES` bindings. Before reading the token, the host runs `cf auth whoami --profile <ours>` so an expired access token (about an hour) is refreshed. It never sets `CLOUDFLARE_API_TOKEN` when it runs `cf` itself, because `cf` then ignores the profile.

Fallback, only for a keyring-backed profile: `wrangler login` in the browser, counted in the step table. Reimplementing the upload over REST is not a candidate.

Scopes: the default `cf` list was enough. The deploy needs `workers_scripts:write` (script, assets, migrations, secrets) and the account lookup (`account:read`, `user:read`); `CLOUDFLARE_ACCOUNT_ID` saves the memberships call. Not checked: a token that expires during a long deploy (this one took about 25 seconds).

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
| Durable Objects | classes `Resident`, `BoxHub`; bindings `RESIDENT`, `BOXES` | the deploy (migrations `v1`, `v2`, `v3`) | SQLite-backed; no separate create. The migration list must be carried in full (see Bundles) |
| Bindings, no resource | `AI`, `BROWSER`, `IMAGES` | the deploy | Checked on a Workers Free account (Task 1.4): the deploy is accepted with all three. Browser Run is 10 minutes a day with 3 concurrent browsers on Free; Images is 5,000 unique transformations a month. The code works without either. No fallback needed |
| Secret | `WEB_KEY` (generated) | `wrangler secret put`, stdin | |
| Variable and secret | `AELIOS_URL`, `AELIOS_API_KEY` | deploy config and `put` on stdin | Contest path. The service binding is in "After the contest" |
| Variable, optional | `AELIOS_NAMESPACE`, `AELIOS_IDENTITY` | deploy config | Only when the owner needs another space or picks another identity |

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
- A secret step is `done` only when the secret exists in both places. Local yes, Cloudflare no: put it again. Neither: generate, store, put. Cloudflare yes, local gone: the step is not done; the flow goes to a "set a new one" card that says other clients of that Worker stop working, needs the owner's approval, then stores the new value locally first and puts it.
- A step that fails stops the flow on its card. Earlier steps stay. Nothing is deleted. "Try again" runs the same step; the wizard restarts at the first step whose `check` is not `done`.
- "Start over" forgets the saved progress only. It keeps the generated secrets in DSH credentials, so a re-run finds them and no Cloudflare secret is left that nobody knows. It never deletes cloud resources. A person who wants them gone does it in Cloudflare.
- Order for a new install: auth, d1, migrations, vectorize, queue, secret, deploy Aelios, health, gateway identity, then the resident: secret, deploy, health, pairing.
- The wizard never deploys over, rekeys or changes a Worker it did not create. A found resident switches to the existing-resident path; a found Aelios alone stops the flow with an explanation. The card says that going on would overwrite, and does not offer it in contest scope.

## Bundles

The plugin carries Aelios and resident code as prebuilt output (`wrangler deploy --dry-run --outdir`), so the owner needs no `npm install` and no source build. `bundles/manifest.json` lists, for each bundle, the source commit, a version tag and a hash. A script `scripts/build-bundles.mjs` makes them from two named commits; `npm test` fails when the manifest and the files differ. Both projects are AGPL-3.0 with the same author as this one, so the files are carried with their license. The deploy uploads the prebuilt entry with a temporary config that holds the real D1 id; the temporary config is deleted after. Upload goes through the path chosen in "Worker upload login".

Carried besides code, from the real configs (`wrangler.toml` of Aelios, `wrangler.jsonc` of the resident, `origin/main`, checked 2026-11-09). The manifest lists each item and the test fails when one is missing.

Resident:
- `public/` assets, 18 files: `index.html`, `app.js`, `app.css`, `threads.css`, `attach.js`, `boxes.js`, `group.js`, `hands.mjs`, `machine.js`, `markdown.js`, `progress.js`, `waiting.js`, `sw.js`, `models.json`, two icons, `vendor/alpine-3.14.9.min.js` and its license file.
- `assets.run_worker_first`: `/messengers/*`, `/tg/*`, `/web/*`, `/mcp/*`, `/stickers/*`, `/tasks/*`, `/runner/*`, `/box/*`, `/avatar/*`, `/r/*`, `/manifest.webmanifest`. Without it the assets would answer these routes first.
- Durable Object migrations `v1` (new SQLite class `Resident`), `v2` (new SQLite class `ClaudeBox`), `v3` (rename `ClaudeBox` to `BoxHub`). All three, in order, even on a new install.
- Bindings `AI`, `BROWSER`, `IMAGES`, the `nodejs_compat` flag, `keep_vars`, `observability`. No cron, no queue, no D1.

Aelios:
- Cron trigger `10 20 * * *` (UTC).
- Queue: producer `MEMORY_QUEUE` and a consumer on the same Worker (`max_batch_size` 1, `max_batch_timeout` 30).
- D1 migrations `0001` to `0020` (20 files), the `DB` binding, the `VECTORIZE` binding, the `AI` binding.
- `[cache]` and `[observability]` blocks, `keep_vars`.
- The `[vars]` defaults (about 30 model names and tuning values). They are carried as defaults; `keep_vars` keeps any value the owner has changed.
- Not carried: private values (`CHATBOX_API_KEY` and the other keys), which are secrets.

## Secrets in the wizard

- The secret field is a password input in the shell's own UI. On submit it calls `onboarding.secret` once. The browser half clears the field and keeps nothing.
- The host half keeps held secrets in memory for `redact.mjs` and in DSH credentials. Every string that leaves `cli.mjs` (output, error) and every message sent to the browser half or the explainer passes through `redact`.
- `cli.mjs` starts children with a clean environment (`PATH`, `HOME`, the `cf` profile, nothing else), never puts a secret in `argv`, and passes it on stdin.
- Test: put a known secret through every step with a fake `cf`, fake `wrangler` and fake Aelios; the secret must not appear in any returned value, saved state or captured log.

## Main model card

- Cloudflare models: nothing to store. The list is read from the Aelios model catalog route (`/api/gateway/models`) after the deploy. Credits: the card links to the dashboard to buy credits and then runs a test call.
- BYOK, built-in: provider list read live from the account's AI Gateway when the card opens (`cf` has no such command; Task 1.3 found `GET /accounts/<account>/ai-gateway/providers?per_page=100`, answered with the `cf` token, and `GET https://gateway.ai.cloudflare.com/v1/<account>/<gateway>/compat/models` for the models). The key goes to `cf ai-gateway gateways providers create <gateway> --body @/dev/stdin`, never `--secret`, which would put it in `argv`.
- Memory pattern: the field is pre-filled with the chosen model (default path: `glm-4.7-flash`) and follows it until the owner edits it. If the edited pattern does not match the chosen model (Aelios's own matcher, Task 4.2), the card shows one line, "This model will not be remembered", with an "I know" button. It does not block. An empty field is refused.
- After each choice the wizard sends a test call and shows the answer's first line, or the redacted failure.

## Update (scheduled after the contest)

Wizard installs have no fork, so this is their only update channel.


The deployed version tag (`aelios-desktop bundle <semver>`, set at deploy through `--tag`) is compared with `manifest.json`. A card shows old and new tags, and the new D1 migration names. After approval it runs deploy, migrations, health. Vars and secrets are never rewritten.

## After the contest

Designed so the contest build leaves room, not built yet.

- **Has Aelios, no resident.** Card A asks "Do you run Aelios?". On yes: address and API key (secret), health check, then `identities.mjs` calls `GET /v1/hook/identities` with that key. It is read-only and returns, for each identity, `slug`, `name` and `mainModels`. The card lists them with their main models; the pick becomes the new resident's `AELIOS_IDENTITY`. Nothing in that Aelios is changed.
- **Codex sign-in.** `codex.mjs`: `POST /api/gateway/chatgpt/login` returns an authorize link whose redirect is `http://127.0.0.1:1455/auth/callback`. It listens on that port on 127.0.0.1 for 10 minutes, posts the captured address to `/api/gateway/chatgpt/callback` and runs `/test`. Port busy: show a paste field.
- **Custom provider.** `cf ai-gateway custom-providers create` with name and base URL; then the key as for a built-in provider.
- **Service binding.** A binding gives no caller identity, and the Aelios front door wants an API key. Plan: Aelios adds a `WorkerEntrypoint` that calls its handler as the trusted resident; the resident adds an `AELIOS` binding with that entrypoint and uses it before `fetch`. This changes Aelios (`src/index.ts`, `wrangler.toml`) and the resident (`src/aelios.ts`, `wrangler.jsonc`, `env.d.ts`).
- **"Help me check".** `explain.mjs` builds one message from the step name, the error code and the redacted output. It calls Workers AI (`glm-4.7-flash`, id looked up live) on the owner's account through the REST route with the `cf` token, and offers the Cloudflare MCP server's read tools. The host half owns the tool loop: a tool is called only if its name is on a read allowlist; any other tool name becomes an approval card and waits. The answer is shown as text; it never changes state itself and its text is never run. Checked (Task 1.5): `https://mcp.cloudflare.com/mcp` accepts the `cf` access token as a bearer token. Its tools are `docs`, `search`, `execute` and `whoami`; only `whoami` is marked read-only by the server, `docs` and `search` are read-only in fact but not marked, and `execute` can call any API method. So the allowlist is by name in the host half (`docs`, `search`, `whoami`, and `get_*` with `?codemode=false`), never by the server's hints.

## Open items

1. The service binding needs changes in both other repositories (see above). Until then the wizard uses the address and key.
2. (Settled) An existing resident with a new Aelios does not happen: a resident only works with Aelios, so the wizard never deploys Aelios for an owner who already has a resident.
3. Where users get `cf`. It is an npm package in beta (`cf`). The wizard pins a tested version in `npx`.
4. (Settled, Task 1.7) The Worker upload uses the `cf` token through the child's environment; no second approval.
