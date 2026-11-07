// The preview's only script: take the very styles the plugin ships and put them on the page, so what is seen here is
// what the client half draws in DSH. Nothing else runs, and nothing outside preview/ is written.
//   ?theme=light | ?theme=dark   force a palette (the page follows the system setting when neither is given)
import { BASE } from "../client/style-base.mjs";
import { CHAT } from "../client/style-chat.mjs";
import { RAIL } from "../client/style-rail.mjs";
import { RIGHT } from "../client/style-right.mjs";
import { TOKENS } from "../client/theme.mjs";

const wanted = new URLSearchParams(location.search).get("theme");
// The palette is the shell's `.day` class: the plugin sets it from what DSH says. Here a query can force it, and
// with no query the preview follows the same rule as the plugin.
import { paletteOf, readSurface } from "../client/palette.mjs";

const style = document.createElement("style");
style.textContent = [TOKENS, BASE, RAIL, CHAT, RIGHT].join("\n");
document.head.append(style);

const day = wanted === "light" || (wanted !== "dark" && paletteOf(readSurface()) === "day");
for (const root of document.querySelectorAll(".ad-root")) root.classList.toggle("day", day);
const dark = !day;
const paper = dark ? "#070a16" : "#F8F5EF";
document.documentElement.style.background = paper;
document.body.style.background = paper;
// The conversation opens at its end, the way the shell draws it.
const stream = document.querySelector(".ad-stream");
if (stream) stream.scrollTop = stream.scrollHeight;

const bar = document.querySelector(".frame-bar");
bar.style.color = dark ? "#7f85b0" : "#5a5d82";
bar.style.borderBottomColor = dark ? "rgba(148,163,255,.12)" : "rgba(109,92,210,.14)";