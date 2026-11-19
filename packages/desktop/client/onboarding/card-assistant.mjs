// Card S: the assistant's name, its main model and the memory pattern. The pattern follows the model until the
// owner edits it; a pattern that does not match only warns, it never blocks.
import { createElement as h, useState } from "react";
import { words } from "../strings.mjs";
import { matchesMainModel } from "./pattern.mjs";

export function AssistantCard({ status, busy, act }) {
  const t = words();
  const [form, setForm] = useState({
    name: status.values?.name ?? "",
    model: status.values?.model ?? t.wizard.defaultModel,
    pattern: status.values?.pattern ?? t.wizard.defaultModel,
  });
  const [editedPattern, setEditedPattern] = useState(Boolean(status.values?.pattern));
  const [know, setKnow] = useState(false);
  const set = (name) => (event) => {
    const value = event.target.value;
    setForm((current) => {
      // Until the owner edits the pattern it follows the chosen model.
      if (name === "model" && !editedPattern) return { ...current, model: value, pattern: value };
      return { ...current, [name]: value };
    });
    if (name === "pattern") setEditedPattern(true);
  };
  const warn = Boolean(form.pattern && form.model && !matchesMainModel([form.pattern], form.model));
  const submit = (event) => {
    event.preventDefault();
    if (warn && !know) return;
    void act("onboarding.answer", { values: form });
  };

  return h("form", { className: "ad-form", onSubmit: submit },
    h("h2", null, t.wizard.assistantTitle),
    h("label", null, t.name, h("input", { value: form.name, onChange: set("name"), maxLength: 32, required: true, placeholder: t.wizard.assistantName })),
    h("label", null, t.model, h("input", { value: form.model, onChange: set("model"), list: "ad-wizard-models" }),
      h("datalist", { id: "ad-wizard-models" }, ["glm-4.7-flash", "deepseek/deepseek-v4-pro"].map((model) => h("option", { key: model, value: model })))),
    h("label", null, t.wizard.pattern, h("input", { value: form.pattern, onChange: set("pattern"), required: true })),
    h("p", { className: "ad-note" }, t.wizard.patternInfo),
    warn && h("label", { className: "check" },
      h("span", null, h("input", { type: "checkbox", checked: know, onChange: (event) => setKnow(event.target.checked) }), " ", t.wizard.rememberWarn)),
    h("button", { className: "ad-btn", type: "submit", disabled: busy || (warn && !know) }, busy ? t.wizard.working : t.wizard.deploy));
}
