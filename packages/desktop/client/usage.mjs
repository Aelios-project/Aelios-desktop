// The usage block in the left column: what the resident spent, day by day, in the spans its own page shows.
// Follows Aelios-resident's usage page (public/app.js money/compact/hitText/totalTokens; AGPL-3.0, same author;
// main at b118dfb, 2026-11-07). Pure, so test/usage.test.mjs can cover the numbers.

/** Money the way the resident writes it: cents under a dollar, more places as it gets smaller. */
export function money(cost) {
  if (!cost) return "$0";
  return "$" + (cost >= 1 ? cost.toFixed(2) : cost >= 0.01 ? cost.toFixed(3) : cost.toFixed(4));
}

/** Big token counts in three characters or so. */
export function compact(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 1 : 2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + "k";
  return String(n || 0);
}

/** Share of the prompt read from the cache. */
export function hitText(t) {
  const all = t ? t.input + t.cacheRead + t.cacheWrite : 0;
  return all ? `${Math.round((t.cacheRead / all) * 100)}%` : "—";
}

export function tokensText(t) {
  if (!t) return "";
  return `in ${compact(t.input + t.cacheRead + t.cacheWrite)} · out ${compact(t.output)}`;
}

/** Cost for a span, or a plain word when the calls carry no price. */
export function costText(t) {
  if (!t) return "…";
  if (t.calls && t.unpriced === t.calls) return "unpriced";
  return money(t.cost);
}

export const SPANS = [
  { key: "today", label: "Today" },
  { key: "week", label: "7 days" },
  { key: "month", label: "30 days" },
];

/** One row per span, ready to draw; a span the answer lacks is left out. */
export function usageRows(totals = {}) {
  return SPANS.map(({ key, label }) => {
    const t = totals?.[key];
    if (!t) return null;
    return { key, label, cost: costText(t), calls: `${t.calls} ${t.calls === 1 ? "call" : "calls"}`, tokens: tokensText(t), hit: hitText(t) };
  }).filter(Boolean);
}