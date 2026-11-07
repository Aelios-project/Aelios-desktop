// The browser half. It takes over DSH's left column and the middle area (the way DS Bot shadows slots)
// and draws the resident's columns itself. The right panels come in the next slice.
import { createElement as h, useEffect } from "react";
import { call } from "./api.mjs";
import { Chat } from "./chat.mjs";
import { ConnectForm } from "./connect-form.mjs";
import { Left } from "./left.mjs";
import { store, useStore } from "./store.mjs";
import { words } from "./strings.mjs";
import { LAYOUT, TOKENS } from "./theme.mjs";

export const inject = ["slots", "layout"];

const PANEL = "aelios-desktop";
const SHADOW_PRIORITY = -100; // lower renders first, so ours wins over DSH's own cell
const POLL_MS = 5000;

function useStatus() {
  const { status } = useStore(store);
  useEffect(() => {
    const load = async () => { try { store.set({ status: await call("status") }); } catch (e) { store.set({ error: e.message }); } };
    void load();
    const timer = setInterval(() => { if (!document.hidden) void load(); }, POLL_MS);
    return () => clearInterval(timer);
  }, []);
  return status;
}

function Main() {
  const status = useStatus();
  const t = words();
  return h("div", { className: "ad-root" },
    !status ? h("div", { className: "ad-note" }, t.connecting)
      : status.connected ? h(Chat) : h(ConnectForm, { defaultWorkspace: status.defaultWorkspace }));
}

const Side = () => h("div", { className: "ad-root ad-side" }, h(Left));

const Nav = () => h("svg", { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, "aria-hidden": true },
  h("path", { d: "M3 11 12 3l9 8M6 10v11h12V10M10 21v-7h4v7" }));

export function apply(ctx) {
  const t = words();
  ctx.effect(() => {
    const style = document.createElement("style");
    style.textContent = `${TOKENS}\n${LAYOUT}\n.ad-side .ad-left { width: 100%; border: 0; background: transparent; }`;
    document.head.append(style);
    return () => style.remove();
  });

  ctx.slots.inject("main", () => ctx.slots.register({ name: "main", key: PANEL }, Main));
  ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({ name: "sidebar.panellist", id: PANEL, order: 5, label: () => t.title }, Nav));

  // The left column is shadowed only while connected, so an unconnected DSH keeps its own list.
  let release = null;
  const sync = () => {
    const on = Boolean(store.get().status?.connected);
    if (on && !release) release = ctx.slots.inject("sidebar.workspaces", () => ctx.slots.register({ name: "sidebar.workspaces", priority: SHADOW_PRIORITY }, Side));
    if (!on && release) { release(); release = null; }
  };
  ctx.effect(() => { const off = store.subscribe(sync); sync(); return () => { off(); release?.(); release = null; }; });
  ctx.effect(() => { void call("status").then((s) => { store.set({ status: s }); if (s.connected) ctx.layout.selectPanel(PANEL); }).catch(() => {}); });
}
