// Copied from Aelios-resident, public/app.css (AGPL-3.0, same author; main at b118dfb, 2026-11-07): the page
// frame (.shell), the sky (.sky), the shared pieces (.icon-btn, .avatar, .btn, .pill, .divider, .md) and the form
// card. Changed: every class has the ad- prefix and is scoped to .ad-root so it cannot touch DSH's own parts; the
// columns sit beside each other instead of one centred column; a status is a dot or a one-word pill, a count is a
// badge, and a longer explanation waits behind an (i).
export const BASE = `
.ad-root { position: relative; display: flex; height: 100%; min-height: 0; overflow: hidden; color: var(--text-1); background: var(--bg); font-family: var(--font); font-size: 14px; line-height: 1.55; -webkit-font-smoothing: antialiased; }
.ad-root > * { position: relative; z-index: 1; }
.ad-root *, .ad-root *::before, .ad-root *::after { box-sizing: border-box; }
.ad-root button, .ad-root input, .ad-root textarea, .ad-root select { font: inherit; color: inherit; }
.ad-root button { cursor: pointer; }
.ad-root button:disabled { cursor: default; }
.ad-root a { color: var(--accent-text); }
.ad-root :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.ad-root svg { flex: none; }
.ad-root ::-webkit-scrollbar { width: 8px; height: 8px; }
.ad-root ::-webkit-scrollbar-thumb { border-radius: 4px; background: var(--line); }
.ad-root ::-webkit-scrollbar-track { background: transparent; }

/* The sky: a nebula and fixed stars, never moving. Behind every column. */
.ad-sky { position: absolute; inset: 0; z-index: 0; pointer-events: none; background: var(--bg); }
.ad-sky::before { content: ""; position: absolute; inset: 0;
  background: radial-gradient(58% 42% at 78% 8%, var(--nebula-a), transparent 72%), radial-gradient(52% 42% at 8% 86%, var(--nebula-b), transparent 72%),
    radial-gradient(40% 30% at 96% 62%, var(--nebula-c), transparent 70%); }
.ad-sky::after { content: ""; position: absolute; inset: 0; opacity: var(--stars-opacity); background-size: 420px 420px;
  background-image: radial-gradient(1px 1px at 24px 36px, var(--star-1), transparent), radial-gradient(1px 1px at 128px 96px, var(--star-2), transparent),
    radial-gradient(1.5px 1.5px at 212px 180px, var(--star-1), transparent), radial-gradient(1px 1px at 320px 64px, var(--star-2), transparent),
    radial-gradient(1px 1px at 392px 240px, var(--star-3), transparent), radial-gradient(1px 1px at 72px 300px, var(--star-2), transparent),
    radial-gradient(1.5px 1.5px at 268px 356px, var(--star-1), transparent); }

.ad-icon-btn { flex: none; width: 36px; height: 36px; border: 0; border-radius: 11px; display: grid; place-items: center; background: transparent; color: var(--text-3); position: relative; }
.ad-icon-btn:hover { color: var(--text-1); background: var(--line-soft); }
.ad-icon-btn[aria-expanded="true"] { color: var(--accent-text); background: var(--accent-soft); }
.ad-icon-btn svg { width: 18px; height: 18px; }
.ad-icon-btn.sm { width: 28px; height: 28px; border-radius: 8px; }
.ad-icon-btn.sm svg { width: 15px; height: 15px; }
.ad-icon-btn.danger:hover { color: var(--err-text); }
.ad-icon-btn:disabled { opacity: .4; }
.ad-avatar { position: relative; flex: none; width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; overflow: hidden; background: var(--avatar-bg); box-shadow: 0 0 0 1px var(--avatar-ring), 0 0 18px rgba(139, 124, 246, .18); color: var(--text-1); font-family: var(--serif); font-size: 17px; }
.ad-avatar.mini { width: 22px; height: 22px; font-size: 11px; box-shadow: 0 0 0 1px var(--avatar-ring); }
.ad-avatar img { width: 100%; height: 100%; object-fit: cover; }
.ad-avatar svg { width: 55%; height: 55%; color: var(--text-3); }
.ad-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 34px; padding: 0 14px; border-radius: 11px; border: 0; background: var(--accent); color: var(--on-accent); font-size: 13.5px; font-weight: 600; white-space: nowrap; text-decoration: none; }
.ad-root a.ad-btn { color: var(--on-accent); }
.ad-btn:hover { filter: brightness(1.05); }
.ad-btn svg { width: 15px; height: 15px; }
.ad-btn.quiet, .ad-root a.ad-btn.quiet { border: 1px solid var(--line); background: var(--panel-strong); color: var(--text-1); font-weight: 500; }
.ad-btn.quiet:hover { border-color: var(--line-dash); filter: none; }
.ad-btn.danger { color: var(--err-text); }
.ad-btn.small { height: 28px; padding: 0 10px; border-radius: 9px; font-size: 12.5px; }
.ad-btn:disabled { opacity: .45; filter: none; }

/* Status: a dot, or a pill holding a dot and one word. Counts: a badge. */
.ad-dot { flex: none; display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--idle); }
.ad-dot.ok { background: var(--ok); } .ad-dot.warn { background: var(--warn); } .ad-dot.bad { background: var(--err); }
.ad-dot.hot { background: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); } .ad-dot.info { background: var(--violet); }
.ad-dot.live { animation: ad-pulse 1.6s infinite ease-in-out; }
.ad-pill { flex: none; display: inline-flex; align-items: center; gap: 5px; height: 20px; padding: 0 8px 0 6px; border-radius: 999px; background: var(--line-soft); font-size: 11px; font-weight: 500; line-height: 1; color: var(--text-2); white-space: nowrap; }
.ad-pill .ad-dot { width: 6px; height: 6px; box-shadow: none; }
.ad-pill.hot { background: var(--accent-soft); color: var(--accent-text); font-weight: 600; }
.ad-pill.ok { background: var(--ok-soft); color: var(--ok-text); }
.ad-pill.bad { background: color-mix(in srgb, var(--err) 12%, transparent); color: var(--err-text); }
.ad-pill.warn { background: color-mix(in srgb, var(--warn) 16%, transparent); }
.ad-pill.info { background: color-mix(in srgb, var(--violet) 14%, transparent); color: var(--violet-text); }
.ad-pill.idle { color: var(--text-3); }
.ad-badge { flex: none; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 999px; background: var(--line); color: var(--text-2); font-size: 10.5px; font-weight: 700; line-height: 18px; text-align: center; font-variant-numeric: tabular-nums; }
.ad-badge.hot { background: var(--accent); color: var(--on-accent); }
@keyframes ad-pulse { 50% { opacity: .35; } }

/* An explanation behind an (i): the button, and the line it opens. */
.ad-info { flex: none; width: 22px; height: 22px; padding: 0; border: 0; border-radius: 50%; display: inline-grid; place-items: center; background: transparent; color: var(--text-4); vertical-align: middle; }
.ad-info:hover, .ad-info[aria-expanded="true"] { color: var(--accent-text); background: var(--accent-soft); }
.ad-info svg { width: 15px; height: 15px; }
.ad-info-text { margin: 0; padding: 8px 10px; border-radius: 10px; background: var(--line-soft); font-size: 12.5px; line-height: 1.55; color: var(--text-3); }
.ad-label { display: flex; align-items: center; gap: 6px; margin: 0; font-size: 11px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: var(--text-4); }
.ad-hint { margin: 0; font-size: 12.5px; color: var(--text-3); }
.ad-note { color: var(--text-4); font-size: 13px; text-align: center; margin: auto; padding: 24px 16px; max-width: 34ch; line-height: 1.7; }
.ad-error { color: var(--err-text); font-size: 12.5px; }
.ad-empty { margin: auto; display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 36px 16px; text-align: center; color: var(--text-4); font-size: 13px; }
.ad-empty > span:first-child { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; background: var(--line-soft); color: var(--text-3); }
.ad-empty svg { width: 20px; height: 20px; }
.ad-empty .ad-info-text { max-width: 30ch; }

.ad-form { margin: auto; width: min(420px, 90%); display: flex; flex-direction: column; gap: 12px; padding: 26px 24px; border-radius: 20px; border: 1px solid var(--line); background: var(--panel-strong); box-shadow: var(--shadow); }
.ad-form h2 { margin: 0 0 4px; font-family: var(--serif); font-size: 20px; font-weight: 700; letter-spacing: .02em; }
.ad-form label { display: flex; flex-direction: column; gap: 4px; font-size: 12.5px; color: var(--text-3); }
.ad-form label.check { flex-direction: row; align-items: flex-start; gap: 8px; }
.ad-form input, .ad-form select { min-width: 0; padding: 9px 12px; border-radius: 11px; border: 1px solid var(--line); background: var(--input-bg); color: var(--text-1); outline: 0; }
.ad-form input:focus, .ad-form select:focus { border-color: color-mix(in srgb, var(--accent) 60%, transparent); }
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
