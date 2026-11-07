// The left column: the residents. Threads (pinned and recent) come in the next slice.
import { createElement as h, useEffect } from "react";
import { call, web } from "./api.mjs";
import { store, useStore } from "./store.mjs";
import { words } from "./strings.mjs";

const POLL_MS = 30000;

export function Left() {
  const t = words();
  const { status, residents } = useStore(store);

  useEffect(() => {
    const load = async () => {
      try { store.set({ residents: (await web("/web/residents", { resident: "default" }))?.residents || [] }); } catch { /* keep the last list */ }
    };
    void load();
    const timer = setInterval(() => { if (!document.hidden) void load(); }, POLL_MS);
    return () => clearInterval(timer);
  }, []);

  const pick = async (id) => store.set({ status: await call("select", { resident: id }) });
  const list = residents.length ? residents : [{ id: "default", name: t.title }];
  return h("nav", { className: "ad-left", "aria-label": t.residents },
    h("h2", null, t.residents),
    list.map((r) => h("button", { key: r.id, className: "ad-item", type: "button", "aria-current": (status?.resident || "default") === r.id, onClick: () => pick(r.id) },
      h("span", { className: "ad-avatar", "aria-hidden": true }, (r.name || r.id).slice(0, 1)),
      h("span", null, r.name || r.id))));
}
