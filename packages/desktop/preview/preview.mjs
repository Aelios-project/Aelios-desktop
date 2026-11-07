// The preview's only script: take the very styles the plugin ships and put them on the page, so what is seen here is
// what the client half draws in DSH. Nothing else runs, and nothing outside preview/ is written.
//   ?theme=light | ?theme=dark   force a palette (the page follows the system setting when neither is given)
import { BASE } from "../client/style-base.mjs";
import { CHAT } from "../client/style-chat.mjs";
import { RAIL } from "../client/style-rail.mjs";
import { RIGHT } from "../client/style-right.mjs";
import { TOKENS } from "../client/theme.mjs";

const wanted = new URLSearchParams(location.search).get("theme");
// The palette normally follows the system. A forced theme unstacks it: the night block always, the day block only
// when day is asked for, and the media query dropped so the system setting cannot disagree. Preview only.
const MARK = "@media (prefers-color-scheme: light) {";
const night = TOKENS.slice(0, TOKENS.indexOf(MARK));
const day = TOKENS.slice(TOKENS.indexOf(MARK)).replace(MARK, "").replace(/\}\s*$/, "");
const tokens = wanted === "light" ? night + day : wanted === "dark" ? night : TOKENS;

const style = document.createElement("style");
style.textContent = [tokens, BASE, RAIL, CHAT, RIGHT].join("\n");
document.head.append(style);

const dark = wanted !== "light";
const paper = dark ? "#070a16" : "#F8F5EF";
document.documentElement.style.background = paper;
document.body.style.background = paper;
const bar = document.querySelector(".frame-bar");
bar.style.color = dark ? "#7f85b0" : "#5a5d82";
bar.style.borderBottomColor = dark ? "rgba(148,163,255,.12)" : "rgba(109,92,210,.14)";