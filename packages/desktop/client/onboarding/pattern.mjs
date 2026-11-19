// Aelios's main-model rule, needed while the owner types: a glob against the requested name and its basename.
export function matchGlob(pattern, value) {
  const source = String(pattern).split("*").map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*");
  return new RegExp(`^${source}$`, "i").test(value);
}

export function matchesMainModel(patterns, requested) {
  const base = String(requested).slice(String(requested).lastIndexOf("/") + 1);
  return (patterns ?? []).some((pattern) => matchGlob(pattern, requested) || matchGlob(pattern, base));
}
