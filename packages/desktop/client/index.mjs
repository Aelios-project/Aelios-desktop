// The browser half. It takes over DSH's left column and the middle area (the way DS Bot shadows slots)
// and draws the resident's columns itself. The right column holds the panels.
import { createElement as h, useEffect, useRef, useState } from "react";
import { call } from "./api.mjs";
import { paletteOf, readSurface } from "./palette.mjs";
import { shellTopInset } from "./platform.mjs";
import { Chat } from "./chat.mjs";
import { GroupChat } from "./group-chat.mjs";
import { ConnectForm } from "./connect-form.mjs";
import { Left } from "./left.mjs";
import { store, useStore } from "./store.mjs";
import { words } from "./strings.mjs";
import { Right } from "./right.mjs";
import { BASE } from "./style-base.mjs";
import { CHAT } from "./style-chat.mjs";
import { RAIL } from "./style-rail.mjs";
import { RIGHT } from "./style-right.mjs";
import { TOKENS } from "./theme.mjs";

export const inject = ["slots", "layout"];

const PANEL = "aelios-desktop";
const SHADOW_PRIORITY = -100; // lower renders first, so ours wins over DSH's own cell
const POLL_MS = 5000;
// The rail starts in place on every load: the plugin's whole point. "Back to DSH" hands the column back for the
// rest of that visit, and the chat header's button takes it again.

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

// A panel narrower than this cannot hold two columns beside each other, so the right column overlays instead.
const NARROW = 980;

/** The day palette follows DSH's own choice, then the system; a change on either side repaints. */
function useDay() {
  const [day, setDay] = useState(() => paletteOf(readSurface()) === "day");
  useEffect(() => {
    const update = () => setDay(paletteOf(readSurface()) === "day");
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style", "class", "data-ds-theme-source"] });
    const media = typeof matchMedia === "function" ? matchMedia("(prefers-color-scheme: light)") : null;
    media?.addEventListener?.("change", update);
    return () => { observer.disconnect(); media?.removeEventListener?.("change", update); };
  }, []);
  return day;
}

function Main() {
  const status = useStatus();
  const t = words();
  const day = useDay();
  const root = useRef(null);
  useEffect(() => {
    const el = root.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const fit = () => {
      const narrow = el.clientWidth < NARROW;
      const right = store.get().right;
      if (narrow === right.overlay) return;
      store.set({ right: narrow ? { ...right, overlay: true, open: false } : { ...right, overlay: false } });
    };
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    fit();
    return () => observer.disconnect();
  }, []);
  return h("div", { className: `ad-root${day ? " day" : ""}`, ref: root },
    h("div", { className: "ad-sky", "aria-hidden": true }),
    !status ? h("div", { className: "ad-note" }, t.connecting)
      : status.connected ? [h(store.get().group ? GroupChat : Chat, { key: "chat" }), h(Right, { key: "right" })] : h(ConnectForm, { defaultWorkspace: status.defaultWorkspace }));
}

/** The whole left column while ours is in place; its foot hands the column back to DSH. */
function Side({ onBack }) {
  const day = useDay();
  const inset = shellTopInset();
  return h("div", { className: `ad-root ad-side${day ? " day" : ""}`, style: inset ? { "--ad-top-inset": `${inset}px` } : undefined }, h(Left, { onBack }));
}

const Nav = () => h("svg", { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, "aria-hidden": true },
  h("path", { d: "M3 11 12 3l9 8M6 10v11h12V10M10 21v-7h4v7" }));

export function apply(ctx) {
  const t = words();
  ctx.effect(() => {
    const style = document.createElement("style");
    style.textContent = [TOKENS, BASE, RAIL, CHAT, RIGHT].join("\n");
    document.head.append(style);
    return () => style.remove();
  });

  ctx.slots.inject("main", () => ctx.slots.register({ name: "main", key: PANEL }, Main));
  ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({ name: "sidebar.panellist", id: PANEL, order: 5, label: () => t.title }, Nav));

  // The whole left column is shadowed while connected and while the reader wants our rail; the foot button hands
  // it back to DSH, which is also how DSH's own navigation comes back.
  const back = () => ctx.layout.selectPanel(null);

  // DSH unmounts our panel when another one is selected, so its presence is the honest signal: while it is drawn the
  // rail covers the left column, and the moment it is not the column goes back to DSH. This is what makes "Back to
  // DSH" and coming back from it work without a second click.
  ctx.effect(() => {
    const tick = () => {
      const shown = Boolean(document.querySelector(".ad-main"));
      if (shown === store.get().shown) return;
      store.set({ shown, rail: shown });
    };
    const timer = setInterval(tick, 600);
    tick();
    return () => clearInterval(timer);
  });
  let release = null;
  const sync = () => {
    const on = Boolean(store.get().status?.connected) && store.get().rail && store.get().shown;
    if (on && !release) release = ctx.slots.inject("sidebar", () => ctx.slots.register({ name: "sidebar", priority: SHADOW_PRIORITY }, () => h(Side, { onBack: back })));
    if (!on && release) { release(); release = null; }
  };
  ctx.effect(() => { const off = store.subscribe(sync); sync(); return () => { off(); release?.(); release = null; }; });
  ctx.effect(() => { void call("status").then((s) => { store.set({ status: s }); if (s.connected) ctx.layout.selectPanel(PANEL); }).catch(() => {}); });
}
