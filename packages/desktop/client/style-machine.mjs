// This machine's view in the middle column (machine-view.mjs): cards on a two-column grid that stacks when narrow.
export const MACHINE = `
.ad-mv { flex: 1; min-height: 0; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); align-content: start; gap: 12px; padding: 8px max(18px, calc((100% - 880px) / 2)) 24px; }
.ad-mv-wide, .ad-mv-card.live { grid-column: 1 / -1; }
.ad-mv-card { display: flex; flex-direction: column; gap: 10px; min-width: 0; padding: 14px 16px; border-radius: 16px; border: 1px solid var(--line); background: var(--panel); box-shadow: var(--shadow); }
.ad-mv-title { justify-content: space-between; }
.ad-mv-state { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.ad-mv-state b { font-family: var(--serif); font-size: 22px; font-weight: 700; letter-spacing: .02em; }
.ad-dot.big { width: 12px; height: 12px; }
.ad-dot.big.ok { box-shadow: 0 0 0 4px var(--ok-soft); }
.ad-mv-card .ad-pill { height: 24px; gap: 6px; font-size: 12px; }
button.ad-pill { border: 0; font-family: inherit; cursor: pointer; }
button.ad-pill:disabled { opacity: .6; cursor: default; }
.ad-seg { display: inline-flex; padding: 2px; border-radius: 999px; background: var(--line-soft); }
.ad-seg button { display: inline-flex; align-items: center; gap: 5px; height: 22px; padding: 0 10px 0 7px; border: 0; border-radius: 999px; background: transparent; color: var(--text-3); font-size: 12px; font-weight: 500; }
.ad-seg button[aria-pressed="true"] { background: var(--panel-strong); color: var(--text-1); box-shadow: var(--shadow); }
.ad-seg button:disabled { opacity: .6; }
.ad-seg svg { width: 13px; height: 13px; }
.ad-mv-card .ad-pill svg { width: 13px; height: 13px; }
.ad-mv-card .ad-pill .ad-helper { width: 16px; height: 16px; background: transparent; }
.ad-mv-folder { display: flex; align-items: center; gap: 8px; min-width: 0; padding: 8px 10px; border-radius: 10px; background: var(--line-soft); }
.ad-mv-folder svg { width: 16px; height: 16px; color: var(--accent-text); }
.ad-mv-folder code { flex: 1; min-width: 0; font: 12.5px/1.4 var(--mono); color: var(--text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-mv-tiles { display: grid; grid-template-columns: 1.6fr 1fr 1fr; gap: 10px; height: 100%; }
.ad-mv-tiles > div { display: flex; flex-direction: column; justify-content: center; gap: 2px; min-width: 0; padding: 8px 10px; border-radius: 12px; background: var(--line-soft); }
.ad-mv-tiles small { font-size: 11px; color: var(--text-4); }
.ad-mv-tiles b { font-size: 18px; font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-mv-tiles > div:first-child b { font-size: 13.5px; }
.ad-mv-list { display: flex; flex-direction: column; gap: 2px; margin: 0 -8px; }
.ad-mv-row { display: flex; align-items: center; gap: 10px; min-height: 42px; padding: 6px 8px; border: 0; border-radius: 10px; background: transparent; text-align: left; color: var(--text-2); }
.ad-mv-row:hover { background: var(--line-soft); color: var(--text-1); }
.ad-mv-row .n { flex: 1; min-width: 0; font-size: 13.5px; color: var(--text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-mi.hot { color: var(--accent-text); font-weight: 600; }
.ad-mv-log { margin: 0; max-height: 220px; overflow: auto; padding: 10px 12px; border-radius: 10px; background: var(--input-bg); font: 11.5px/1.6 var(--mono); color: var(--text-3); white-space: pre-wrap; overflow-wrap: anywhere; }
`;
