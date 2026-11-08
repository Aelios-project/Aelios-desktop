// The left column: who this is, what it has coming, and what it costs.
//   the residents (a card for the current one, a row for the others)
//   the alarms still to ring — the room that is left in this column goes here
//   the usage line at the very foot, then the two buttons that leave this column
// Styles in style-rail.mjs; drawn from the resident's own rail.
import { createElement as h, useCallback, useEffect, useState } from "react";
import { call, web } from "./api.mjs";
import { soonAlarms } from "./alarms.mjs";
import { askedFor, hitRows, searchPath, snippetOf } from "./search.mjs";
import { Face } from "./face.mjs";
import { groupList } from "./group.mjs";
import { Icon } from "./icons.mjs";
import { store, useStore } from "./store.mjs";
import { words } from "./strings.mjs";
import { usageRows } from "./usage.mjs";

const POLL_MS = 30000;

export function Left({ onBack }) {
  const t = words();
  const { status, residents, usage, alarms, search, groups, group } = useStore(store);
  const resident = status?.resident || "default";
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");

  // Read separately: a route the resident refuses (or an older host that has not been restarted) must not hide the
  // numbers that did arrive.
  const loadAll = useCallback(async () => {
    const [u, a] = await Promise.allSettled([web("/web/usage", { resident }), web("/web/alarms", { resident })]);
    const patch = {};
    if (u.status === "fulfilled") patch.usage = u.value?.totals || {};
    if (a.status === "fulfilled") patch.alarms = { on: Boolean(a.value?.on), alarms: a.value?.alarms || [] };
    if (Object.keys(patch).length) store.set(patch);
  }, [resident]);

  useEffect(() => {
    const load = async () => {
      try { store.set({ residents: (await web("/web/residents", { resident: "default" }))?.residents || [] }); } catch { /* keep the last list */ }
    };
    void load();
    const timer = setInterval(() => { if (!document.hidden) void load(); }, POLL_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    void loadAll();
    const timer = setInterval(() => { if (!document.hidden) void loadAll(); }, POLL_MS);
    return () => clearInterval(timer);
  }, [loadAll]);
  const move = async (alarm) => {
    const when = window.prompt(t.moveAlarm, alarm.when);
    if (!when) return;
    setBusy(true);
    try { await web("/web/alarms/edit", { method: "POST", body: { id: alarm.id, when }, resident }); await loadAll(); } catch (e) { store.set({ error: e.message }); } finally { setBusy(false); }
  };
  const drop = async (alarm) => {
    setBusy(true);
    try { await web("/web/alarms/remove", { method: "POST", body: { id: alarm.id }, resident }); await loadAll(); } catch (e) { store.set({ error: e.message }); } finally { setBusy(false); }
  };
  const find = async (event) => {
    event.preventDefault();
    const asked = askedFor(q);
    if (asked.error) { store.set({ search: { q, results: [], done: true, busy: false } }); return; }
    store.set({ search: { q: asked.query, results: [], busy: true, done: false } });
    try {
      const found = await web(searchPath(asked.query), { resident });
      store.set({ search: { q: asked.query, results: hitRows(found?.results || []), busy: false, done: true } });
    } catch (e) { store.set({ error: e.message, search: { q: asked.query, results: [], busy: false, done: true } }); }
  };
  const openHit = async (hit) => {
    try {
      const around = await web(`/web/search/around?id=${encodeURIComponent(hit.id)}`, { resident });
      store.set({ around: { lines: around?.lines || [], id: hit.id } });
    } catch (e) { store.set({ error: e.message }); }
  };
  const pick = async (id) => store.set({ status: await call("select", { resident: id }) });
  const list = residents.length ? residents : [{ id: "default", name: t.title }];
  const current = list.find((r) => r.id === resident) || list[0];
  const others = list.filter((r) => r.id !== current.id);
  const rows = usageRows(usage);
  const next = soonAlarms(alarms.alarms);

  return h("nav", { className: "ad-rail", "aria-label": t.residents },
    h("div", { className: "ad-rail-head" },
      h("span", { className: "ad-rail-brand" }, h("span", { className: "ad-rail-mark", "aria-hidden": true }, "✦"), t.residents)),
    h("button", { type: "button", className: "ad-current on", title: current.name, onClick: () => pick(current.id) },
      h(Face, { resident: current, base: status?.url }),
      h("span", { className: "ad-name" }, current.name || current.id),
      h("span", { className: "ad-tag" }, status?.runner?.state ? (t.runner[status.runner.state] || status.runner.state) : t.title)),
    others.map((r) => h("button", { key: r.id, type: "button", className: "ad-rail-item", title: r.name, onClick: () => pick(r.id) },
      h(Face, { resident: r, base: status?.url }),
      h("span", { className: "ad-txt" }, h("span", { className: "ad-label" }, r.name || r.id)))),

    h("form", { className: "ad-find", onSubmit: find },
      h("input", { type: "search", value: q, placeholder: t.searchHint, "aria-label": t.search, onChange: (e) => setQ(e.target.value) }),
      search.q && h("button", { type: "button", className: "ad-find-x", "aria-label": t.backToChat, title: t.backToChat, onClick: () => { setQ(""); store.set({ search: { q: "", results: [], done: false, busy: false } }); } }, h(Icon, { name: "close" }))),
    search.q && h("div", { className: "ad-finds" },
      search.busy && h("p", { className: "ad-hint" }, "…"),
      !search.busy && search.done && !search.results.length && h("p", { className: "ad-hint" }, t.noHits),
      search.results.map((hit) => h("button", { key: hit.id, type: "button", className: "ad-find-hit", onClick: () => openHit(hit) },
        h("span", { className: "t" }, snippetOf(hit).before, h("b", null, snippetOf(hit).match), snippetOf(hit).after),
        h("span", { className: "s" }, hit.role === "user" ? t.mine : t.given)))),
    h("div", { className: `ad-alarms${search.q ? " quiet" : ""}` },
      h("p", { className: "ad-group-title" }, t.alarms),
      !alarms.on ? h("p", { className: "ad-hint" }, t.alarmsOff)
        : next.length ? next.map((a) => h("div", { key: a.id, className: "ad-alarm", title: a.note },
          h("button", { type: "button", className: "ad-alarm-main", disabled: !a.edit || Boolean(busy),
            title: a.edit ? t.moveAlarm : a.note,
            onClick: () => a.edit && move(a) },
            h("span", { className: "w" }, a.when), h("span", { className: "n" }, a.note)),
          h("button", { type: "button", className: "ad-alarm-x", title: t.dropAlarm, "aria-label": t.dropAlarm, disabled: Boolean(busy),
            onClick: () => drop(a) }, h(Icon, { name: "close" }))))
        : h("p", { className: "ad-hint" }, t.noAlarms)),

    rows.length > 0 && h("div", { className: "ad-usage" },
      rows.map((row) => h("div", { key: row.key, className: "ad-urow", title: row.label },
        h("span", { className: "l" }, row.label), h("span", { className: "s" }, row.size), h("span", { className: "h" }, row.hit)))),
    h("div", { className: "ad-rail-foot" },
      h("button", { type: "button", className: "ad-btn quiet small", title: t.backToDsh, onClick: onBack }, t.backToDsh),
      h("button", { type: "button", className: "ad-icon-btn sm", title: t.disconnect, "aria-label": t.disconnect, onClick: async () => store.set({ status: await call("disconnect") }) }, h(Icon, { name: "back" }))));
}