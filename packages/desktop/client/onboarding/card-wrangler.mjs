// The extra card a keychain-backed cf profile needs: wrangler has its own login store, and its token cannot be
// read out of the keychain. One browser approval, counted as a step for that owner only.
import { createElement as h, useEffect } from "react";
import { words } from "../strings.mjs";

export function WranglerCard({ status, busy, act }) {
  const t = words();
  useEffect(() => { if (!status.job) void act("onboarding.answer", {}); }, []);
  return h("div", { className: "ad-form" },
    h("h2", null, "wrangler"),
    h("p", null, t.wizard.keychain),
    status.job?.running
      ? h("p", { className: "ad-note" }, t.wizard.waiting)
      : h("button", { className: "ad-btn", disabled: busy, onClick: () => act("onboarding.answer", {}) }, t.wizard.approveWrangler));
}
