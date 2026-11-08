// Small line icons (24px grid, stroke only), drawn the way Aelios-resident's page draws its own.
import { createElement as h } from "react";

const PATHS = {
  send: "M12 19V5M5.5 11.5 12 5l6.5 6.5",
  back: "M15 18l-6-6 6-6",
  close: "M6 6l12 12M18 6 6 18",
  stop: "M7 7h10v10H7z",
  open: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  panel: "M4 5h16v14H4zM15 5v14",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  plus: "M12 5v14M5 12h14",
  sticker: "M12 3.5a8.5 8.5 0 1 0 0 17c.8 0 1.6-.1 2.3-.4l5.2 1.4-1.4-5.2c.3-.7.4-1.5.4-2.3a8.5 8.5 0 0 0-8.5-8.5zM9 9.5h.01M15 9.5h.01M8.5 14.5c1.6 1.8 5 1.8 7 0",
  mic: "M12 4a3 3 0 0 1 3 3v4a3 3 0 0 1-6 0V7a3 3 0 0 1 3-3zM5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21",
  wrench: "M14.5 6a4 4 0 1 0 3.8 6.2L21 15l-1.8 1.8-2.8-2.7A4 4 0 0 0 14.5 6z",
};


export const Icon = ({ name }) => h("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true },
  h("path", { d: PATHS[name] }));
