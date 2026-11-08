// Copied from Aelios-resident, public/app.css (AGPL-3.0, same author; main at b118dfb, 2026-11-07): the thread
// rows (.trow), the thread lines (.tline), the progress bar (.track) and the say box (.thread-say). Changed: ad-
// prefix, scoped to .ad-root; the column holds the work only (Waiting, Threads, Alarms) behind a segmented row of
// tabs with icons and counts; a card shows its title, one status word and its time, and opens for the rest.
export const RIGHT = `
.ad-right { flex: none; width: var(--panel-w); display: flex; flex-direction: column; min-height: 0; background: var(--glass); border-left: 1px solid var(--line-soft); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
.ad-right.overlay { position: absolute; top: 0; right: 0; bottom: 0; z-index: 6; width: min(var(--panel-w), 88%); box-shadow: var(--lift); }
.ad-right-head { display: flex; align-items: center; gap: 4px; padding: 12px 10px 10px 12px; }
.ad-tabs { flex: 1; min-width: 0; display: flex; gap: 2px; padding: 3px; border-radius: 12px; background: var(--line-soft); }
.ad-tab { flex: 1; min-width: 0; display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 32px; padding: 0 6px; border: 0; border-radius: 9px; background: transparent; color: var(--text-3); font-size: 12.5px; white-space: nowrap; }
.ad-tab svg { width: 15px; height: 15px; }
.ad-tab:hover { color: var(--text-1); }
.ad-tab[aria-selected="true"] { background: var(--panel-strong); color: var(--text-1); font-weight: 600; box-shadow: var(--shadow); }
.ad-tab .w { display: none; overflow: hidden; text-overflow: ellipsis; }
.ad-tab[aria-selected="true"] { flex: 1.8; }
.ad-tab[aria-selected="true"] .w { display: inline; }

.ad-panel { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding: 4px 12px 14px; overscroll-behavior: contain; }
.ad-panel > * { flex-shrink: 0; }
.ad-panel-bar { display: flex; align-items: center; gap: 8px; min-height: 28px; padding: 0 2px; font-size: 12px; color: var(--text-3); }
.ad-panel-bar .sp { flex: 1; }
.ad-explained { display: flex; align-items: center; gap: 6px; min-width: 0; }
.ad-fold.ad-label { font-size: 11px; }
.ad-fold { display: flex; align-items: center; gap: 6px; width: 100%; margin-top: 6px; padding: 4px 4px; border: 0; background: transparent; color: var(--text-4); text-align: left; }
.ad-fold:hover { color: var(--text-1); }
.ad-fold svg { width: 13px; height: 13px; transition: transform .15s; }
.ad-fold[aria-expanded="false"] svg { transform: rotate(-90deg); }

.ad-card { position: relative; display: flex; flex-direction: column; gap: 7px; width: 100%; padding: 10px 12px; border-radius: 14px; border: 1px solid var(--line); background: var(--panel); color: inherit; text-align: left; }
button.ad-card:hover { border-color: var(--line-dash); background: var(--panel-strong); }
.ad-card.ask { border-color: color-mix(in srgb, var(--accent) 50%, transparent); background: var(--accent-soft); }
.ad-card.dim { opacity: .6; }
.ad-card-top { display: flex; align-items: flex-start; gap: 10px; width: 100%; padding: 0; border: 0; background: transparent; text-align: left; color: inherit; }
.ad-card-title { flex: 1; min-width: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-size: 13.5px; font-weight: 600; line-height: 1.4; overflow-wrap: anywhere; }
.ad-card-time { flex: none; padding-top: 1px; font-size: 11.5px; color: var(--text-4); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ad-card-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.ad-card-row .sp { flex: 1; }
.ad-step { font: 11.5px/1.5 var(--mono); color: var(--text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-card-more { margin: 0; font-size: 12.5px; line-height: 1.55; color: var(--text-2); overflow-wrap: anywhere; }
.ad-card .ad-hide { position: absolute; top: 6px; right: 6px; opacity: 0; transition: opacity .12s; background: var(--panel-strong); }
.ad-card:hover .ad-hide, .ad-card:focus-within .ad-hide { opacity: 1; }
.ad-card:hover .ad-card-time, .ad-card:focus-within .ad-card-time { visibility: hidden; }
.ad-mi { display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px; color: var(--text-4); font-variant-numeric: tabular-nums; }
.ad-mi svg { width: 13px; height: 13px; }
.ad-track { position: relative; height: 2px; border-radius: 2px; background: var(--line); overflow: hidden; }
.ad-track span { position: absolute; top: 0; bottom: 0; left: -40%; width: 40%; border-radius: 2px; background: var(--accent); animation: ad-slide 1.6s infinite ease-in-out; }
@keyframes ad-slide { to { left: 100%; } }
.ad-meter { display: inline-flex; align-items: center; gap: 6px; font-variant-numeric: tabular-nums; }
.ad-meter i { position: relative; display: block; width: 46px; height: 4px; border-radius: 2px; background: var(--line); overflow: hidden; }
.ad-meter i b { position: absolute; inset: 0 auto 0 0; border-radius: 2px; background: var(--accent); }

.ad-say { position: sticky; bottom: -14px; display: flex; gap: 6px; align-items: flex-end; margin: 0 -12px -14px; padding: 10px 12px 12px; background: var(--glass); backdrop-filter: blur(14px); }
.ad-say textarea { flex: 1; min-width: 0; min-height: 40px; max-height: 30vh; padding: 9px 12px; border-radius: 14px; border: 1px solid var(--line); background: var(--panel-strong); color: var(--text-1); outline: 0; resize: vertical; font-size: 13.5px; }
.ad-say textarea:focus { border-color: color-mix(in srgb, var(--accent) 60%, transparent); }

.ad-alarm { position: relative; display: flex; align-items: center; gap: 10px; padding: 8px 8px 8px 10px; border-radius: 12px; }
.ad-alarm:hover, .ad-alarm:focus-within { background: var(--line-soft); }
.ad-alarm .mark { flex: none; width: 14px; display: grid; place-items: center; color: var(--violet-text); }
.ad-alarm .mark svg { width: 14px; height: 14px; }
.ad-alarm .mark .ad-dot, .ad-legend .ad-dot { width: 7px; height: 7px; background: var(--accent); }
.ad-alarm .when { flex: none; width: 66px; display: flex; flex-direction: column; align-items: flex-start; padding: 0; border: 0; background: transparent; text-align: left; color: var(--text-1); }
.ad-alarm .when b { font-size: 14px; font-weight: 600; line-height: 1.3; font-variant-numeric: tabular-nums; }
.ad-alarm .when small { font-size: 11px; color: var(--text-4); }
.ad-alarm button.when:hover b { color: var(--accent-text); }
.ad-alarm .note { flex: 1; min-width: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-size: 13px; line-height: 1.45; color: var(--text-2); }
.ad-alarm .ad-icon-btn { opacity: 0; }
.ad-alarm:hover .ad-icon-btn, .ad-alarm:focus-within .ad-icon-btn { opacity: 1; }
.ad-alarm-edit { display: flex; align-items: center; gap: 4px; flex: 1; min-width: 0; }
.ad-alarm-edit input { flex: 1; min-width: 0; height: 30px; padding: 0 9px; border-radius: 9px; border: 1px solid color-mix(in srgb, var(--accent) 60%, transparent); background: var(--input-bg); color: var(--text-1); font-size: 13px; outline: 0; font-variant-numeric: tabular-nums; }
.ad-legend { gap: 12px; font-size: 11px; color: var(--text-4); }
.ad-legend .sp { flex: 1; }
.ad-legend span { display: inline-flex; align-items: center; gap: 5px; }
.ad-legend svg { width: 12px; height: 12px; color: var(--violet-text); }
`;
