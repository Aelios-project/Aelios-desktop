// A resident's avatar: the resident serves it as a public path (`/avatar/<key>`, or `/r/<id>/avatar/<key>` for the
// other residents), so the shell only joins it to the address it was given. Pure, so it can be tested.

/** @param {string} base the resident's address, as the connection stored it @param {string} path the avatar path */
export function avatarUrl(base, path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path) || /^data:/i.test(path)) return path;
  const root = String(base || "").replace(/\/+$/, "");
  return `${root}${path.startsWith("/") ? "" : "/"}${path}`;
}
