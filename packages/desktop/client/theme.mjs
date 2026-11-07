// All colors, radii and shadows are CSS variables on .ad-root, with plain defaults. A skin is a separate
// package that only sets these variables, so nothing outside this file holds a color.
// The default values are copied from Aelios-resident, public/app.css, the night :root block (AGPL-3.0,
// same author; main at fb4593a, 2026-11-07). Changed: scoped to .ad-root instead of :root.
export const TOKENS = `.ad-root {
  color-scheme: dark;
  --bg: #070a16;
  --glass: rgba(7, 10, 22, .6);
  --panel: rgba(21, 27, 54, .62);
  --panel-strong: rgba(23, 29, 58, .94);
  --line: rgba(148, 163, 255, .16);
  --line-soft: rgba(148, 163, 255, .10);
  --mine: rgba(244, 160, 124, .16);
  --mine-line: rgba(244, 160, 124, .35);
  --text-1: #eef0ff;
  --text-2: #c9cdea;
  --text-3: #9aa0c8;
  --text-4: #7f85b0;
  --accent: #F4A07C;
  --accent-text: #F4A07C;
  --accent-soft: rgba(244, 160, 124, .12);
  --on-accent: #251304;
  --ok-text: #a7e6c2;
  --err-text: #fca5a5;
  --shadow: 0 1px 0 rgba(180, 190, 255, .07) inset, 0 10px 30px rgba(2, 5, 18, .5);
  --avatar-bg: radial-gradient(circle at 35% 30%, #2d2b66, #11142e 72%);
  --avatar-ring: rgba(246, 221, 174, .35);
  --input-bg: #0b0f22;
  --font: system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", "Microsoft YaHei", "Segoe UI", sans-serif;
  --serif: "Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", serif;
  --mono: ui-monospace, SFMono-Regular, Menlo, monospace;
}`;

// Layout and parts. The bubble rules follow Aelios-resident's .bubble (same source and date as above).
export const LAYOUT = `
.ad-root { display: flex; height: 100%; min-height: 0; color: var(--text-1); background: var(--bg); font-family: var(--font); }
.ad-root * { box-sizing: border-box; }
.ad-left { flex: none; width: 260px; display: flex; flex-direction: column; gap: 4px; padding: 10px; border-right: 1px solid var(--line); background: var(--glass); overflow: auto; }
.ad-left h2 { margin: 4px 6px 6px; font-size: 12px; font-weight: 600; color: var(--text-3); }
.ad-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 6px; border: 0; border-radius: 12px; background: transparent; color: var(--text-1); font: inherit; text-align: left; cursor: pointer; }
.ad-item:hover { background: var(--line-soft); }
.ad-item[aria-current="true"] { background: var(--accent-soft); }
.ad-avatar { flex: none; width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; background: var(--avatar-bg); box-shadow: 0 0 0 1px var(--avatar-ring); font-family: var(--serif); }
.ad-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); }
.ad-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.ad-head { padding: 10px 16px; border-bottom: 1px solid var(--line); font-weight: 600; }
.ad-state { margin-left: 8px; font-size: 12px; font-weight: 400; color: var(--text-3); }
.ad-lines { flex: 1; min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: 10px; padding: 16px; }
.ad-row { display: flex; }
.ad-row.user { justify-content: flex-end; }
.ad-bubble { position: relative; max-width: min(640px, 85%); padding: 9px 13px; border-radius: 18px; border: 1px solid var(--line); background: var(--panel); box-shadow: var(--shadow); overflow-wrap: anywhere; user-select: text; }
.ad-row.user .ad-bubble { background: var(--mine); border-color: var(--mine-line); white-space: pre-wrap; }
.ad-bubble p { margin: 0 0 6px; } .ad-bubble p:last-child { margin: 0; }
.ad-meta { display: block; margin-top: 4px; font-size: 11px; color: var(--text-4); text-align: right; }
.ad-compose { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--line); }
.ad-compose textarea, .ad-form input, .ad-form select { flex: 1; min-width: 0; padding: 9px 12px; border-radius: 12px; border: 1px solid var(--line); background: var(--input-bg); color: var(--text-1); font: inherit; }
.ad-btn { padding: 9px 16px; border-radius: 12px; border: 1px solid var(--accent); background: var(--accent); color: var(--on-accent); font: inherit; cursor: pointer; }
.ad-btn:disabled { opacity: .5; cursor: default; }
.ad-btn.quiet { background: transparent; color: var(--accent-text); }
.ad-root :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.ad-form { margin: auto; width: min(420px, 90%); display: flex; flex-direction: column; gap: 12px; padding: 24px; border-radius: 18px; border: 1px solid var(--line); background: var(--panel-strong); box-shadow: var(--shadow); }
.ad-form label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--text-2); }
.ad-error { color: var(--err-text); font-size: 13px; }
.ad-note { color: var(--text-3); font-size: 13px; }
@media (prefers-reduced-motion: reduce) { .ad-root * { animation: none !important; transition: none !important; } }
`;
