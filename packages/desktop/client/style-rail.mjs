// Copied from Aelios-resident, public/app.css (AGPL-3.0, same author; main at b118dfb, 2026-11-07): the wide
// screen rail (.rail, .rail-head, .rail-brand, .rail-item, .rail-foot, .group-title). Changed: ad- prefix, scoped
// to .ad-root; the rail is a column of the window instead of a drawer, and holds only who and where: the residents,
// the groups and this machine as rows of one kind, then a foot with the settings and the way back to DSH.
export const RAIL = `
.ad-rail { flex: none; width: var(--rail-w); display: flex; flex-direction: column; min-height: 0; padding: 10px 10px 8px; background: var(--glass); border-right: 1px solid var(--line-soft); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
.ad-rail-head { display: flex; align-items: center; gap: 9px; padding: calc(var(--ad-top-inset, 0px) + 6px) 8px 14px; }
.ad-rail-brand { flex: 1; min-width: 0; font-family: var(--serif); font-size: 18px; font-weight: 700; letter-spacing: .05em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-rail-mark { flex: none; width: 26px; height: 26px; border-radius: 9px; display: grid; place-items: center; background: var(--avatar-bg); box-shadow: 0 0 0 1px var(--avatar-ring); color: var(--moon); font-size: 13px; }
.ad-rail-list { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; margin: 0 -4px; padding: 0 4px; }
.ad-rail-list .ad-label { margin: 14px 8px 4px; }
.ad-rail-list .ad-label:first-child { margin-top: 2px; }
.ad-row-btn { position: relative; display: flex; align-items: center; gap: 10px; width: 100%; min-height: 46px; padding: 6px 8px; border: 0; border-radius: 12px; background: transparent; text-align: left; color: var(--text-2); }
.ad-row-btn:hover { background: var(--line-soft); color: var(--text-1); }
.ad-row-btn[aria-current="page"] { background: var(--accent-soft); color: var(--text-1); }
.ad-row-btn[aria-current="page"] .ad-avatar { box-shadow: 0 0 0 2px var(--accent), 0 0 16px rgba(244, 160, 124, .3); }
.ad-row-btn .ad-avatar { width: 34px; height: 34px; font-size: 15px; }
.ad-row-btn .n { flex: 1; min-width: 0; font-size: 14px; line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-row-btn[aria-current="page"] .n { font-weight: 600; }
.ad-row-btn .ad-dot { margin-right: 4px; }
.ad-rail-label { justify-content: space-between; min-height: 28px; }
.ad-rail-label .ad-icon-btn { width: 24px; height: 24px; margin-right: -4px; opacity: .7; }
.ad-rail-label .ad-icon-btn:hover { opacity: 1; }
.ad-rail-form { display: flex; flex-direction: column; gap: 6px; margin: 2px 4px 8px; padding: 10px; border-radius: 12px; border: 1px solid var(--line); background: var(--panel-strong); }
.ad-rail-form input { height: 32px; padding: 0 10px; border-radius: 9px; border: 1px solid var(--line); background: var(--input-bg); color: var(--text-1); font-size: 13px; outline: 0; }
.ad-rail-form input:focus { border-color: color-mix(in srgb, var(--accent) 60%, transparent); }
.ad-row-wrap { position: relative; display: flex; align-items: center; }
.ad-row-wrap .ad-machine-go { position: absolute; right: 8px; }
.ad-row-btn .n small { display: block; font-size: 11.5px; line-height: 1.3; color: var(--text-4); font-weight: 400; }
.ad-avatar.machine { overflow: visible; background: var(--line-soft); box-shadow: 0 0 0 1px var(--line); color: var(--text-2); }
.ad-avatar.machine svg { width: 52%; height: 52%; color: var(--text-2); }
.ad-avatar.machine .ad-dot { position: absolute; right: -1px; bottom: -1px; width: 11px; height: 11px; border: 2px solid var(--bg); }
.ad-rail-foot { display: flex; align-items: center; gap: 2px; margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--line-soft); }
.ad-rail-foot .sp { flex: 1; }
.ad-machine-go { flex: none; width: 28px; height: 28px; border: 0; border-radius: 50%; display: grid; place-items: center; background: var(--accent-soft); color: var(--accent-text); }
.ad-machine-go:hover { background: var(--accent); color: var(--on-accent); }
.ad-machine-go svg { width: 13px; height: 13px; }
.ad-dsh { flex: none; display: inline-flex; align-items: center; gap: 5px; height: 28px; padding: 0 9px; border: 1px solid var(--line); border-radius: 9px; background: transparent; color: var(--text-3); font-size: 12px; font-weight: 600; letter-spacing: .03em; }
.ad-dsh:hover { color: var(--text-1); border-color: var(--line-dash); }
.ad-dsh svg { width: 14px; height: 14px; }
.ad-side .ad-rail { width: 100%; height: 100%; border-right: 0; border-radius: 0; }
`;
