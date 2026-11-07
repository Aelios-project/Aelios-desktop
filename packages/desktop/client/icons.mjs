// Small line icons (24px grid, stroke only), drawn the way Aelios-resident's page draws its own.
import { createElement as h } from "react";

const PATHS = {
  send: "M12 19V5M5.5 11.5 12 5l6.5 6.5",
  back: "M15 18l-6-6 6-6",
  close: "M6 6l12 12M18 6 6 18",
  stop: "M7 7h10v10H7z",
  open: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  panel: "M4 5h16v14H4zM15 5v14",
};

export const Icon = ({ name }) => h("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true },
  h("path", { d: PATHS[name] }));
