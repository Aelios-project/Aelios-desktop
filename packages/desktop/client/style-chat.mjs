// Copied from Aelios-resident, public/app.css (AGPL-3.0, same author; main at fb4593a, 2026-11-07): the header
// (.top, .who), the stream, the bubbles (.row, .bubble, .meta) and the composer (.compose, .field, .round).
// Changed: ad- prefix, scoped to .ad-root; the left column is a list of residents in the same card style.
export const CHAT = `
.ad-left { flex: none; width: 260px; display: flex; flex-direction: column; gap: 4px; padding: 10px; border-right: 1px solid var(--line); background: var(--glass); overflow: auto; }
.ad-side .ad-left { width: 100%; border: 0; background: transparent; }
.ad-left h2 { margin: 4px 6px 6px; font-size: 12px; font-weight: 500; letter-spacing: .12em; color: var(--text-3); }
.ad-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 6px; border: 0; border-radius: 14px; background: transparent; text-align: left; }
.ad-item:hover { background: var(--line-soft); }
.ad-item[aria-current="true"] { background: var(--accent-soft); }
.ad-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.ad-top { display: flex; align-items: center; gap: 10px; padding: 10px 8px 8px 16px; background: var(--glass); border-bottom: 1px solid var(--line-soft); backdrop-filter: blur(14px); }
.ad-who { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.ad-name { font-family: var(--serif); font-size: 18px; font-weight: 700; line-height: 1.3; letter-spacing: .04em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-status { font-size: 12px; line-height: 1.4; color: var(--text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-stream { flex: 1; min-height: 0; overflow-y: auto; padding: 12px 14px 10px; display: flex; flex-direction: column; gap: 12px; }
.ad-row { display: flex; flex-direction: column; gap: 4px; max-width: 82%; }
.ad-row.ai { align-self: flex-start; align-items: flex-start; }
.ad-row.me { align-self: flex-end; align-items: flex-end; }
.ad-bubble { position: relative; max-width: 100%; padding: 9px 13px; border-radius: 6px 18px 18px 18px; border: 1px solid var(--line); background: var(--panel); box-shadow: var(--shadow); overflow-wrap: anywhere; user-select: text; }
.ad-row.me .ad-bubble { background: var(--mine); border-color: var(--mine-line); box-shadow: none; border-radius: 18px 18px 6px 18px; white-space: pre-wrap; }
.ad-meta { float: right; margin: 9px -3px -6px 12px; font-size: 11px; line-height: 1; color: var(--text-4); white-space: nowrap; }
.ad-row.me .ad-meta { color: var(--text-3); }
.ad-compose { background: var(--glass); border-top: 1px solid var(--line-soft); backdrop-filter: blur(14px); }
.ad-bar { display: flex; align-items: flex-end; gap: 8px; padding: 8px 12px 10px; }
.ad-field { flex: 1; min-width: 0; display: flex; align-items: flex-end; min-height: 44px; padding: 0 4px 0 16px; border-radius: 22px; border: 1px solid var(--line); background: var(--panel-strong); }
.ad-field:focus-within { border-color: color-mix(in srgb, var(--accent) 60%, transparent); }
.ad-field textarea { flex: 1; min-width: 0; max-height: 38vh; padding: 10px 0; border: 0; outline: 0; background: transparent; resize: none; font-size: 15px; line-height: 1.5; }
.ad-field textarea::placeholder { color: var(--text-4); }
.ad-round { flex: none; width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; border: 0; background: var(--accent); color: var(--on-accent); }
.ad-round svg { width: 20px; height: 20px; }
.ad-round:disabled { opacity: .5; cursor: default; }
`;
