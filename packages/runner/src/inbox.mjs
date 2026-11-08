// Pictures and files the user sent to a thread. The runner fetches them from the resident (one call per file, with its own
// token), saves them in the thread's workspace under .aelios-inbox/<workId>/, and gives them to the helper: pictures as ACP
// image blocks (when the helper takes them), everything as a resource link plus its path in the prompt. A name the cloud
// sends is never trusted: it is cleaned here, and a file is only ever written inside the workspace.
import { mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { excludeFromGit } from "./git-exclude.mjs";

export const ATTACHMENTS_MAX = 4;
export const FILE_MAX_BYTES = 4 * 1024 * 1024;
const KEY = /^[0-9a-f]{32}$/;
const IMAGES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/** A name that is safe on any disk: no folders, no control characters, no leading dot, at most 80 characters, the extension kept. */
export function safeFileName(name) {
  const last = String(name ?? "").split(/[\\/]/).pop() ?? "";
  const clean = last.replace(/[^\p{L}\p{N}._ ()-]/gu, "_").replace(/\s+/g, " ").replace(/^[.\s]+/, "").trim();
  const dot = clean.lastIndexOf(".");
  const ext = dot > 0 ? clean.slice(dot).slice(0, 12) : "";
  const base = (dot > 0 ? clean.slice(0, dot) : clean).slice(0, 80 - ext.length);
  return base ? base + ext : "file";
}

/** The attachments a work may carry, or null when the list is not what the protocol says. */
export function readAttachments(list) {
  if (list === undefined) return [];
  if (!Array.isArray(list) || list.length > ATTACHMENTS_MAX) return null;
  const out = [];
  for (const item of list) {
    if (!item || typeof item !== "object" || !KEY.test(item.key ?? "") || typeof item.name !== "string" || typeof item.type !== "string" || item.type.length > 120) return null;
    out.push({ key: item.key, name: item.name.slice(0, 200), type: item.type });
  }
  return out;
}

/** Fetches and saves them. Returns what was saved and the names that could not be. */
export async function saveAttachments({ cloud, work, cwd }) {
  const saved = [], failed = [];
  const root = await realpath(cwd);
  const dir = path.join(root, ".aelios-inbox", work.workId.replace(/[^A-Za-z0-9_.-]/g, "_"));
  await mkdir(dir, { recursive: true, mode: 0o700 });
  if (!(await realpath(dir)).startsWith(root + path.sep)) throw new Error("the inbox is outside the workspace");
  await excludeFromGit(root, ".aelios-inbox/"); // the user's uploads must not end up in a commit
  for (const [n, item] of work.attachments.entries()) {
    const name = safeFileName(item.name);
    try {
      const got = await cloud.file({ workId: work.workId, key: item.key });
      const bytes = Buffer.from(String(got.data ?? ""), "base64");
      if (!bytes.length || bytes.length > FILE_MAX_BYTES) throw new Error("size");
      const target = path.join(dir, `${n + 1}-${name}`);
      if (path.dirname(target) !== dir) throw new Error("path");
      await writeFile(target, bytes, { flag: "wx", mode: 0o600 });
      saved.push({ path: target, name, type: IMAGES.has(item.type) ? item.type : "application/octet-stream", size: bytes.length, image: IMAGES.has(item.type) });
    } catch { failed.push(name); }
  }
  return { saved, failed };
}

/** The prompt as ACP content blocks: the text (job, the list of files, then `tail`), plus image and resource-link blocks. */
export async function promptBlocks(text, tail, files, imageOk) {
  if (!files) return [{ type: "text", text: `${text}\n\n${tail}` }];
  const lines = files.saved.map(file => `- ${file.path} (${file.image ? "picture" : "file"}, ${file.size} bytes)`);
  if (files.failed.length) lines.push(`(Could not be fetched: ${files.failed.join(", ")})`);
  const list = lines.length ? `\n\nThe user attached these; they are saved in the workspace (the .aelios-inbox folder is the user's uploads: never commit or push it):\n${lines.join("\n")}` : "";
  const blocks = [{ type: "text", text: `${text}${list}\n\n${tail}` }];
  for (const file of files.saved) {
    if (file.image && imageOk) blocks.push({ type: "image", mimeType: file.type, data: (await readFile(file.path)).toString("base64") });
    else blocks.push({ type: "resource_link", uri: pathToFileURL(file.path).href, name: path.basename(file.path), mimeType: file.type, size: file.size });
  }
  return blocks;
}
