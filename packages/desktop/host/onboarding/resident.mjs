// The resident half of a fresh install: two secrets, the deploy with the Aelios address as a variable, the
// health check, and pairing the runner. The resident never gets a model outside Aelios or a box.
import { RESIDENT_NAME, listSecrets, workerUrl } from "./cloudflare.mjs";

export const WEB_KEY_NAME = "WEB_KEY";
export const AELIOS_KEY_NAME = "AELIOS_API_KEY";

const cloudHas = async (ctx, name) => (await listSecrets(ctx.cli, RESIDENT_NAME, ctx.profile)).includes(name);

export function residentSteps(ctx) {
  const options = () => ({ bundle: ctx.residentBundle, token: ctx.token, accountId: ctx.accountId });

  return {
    "resident-secret": {
      check: async () => {
        const local = await ctx.secrets.get("web-key");
        if (local) { ctx.keys.web = local; ctx.redactor.add(local); }
        if (await cloudHas(ctx, WEB_KEY_NAME) && !local) {
          throw new Error("Cloudflare has the web key but this machine lost its copy. Set a new one, then other browser sessions need it again.");
        }
        return Boolean(local) && await cloudHas(ctx, WEB_KEY_NAME) && await cloudHas(ctx, AELIOS_KEY_NAME);
      },
      do: async () => {
        const web = (await ctx.secrets.get("web-key")) ?? ctx.generate();
        await ctx.secrets.set("web-key", web);
        ctx.keys.web = web;
        ctx.redactor.add(web).add(ctx.keys.aelios);
        await ctx.deployer.secret(ctx.residentBundle, { ...options(), name: WEB_KEY_NAME, value: web });
        await ctx.deployer.secret(ctx.residentBundle, { ...options(), name: AELIOS_KEY_NAME, value: ctx.keys.aelios });
      },
    },

    "resident-deploy": {
      do: async () => {
        await ctx.deployer.upload(ctx.residentBundle, { ...options(), tag: ctx.tag, vars: { AELIOS_URL: ctx.aeliosUrl } });
      },
    },

    "resident-health": {
      check: async () => {
        const url = workerUrl(await ctx.getWorker(RESIDENT_NAME));
        if (!url) return false;
        ctx.residentUrl = url;
        try { return (await ctx.fetch(`${url}/`)).ok; } catch { return false; }
      },
      do: async () => {
        const url = workerUrl(await ctx.getWorker(RESIDENT_NAME));
        if (!url) throw new Error("Cloudflare did not report an address for the resident");
        ctx.residentUrl = url;
        const response = await ctx.fetch(`${url}/`);
        if (!response.ok) throw new Error(`The resident answered ${response.status}`);
      },
    },

  };
}
