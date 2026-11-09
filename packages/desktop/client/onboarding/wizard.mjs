// The first-run wizard. It replaces the connect form until a connection exists: a fixed sequence of cards drawn
// by the shell, no model, and a job behind two of the cards that the status endpoint reports.
import { createElement as h, useEffect, useState } from "react";
import { call } from "../api.mjs";
import { words } from "../strings.mjs";
import { AeliosCard } from "./card-aelios.mjs";
import { AssistantCard } from "./card-assistant.mjs";
import { HelpersCard } from "./card-helpers.mjs";
import { ResidentCard } from "./card-resident.mjs";
import { WranglerCard } from "./card-wrangler.mjs";

const POLL_MS = 1500;

export function Wizard() {
  const t = words();
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = async () => {
    try { setStatus(await call("onboarding.status")); }
    catch (err) { setError(err.message); }
  };
  useEffect(() => { void refresh(); }, []);
  useEffect(() => {
    if (!status?.job?.running) return;
    const timer = setInterval(() => { void refresh(); }, POLL_MS);
    return () => clearInterval(timer);
  }, [status?.job?.running]);

  const act = async (action, input = {}) => {
    setBusy(true); setError("");
    try { setStatus(await call(action, input)); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  if (!status) return h("div", { className: "ad-form" }, h("p", null, error || t.connecting));
  const shared = { status, busy, act };
  const body = status.failed ? ErrorCard({ status, act }) : {
    resident: () => h(ResidentCard, shared),
    aelios: () => h(AeliosCard, shared),
    assistant: () => h(AssistantCard, shared),
    wrangler: () => h(WranglerCard, shared),
    helpers: () => h(HelpersCard, shared),
    error: () => ErrorCard({ status, act }),
    done: () => h("div", { className: "ad-form" }, h("h2", null, t.wizard.connected), h("button", { className: "ad-btn", onClick: () => refresh() }, t.done)),
  }[status.card]?.() ?? ErrorCard({ status, act });

  return h("div", { className: "ad-wizard" },
    h("div", { className: "ad-wizard-step" }, t.wizard.stepOf
      .replace("{n}", String(Math.max(1, (status.cards ?? [status.card]).indexOf(status.card) + 1)))
      .replace("{total}", String(status.count ?? (status.cards ?? []).length ?? 1))),
    status.job?.running && h("div", { className: "ad-note" }, t.wizard.working),
    body,
    (error || status.failed) && h("div", { className: "ad-error", role: "alert" }, error || status.failed.message),
    status.card !== "done" && h("button", { className: "ad-wizard-reset", onClick: () => act("onboarding.reset") }, t.wizard.startOver));
}

function ErrorCard({ status, act }) {
  const t = words();
  return h("div", { className: "ad-form" },
    h("h2", null, t.wizard.failed),
    h("p", null, status.failed?.message ?? t.wizard.failedInfo),
    status.failed?.tail && h("pre", { className: "ad-wizard-tail" }, status.failed.tail),
    h("button", { className: "ad-btn", onClick: () => act("onboarding.retry") }, t.retryIt));
}
