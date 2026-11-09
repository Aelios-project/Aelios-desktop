// Card R: "Do you already run a resident?" A resident that exists already has its Aelios, so this question
// comes first and an existing one never sees the Aelios card.
import { createElement as h, useState } from "react";
import { words } from "../strings.mjs";

export function ResidentCard({ status, busy, act }) {
  const t = words();
  const [mode, setMode] = useState(status.values?.url ? "key" : "ask");
  const [form, setForm] = useState({ url: status.values?.url ?? "", key: "" });
  const set = (name) => (event) => setForm({ ...form, [name]: event.target.value });

  if (mode === "ask") {
    return h("div", { className: "ad-form" },
      h("h2", null, t.wizard.residentQ),
      h("button", { className: "ad-btn", disabled: busy, onClick: () => act("onboarding.answer", { values: { exists: false } }) }, t.wizard.no),
      h("button", { className: "ad-btn quiet", disabled: busy, onClick: () => setMode("key") }, t.wizard.yes));
  }

  const submit = async (event) => {
    event.preventDefault();
    // The key is sent once and cleared here, whatever the host answers.
    await act("onboarding.answer", { values: { ...form, exists: true }, secret: form.key });
    setForm((current) => ({ ...current, key: "" }));
  };
  return h("form", { className: "ad-form", onSubmit: submit },
    h("h2", null, t.wizard.yes),
    status.values?.found === "resident" && h("p", null, t.wizard.foundResident),
    h("label", null, t.address, h("input", { type: "url", required: true, value: form.url, onChange: set("url"), placeholder: "https://", autoComplete: "off" })),
    h("label", null, t.key, h("input", { type: "password", required: true, value: form.key, onChange: set("key"), autoComplete: "off" })),
    h("button", { className: "ad-btn", type: "submit", disabled: busy }, busy ? t.connecting : t.connect));
}
