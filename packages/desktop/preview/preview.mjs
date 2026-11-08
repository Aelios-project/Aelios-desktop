// The preview: the plugin's own browser half (client/index.mjs Main and Side, with every style it injects) drawn
// against a fake host route (fake-host.mjs) and made-up data (fake-data.mjs). Nothing reads a resident and nothing
// outside preview/ is written. The query picks what to show:
//   ?theme=light|dark   the palette (else DSH's rule: the page's color-scheme, then the system)
//   ?panel=waiting|threads|alarms   ?thread=<id>   ?wide=1   ?view=machine   ?sheet=<section>   ?group=<id>   ?shot=1
import "./fake-host.mjs";
import { seenBefore } from "./fake-data.mjs";
import { Main, Side, STYLES } from "../client/index.mjs";
import { store } from "../client/store.mjs";

const q = new URLSearchParams(location.search);
const theme = q.get("theme");
if (theme === "light" || theme === "dark") document.documentElement.style.colorScheme = theme;
if (q.get("shot")) document.body.classList.add("shot");
try { localStorage.setItem("aelios-desktop.seen", JSON.stringify(seenBefore)); } catch { /* dots may not show */ }
for (const a of document.querySelectorAll("[data-theme]")) a.href = `?${new URLSearchParams({ ...Object.fromEntries(q), theme: a.dataset.theme })}`;

const style = document.createElement("style");
style.textContent = STYLES;
document.head.append(style);

const { createElement: h } = window.React;
window.ReactDOM.createRoot(document.getElementById("side")).render(h(Side, { onBack: () => {} }));
window.ReactDOM.createRoot(document.getElementById("main")).render(h(Main));

// The scene the query asks for, once the first status has arrived.
setTimeout(() => {
  const right = store.get().right;
  const patch = {};
  if (q.get("panel") || q.get("thread")) patch.right = { ...right, open: true, panel: q.get("thread") ? "threads" : q.get("panel") };
  if (q.get("wide")) patch.right = { ...(patch.right || right), width: 580 };
  if (q.get("thread")) patch.focus = q.get("thread");
  if (q.get("view")) patch.view = q.get("view");
  if (q.get("sheet")) patch.sheet = q.get("sheet");
  if (q.get("group")) patch.group = q.get("group");
  store.set(patch);
}, 150);

// Paint the page behind the columns in the palette the shell chose.
const paint = () => {
  const day = document.querySelector(".ad-root")?.classList.contains("day");
  document.body.style.background = day ? "#F8F3EC" : "#070a16";
  document.body.style.color = day ? "#2B2420" : "#eef0ff";
};
new MutationObserver(paint).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["class"] });
setTimeout(paint, 50);

// ?desktop=1: the macOS window the plugin lives in, its traffic lights over the corner and the strip left for them.
if (q.get("desktop") === "1") {
  setTimeout(() => document.querySelector("#side .ad-root")?.style.setProperty("--ad-top-inset", "30px"), 100);
  const lights = document.createElement("div");
  lights.style.cssText = "position:fixed;top:12px;left:12px;z-index:99;display:flex;gap:8px";
  for (const colour of ["#ff5f57", "#febc2e", "#28c840"]) {
    const dot = document.createElement("span");
    dot.style.cssText = `width:12px;height:12px;border-radius:50%;background:${colour};box-shadow:0 0 0 .5px rgba(0,0,0,.2)`;
    lights.append(dot);
  }
  document.body.append(lights);
}
