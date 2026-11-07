// The connect form: address and web key, with the folder, helper and permission already filled in.
import { createElement as h, useState } from "react";
import { call } from "./api.mjs";
import { store } from "./store.mjs";
import { words } from "./strings.mjs";

export function ConnectForm({ defaultWorkspace = "" }) {
  const t = words();
  const [form, setForm] = useState({ url: "", key: "", workspace: "", helper: "dsh", access: "edit", confirmFull: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (name) => (e) => setForm({ ...form, [name]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      store.set({ status: await call("connect", { ...form, workspace: form.workspace || undefined }) });
    } catch (err) {
      setError(err.message);
      setForm({ ...form, key: "" }); // the key is never kept after a failed try
    } finally { setBusy(false); }
  }

  const field = (name, label, props = {}) => h("label", null, label, h("input", { value: form[name], onChange: set(name), disabled: busy, ...props }));
  return h("form", { className: "ad-form", onSubmit: submit },
    field("url", t.address, { type: "url", required: true, placeholder: "https://", autoComplete: "off" }),
    field("key", t.key, { type: "password", required: true, autoComplete: "off" }),
    field("workspace", t.folder, { placeholder: defaultWorkspace }),
    h("label", null, t.helper, h("select", { value: form.helper, onChange: set("helper"), disabled: busy }, h("option", { value: "dsh" }, "DSH"), h("option", { value: "kiro" }, "Kiro"))),
    h("label", null, t.access, h("select", { value: form.access, onChange: set("access"), disabled: busy }, ["read", "edit", "full"].map((v) => h("option", { key: v, value: v }, v)))),
    form.access === "full" && h("label", null, h("span", null, h("input", { type: "checkbox", checked: form.confirmFull, onChange: set("confirmFull") }), " ", t.fullOk)),
    error && h("div", { className: "ad-error", role: "alert" }, error),
    h("button", { className: "ad-btn", type: "submit", disabled: busy }, busy ? t.connecting : t.connect));
}
