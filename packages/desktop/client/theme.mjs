// All colors, radii and shadows are CSS variables on .ad-root, with plain defaults. The day palette is the
// `.ad-root.day` class, not a media query: DSH can set its own light or dark independently of the system, and the
// shell follows DSH (client/palette.mjs decides, and adds the class). A skin is a separate
// package that only sets these variables, so nothing outside this file holds a color.
// The default values are copied from Aelios-resident, public/app.css, the night :root block and the
// light block (AGPL-3.0, same author; main at b118dfb, 2026-11-07). Changed: scoped to .ad-root; the day lines and
// greys lean warm (cream and peach) instead of violet; the status dots, the nebula, --violet and --moon are named
// here because the styles use them; the columns are a little narrower.
export const TOKENS = `.ad-root {
  color-scheme: dark;
  --bg: #070a16;
  --nebula-a: rgba(139, 124, 246, .16);
  --nebula-b: rgba(244, 160, 124, .10);
  --nebula-c: rgba(90, 140, 255, .08);
  --stars-opacity: .9;
  --star-1: rgba(255, 255, 255, .85);
  --star-2: rgba(190, 205, 255, .7);
  --star-3: rgba(244, 160, 124, .55);
  --glass: rgba(7, 10, 22, .6);
  --panel: rgba(21, 27, 54, .62);
  --panel-strong: rgba(23, 29, 58, .96);
  --line: rgba(148, 163, 255, .16);
  --line-soft: rgba(148, 163, 255, .09);
  --line-dash: rgba(148, 163, 255, .32);
  --mine: rgba(244, 160, 124, .16);
  --mine-line: rgba(244, 160, 124, .35);
  --text-1: #eef0ff;
  --text-2: #c9cdea;
  --text-3: #a3a9cf;
  --text-4: #8a90b8;
  --accent: #F4A07C;
  --accent-text: #F4A07C;
  --accent-soft: rgba(244, 160, 124, .12);
  --on-accent: #251304;
  --violet: #8b7cf6;
  --violet-text: #b3a8ff;
  --moon: #F6DDAE;
  --ok: #7BD3A0;
  --ok-text: #a7e6c2;
  --ok-soft: rgba(123, 211, 160, .1);
  --warn: #F2C46D;
  --err: #f87171;
  --err-text: #fca5a5;
  --idle: #6d7399;
  --shadow: 0 1px 0 rgba(180, 190, 255, .07) inset, 0 10px 30px rgba(2, 5, 18, .5);
  --lift: 0 24px 80px rgba(2, 5, 18, .6);
  --avatar-bg: radial-gradient(circle at 35% 30%, #2d2b66, #11142e 72%);
  --avatar-ring: rgba(246, 221, 174, .35);
  --input-bg: #0b0f22;
  --scrim: rgba(4, 6, 16, .62);
  --rail-w: 248px;
  --panel-w: 340px;
  --font: system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", "Microsoft YaHei", "Segoe UI", sans-serif;
  --serif: "Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", Georgia, serif;
  --mono: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.ad-root.day {
  color-scheme: light;
  --bg: #F8F3EC;
  --nebula-a: rgba(244, 160, 124, .20);
  --nebula-b: rgba(246, 221, 174, .42);
  --nebula-c: rgba(139, 124, 246, .07);
  --stars-opacity: .55;
  --star-1: rgba(201, 150, 46, .55);
  --star-2: rgba(214, 120, 84, .35);
  --star-3: rgba(201, 150, 46, .45);
  --glass: rgba(251, 247, 241, .78);
  --panel: rgba(255, 255, 255, .80);
  --panel-strong: #FFFDFA;
  --line: rgba(120, 86, 60, .15);
  --line-soft: rgba(120, 86, 60, .08);
  --line-dash: rgba(120, 86, 60, .28);
  --mine: rgba(244, 160, 124, .22);
  --mine-line: rgba(214, 120, 84, .30);
  --text-1: #2B2420;
  --text-2: #463c36;
  --text-3: #6a5c53;
  --text-4: #75675d;
  --accent: #F4A07C;
  --accent-text: #A34D2A;
  --accent-soft: rgba(244, 160, 124, .18);
  --on-accent: #2a1608;
  --violet: #8b7cf6;
  --violet-text: #5B4BC4;
  --moon: #C9962E;
  --ok: #3E9A6A;
  --ok-text: #2c7a52;
  --ok-soft: rgba(62, 154, 106, .1);
  --warn: #D08A2E;
  --err: #B23B31;
  --err-text: #B23B31;
  --idle: #b3a69b;
  --shadow: 0 1px 0 rgba(255, 255, 255, .7) inset, 0 6px 20px rgba(120, 80, 50, .08);
  --lift: 0 24px 70px rgba(120, 80, 50, .18);
  --avatar-bg: radial-gradient(circle at 35% 30%, #fff6dc, #f6e1d3 75%);
  --avatar-ring: rgba(201, 150, 46, .45);
  --input-bg: #fff;
  --scrim: rgba(60, 40, 25, .22);
}`;
