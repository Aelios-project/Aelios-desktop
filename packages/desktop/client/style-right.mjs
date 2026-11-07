// Copied from Aelios-resident, public/app.css (AGPL-3.0, same author; main at fb4593a, 2026-11-07): the thread
// rows (.trow), the thread lines (.tline), the list card (.list), the progress bar (.track), the say box
// (.thread-say). Changed: ad- prefix, scoped to .ad-root; the right column frame and its tabs are new.
export const RIGHT = `
.ad-right { flex: none; width: 340px; display: flex; flex-direction: column; min-height: 0; border-left: 1px solid var(--line); background: var(--glass); }
.ad-right-top { display: flex; align-items: center; gap: 4px; padding: 8px 8px 8px 12px; border-bottom: 1px solid var(--line-soft); }
.ad-tabs { flex: 1; min-width: 0; display: flex; gap: 4px; overflow-x: auto; }
.ad-tab { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px; border: 0; border-radius: 10px; background: transparent; color: var(--text-3); font-size: 13px; white-space: nowrap; }
.ad-tab:hover { background: var(--line-soft); }
.ad-tab[aria-selected="true"] { background: var(--accent-soft); color: var(--accent-text); font-weight: 600; }
.ad-badge { min-width: 16px; height: 16px; padding: 0 4px; border-radius: 999px; background: var(--accent); color: var(--on-accent); font-size: 10px; font-weight: 700; line-height: 16px; text-align: center; }
.ad-panel { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding: 12px; }
.ad-panel > * { flex-shrink: 0; }
.ad-group { margin: 6px 0 -6px; padding: 0 6px; font-size: 12px; font-weight: 500; letter-spacing: .12em; color: var(--text-3); }
.ad-trow { display: flex; flex-direction: column; gap: 6px; padding: 12px; border-radius: 18px; border: 1px solid var(--line); background: var(--panel); color: inherit; text-align: left; width: 100%; }
button.ad-trow:hover { border-color: var(--accent); }
.ad-trow.working { border-style: dashed; border-color: var(--line-dash); }
.ad-trow.ask { border-color: color-mix(in srgb, var(--accent) 55%, transparent); background: var(--accent-soft); }
.ad-trow.dim { opacity: .55; }
.ad-trow .top-line { display: flex; align-items: center; gap: 8px; }
.ad-trow .t { flex: 1; min-width: 0; font-size: 14px; font-weight: 600; overflow-wrap: anywhere; }
.ad-trow .sub { display: flex; gap: 8px; font-size: 12px; color: var(--text-3); }
.ad-trow .sub span:first-child { flex: 1; min-width: 0; }
.ad-links { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.ad-track { position: relative; height: 3px; border-radius: 2px; background: var(--line); overflow: hidden; }
.ad-track span { position: absolute; top: 0; bottom: 0; left: -40%; width: 40%; border-radius: 2px; background: var(--accent); animation: ad-slide 1.6s infinite ease-in-out; }
@keyframes ad-slide { to { left: 100%; } }
.ad-tline { display: flex; flex-direction: column; gap: 4px; padding: 10px 12px; border-radius: 14px; border: 1px solid var(--line); background: var(--panel); }
.ad-tline.r-user { background: var(--mine); border-color: var(--mine-line); }
.ad-tline.r-result { border-style: dashed; border-color: var(--line-dash); }
.ad-tline .who-l { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-3); }
.ad-tline .step-l { font-size: 12px; color: var(--text-4); overflow-wrap: anywhere; }
.ad-tline .text { font-size: 14px; white-space: pre-wrap; overflow-wrap: anywhere; }
.ad-tline .text.ad-md { white-space: normal; }
.ad-say { position: sticky; bottom: 0; display: flex; gap: 8px; align-items: flex-end; padding-top: 8px; background: var(--glass); }
.ad-say textarea { flex: 1; min-width: 0; min-height: 44px; max-height: 30vh; padding: 10px 12px; border-radius: 14px; border: 1px solid var(--line); background: var(--panel-strong); outline: 0; resize: vertical; font-size: 14px; }
.ad-say .ad-round { width: 40px; height: 40px; }
.ad-slot { margin: auto; text-align: center; color: var(--text-4); font-size: 13px; }
`;
