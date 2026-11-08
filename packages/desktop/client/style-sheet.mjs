// The settings sheet and the group sheet (sheet.mjs, group-sheet.mjs): a card over a soft scrim, a list of sections
// on its left that becomes a row of tabs when the window is narrow. Follows the resident's .sheet look.
export const SHEET = `
.ad-scrim { position: absolute; inset: 0; z-index: 20; display: grid; place-items: center; padding: 28px; background: var(--scrim); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); container-type: inline-size; }
.ad-sheet { display: flex; width: min(820px, 100%); height: min(640px, 100%); border-radius: 20px; border: 1px solid var(--line); background: var(--panel-strong); box-shadow: var(--lift); overflow: hidden; }
.ad-sheet.small { width: min(480px, 100%); height: auto; max-height: 100%; flex-direction: column; }
.ad-sheet-nav { flex: none; width: 200px; display: flex; flex-direction: column; gap: 2px; padding: 16px 10px; border-right: 1px solid var(--line-soft); background: var(--line-soft); overflow-y: auto; }
.ad-sheet-title { margin: 2px 10px 12px; font-family: var(--serif); font-size: 18px; font-weight: 700; letter-spacing: .03em; }
.ad-sheet-nav button { display: flex; align-items: center; gap: 10px; height: 34px; padding: 0 10px; border: 0; border-radius: 10px; background: transparent; color: var(--text-2); font-size: 13.5px; text-align: left; white-space: nowrap; }
.ad-sheet-nav button:hover { background: var(--line-soft); color: var(--text-1); }
.ad-sheet-nav button[aria-current="page"] { background: var(--panel-strong); color: var(--text-1); font-weight: 600; box-shadow: var(--shadow); }
.ad-sheet-nav button[aria-current="page"] svg { color: var(--accent-text); }
.ad-sheet-nav svg { width: 16px; height: 16px; color: var(--text-3); }
.ad-sheet-body { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.ad-sheet-head { display: flex; align-items: center; gap: 8px; padding: 16px 16px 10px 24px; border-bottom: 1px solid var(--line-soft); }
.ad-sheet-head h2 { flex: 1; margin: 0; font-family: var(--serif); font-size: 19px; font-weight: 700; letter-spacing: .02em; }
.ad-sheet-scroll { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 18px; padding: 18px 24px 28px; }
.ad-sheet-sections { display: flex; flex-direction: column; gap: 18px; }
.ad-sheet-block { display: flex; flex-direction: column; gap: 10px; }
.ad-sheet-block + .ad-sheet-block { padding-top: 16px; border-top: 1px solid var(--line-soft); }
.ad-sheet-subhead { display: flex; align-items: center; gap: 8px; min-height: 28px; }
.ad-sheet-subhead .sp { flex: 1; }
.ad-sheet-subhead .ad-label svg, .ad-sheet-block > .ad-label svg { width: 13px; height: 13px; }
.ad-filter { margin-left: auto; width: 180px; height: 28px; padding: 0 10px; border-radius: 9px; border: 1px solid var(--line); background: var(--input-bg); color: var(--text-1); font-size: 12.5px; outline: 0; }
.ad-field-row { display: flex; flex-direction: column; gap: 5px; }
.ad-field-row > label { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--text-3); }
.ad-field-row > label span { font-size: 11.5px; color: var(--err-text); } .ad-field-row > label span.ok { color: var(--ok-text); }
.ad-set-line { display: flex; align-items: center; gap: 6px; }
.ad-set-line input, .ad-set-line select, .ad-sheet-form input, .ad-sheet-form textarea { flex: 1; min-width: 0; height: 34px; padding: 0 11px; border-radius: 10px; border: 1px solid var(--line); background: var(--input-bg); color: var(--text-1); font-size: 13.5px; outline: 0; }
.ad-sheet-form textarea { height: auto; padding: 8px 11px; resize: vertical; }
.ad-set-line input:focus, .ad-set-line select:focus, .ad-sheet-form input:focus, .ad-sheet-form textarea:focus, .ad-persona:focus { border-color: color-mix(in srgb, var(--accent) 60%, transparent); }
.ad-persona { width: 100%; min-height: 120px; max-height: 40vh; padding: 10px 12px; border-radius: 12px; border: 1px solid var(--line); background: var(--input-bg); color: var(--text-1); outline: 0; resize: vertical; font-size: 13.5px; line-height: 1.65; }
.ad-sheet-form { display: flex; flex-direction: column; gap: 6px; padding: 10px; border-radius: 12px; background: var(--line-soft); }
.ad-sheet-form.row { flex-direction: row; flex-wrap: wrap; align-items: center; background: transparent; padding: 0; }
.ad-sheet-me { display: flex; align-items: center; gap: 12px; }
.ad-sheet-me .ad-avatar { width: 56px; height: 56px; font-size: 22px; }
.ad-sheet-me > div { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.ad-sheet-me b { font-size: 16px; } .ad-sheet-me span { font-size: 12px; color: var(--text-4); }
.ad-list-row { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; min-height: 40px; padding: 4px 0; border-bottom: 1px solid var(--line-soft); }
.ad-list-row .n { flex: 1; min-width: 0; display: flex; flex-direction: column; font-size: 13.5px; color: var(--text-1); }
.ad-list-row .n small { font-size: 11.5px; color: var(--text-4); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-list-row .full { flex-basis: 100%; margin: 0; }
.ad-pack-row { display: flex; flex-direction: column; gap: 6px; }
.ad-pack-strip { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; }
.ad-pack-strip img { flex: none; width: 40px; height: 40px; object-fit: contain; border-radius: 8px; background: var(--line-soft); image-rendering: pixelated; }
.ad-switch { position: relative; flex: none; width: 34px; height: 20px; }
.ad-switch input { position: absolute; inset: 0; opacity: 0; margin: 0; cursor: pointer; }
.ad-switch span { position: absolute; inset: 0; border-radius: 999px; background: var(--line); transition: background .15s; pointer-events: none; }
.ad-switch span::after { content: ""; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0, 0, 0, .2); transition: transform .15s; }
.ad-switch input:checked + span { background: var(--accent); } .ad-switch input:checked + span::after { transform: translateX(14px); }
.ad-switch input:focus-visible + span { outline: 2px solid var(--accent); outline-offset: 2px; }
.ad-seg { display: inline-flex; gap: 2px; padding: 3px; border-radius: 11px; background: var(--line-soft); align-self: flex-start; }
.ad-seg button { height: 30px; padding: 0 16px; border: 0; border-radius: 8px; background: transparent; color: var(--text-3); font-size: 13px; }
.ad-seg button[aria-checked="true"] { background: var(--panel-strong); color: var(--text-1); font-weight: 600; box-shadow: var(--shadow); }
.ad-tiles { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.ad-tile { display: flex; flex-direction: column; gap: 2px; padding: 12px 14px; border-radius: 14px; border: 1px solid var(--line); background: var(--panel); }
.ad-tile small { font-size: 11.5px; color: var(--text-4); }
.ad-tile b { font-family: var(--serif); font-size: 24px; font-weight: 700; font-variant-numeric: tabular-nums; }
.ad-tile .u { margin-top: -4px; font-size: 11px; color: var(--text-4); }
.ad-tile .row { display: flex; justify-content: space-between; gap: 6px; margin-top: 6px; font-size: 12px; color: var(--text-3); font-variant-numeric: tabular-nums; }
.ad-calls { display: flex; flex-direction: column; }
.ad-call { display: grid; grid-template-columns: 96px minmax(0, 1fr) 110px 64px; gap: 10px; align-items: center; min-height: 32px; border-bottom: 1px solid var(--line-soft); font-size: 12.5px; color: var(--text-2); font-variant-numeric: tabular-nums; }
.ad-call .w { color: var(--text-4); } .ad-call .m { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .ad-call .n, .ad-call .c { text-align: right; }
.ad-check { display: flex; align-items: center; gap: 8px; font-size: 13.5px; }
.ad-checks { display: flex; flex-wrap: wrap; gap: 6px 14px; }
@container (max-width: 620px) {
  .ad-sheet { flex-direction: column; }
  .ad-sheet-nav { width: auto; flex-direction: row; padding: 8px; border-right: 0; border-bottom: 1px solid var(--line-soft); overflow-x: auto; }
  .ad-sheet-title { display: none; }
  .ad-tiles { grid-template-columns: minmax(0, 1fr); }
  .ad-call { grid-template-columns: 80px minmax(0, 1fr) 90px; } .ad-call .c { display: none; }
}
`;
