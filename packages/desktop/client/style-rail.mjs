// Copied from Aelios-resident, public/app.css (AGPL-3.0, same author; main at b118dfb, 2026-11-07): the wide
// screen rail (.rail, .rail-head, .rail-brand, .rail-current, .rail-item, .rail-foot) and the thread rows the
// threads page draws (.group-title, .trow reduced to a bare line). Changed: ad- prefix, scoped to .ad-root; the
// rail is a column of the window instead of a drawer, and the thread rows are short lines, not cards.
export const RAIL = `
.ad-rail { flex: none; width: var(--rail-w); display: flex; flex-direction: column; gap: 2px; min-height: 0; padding: 10px; overflow-y: auto; background: var(--glass); border-right: 1px solid var(--line-soft); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
.ad-rail-head { display: flex; align-items: center; gap: 2px; padding: 0 0 10px 6px; padding-top: var(--ad-top-inset, 0px); }
.ad-rail-brand { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; font-family: var(--serif); font-size: 17px; font-weight: 700; letter-spacing: .06em; white-space: nowrap; overflow: hidden; }
.ad-rail-mark { width: 24px; height: 24px; border-radius: 8px; display: grid; place-items: center; background: var(--avatar-bg); box-shadow: 0 0 0 1px var(--avatar-ring); color: var(--moon); font-size: 13px; }
.ad-current { display: flex; flex-direction: column; align-items: center; gap: 2px; align-self: center; width: 132px; margin: 4px 0 12px; padding: 12px 8px 10px; border: 1px solid var(--line); border-radius: 18px; background: var(--panel); box-shadow: var(--shadow); color: var(--text-1); }
.ad-current:hover { border-color: var(--line-dash); }
.ad-current.on { background: var(--accent-soft); border-color: color-mix(in srgb, var(--accent) 45%, transparent); }
.ad-current .ad-avatar { width: 64px; height: 64px; margin-bottom: 6px; font-size: 26px; }
.ad-current .ad-name { max-width: 100%; font-size: 14px; font-weight: 600; line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-current .ad-tag { max-width: 100%; padding: 0 6px; border: 1px solid var(--line); border-radius: 6px; font-size: 11px; line-height: 18px; color: var(--text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-current .ad-tag.live { color: var(--violet-text); }
.ad-rail-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px; border: 0; border-radius: 12px; background: transparent; text-align: left; color: var(--text-2); }
.ad-rail-item:hover { background: var(--line-soft); }
.ad-rail-item.on { background: var(--accent-soft); color: var(--text-1); }
.ad-rail-item.on .ad-avatar { box-shadow: 0 0 0 2px var(--accent); }
.ad-rail-item .ad-avatar { width: 38px; height: 38px; font-size: 16px; }
.ad-rail-item .ad-txt { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.ad-rail-item .ad-label { font-size: 14px; line-height: 1.45; color: var(--text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-rail-item .ad-sub { font-size: 12px; line-height: 1.4; color: var(--text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-rail-item .ad-dot { position: absolute; top: 6px; left: 38px; width: 9px; height: 9px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 0 2px var(--bg); }
.ad-rail-item { position: relative; }
.ad-group-title { display: flex; align-items: baseline; gap: 6px; margin: 12px 8px 2px; font-size: 11px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--text-4); }
.ad-group-title span { font-weight: 400; letter-spacing: 0; text-transform: none; color: var(--text-3); }
.ad-thread { display: flex; flex-direction: column; gap: 1px; width: 100%; padding: 6px 8px; border: 0; border-radius: 10px; background: transparent; text-align: left; color: var(--text-2); }
.ad-thread:hover { background: var(--line-soft); }
.ad-thread .ad-t { font-size: 13px; line-height: 1.45; color: var(--text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-thread .ad-s { display: flex; align-items: center; gap: 6px; font-size: 11px; line-height: 1.5; color: var(--text-4); }
.ad-thread .ad-s .ad-live { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); animation: ad-pulse 1.6s infinite ease-in-out; }
@keyframes ad-pulse { 50% { opacity: .3; } }
.ad-find { position: relative; display: flex; align-items: center; margin: 4px 2px 6px; }
.ad-find input { width: 100%; height: 32px; padding: 0 30px 0 10px; border-radius: 10px; border: 1px solid var(--line); background: var(--input-bg); color: var(--text-1); font-size: 13px; outline: 0; }
.ad-find input:focus { border-color: color-mix(in srgb, var(--accent) 60%, transparent); }
.ad-find input::placeholder { color: var(--text-4); }
.ad-find-x { position: absolute; right: 4px; width: 24px; height: 24px; border: 0; border-radius: 7px; background: transparent; color: var(--text-4); display: grid; place-items: center; }
.ad-find-x:hover { color: var(--text-1); background: var(--line-soft); }
.ad-find-x svg { width: 12px; height: 12px; }
.ad-finds { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
.ad-find-hit { display: flex; flex-direction: column; gap: 1px; padding: 6px 8px; border: 0; border-radius: 10px; background: transparent; text-align: left; }
.ad-find-hit:hover { background: var(--line-soft); }
.ad-find-hit .t { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-size: 12.5px; line-height: 1.5; color: var(--text-2); overflow-wrap: anywhere; }
.ad-find-hit .t b { color: var(--accent-text); font-weight: 600; }
.ad-find-hit .s { font-size: 11px; color: var(--text-4); }
.ad-alarms.quiet { display: none; }
.ad-groups { display: flex; flex-direction: column; gap: 1px; padding-top: 2px; }
.ad-alarms { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; padding-top: 4px; }
.ad-alarm { display: flex; align-items: center; gap: 2px; border-radius: 10px; }
.ad-alarm-main { flex: 1; min-width: 0; display: flex; align-items: baseline; gap: 8px; padding: 6px 8px; border: 0; border-radius: 10px; background: transparent; text-align: left; }
.ad-alarm:hover { background: var(--line-soft); }
.ad-alarm-main:hover, .ad-alarm:hover { background: var(--line-soft); }
.ad-alarm-x { flex: none; width: 22px; height: 22px; border: 0; border-radius: 7px; background: transparent; color: var(--text-4); display: grid; place-items: center; opacity: 0; }
.ad-alarm:hover .ad-alarm-x { opacity: 1; }
.ad-alarm-x:hover { color: var(--err-text); background: var(--line-soft); }
.ad-alarm-x svg { width: 12px; height: 12px; }
.ad-alarm .w { flex: none; max-width: 46%; font-size: 12px; line-height: 1.5; color: var(--accent-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-alarm .n { flex: 1; min-width: 0; font-size: 12px; line-height: 1.5; color: var(--text-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-usage { display: flex; flex-direction: column; gap: 0; margin-top: 2px; padding: 8px 8px 2px; border-top: 1px solid var(--line-soft); }
.ad-urow { display: flex; align-items: baseline; gap: 6px; padding: 2px 0; font-size: 11.5px; line-height: 1.6; }
.ad-urow .l { flex: 1; color: var(--text-4); }
.ad-urow .s { color: var(--text-2); font-variant-numeric: tabular-nums; }
.ad-urow .h { min-width: 3ch; text-align: right; color: var(--text-4); font-variant-numeric: tabular-nums; }
.ad-rail-foot { display: flex; align-items: center; gap: 2px; margin-top: auto; padding-top: 10px; }
.ad-side .ad-rail { width: 100%; height: 100%; border-right: 0; border-radius: 0; }
`;