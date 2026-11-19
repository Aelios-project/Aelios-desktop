// Card A: the Cloudflare browser approval, then the scan for Workers. The link and the code come from the
// running `cf auth create` job; the card shows both in case the browser does not open.
import { createElement as h, useEffect } from "react";
import { words } from "../strings.mjs";

export function AeliosCard({ status, busy, act }) {
  const t = words();
  const job = status.job;
  const events = job?.events ?? [];
  const last = events.at(-1) ?? {};
  useEffect(() => { if (!job) void act("onboarding.answer", {}); }, []);

  if (job?.running) {
    return h("div", { className: "ad-form" },
      h("h2", null, t.wizard.aeliosTitle),
      h("p", null, t.wizard.waiting),
      last.link && h("a", { className: "ad-btn", href: last.link, target: "_blank", rel: "noreferrer" }, t.wizard.openLink),
      last.code && h("p", null, `${t.wizard.code}: ${last.code}`),
      h("p", { className: "ad-note" }, t.wizard.aeliosInfo));
  }

  return h("div", { className: "ad-form" },
    h("h2", null, t.wizard.aeliosTitle),
    h("p", null, t.wizard.aeliosInfo),
    h("button", { className: "ad-btn", disabled: busy, onClick: () => act("onboarding.answer", {}) }, t.wizard.approveCf));
}
