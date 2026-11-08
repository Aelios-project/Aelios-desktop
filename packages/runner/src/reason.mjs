// Why a turn failed, as a code the resident can act on (PROTOCOL.md, "reason"). The runner says only what it knows: the
// helper could not be started, the workspace could not be used, or the helper's own error says it needs a login, a key
// or a permission (ACP's auth_required code, -32000, or those words in its error text). Anything else is "error".
export const REASONS = ["permission_denied", "needs_login", "missing_key", "helper_missing", "workspace_denied", "error"];

const AUTH_REQUIRED = -32000; // ACP: authentication required
const KEY = /api[ _-]?key|no key\b|credential|missing[^.]{0,20}token/i;
const LOGIN = /auth(entication)?[ _-]?required|not (logged|signed) in|log ?in\b|sign ?in\b|unauthori[sz]ed|\b401\b/i;
const PERMISSION = /permission denied|forbidden|\b403\b|not allowed/i;

/** The code for an error the helper (or the process around it) gave: its ACP code and its words. */
export function reasonOf(code, text) {
  const said = String(text ?? "");
  if (KEY.test(said)) return "missing_key";
  if (code === AUTH_REQUIRED || LOGIN.test(said)) return "needs_login";
  if (PERMISSION.test(said)) return "permission_denied";
  return "error";
}

/** A helper that could not be started at all (no such program, not allowed to run it) is `helper_missing`; otherwise by its words. */
export function reasonOfStart(error, stderr = "") {
  return /did not start: (ENOENT|EACCES|EPERM)/.test(String(error?.message)) ? "helper_missing" : reasonOf(undefined, `${error?.message} ${stderr}`);
}

/** The workspace folder could not be made or entered. */
export const workspaceDenied = error => ["EACCES", "EPERM", "ENOENT", "ENOTDIR", "EROFS"].includes(error?.code);
