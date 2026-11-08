// The settings sheet's smaller extras: the sticker packs (on or off, delete, import by link), Telegram's connect
// button, background help (GitHub Actions set-up, a test thread, roles) and the App section (language, disconnect).
import { createElement as h, useEffect, useState } from "react";
import { call, web } from "./api.mjs";
import { Icon } from "./icons.mjs";
import { stickerSrc } from "./media.mjs";
import { store, useStore } from "./store.mjs";
import { LANGS, langNow, setLang, words } from "./strings.mjs";

/** A POST that may answer { error }, with its error kept for the block to show. */
function usePost(resident) {
  const [error, setError] = useState("");
  const post = async (path, body = {}) => {
    try { const d = await web(path, { method: "POST", body, resident }); if (d?.error) throw new Error(d.error); setError(""); return d; } catch (e) { setError(e.message); return null; }
  };
  return [post, error];
}

export function StickersBlock({ resident }) {
  const t = words();
  const { status } = useStore(store);
  const [packs, setPacks] = useState(null);
  const [link, setLink] = useState("");
  const [post, error] = usePost(resident);
  useEffect(() => { void web("/web/stickers", { resident }).then((d) => setPacks(d?.packs || [])).catch(() => setPacks([])); }, [resident]);
  const after = (d) => { if (d?.packs) setPacks(d.packs); };
  return h("div", { className: "ad-sheet-block" },
    h("span", { className: "ad-label" }, h(Icon, { name: "sticker" }), t.packs),
    (packs || []).map((p) => h("div", { key: p.id, className: "ad-pack-row" },
      h("div", { className: "ad-list-row" },
        h("span", { className: "n" }, p.name || p.id, h("small", null, `${(p.stickers || []).length}`)),
        h("label", { className: "ad-switch", title: p.enabled ? "On" : "Off" }, h("input", { type: "checkbox", checked: Boolean(p.enabled), onChange: async (e) => after(await post("/web/stickers/pack", { id: p.id, on: e.target.checked })) }), h("span", null)),
        h("button", { type: "button", className: "ad-icon-btn sm danger", title: t.drop, "aria-label": t.drop, onClick: async () => after(await post("/web/stickers/remove", { id: p.id })) }, h(Icon, { name: "trash" }))),
      h("div", { className: "ad-pack-strip" }, (p.stickers || []).slice(0, 12).map((s) => h("img", { key: s.key, src: stickerSrc(status?.url, resident, s.key), alt: s.name || "", title: s.when || s.name || "" }))))),
    h("form", { className: "ad-sheet-form row", onSubmit: async (e) => { e.preventDefault(); const d = await post("/web/stickers/import", { url: link }); if (d) { after(d); setLink(""); } } },
      h("input", { placeholder: t.packLink, "aria-label": t.importPack, value: link, onChange: (e) => setLink(e.target.value) }),
      h("button", { type: "submit", className: "ad-btn quiet small", disabled: !link }, h(Icon, { name: "plus" }), t.importPack)),
    error && h("p", { className: "ad-error" }, error));
}

export function TelegramBlock({ resident }) {
  const t = words();
  const [post, error] = usePost(resident);
  const [done, setDone] = useState(false);
  return h("div", { className: "ad-card-row" },
    h("span", { className: "ad-label" }, t.telegram), h("span", { className: "sp" }),
    done && h("span", { className: "ad-pill ok" }, h("span", { className: "ad-dot ok" }), t.saved),
    h("button", { type: "button", className: "ad-btn quiet small", onClick: async () => setDone(Boolean(await post("/web/telegram/connect"))) }, h(Icon, { name: "plug" }), t.telegramConnect),
    error && h("p", { className: "ad-error full" }, error));
}

export function WorkBlock({ resident }) {
  const t = words();
  const [tasks, setTasks] = useState(null);
  const [role, setRole] = useState(null);
  const [post, error] = usePost(resident);
  useEffect(() => { void web("/web/tasks", { resident }).then(setTasks).catch(() => setTasks(null)); }, [resident]);
  const after = (d) => { if (d && !d.error && d.roles) setTasks(d); };
  return h("div", { className: "ad-sheet-block" },
    h("div", { className: "ad-card-row" },
      h("button", { type: "button", className: "ad-btn quiet small", onClick: async () => after(await post("/web/tasks/github")) }, h(Icon, { name: "cloud" }), t.githubSetup),
      h("button", { type: "button", className: "ad-btn quiet small", onClick: async () => after(await post("/web/tasks/test")) }, h(Icon, { name: "play" }), t.testTask),
      tasks?.github?.repo && h("span", { className: "ad-mi" }, h(Icon, { name: "folder" }), tasks.github.repo)),
    tasks?.github?.problem && h("p", { className: "ad-error" }, tasks.github.problem),
    h("div", { className: "ad-sheet-subhead" }, h("span", { className: "ad-label" }, t.roles), h("span", { className: "sp" }),
      h("button", { type: "button", className: "ad-btn quiet small", "aria-expanded": Boolean(role), onClick: () => setRole(role ? null : { name: "", template: "", model: "" }) }, h(Icon, { name: "plus" }), t.addRole)),
    role && h("form", { className: "ad-sheet-form", onSubmit: async (e) => { e.preventDefault(); const d = await post("/web/tasks/roles", role); if (d) { after(d); setRole(null); } } },
      h("input", { placeholder: t.roleName, "aria-label": t.roleName, value: role.name, onChange: (e) => setRole({ ...role, name: e.target.value }) }),
      h("textarea", { rows: 3, placeholder: t.roleTemplate, "aria-label": t.roleTemplate, value: role.template, onChange: (e) => setRole({ ...role, template: e.target.value }) }),
      h("input", { placeholder: t.roleModel, "aria-label": t.roleModel, value: role.model, onChange: (e) => setRole({ ...role, model: e.target.value }) }),
      h("button", { type: "submit", className: "ad-btn small", disabled: !role.name }, t.save)),
    (tasks?.roles || []).map((r) => h("div", { key: r.name, className: "ad-list-row" },
      h("span", { className: "n" }, r.name, h("small", null, r.model || "")),
      h("button", { type: "button", className: "ad-icon-btn sm danger", title: t.drop, "aria-label": t.drop, onClick: async () => after(await post("/web/tasks/roles/remove", { name: r.name })) }, h(Icon, { name: "trash" })))),
    error && h("p", { className: "ad-error" }, error));
}

export function AppSection() {
  const t = words();
  const lang = langNow();
  const off = async () => { try { store.set({ sheet: "", status: await call("disconnect") }); } catch (e) { store.set({ error: e.message }); } };
  return h("div", { className: "ad-sheet-sections" },
    h("div", { className: "ad-sheet-block" },
      h("span", { className: "ad-label" }, h(Icon, { name: "globe" }), t.language),
      h("div", { className: "ad-seg", role: "radiogroup", "aria-label": t.language }, LANGS.map((l) => h("button", { key: l.id, type: "button", role: "radio", "aria-checked": l.id === lang,
        onClick: () => { setLang(l.id); store.set({ lang: l.id }); } }, l.name)))),
    h("div", { className: "ad-sheet-block" },
      h("div", { className: "ad-card-row" }, h("span", { className: "ad-label" }, t.disconnect), h("span", { className: "sp" }),
        h("button", { type: "button", className: "ad-btn quiet small danger", onClick: off }, h(Icon, { name: "exit" }), t.disconnect))));
}
