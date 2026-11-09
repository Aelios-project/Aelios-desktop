// The Aelios half of a fresh install: the D1 database, its migrations, the Vectorize index, the queue, the
// password, the deploy, the health check and the first gateway identity. Every step is check → do → verify.
import { randomBytes } from "node:crypto";
import { AELIOS_NAME, listSecrets } from "./cloudflare.mjs";

export const D1_NAME = "companion_memory_proxy";
export const VECTORIZE_NAME = "memo-kb";
export const QUEUE_NAME = "companion-memory";
export const DEFAULT_MODEL = "glm-4.7-flash";

const asArray = (value) => Array.isArray(value) ? value : Array.isArray(value?.result) ? value.result : [];
const json = (out, what) => {
  try { return JSON.parse(out.out); } catch { throw new Error(`${what} answered something that is not JSON`); }
};

async function cfJson(ctx, args, what) {
  const out = await ctx.cli.cf([...args, "--profile", ctx.profile]);
  if (out.code !== 0) throw Object.assign(new Error(`${what} failed`), { tail: out.tail });
  return json(out, what);
}

export const generateKey = () => randomBytes(24).toString("base64url");

/** The identity body Aelios accepts: a slug as the URL path, a display name, one key and its main-model pattern. */
export function identityBody({ name, model, pattern }) {
  return {
    slug: "main",
    assistantName: String(name).trim().slice(0, 32),
    namespace: "main",
    keys: ["CHATBOX_API_KEY"],
    models: [pattern || model || DEFAULT_MODEL],
  };
}

export function aeliosSteps(ctx) {
  const deployOptions = () => ({ bundle: ctx.bundle, token: ctx.token, accountId: ctx.accountId, d1Id: ctx.d1Id });

  return {
    d1: {
      check: async () => Boolean(await findD1(ctx)),
      do: async () => {
        const before = await findD1(ctx);
        if (before) { ctx.d1Id = before.uuid; return; }
        await cfJson(ctx, ["d1", "create", "--name", D1_NAME], "Creating the database");
        const after = await findD1(ctx);
        if (!after) throw new Error("The database was created but cannot be found");
        ctx.d1Id = after.uuid;
      },
    },

    migrations: {
      check: async () => {
        const pending = await ctx.deployer.pendingMigrations(ctx.bundle, deployOptions());
        return Array.isArray(pending) && pending.length === 0;
      },
      do: async () => {
        await ctx.deployer.migrate(ctx.bundle, { ...deployOptions(), database: D1_NAME });
      },
    },

    vectorize: {
      check: async () => {
        const index = await vectorizeIndex(ctx);
        if (!index) return false;
        const dimensions = Number(index.config?.dimensions ?? 0);
        if (dimensions !== 1024) throw new Error(`The index ${VECTORIZE_NAME} has ${dimensions} dimensions, not 1024. Its contents cannot be moved by the wizard.`);
        return true;
      },
      do: async () => {
        await cfJson(ctx, ["vectorize", "create", "--name", VECTORIZE_NAME, "--config-dimensions", "1024", "--config-metric", "cosine"], "Creating the index");
      },
    },

    queue: {
      check: async () => (await queues(ctx)).some((queue) => queue.queue_name === QUEUE_NAME),
      do: async () => { await cfJson(ctx, ["queues", "create", "--queue-name", QUEUE_NAME], "Creating the queue"); },
    },

    "aelios-secret": {
      check: async () => {
        const local = await ctx.secrets.get("aelios-key");
        if (local) { ctx.keys.aelios = local; ctx.redactor.add(local); }
        const cloud = await listSecrets(ctx.cli, AELIOS_NAME, ctx.profile);
        if (cloud.includes("CHATBOX_API_KEY") && !local) throw new Error("Cloudflare has this password but this machine lost its copy. Set a new one, or other clients of this deployment stop working.");
        return Boolean(local) && cloud.includes("CHATBOX_API_KEY");
      },
      do: async () => {
        const key = (await ctx.secrets.get("aelios-key")) ?? generateKey();
        await ctx.secrets.set("aelios-key", key);
        ctx.keys.aelios = key;
        ctx.redactor.add(key);
        await ctx.deployer.secret(ctx.bundle, { ...deployOptions(), name: "CHATBOX_API_KEY", value: key });
      },
    },

    "aelios-deploy": {
      // No cloud check: wrangler's --tag lands on a version, not on the Worker's tags, so the saved step flag is
      // the honest signal. A re-run after a later failure skips it; "Start over" deploys again, over our own Worker.
      do: async () => { await ctx.deployer.upload(ctx.bundle, { ...deployOptions(), tag: ctx.tag }); },
    },

    "aelios-health": {
      check: async () => {
        const url = await ctx.workerUrl(AELIOS_NAME);
        if (!url) return false;
        ctx.aeliosUrl = url;
        try { return (await ctx.fetch(`${url}/health`)).ok; } catch { return false; }
      },
      do: async () => {
        const url = await ctx.workerUrl(AELIOS_NAME);
        if (!url) throw new Error("Cloudflare did not report an address for the deployed Worker");
        ctx.aeliosUrl = url;
        const response = await ctx.fetch(`${url}/health`);
        if (!response.ok) throw new Error(`The health check answered ${response.status}`);
      },
    },

    gateway: {
      check: async () => {
        const response = await ctx.fetch(`${ctx.aeliosUrl}/v1/hook/identities`, { headers: { authorization: `Bearer ${ctx.keys.aelios}` } });
        if (!response.ok) return false;
        const data = await response.json();
        return (data.identities ?? []).some((identity) => identity.slug === "main");
      },
      do: async () => {
        const body = identityBody({ name: ctx.assistantName, model: ctx.model, pattern: ctx.pattern });
        const response = await ctx.fetch(`${ctx.aeliosUrl}/api/gateway/config`, {
          method: "PATCH",
          headers: { authorization: `Bearer ${ctx.keys.aelios}`, "content-type": "application/json" },
          body: JSON.stringify({ identities: [body] }),
        });
        if (!response.ok) throw new Error(`Aelios answered ${response.status} while saving the assistant`);
      },
    },
  };
}

async function findD1(ctx) {
  const rows = asArray(await cfJson(ctx, ["d1", "list"], "Listing the databases"));
  const found = rows.find((row) => row.name === D1_NAME);
  if (found?.uuid) ctx.d1Id = found.uuid;
  return found ?? null;
}

async function vectorizeIndex(ctx) {
  const rows = asArray(await cfJson(ctx, ["vectorize", "list"], "Listing the indexes"));
  return rows.find((row) => row.name === VECTORIZE_NAME) ?? null;
}

async function queues(ctx) {
  return asArray(await cfJson(ctx, ["queues", "list"], "Listing the queues"));
}

