// Card H: the helper, the folder and the permission tier on one card, then Start. The new keys are shown once
// above this card by the wizard, never sent through a helper.
import { createElement as h, useState } from "react";
import { words } from "../strings.mjs";

export function HelpersCard({ status, busy, act }) {
  const t = words();
  const [form, setForm] = useState({
    helper: status.values?.helper ?? "dsh",
    access: status.values?.access ?? "edit",
    workspace: status.values?.workspace ?? "",
    confirmFull: false,
  });
  const set = (name) => (event) => setForm({ ...form, [name]: event.target.type === "checkbox" ? event.target.checked : event.target.value });
  const submit = async (event) => {
    event.preventDefault();
    await act("onboarding.answer", { values: form });
    await act("onboarding.run", {});
  };

  return h("form", { className: "ad-form", onSubmit: submit },
    h("h2", null, t.wizard.helpersTitle),
    h("p", { className: "ad-note" }, (status.helpers ?? []).some((helper) => helper.path)
      ? `${t.wizard.helpersFound}: ${(status.helpers ?? []).filter((helper) => helper.path).map((helper) => helper.name).join(", ")}`
      : t.wizard.helpersNone),
    h("label", null, t.helper, h("select", { value: form.helper, onChange: set("helper") }, h("option", { value: "dsh" }, "DSH"), h("option", { value: "kiro" }, "Kiro"))),
    h("label", null, t.folder, h("input", { value: form.workspace, onChange: set("workspace"), placeholder: t.wizard.workspaceHint })),
    h("label", null, t.access, h("select", { value: form.access, onChange: set("access") }, ["read", "edit", "full"].map((tier) => h("option", { key: tier, value: tier }, t.tier[tier])))),
    form.access === "full" && h("label", { className: "check" },
      h("span", null, h("input", { type: "checkbox", checked: form.confirmFull, onChange: set("confirmFull") }), " ", t.fullOk)),
    h("button", { className: "ad-btn", type: "submit", disabled: busy || status.job?.running }, busy ? t.wizard.working : t.wizard.start));
}
