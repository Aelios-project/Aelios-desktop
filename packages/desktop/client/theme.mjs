// All colors, radii and shadows are CSS variables on .ad-root, with plain defaults. A skin is a separate
// package that only sets these variables, so nothing outside this file holds a color.
// The default values are copied from Aelios-resident, public/app.css, the night :root block and the
// light block (AGPL-3.0, same author; main at fb4593a, 2026-11-07). Changed: scoped to .ad-root; the light set
// follows the system setting. Only the tokens this shell uses are kept.
export const TOKENS = `.ad-root {
  color-scheme: dark;
  --bg: #070a16;
  --glass: rgba(7, 10, 22, .6);
  --panel: rgba(21, 27, 54, .62);
  --panel-strong: rgba(23, 29, 58, .94);
  --line: rgba(148, 163, 255, .16);
  --line-soft: rgba(148, 163, 255, .10);
  --line-dash: rgba(148, 163, 255, .32);
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
  --violet-text: #b3a8ff;
  --ok: #7BD3A0;
  --ok-text: #a7e6c2;
  --ok-soft: rgba(123, 211, 160, .1);
  --err: #f87171;
  --err-text: #fca5a5;
  --shadow: 0 1px 0 rgba(180, 190, 255, .07) inset, 0 10px 30px rgba(2, 5, 18, .5);
  --avatar-bg: radial-gradient(circle at 35% 30%, #2d2b66, #11142e 72%);
  --avatar-ring: rgba(246, 221, 174, .35);
  --input-bg: #0b0f22;
  --font: system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", "Microsoft YaHei", "Segoe UI", sans-serif;
  --serif: "Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", serif;
  --mono: ui-monospace, SFMono-Regular, Menlo, monospace;
}
@media (prefers-color-scheme: light) {
  .ad-root {
    color-scheme: light;
    --bg: #F8F5EF;
    --glass: rgba(248, 245, 239, .74);
    --panel: rgba(255, 255, 255, .82);
    --panel-strong: rgba(255, 255, 255, .97);
    --line: rgba(109, 92, 210, .16);
    --line-soft: rgba(109, 92, 210, .10);
    --line-dash: rgba(109, 92, 210, .3);
    --mine: rgba(244, 160, 124, .24);
    --mine-line: rgba(214, 120, 84, .35);
    --text-1: #232437;
    --text-2: #3c3e5c;
    --text-3: #5a5d82;
    --text-4: #666a90;
    --accent-text: #B0532F;
    --accent-soft: rgba(244, 160, 124, .16);
    --on-accent: #2a1608;
    --violet-text: #5B4BC4;
    --ok: #3E9A6A;
    --ok-text: #2c7a52;
    --ok-soft: rgba(62, 154, 106, .1);
    --err: #B23B31;
    --err-text: #B23B31;
    --shadow: 0 1px 0 rgba(255, 255, 255, .7) inset, 0 8px 22px rgba(88, 76, 160, .10);
    --avatar-bg: radial-gradient(circle at 35% 30%, #fff6dc, #e9e2fb 75%);
    --avatar-ring: rgba(201, 150, 46, .45);
    --input-bg: #fff;
  }
}`;

