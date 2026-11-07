// Copied from Aelios-resident, public/app.css (AGPL-3.0, same author; main at fb4593a, 2026-11-07): the shared
// pieces (.icon-btn, .avatar, .btn, .pill, .md) and the form card. Changed: every class has the ad- prefix and is
// scoped to .ad-root so it cannot touch DSH's own parts.
export const BASE = `
.ad-root { display: flex; height: 100%; min-height: 0; color: var(--text-1); background: var(--bg); font-family: var(--font); font-size: 15px; line-height: 1.6; -webkit-font-smoothing: antialiased; }
.ad-root *, .ad-root *::before, .ad-root *::after { box-sizing: border-box; }
.ad-root button, .ad-root input, .ad-root textarea, .ad-root select { font: inherit; color: inherit; }
.ad-root button { cursor: pointer; }
.ad-root a { color: var(--accent-text); }
.ad-root :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.ad-icon-btn { flex: none; width: 36px; height: 36px; border: 0; border-radius: 12px; display: grid; place-items: center; background: transparent; color: var(--text-2); position: relative; }
.ad-icon-btn:hover { color: var(--text-1); background: var(--line-soft); }
.ad-icon-btn svg { width: 18px; height: 18px; }
.ad-icon-btn.sm { width: 32px; height: 32px; }
.ad-avatar { position: relative; flex: none; width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; overflow: hidden; background: var(--avatar-bg); box-shadow: 0 0 0 1px var(--avatar-ring), 0 0 18px rgba(139, 124, 246, .22); color: var(--text-2); font-family: var(--serif); }
.ad-avatar.mini { width: 24px; height: 24px; font-size: 12px; }
.ad-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 40px; padding: 0 16px; border-radius: 12px; border: 0; background: var(--accent); color: var(--on-accent); font-size: 14px; font-weight: 600; white-space: nowrap; }
.ad-btn:hover { filter: brightness(1.05); }
.ad-btn.quiet { border: 1px solid var(--line); background: transparent; color: var(--text-1); font-weight: 400; }
.ad-btn.quiet:hover { border-color: var(--accent); }
.ad-btn.small { height: 32px; padding: 0 12px; border-radius: 10px; font-size: 13px; }
.ad-btn:disabled { opacity: .45; cursor: default; }
.ad-pill { display: inline-flex; align-items: center; height: 24px; padding: 0 9px; border-radius: 999px; border: 1px solid var(--line); font-size: 12px; color: var(--text-2); white-space: nowrap; }
.ad-pill.ok { color: var(--ok-text); border-color: color-mix(in srgb, var(--ok) 40%, transparent); background: var(--ok-soft); }
.ad-pill.warn { color: var(--accent-text); border-color: color-mix(in srgb, var(--accent) 55%, transparent); }
.ad-pill.hot { background: var(--accent); border-color: var(--accent); color: var(--on-accent); font-weight: 600; }
.ad-pill.bad { color: var(--err-text); border-color: color-mix(in srgb, var(--err) 50%, transparent); }
.ad-hint { margin: 0; font-size: 13px; color: var(--text-3); }
.ad-note { color: var(--text-3); font-size: 13px; text-align: center; margin: auto; padding: 0 16px; }
.ad-error { color: var(--err-text); font-size: 13px; }
.ad-form { margin: auto; width: min(420px, 90%); display: flex; flex-direction: column; gap: 12px; padding: 24px; border-radius: 18px; border: 1px solid var(--line); background: var(--panel-strong); box-shadow: var(--shadow); }
.ad-form label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--text-2); }
.ad-form input, .ad-form select { min-width: 0; padding: 9px 12px; border-radius: 12px; border: 1px solid var(--line); background: var(--input-bg); }
.ad-md { overflow-wrap: anywhere; }
.ad-md p, .ad-md ul, .ad-md ol, .ad-md pre, .ad-md blockquote, .ad-md .md-table, .ad-md h3, .ad-md h4, .ad-md hr { margin: 0 0 .55em; }
.ad-md > :last-child { margin-bottom: 0; }
.ad-md h3 { font-size: 1.08em; font-weight: 700; } .ad-md h4 { font-size: 1em; font-weight: 700; }
.ad-md ul, .ad-md ol { padding-left: 1.35em; }
.ad-md code { font-family: var(--mono); font-size: .88em; padding: .1em .35em; border-radius: 6px; background: var(--line-soft); }
.ad-md pre { padding: 8px 10px; border-radius: 10px; background: var(--line-soft); overflow-x: auto; font-size: 12.5px; line-height: 1.5; }
.ad-md pre code { padding: 0; background: none; font-size: inherit; }
.ad-md blockquote { padding-left: 10px; border-left: 3px solid var(--line); color: var(--text-2); }
.ad-md a { color: var(--accent-text); text-decoration: underline; text-underline-offset: 2px; }
.ad-md hr { border: 0; border-top: 1px solid var(--line); }
.ad-md .md-table { max-width: 100%; overflow-x: auto; }
.ad-md table { border-collapse: collapse; font-size: .9em; }
.ad-md th, .ad-md td { border: 1px solid var(--line); padding: 4px 8px; text-align: left; vertical-align: top; }
.ad-md th { background: var(--line-soft); font-weight: 600; }
@media (prefers-reduced-motion: reduce) { .ad-root * { animation: none !important; transition: none !important; } }
`;
