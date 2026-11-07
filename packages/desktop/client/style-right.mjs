// Copied from Aelios-resident, public/app.css (AGPL-3.0, same author; main at b118dfb, 2026-11-07): the thread
// rows (.trow), the thread lines (.tline), the progress bar (.track), the say box (.thread-say) and the sheet head
// (.sheet-head h2) for the panel title. Changed: ad- prefix, scoped to .ad-root; the panel is a column with a
// title bar, and its tabs are a segmented row.
export const RIGHT = `
.ad-right { flex: none; width: var(--panel-w); display: flex; flex-direction: column; min-height: 0; background: var(--glass); border-left: 1px solid var(--line-soft); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
.ad-right-head { display: flex; flex-direction: column; gap: 8px; padding: 14px 12px 10px 18px; border-bottom: 1px solid var(--line-soft); }
.ad-right-line { display: flex; align-items: center; gap: 6px; }
.ad-right-title { flex: 1; min-width: 0; margin: 0; font-family: var(--serif); font-size: 16px; font-weight: 700; letter-spacing: .04em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-tabs { display: flex; gap: 2px; padding: 2px; border-radius: 12px; background: var(--line-soft); }
.ad-tab { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 5px; height: 28px; padding: 0 8px; border: 0; border-radius: 10px; background: transparent; color: var(--text-3); font-size: 12.5px; white-space: nowrap; }
.ad-tab:hover { color: var(--text-1); }
.ad-tab[aria-selected="true"] { background: var(--panel-strong); color: var(--accent-text); font-weight: 600; box-shadow: var(--shadow); }
.ad-tab:disabled { opacity: .45; cursor: default; }
.ad-badge { min-width: 16px; height: 16px; padding: 0 4px; border-radius: 999px; background: var(--accent); color: var(--on-accent); font-size: 10px; font-weight: 700; line-height: 16px; text-align: center; }
.ad-right.overlay { position: absolute; top: 0; right: 0; bottom: 0; z-index: 3; width: min(var(--panel-w), 86%); box-shadow: -18px 0 50px rgba(2, 5, 18, .35); }
.ad-panel { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding: 12px; overscroll-behavior: contain; }
.ad-panel > * { flex-shrink: 0; }
.ad-group { margin: 8px 0 -4px; padding: 0 6px; font-size: 11px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--text-4); }
.ad-trow { display: flex; flex-direction: column; gap: 6px; width: 100%; padding: 12px; border-radius: 16px; border: 1px solid var(--line); background: var(--panel); color: inherit; text-align: left; }
button.ad-trow:hover { border-color: var(--line-dash); background: var(--panel-strong); }
.ad-trow.working { border-style: dashed; border-color: var(--line-dash); }
.ad-trow.ask { border-color: color-mix(in srgb, var(--accent) 55%, transparent); background: var(--accent-soft); }
.ad-trow.dim { opacity: .55; }
.ad-trow .top-line { display: flex; align-items: center; gap: 8px; }
.ad-trow .t { flex: 1; min-width: 0; font-size: 14px; font-weight: 600; line-height: 1.45; overflow-wrap: anywhere; }
.ad-trow .sub { display: flex; gap: 8px; font-size: 12px; line-height: 1.5; color: var(--text-3); }
.ad-trow .sub span:first-child { flex: 1; min-width: 0; overflow-wrap: anywhere; }
.ad-links { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.ad-track { position: relative; height: 3px; border-radius: 2px; background: var(--line); overflow: hidden; }
.ad-track span { position: absolute; top: 0; bottom: 0; left: -40%; width: 40%; border-radius: 2px; background: var(--accent); animation: ad-slide 1.6s infinite ease-in-out; }
@keyframes ad-slide { to { left: 100%; } }
.ad-tline { display: flex; flex-direction: column; gap: 4px; padding: 10px 12px; border-radius: 14px; border: 1px solid var(--line); background: var(--panel); }
.ad-tline.r-user { background: var(--mine); border-color: var(--mine-line); }
.ad-tline.r-result { border-style: dashed; border-color: var(--line-dash); }
.ad-tline .who-l { display: flex; align-items: center; gap: 8px; font-size: 11px; letter-spacing: .04em; color: var(--text-4); }
.ad-tline .step-l { font-size: 12px; color: var(--text-4); overflow-wrap: anywhere; }
.ad-tline .text { font-size: 14px; white-space: pre-wrap; overflow-wrap: anywhere; }
.ad-tline .text.ad-md { white-space: normal; }
.ad-say { position: sticky; bottom: -12px; display: flex; gap: 6px; align-items: flex-end; margin: 0 -12px -12px; padding: 10px 12px 12px; background: var(--glass); backdrop-filter: blur(14px); }
.ad-say textarea { flex: 1; min-width: 0; min-height: 40px; max-height: 30vh; padding: 9px 12px; border-radius: 14px; border: 1px solid var(--line); background: var(--panel-strong); outline: 0; resize: vertical; font-size: 14px; }
.ad-say textarea:focus { border-color: color-mix(in srgb, var(--accent) 60%, transparent); }
.ad-say .ad-round { width: 40px; height: 40px; }
.ad-slot { margin: auto; display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px 16px; text-align: center; color: var(--text-4); font-size: 13px; line-height: 1.7; }
.ad-slot .ad-slot-mark { width: 36px; height: 36px; border-radius: 12px; display: grid; place-items: center; border: 1px dashed var(--line-dash); color: var(--text-3); }
.ad-slot .ad-slot-mark svg { width: 18px; height: 18px; }
`;