// Copied from Aelios-resident, public/app.css (AGPL-3.0, same author; main at b118dfb, 2026-11-07): the wide
// screen header (.top .ident), the stream (.stream), the bubbles (.row, .bubble, .meta) and the composer
// (.compose .bar, .field, .round). Changed: ad- prefix, scoped to .ad-root; the pages are columns of one window,
// so the header is a pill in the middle of its column and the composer is one rounded box under it.
export const CHAT = `
.ad-main { flex: 1; min-width: 0; display: flex; flex-direction: column; min-height: 0; }
.ad-top, .ad-stream, .ad-compose { width: 100%; }
.ad-around { display: flex; align-items: center; gap: 8px; justify-content: space-between; width: min(100% - 36px, 768px); margin: 6px auto 0; padding: 6px 10px 6px 14px; border-radius: 12px; border: 1px dashed var(--line-dash); background: var(--panel); font-size: 12px; color: var(--text-3); }
.ad-stream { padding-inline: max(18px, calc((100% - 768px) / 2)); }
.ad-compose { padding-inline: max(18px, calc((100% - 780px) / 2)); }
.ad-top { position: relative; display: flex; align-items: center; justify-content: center; min-height: 64px; padding: 8px 56px 4px 16px; }
.ad-ident { display: flex; align-items: center; gap: 8px; min-width: 0; max-width: min(460px, 100%); padding: 4px 14px 4px 4px; border: 1px solid var(--line); border-radius: 999px; background: var(--panel-strong); box-shadow: var(--shadow); }
.ad-ident .ad-avatar { width: 30px; height: 30px; font-size: 13px; }
.ad-who { min-width: 0; display: flex; flex-direction: column; }
.ad-name { font-size: 15px; font-weight: 600; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-status { font-size: 11px; line-height: 1.4; color: var(--text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-top .ad-act { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); display: flex; align-items: center; gap: 2px; }
.ad-around { display: flex; align-items: center; gap: 8px; justify-content: space-between; width: min(100% - 36px, 768px); margin: 6px auto 0; padding: 6px 10px 6px 14px; border-radius: 12px; border: 1px dashed var(--line-dash); background: var(--panel); font-size: 12px; color: var(--text-3); }
.ad-stream { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 8px 18px 16px; display: flex; flex-direction: column; gap: 12px; scroll-behavior: smooth; }
.ad-stream > .grow { flex: 1; }
.ad-row { display: flex; flex-direction: column; gap: 4px; max-width: 78%; }
.ad-row.ai { align-self: flex-start; align-items: flex-start; }
.ad-row.me { align-self: flex-end; align-items: flex-end; }
.ad-bubble { position: relative; max-width: 100%; padding: 9px 13px; border-radius: 6px 18px 18px 18px; border: 1px solid var(--line); background: var(--panel); box-shadow: var(--shadow); overflow-wrap: anywhere; user-select: text; }
.ad-row.ai .ad-bubble.first { border-radius: 18px 18px 18px 6px; }
.ad-row.me .ad-bubble { background: var(--mine); border-color: var(--mine-line); box-shadow: none; border-radius: 18px 18px 6px 18px; white-space: pre-wrap; }
.ad-row.me .ad-bubble .ad-md { white-space: pre-wrap; }
.ad-bubble .ad-md { display: block; }
.ad-bubble .ad-md > p:last-child { display: inline; }
.ad-bubble .ad-md > p { margin: 0; }
.ad-bubble .ad-md > p + p { margin-top: .55em; }
.ad-meta { float: right; margin: 9px -3px -6px 12px; font-size: 11px; line-height: 1; color: var(--text-4); white-space: nowrap; }
.ad-row.me .ad-meta { color: var(--text-3); }
.ad-compose { padding: 4px 18px 18px; }
.ad-bar { display: flex; align-items: flex-end; gap: 6px; padding: 6px; border: 1px solid var(--line); border-radius: 26px; background: var(--panel-strong); box-shadow: var(--shadow); transition: border-color .15s; }
.ad-bar:focus-within { border-color: color-mix(in srgb, var(--accent) 60%, transparent); }
.ad-field { flex: 1; min-width: 0; display: flex; align-items: flex-end; min-height: 40px; padding-left: 8px; }
.ad-field textarea { flex: 1; min-width: 0; max-height: 38vh; padding: 8px 0; border: 0; outline: 0; background: transparent; resize: none; font-size: 15px; line-height: 1.5; }
.ad-field textarea::placeholder { color: var(--text-4); }
.ad-round { flex: none; width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; border: 0; background: var(--accent); color: var(--on-accent); }
.ad-round svg { width: 19px; height: 19px; }
.ad-round:disabled { opacity: .5; cursor: default; }
.ad-round.quiet { background: var(--line-soft); color: var(--text-2); }
.ad-quote { margin: 0 0 2px; padding: 5px 10px; border-radius: 10px; background: var(--line-soft); font-size: 12px; line-height: 1.5; color: var(--text-3); max-width: 100%; white-space: pre-wrap; overflow-wrap: anywhere; }
.ad-busy { display: flex; flex-direction: column; gap: 6px; align-items: flex-start; max-width: 100%; }
.ad-busy > button { display: inline-flex; align-items: center; gap: 6px; min-height: 32px; padding: 0 12px 0 10px; border-radius: 999px; border: 1px dashed var(--line-dash); background: transparent; color: var(--text-3); font-size: 12px; }
.ad-busy > button.live { color: var(--accent-text); border-color: color-mix(in srgb, var(--accent) 55%, transparent); }
.ad-busy > button svg { width: 14px; height: 14px; color: var(--moon); }
.ad-busy > button .chev { width: 12px; height: 12px; color: currentColor; transition: transform .15s; }
.ad-busy.open > button .chev { transform: rotate(90deg); }
.ad-busy-list { display: flex; flex-direction: column; width: min(340px, 78vw); padding: 6px 12px; border-radius: 14px; background: var(--panel-strong); border: 1px solid var(--line); font-size: 12px; line-height: 1.5; }
.ad-busy-item { border-top: 1px solid var(--line-soft); }
.ad-busy-item:first-child { border-top: 0; }
.ad-busy-item > button { display: flex; gap: 8px; width: 100%; padding: 6px 0; border: 0; background: none; text-align: left; color: var(--text-2); }
.ad-busy-item .what { flex: none; color: var(--text-1); }
.ad-busy-item .detail { flex: 1; min-width: 0; color: var(--text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-busy-item .state { flex: none; color: var(--text-4); }
.ad-busy-item pre { margin: 0 0 8px; max-height: 40vh; overflow: auto; padding: 8px 10px; border-radius: 10px; background: var(--input-bg); white-space: pre-wrap; overflow-wrap: anywhere; font: 12px/1.6 var(--mono); color: var(--text-2); }
.ad-busy-item .label { font-size: 11px; color: var(--text-4); }
.ad-pics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px; width: min(260px, 70vw); }
.ad-pics.one { grid-template-columns: minmax(0, 1fr); }
.ad-pics button { padding: 0; border: 0; border-radius: 14px; overflow: hidden; aspect-ratio: 1; background: var(--panel); }
.ad-pics.one button { aspect-ratio: auto; min-height: 120px; }
.ad-pics img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ad-files { display: flex; flex-wrap: wrap; gap: 6px; max-width: 100%; }
.ad-file { display: inline-flex; align-items: center; gap: 6px; max-width: 100%; padding: 6px 10px; border-radius: 12px; border: 1px solid var(--line); background: var(--panel); color: var(--text-2); font-size: 12px; }
.ad-file:hover { border-color: var(--line-dash); }
.ad-file svg { width: 14px; height: 14px; color: var(--accent-text); }
.ad-file .n { max-width: 22ch; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-file .s { color: var(--text-4); }
.ad-thumbs { display: flex; gap: 8px; padding: 0 2px 8px; overflow-x: auto; }
.ad-thumbs div { position: relative; flex: none; width: 64px; height: 64px; border-radius: 12px; overflow: hidden; background: var(--panel); }
.ad-thumbs img { width: 100%; height: 100%; object-fit: cover; }
.ad-thumbs .ad-x { position: absolute; top: 2px; right: 2px; width: 22px; height: 22px; border-radius: 50%; border: 0; background: rgba(0, 0, 0, .55); color: #fff; display: grid; place-items: center; }
.ad-thumbs .ad-x svg { width: 11px; height: 11px; }
.ad-voice { display: flex; align-items: center; gap: 10px; padding: 7px 12px 7px 7px; border-radius: 18px 18px 18px 6px; border: 1px solid var(--line); background: var(--panel); }
.ad-row.me .ad-voice { background: var(--mine); border-color: var(--mine-line); border-radius: 18px 18px 6px 18px; }
.ad-voice-play { flex: none; width: 34px; height: 34px; border-radius: 50%; border: 0; display: grid; place-items: center; background: var(--violet); color: #fff; }
.ad-row.me .ad-voice-play { background: var(--accent); color: var(--on-accent); }
.ad-voice-play svg { width: 14px; height: 14px; }
.ad-voice .len { font-size: 12px; color: var(--text-3); font-variant-numeric: tabular-nums; }
.ad-stickers { display: flex; flex-wrap: wrap; gap: 6px; }
.ad-sticker { border-radius: 14px; overflow: hidden; background: var(--panel); }
.ad-sticker img, .ad-sticker video { display: block; width: 120px; height: auto; image-rendering: pixelated; }
.ad-picker { display: flex; flex-direction: column; gap: 8px; max-height: 240px; overflow-y: auto; margin: 0 0 8px; padding: 8px; border-radius: 16px; border: 1px solid var(--line); background: var(--panel-strong); box-shadow: var(--shadow); }
.ad-picker .ad-group-title { margin: 0 4px; }
.ad-pack-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(64px, 1fr)); gap: 6px; }
.ad-pack-grid button { aspect-ratio: 1; padding: 6px; border: 0; border-radius: 12px; background: var(--panel); display: grid; place-items: center; }
.ad-pack-grid button:hover { background: var(--accent-soft); }
.ad-pack-grid img, .ad-pack-grid video { max-width: 100%; max-height: 100%; image-rendering: pixelated; }
.ad-round.on { background: var(--accent-soft); color: var(--accent-text); }
.ad-round.rec { background: var(--err); color: #fff; animation: ad-pulse 1.4s infinite ease-in-out; }
@keyframes ad-pulse { 50% { opacity: .55; } }
.ad-typing { display: inline-flex; gap: 4px; padding: 3px 2px; }
.ad-typing span { width: 6px; height: 6px; border-radius: 50%; background: var(--text-3); animation: ad-bounce 1.2s infinite ease-in-out; }
.ad-typing span:nth-child(2) { animation-delay: .15s; } .ad-typing span:nth-child(3) { animation-delay: .3s; }
@keyframes ad-bounce { 0%, 60%, 100% { opacity: .35; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-2px); } }
`;