// The left column: the residents, then the threads that are at work or waiting, newest first.
// Drawn like Aelios-resident's wide-screen rail (styles in style-rail.mjs); the thread rows follow its 线程 page.
import { createElement as h, useEffect } from "react";
import { call, web } from "./api.mjs";
import { store, useStore } from "./store.mjs";
import { words } from "./strings.mjs";
import { railThreads } from "./rail-rows.mjs";
import { isWorking, loadThreads, when } from "./threads-api.mjs";

const POLL_MS = 30000;
const SHOWN = 6;

export function Left() {
  const t = words();
  const { status, residents, threads } = useStore(store);

  useEffect(() => {
    const load = async () => {
      try { store.set({ residents: (await web("/web/residents", { resident: "default" }))?.residents || [] }); } catch { /* keep the last list */ }
    };
    void load();
    const timer = setInterval(() => { if (!document.hidden) void load(); }, POLL_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const load = async () => {
      try { store.set({ threads: (await loadThreads(status?.resident || "default"))?.threads || [] }); } catch { /* keep the last list */ }
    };
    void load();
    const timer = setInterval(() => { if (!document.hidden) void load(); }, POLL_MS);
    return () => clearInterval(timer);
  }, [status?.resident]);

  const pick = async (id) => store.set({ status: await call("select", { resident: id }) });
  const list = residents.length ? residents : [{ id: "default", name: t.title }];
  const current = list.find((r) => r.id === (status?.resident || "default")) || list[0];
  const others = list.filter((r) => r.id !== current.id);
  const { open, recent } = railThreads(threads, SHOWN);
  const row = (item) => h("button", { key: item.id, type: "button", className: "ad-thread", title: item.title,
    onClick: () => store.set({ focus: item.id, right: { open: true, panel: "threads" } }) },
    h("span", { className: "ad-t" }, item.title),
    h("span", { className: "ad-s" }, isWorking(item) && h("span", { className: "ad-live", "aria-hidden": true }), when(item.updatedAt)));

  return h("nav", { className: "ad-rail", "aria-label": t.residents },
    h("div", { className: "ad-rail-head" },
      h("span", { className: "ad-rail-brand" }, h("span", { className: "ad-rail-mark", "aria-hidden": true }, "✦"), t.residents)),
    h("button", { type: "button", className: "ad-current on", title: current.name, onClick: () => pick(current.id) },
      h("span", { className: "ad-avatar", "aria-hidden": true }, (current.name || current.id).slice(0, 1)),
      h("span", { className: "ad-name" }, current.name || current.id),
      h("span", { className: "ad-tag" }, status?.runner?.state ? (t.runner[status.runner.state] || status.runner.state) : t.title)),
    others.map((r) => h("button", { key: r.id, type: "button", className: "ad-rail-item", title: r.name, onClick: () => pick(r.id) },
      h("span", { className: "ad-avatar", "aria-hidden": true }, (r.name || r.id).slice(0, 1)),
      h("span", { className: "ad-txt" }, h("span", { className: "ad-label" }, r.name || r.id)))),
    open.length > 0 && h("p", { className: "ad-group-title" }, t.openNow, h("span", null, open.length)),
    open.map(row),
    recent.length > 0 && h("p", { className: "ad-group-title" }, t.recent),
    recent.map(row),
    h("div", { className: "ad-rail-foot" },
      h("button", { type: "button", className: "ad-btn quiet small", onClick: async () => store.set({ status: await call("disconnect") }) }, t.disconnect)));
}