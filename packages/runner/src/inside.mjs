// Whether a file is inside a folder, links followed: a link that leads out of the folder counts as outside.
import { realpathSync } from "node:fs";
import path from "node:path";

export function inside(root, file) {
  if (typeof file !== "string" || !path.isAbsolute(file)) return false;
  let real;
  try { real = realpathSync(file); } // a link out of the folder counts as outside
  catch { try { real = path.join(realpathSync(path.dirname(file)), path.basename(file)); } catch { return false; } } // a new file: check its folder
  const rel = path.relative(realpathSync(root), real);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}
