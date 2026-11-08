// Which palette the shell draws: the day one only when the surface says light. DSH sets its own light or dark
// independently of the system (`color-scheme` on the document element, with `data-ds-theme-source` saying whether a
// person chose it), so DSH wins; with no answer, the system setting decides, the way the resident's page does.
// Pure, so test/palette.test.mjs can cover it without a browser.

/** @param {{scheme?: string, prefersLight?: boolean}} surface @returns {"day" | "night"} */
export function paletteOf({ scheme, prefersLight = false } = {}) {
  const told = String(scheme || "").trim().toLowerCase();
  if (told === "light" || told === "dark") return told === "light" ? "day" : "night";
  return prefersLight ? "day" : "night";
}

/** The surface as it stands: what the document says, else what the system says. */
export function readSurface(doc = globalThis.document) {
  if (!doc?.documentElement) return { scheme: "", prefersLight: false };
  const scheme = getComputedStyle(doc.documentElement).colorScheme || "";
  const prefersLight = typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: light)").matches;
  return { scheme, prefersLight };
}
