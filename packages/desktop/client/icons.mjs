// Small line icons (24px grid, stroke only), drawn the way Aelios-resident's page draws its own. One path each; a
// path may hold several shapes. The gear is the resident page's own.
import { createElement as h } from "react";

const ring = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

const PATHS = {
  send: "M12 19V5M5.5 11.5 12 5l6.5 6.5",
  back: "M15 18l-6-6 6-6",
  next: "M9 6l6 6-6 6",
  down: "M6 9l6 6 6-6",
  close: "M6 6l12 12M18 6 6 18",
  stop: "M7 7h10v10H7z",
  play: "M8 5.5v13l10.5-6.5z",
  open: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  panel: "M4 5h16v14H4zM15 5v14",
  plus: "M12 5v14M5 12h14",
  check: "M5 12.5l4.5 4.5L19 7.5",
  checks: "M2.5 12.5l4.5 4.5L16.5 7.5M12 16l1 1 9.5-9.5",
  sticker: "M12 3.5a8.5 8.5 0 1 0 0 17c.8 0 1.6-.1 2.3-.4l5.2 1.4-1.4-5.2c.3-.7.4-1.5.4-2.3a8.5 8.5 0 0 0-8.5-8.5zM9 9.5h.01M15 9.5h.01M8.5 14.5c1.6 1.8 5 1.8 7 0",
  mic: "M12 4a3 3 0 0 1 3 3v4a3 3 0 0 1-6 0V7a3 3 0 0 1 3-3zM5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21",
  wrench: "M4.5 19.5l7.6-7.6M12.1 11.9a4.5 4.5 0 0 1 5.6-6.6l-2.7 2.7.4 2.1 2.1.4 2.7-2.7a4.5 4.5 0 0 1-6.6 5.6",
  spark: "M12 3.5l2 5.5 5.5 2-5.5 2-2 5.5-2-5.5-5.5-2 5.5-2z",
  search: `${ring(11, 11, 6.5)}M20 20l-4.2-4.2`,
  gear: "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  laptop: "M5 6h14v9H5zM3 18.5h18",
  cloud: "M7 18h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.1 9.5 4.25 4.25 0 0 0 7 18z",
  home: "M4 11 12 4l8 7M6 10v10h12V10",
  repeat: "M17 3l3 3-3 3M4 11V10a4 4 0 0 1 4-4h12M7 21l-3-3 3-3M20 13v1a4 4 0 0 1-4 4H4",
  alarm: `${ring(12, 13, 7.5)}M12 9.5V13l2.5 1.8M4.5 4 2 6.5M19.5 4 22 6.5`,
  inbox: "M4 13l2.5-7h11L20 13v6H4zM4 13h4.5l1 2h5l1-2H20",
  threads: `M4 7h9M4 12h16M4 17h12${ring(18, 7, 2)}`,
  info: `${ring(12, 12, 9)}M12 11v5M12 7.8v.4`,
  people: `${ring(9, 8, 3.5)}M2.5 20c.8-3.5 3.3-5.5 6.5-5.5s5.7 2 6.5 5.5M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c1.8.7 3 2.5 3.5 5.2`,
  user: `${ring(12, 8, 4)}M4.5 20.5c1.3-3.6 4.2-5.5 7.5-5.5s6.2 1.9 7.5 5.5`,
  sliders: "M4 7h10M18 7h2M4 17h4M12 17h8M16 4.5v5M10 14.5v5",
  plug: "M9 3v5M15 3v5M6.5 8h11v3a5.5 5.5 0 0 1-11 0zM12 16.5V21",
  chart: "M4 20h16M7 16v-5M12 16V6M17 16v-8",
  exit: "M10 4H5v16h5M14 8l4 4-4 4M18 12H9",
  globe: `${ring(12, 12, 9)}M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z`,
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  mail: "M4 6h16v12H4zM4 7l8 6 8-6",
  refresh: "M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6",
  file: "M14 3H6v18h12V7zM14 3v4h4",
  stack: "M12 4l8 4-8 4-8-4zM4 12l8 4 8-4M4 16l8 4 8-4",
  eye: `M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z${ring(12, 12, 3)}`,
  pencil: "M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4",
  terminal: "M4 5h16v14H4zM7.5 9.5l3 2.5-3 2.5M12.5 15h4",
  shield: "M12 3.5l7 2.8v5.2c0 4.3-3 7.6-7 9-4-1.4-7-4.7-7-9V6.3zM9 12l2.2 2.2L15.5 10",
  move: "M5 12h14M15 8l4 4-4 4M9 5H5v14h4",
  folder: "M3.5 7.5a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z",
  widen: "M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4",
  narrow: "M3 12h6M21 12h-6M6 9l3 3-3 3M18 9l-3 3 3 3",
  pin: "M9 4h6l-1 5 3 3v1.5H7V12l3-3zM12 13.5V20",
  speaker: "M4 9.5h3.5L12 6v12l-4.5-3.5H4zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11",
  undo: "M9 7 4.5 11.5 9 16M5 11.5h9a5 5 0 0 1 0 10h-2",
  slash: "M15 4 9 20",
  copy: "M8 8h11v12H8zM5 16V4h11",
  // Helpers: the harness (DSH) as a terminal window with a prompt, Kiro as a small ghost, any other ACP command a plug.
  dsh: "M3.5 6a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2zM3.5 8.5h17M7.5 12.5l2.5 2-2.5 2M12 16.5h4",
  kiro: `M12 3a6.8 6.8 0 0 0-6.8 6.8V21l2.3-1.8 2.2 1.8 2.3-1.8 2.3 1.8 2.2-1.8 2.3 1.8V9.8A6.8 6.8 0 0 0 12 3z${ring(9.4, 10.4, 1.5)}${ring(14.6, 10.4, 1.5)}`,
};

export const ICONS = Object.keys(PATHS);

// Drawn filled, its inner shapes cut out: a silhouette that reads at 13 px.
const FILLED = new Set(["kiro"]);

export const Icon = ({ name }) => h("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true },
  FILLED.has(name) ? h("path", { d: PATHS[name], fill: "currentColor", stroke: "none", fillRule: "evenodd" }) : h("path", { d: PATHS[name] || PATHS.info }));
