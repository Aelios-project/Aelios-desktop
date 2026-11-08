// A group's settings, or a new group: its name, who is in it (two residents at least), who answers when nobody is
// named, in what order, and for how many rounds; for an existing group also stopping its answers and deleting it
// (two presses). POST /web/groups makes one; /web/group/config, /web/group/stop and /web/group/remove take ?g=<id>.
import { createElement as h, useState } from "react";
import { web } from "./api.mjs";
import { Face } from "./face.mjs";
import { Icon } from "./icons.mjs";
import { store, useStore } from "./store.mjs";
import { words } from "./strings.mjs";

const reloadGroups = async () => store.set({ groups: (await web("/web/groups"))?.groups || [] });

export function GroupSheet() {
  const t = words();
  const { groupSheet, groups, residents, status } = useStore(store);
  const was = groups.find((g) => g.id === groupSheet?.id) || null;
  const [form, setForm] = useState(() => ({ name: was?.name || "", members: was?.members || [], reply: was?.reply || "all", order: was?.order || "list", rounds: was?.rounds || 2 }));
  const [error, setError] = useState("");
  const [sure, setSure] = useState(false);
  if (!groupSheet) return null;
  const q = (path) => `${path}?g=${encodeURIComponent(was?.id || "")}`;
  const shut = () => store.set({ groupSheet: null });
  const run = async (job) => { try { await job(); setError(""); } catch (e) { setError(e.message); } };
  const save = (e) => { e.preventDefault(); void run(async () => {
    const body = { ...form, rounds: Number(form.rounds) };
    const d = await web(was ? q("/web/group/config") : "/web/groups", { method: "POST", body });
    if (d?.error) throw new Error(d.error);
    await reloadGroups();
    if (!was && d?.group?.id) store.set({ group: d.group.id, view: "chat" });
    shut();
  }); };
  const remove = () => run(async () => {
    if (!sure) { setSure(true); return; }
    await web(q("/web/group/remove"), { method: "POST", body: {} });
    await reloadGroups();
    store.set({ group: "", groupSheet: null });
  });
  const toggle = (id) => setForm({ ...form, members: form.members.includes(id) ? form.members.filter((m) => m !== id) : [...form.members, id] });
  const choice = (key, options) => h("div", { className: "ad-seg", role: "radiogroup" }, Object.entries(options).map(([v, label]) => h("button", { key: v, type: "button", role: "radio", "aria-checked": form[key] === v, onClick: () => setForm({ ...form, [key]: v }) }, label)));

  return h("div", { className: "ad-scrim", onClick: (e) => { if (e.target === e.currentTarget) shut(); }, onKeyDown: (e) => { if (e.key === "Escape") shut(); } },
    h("form", { className: "ad-sheet small", role: "dialog", "aria-modal": true, "aria-label": was ? t.groupSettings : t.newGroup, onSubmit: save },
      h("div", { className: "ad-sheet-head" }, h("h2", null, was ? t.groupSettings : t.newGroup),
        h("button", { type: "button", className: "ad-icon-btn sm", title: t.close, "aria-label": t.close, onClick: shut }, h(Icon, { name: "close" }))),
      h("div", { className: "ad-sheet-scroll" },
        h("div", { className: "ad-field-row" }, h("label", null, t.name),
          h("div", { className: "ad-set-line" }, h("input", { autoFocus: true, value: form.name, "aria-label": t.name, onChange: (e) => setForm({ ...form, name: e.target.value }) }))),
        h("div", { className: "ad-field-row" }, h("label", null, t.members, h("span", { className: "ok" }, `${form.members.length}`)),
          h("div", { className: "ad-checks" }, residents.map((r) => h("label", { key: r.id, className: "ad-check" },
            h("input", { type: "checkbox", checked: form.members.includes(r.id), onChange: () => toggle(r.id) }), h(Face, { resident: r, base: status?.url, className: " mini" }), r.name || r.id)))),
        h("div", { className: "ad-field-row" }, h("label", null, t.whoAnswers), choice("reply", t.reply)),
        h("div", { className: "ad-field-row" }, choice("order", t.order)),
        h("div", { className: "ad-field-row" }, h("label", null, t.rounds),
          h("div", { className: "ad-set-line" }, h("input", { type: "number", min: 1, max: 10, value: form.rounds, "aria-label": t.rounds, style: { maxWidth: 90 }, onChange: (e) => setForm({ ...form, rounds: e.target.value }) }))),
        error && h("p", { className: "ad-error" }, error),
        h("div", { className: "ad-card-row" },
          was && h("button", { type: "button", className: "ad-btn quiet small", onClick: () => run(() => web(q("/web/group/stop"), { method: "POST", body: {} })) }, h(Icon, { name: "stop" }), t.stopGroup),
          was && h("button", { type: "button", className: "ad-btn quiet small danger", onClick: remove }, h(Icon, { name: "trash" }), sure ? t.sureDelete : t.removeGroup),
          h("span", { className: "sp" }),
          h("button", { type: "submit", className: "ad-btn small", disabled: form.members.length < 2 }, was ? t.save : t.create)))));
}
