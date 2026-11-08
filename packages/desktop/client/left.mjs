// The left column: who and where. The residents and the group chats as rows of one kind (the one open is marked,
// a resident with something new has a dot), each list with a + to add one; then "Here": this machine, the one place
// its runner's state shows (a dot on its icon, a play button when it is down), opening the machine view. The foot
// holds the settings and the way back to DSH. Search lives in the chat header, alarms in the work panel, usage in
// the settings sheet. Styles in style-rail.mjs; drawn from the resident's own rail.
import { createElement as h, useEffect, useState } from "react";
import { avatarUrl } from "./avatar.mjs";
import { call, web } from "./api.mjs";
import { Face } from "./face.mjs";
import { groupList } from "./group.mjs";
import { Icon } from "./icons.mjs";
import { usePoll } from "./poll.mjs";
import { keepSeen, newsOf, readSeen } from "./seen.mjs";
import { store, useStore } from "./store.mjs";
import { words } from "./strings.mjs";
import { runnerDown, runnerTone } from "./tones.mjs";

const POLL_MS = 30000;
const ID = /^[a-z][a-z0-9-]{0,23}$/;
const loadResidents = async () => { store.set({ residents: (await web("/web/residents", { resident: "default" }))?.residents || [] }); };

/** A section label with a + at its end. */
const Label = ({ text, add, onAdd, open }) => h("p", { className: "ad-label ad-rail-label" }, h("span", null, text),
  onAdd && h("button", { type: "button", className: "ad-icon-btn sm", title: add, "aria-label": add, "aria-expanded": open, onClick: onAdd }, h(Icon, { name: "plus" })));

function NewResident({ t, onDone }) {
  const [form, setForm] = useState({ id: "", name: "", error: "" });
  const save = async (e) => {
    e.preventDefault();
    const id = form.id.trim().toLowerCase();
    if (!ID.test(id) || id === "default") { setForm({ ...form, error: t.residentId }); return; }
    try { await web("/web/residents", { method: "POST", body: { id, name: form.name.trim() }, resident: "default" }); await loadResidents(); onDone(); } catch (err) { setForm({ ...form, error: err.message }); }
  };
  return h("form", { className: "ad-rail-form", onSubmit: save },
    h("input", { autoFocus: true, value: form.name, placeholder: t.name, "aria-label": t.name, onChange: (e) => setForm({ ...form, name: e.target.value }) }),
    h("input", { value: form.id, placeholder: t.residentId, "aria-label": t.residentId, onChange: (e) => setForm({ ...form, id: e.target.value }) }),
    form.error && h("span", { className: "ad-error" }, form.error),
    h("div", { className: "ad-card-row" }, h("button", { type: "submit", className: "ad-btn small" }, t.create), h("button", { type: "button", className: "ad-btn quiet small", onClick: onDone }, t.cancel)));
}

export function Left({ onBack }) {
  const t = words();
  const { status, residents, groups, group, view } = useStore(store);
  const resident = status?.resident || "default";
  const [adding, setAdding] = useState(false);

  usePoll(async () => { try { await loadResidents(); } catch { /* keep the last list */ } }, POLL_MS, []);
  usePoll(async () => { try { store.set({ groups: (await web("/web/groups"))?.groups || [] }); } catch { /* groups are off, or an older resident */ } }, POLL_MS, []);

  const list = residents.length ? residents : [{ id: resident, name: t.title }];
  const { news, seen } = newsOf(list, resident, readSeen());
  useEffect(() => keepSeen(seen), [residents, resident]);

  const pick = async (id) => {
    if (id === resident) { store.set({ group: "", around: null, view: "chat" }); return; }
    try { store.set({ group: "", around: null, view: "chat", status: await call("select", { resident: id }) }); } catch (e) { store.set({ error: e.message }); }
  };
  const start = async () => { try { store.set({ status: await call("start") }); } catch (e) { store.set({ error: e.message }); } };
  const runner = status?.runner || { state: "unpaired", error: "" };
  const word = t.runner[runner.state] || runner.state;
  const chat = view !== "machine";

  return h("nav", { className: "ad-rail", "aria-label": t.residents },
    h("div", { className: "ad-rail-head" },
      h("span", { className: "ad-rail-mark", "aria-hidden": true }, "✦"),
      h("span", { className: "ad-rail-brand" }, t.brand)),
    h("div", { className: "ad-rail-list" },
      h(Label, { text: t.residents, add: t.addResident, open: adding, onAdd: () => setAdding((v) => !v) }),
      adding && h(NewResident, { t, onDone: () => setAdding(false) }),
      list.map((r) => h("button", { key: r.id, type: "button", className: "ad-row-btn", title: r.name || r.id,
        "aria-current": chat && r.id === resident && !group ? "page" : undefined, onClick: () => pick(r.id) },
        h(Face, { resident: r, base: status?.url }),
        h("span", { className: "n" }, r.name || r.id),
        news.has(r.id) && h("span", { className: "ad-dot hot", title: t.unread, "aria-label": t.unread }))),
      h(Label, { text: t.groups, add: t.newGroup, onAdd: () => store.set({ groupSheet: { id: "" } }) }),
      groupList(groups).map((g) => h("button", { key: g.id, type: "button", className: "ad-row-btn", title: g.name,
        "aria-current": chat && g.id === group ? "page" : undefined, onClick: () => store.set({ group: g.id, around: null, view: "chat" }) },
        h("span", { className: "ad-avatar", "aria-hidden": true }, g.icon ? h("img", { src: avatarUrl(status?.url, g.icon), alt: "" }) : h(Icon, { name: "people" })),
        h("span", { className: "n" }, g.name),
        g.running && h("span", { className: "ad-dot ok live", title: t.answering, "aria-label": t.answering }))),
      h(Label, { text: t.here }),
      h("div", { className: "ad-row-wrap" },
        h("button", { type: "button", className: "ad-row-btn", title: `${t.runnerTitle}: ${word}${runner.error ? ` · ${runner.error}` : ""}`,
          "aria-current": view === "machine" ? "page" : undefined, onClick: () => store.set({ view: "machine" }) },
          h("span", { className: "ad-avatar machine", "aria-hidden": true }, h(Icon, { name: "laptop" }),
            h("span", { className: `ad-dot ${runnerTone(runner.state)}${runner.state === "starting" ? " live" : ""}` })),
          h("span", { className: "n" }, t.thisMachine, h("small", null, word))),
        runnerDown(runner.state) && h("button", { type: "button", className: "ad-machine-go", title: t.start, "aria-label": t.start, onClick: start }, h(Icon, { name: "play" })))),
    h("div", { className: "ad-rail-foot" },
      h("button", { type: "button", className: "ad-icon-btn sm", title: t.settings, "aria-label": t.settings, onClick: () => store.set({ sheet: "resident" }) }, h(Icon, { name: "gear" })),
      h("span", { className: "sp" }),
      h("button", { type: "button", className: "ad-dsh", title: t.backToDsh, "aria-label": t.backToDsh, onClick: onBack }, h(Icon, { name: "exit" }), t.dsh)));
}
