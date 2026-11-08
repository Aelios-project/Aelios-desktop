// Copied from Aelios-resident, public/app.css (AGPL-3.0, same author; main at b118dfb, 2026-11-07): the wide
// screen header (.top .ident), the stream (.stream), the bubbles (.row, .bubble, .meta) and the composer
// (.compose .bar, .field, .round). Changed: ad- prefix, scoped to .ad-root; the pages are columns of one window,
// so the header is a pill in the middle of its column with search beside it, the busy line is a chip of icons and
// numbers, and the composer is one rounded box.
export const CHAT = `
.ad-main { position: relative; flex: 1; min-width: 0; display: flex; flex-direction: column; min-height: 0; }
.ad-top { position: relative; z-index: 4; display: flex; align-items: center; justify-content: center; min-height: 62px; padding: 10px 96px 6px; }
.ad-ident { display: flex; align-items: center; gap: 9px; min-width: 0; max-width: min(440px, 100%); padding: 4px 14px 4px 4px; border: 1px solid var(--line); border-radius: 999px; background: var(--panel-strong); box-shadow: var(--shadow); }
.ad-ident .ad-avatar { width: 30px; height: 30px; font-size: 13px; }
.ad-ident .ad-name { font-size: 14.5px; font-weight: 600; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-ident .ad-meta-chip { display: inline-flex; align-items: center; gap: 4px; margin-left: 2px; font-size: 12px; color: var(--text-3); font-variant-numeric: tabular-nums; }
.ad-ident .ad-meta-chip svg { width: 14px; height: 14px; }
.ad-top .ad-act { position: absolute; right: 12px; top: 50%; transform: translateY(-40%); display: flex; align-items: center; gap: 2px; }

.ad-search { position: absolute; top: 58px; right: 12px; z-index: 5; width: min(420px, calc(100% - 24px)); display: flex; flex-direction: column; max-height: min(60vh, 520px); border-radius: 16px; border: 1px solid var(--line); background: var(--panel-strong); box-shadow: var(--lift); overflow: hidden; }
.ad-search form { display: flex; align-items: center; gap: 8px; padding: 6px 6px 6px 12px; border-bottom: 1px solid var(--line-soft); }
.ad-search form > svg { width: 16px; height: 16px; color: var(--text-4); }
.ad-search input { flex: 1; min-width: 0; height: 34px; border: 0; outline: 0; background: transparent; color: var(--text-1); font-size: 14px; }
.ad-search input::placeholder { color: var(--text-4); }
.ad-hits { overflow-y: auto; padding: 6px; display: flex; flex-direction: column; gap: 2px; }
.ad-hits .ad-hint { padding: 10px; text-align: center; }
.ad-hit { display: flex; flex-direction: column; gap: 2px; padding: 8px 10px; border: 0; border-radius: 10px; background: transparent; text-align: left; }
.ad-hit:hover, .ad-hit:focus-visible { background: var(--line-soft); }
.ad-hit .t { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-size: 13px; line-height: 1.5; color: var(--text-2); overflow-wrap: anywhere; }
.ad-hit .t b { color: var(--accent-text); font-weight: 600; }
.ad-hit .s { font-size: 11px; color: var(--text-4); }
.ad-around { position: absolute; top: 60px; left: 50%; z-index: 3; transform: translateX(-50%); display: flex; align-items: center; gap: 8px; padding: 4px 4px 4px 12px; border-radius: 999px; border: 1px solid var(--line); background: var(--panel-strong); box-shadow: var(--shadow); font-size: 12px; color: var(--text-3); white-space: nowrap; }
.ad-around svg { width: 14px; height: 14px; }

.ad-stream { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 8px max(18px, calc((100% - 760px) / 2)) 16px; display: flex; flex-direction: column; gap: 10px; scroll-behavior: smooth; }
.ad-stream > .grow { flex: 1; }
.ad-row { display: flex; flex-direction: column; gap: 4px; max-width: 78%; }
.ad-row.ai { align-self: flex-start; align-items: flex-start; }
.ad-row.me { align-self: flex-end; align-items: flex-end; }
.ad-row.note { align-self: center; align-items: center; max-width: 92%; }
.ad-note-bubble { border-style: dashed !important; border-color: var(--line-dash) !important; background: transparent !important; box-shadow: none !important; border-radius: 14px !important; padding: 5px 12px !important; color: var(--text-3); font-size: 12px; }
.ad-who-g { padding: 0 4px 1px; font-size: 11px; letter-spacing: .03em; color: var(--text-4); }
.ad-bubble { position: relative; max-width: 100%; padding: 9px 13px; border-radius: 6px 18px 18px 18px; border: 1px solid var(--line); background: var(--panel); box-shadow: var(--shadow); font-size: 15px; overflow-wrap: anywhere; user-select: text; }
.ad-row.ai .ad-bubble.first { border-radius: 18px 18px 18px 6px; }
.ad-row.me .ad-bubble { background: var(--mine); border-color: var(--mine-line); box-shadow: none; border-radius: 18px 18px 6px 18px; white-space: pre-wrap; }
.ad-bubble .ad-md { display: block; }
.ad-bubble .ad-md > p:last-child { display: inline; }
.ad-bubble .ad-md > p { margin: 0; }
.ad-bubble .ad-md > p + p { margin-top: .55em; }
.ad-meta { float: right; margin: 9px -3px -6px 12px; font-size: 11px; line-height: 1; color: var(--text-4); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ad-row.me .ad-meta { color: var(--text-3); }
.ad-quote { margin: 0 0 2px; padding: 5px 10px; border-radius: 10px; background: var(--line-soft); font-size: 12px; line-height: 1.5; color: var(--text-3); max-width: 100%; white-space: pre-wrap; overflow-wrap: anywhere; }

.ad-busy { display: flex; flex-direction: column; gap: 6px; align-items: flex-start; max-width: 100%; }
.ad-busy > button { display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 8px 0 10px; border-radius: 999px; border: 1px dashed var(--line-dash); background: transparent; color: var(--text-3); font-size: 12px; font-variant-numeric: tabular-nums; }
.ad-busy > button:hover { color: var(--text-1); border-color: var(--text-4); }
.ad-busy > button.live { color: var(--accent-text); border-color: color-mix(in srgb, var(--accent) 55%, transparent); }
.ad-busy > button.live .spark { animation: ad-pulse 1.4s infinite ease-in-out; }
.ad-busy > button svg { width: 13px; height: 13px; }
.ad-busy > button .spark, .ad-busy > button .chev { display: grid; place-items: center; }
.ad-busy > button .spark { color: var(--violet-text); }
.ad-busy > button .sep { width: 1px; height: 12px; background: var(--line); }
.ad-busy > button .chev { color: var(--text-4); transition: transform .15s; }
.ad-busy > button .chev svg { width: 12px; height: 12px; }
.ad-busy.open > button .chev { transform: rotate(90deg); }
.ad-busy-list { display: flex; flex-direction: column; width: min(360px, 70vw); padding: 4px 12px; border-radius: 14px; background: var(--panel-strong); border: 1px solid var(--line); font-size: 12px; line-height: 1.5; }
.ad-busy-item { border-top: 1px solid var(--line-soft); }
.ad-busy-item:first-child { border-top: 0; }
.ad-busy-item > button { display: flex; align-items: center; gap: 8px; width: 100%; padding: 6px 0; border: 0; background: none; text-align: left; color: var(--text-2); }
.ad-busy-item > button svg { width: 13px; height: 13px; color: var(--text-4); }
.ad-busy-item .what { flex: none; color: var(--text-1); }
.ad-busy-item .detail { flex: 1; min-width: 0; color: var(--text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-busy-item pre { margin: 0 0 8px; max-height: 40vh; overflow: auto; padding: 8px 10px; border-radius: 10px; background: var(--input-bg); white-space: pre-wrap; overflow-wrap: anywhere; font: 12px/1.6 var(--mono); color: var(--text-2); }
.ad-busy-item .label { font-size: 11px; color: var(--text-4); }

.ad-pics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px; width: min(260px, 70vw); }
.ad-pics.one { grid-template-columns: minmax(0, 1fr); }
.ad-pics button { padding: 0; border: 0; border-radius: 14px; overflow: hidden; aspect-ratio: 1; background: var(--panel); }
.ad-pics.one button { aspect-ratio: auto; min-height: 120px; }
.ad-pics img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ad-files { display: flex; flex-wrap: wrap; gap: 6px; max-width: 100%; }
.ad-file { display: inline-flex; align-items: center; gap: 6px; max-width: 100%; padding: 6px 10px; border-radius: 12px; border: 1px solid var(--line); background: var(--panel); color: var(--text-2); font-size: 12.5px; }
.ad-file:hover { border-color: var(--line-dash); }
.ad-file svg { width: 14px; height: 14px; color: var(--accent-text); }
.ad-file .n { max-width: 22ch; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-file .s { color: var(--text-4); font-variant-numeric: tabular-nums; }
.ad-voice { display: flex; align-items: center; gap: 10px; padding: 6px 12px 6px 6px; border-radius: 18px 18px 18px 6px; border: 1px solid var(--line); background: var(--panel); }
.ad-row.me .ad-voice { background: var(--mine); border-color: var(--mine-line); border-radius: 18px 18px 6px 18px; }
.ad-voice-play { flex: none; width: 32px; height: 32px; border-radius: 50%; border: 0; display: grid; place-items: center; background: var(--violet); color: #fff; }
.ad-row.me .ad-voice-play { background: var(--accent); color: var(--on-accent); }
.ad-voice-play svg { width: 13px; height: 13px; }
.ad-voice .len { font-size: 12px; color: var(--text-3); font-variant-numeric: tabular-nums; }
.ad-stickers { display: flex; flex-wrap: wrap; gap: 6px; }
.ad-sticker { border-radius: 14px; overflow: hidden; background: var(--panel); }
.ad-sticker img, .ad-sticker video { display: block; width: 112px; height: auto; image-rendering: pixelated; }

.ad-chips { display: flex; flex-wrap: wrap; gap: 6px; max-width: 100%; }
.ad-chip { display: inline-flex; align-items: center; gap: 6px; max-width: 100%; height: 28px; padding: 0 10px 0 6px; border-radius: 999px; border: 1px solid var(--line); background: var(--panel); color: var(--text-2); font-size: 12.5px; }
.ad-chip:hover { color: var(--text-1); border-color: var(--text-4); }
.ad-chip .n { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ad-chip .ad-helper { width: 18px; height: 18px; background: transparent; }

.ad-compose { padding: 4px max(18px, calc((100% - 772px) / 2)) 16px; }
.ad-bar { display: flex; align-items: flex-end; gap: 4px; padding: 5px; border: 1px solid var(--line); border-radius: 24px; background: var(--panel-strong); box-shadow: var(--shadow); transition: border-color .15s; }
.ad-bar:focus-within { border-color: color-mix(in srgb, var(--accent) 60%, transparent); }
.ad-field { flex: 1; min-width: 0; display: flex; align-items: flex-end; min-height: 38px; padding-left: 4px; }
.ad-field textarea { flex: 1; min-width: 0; max-height: 38vh; padding: 8px 0; border: 0; outline: 0; background: transparent; resize: none; font-size: 15px; line-height: 1.5; }
.ad-field textarea:focus-visible { outline: 0; } /* the bar around it shows the focus */
.ad-field textarea::placeholder { color: var(--text-4); }
.ad-round { flex: none; width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; border: 0; background: var(--accent); color: var(--on-accent); }
.ad-round svg { width: 18px; height: 18px; }
.ad-round:disabled { opacity: .45; }
.ad-plain { flex: none; width: 34px; height: 34px; margin-bottom: 2px; border: 0; border-radius: 50%; display: grid; place-items: center; background: transparent; color: var(--text-4); }
.ad-plain:hover { color: var(--text-1); background: var(--line-soft); }
.ad-plain svg { width: 18px; height: 18px; }
.ad-plain.on, .ad-plain[aria-expanded="true"] { color: var(--accent-text); background: var(--accent-soft); }
.ad-plain.rec { color: #fff; background: var(--err); animation: ad-pulse 1.4s infinite ease-in-out; }
.ad-thumbs { display: flex; gap: 8px; padding: 0 2px 8px; overflow-x: auto; }
.ad-thumbs div { position: relative; flex: none; width: 60px; height: 60px; border-radius: 12px; overflow: hidden; background: var(--panel); }
.ad-thumbs img { width: 100%; height: 100%; object-fit: cover; }
.ad-docs { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 2px 8px; }
.ad-doc { position: relative; display: inline-flex; align-items: center; gap: 6px; max-width: 100%; padding: 4px 6px 4px 10px; border-radius: 999px; background: var(--panel); border: 1px solid var(--line); font-size: 12.5px; overflow-wrap: anywhere; }
.ad-doc .ad-x { position: static; width: 20px; height: 20px; }
.ad-thumbs .ad-x { position: absolute; top: 2px; right: 2px; width: 20px; height: 20px; border-radius: 50%; border: 0; background: rgba(0, 0, 0, .55); color: #fff; display: grid; place-items: center; }
.ad-thumbs .ad-x svg { width: 10px; height: 10px; }
.ad-picker { display: flex; flex-direction: column; gap: 8px; max-height: 240px; overflow-y: auto; margin: 0 0 8px; padding: 10px; border-radius: 16px; border: 1px solid var(--line); background: var(--panel-strong); box-shadow: var(--shadow); }
.ad-pack-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(60px, 1fr)); gap: 6px; }
.ad-pack-grid button { aspect-ratio: 1; padding: 6px; border: 0; border-radius: 12px; background: var(--line-soft); display: grid; place-items: center; }
.ad-pack-grid button:hover { background: var(--accent-soft); }
.ad-pack-grid img, .ad-pack-grid video { max-width: 100%; max-height: 100%; image-rendering: pixelated; }
.ad-msg-acts { display: flex; align-items: center; gap: 0; margin: -2px 0 0 2px; opacity: 0; transition: opacity .12s; }
.ad-row:hover .ad-msg-acts, .ad-msg-acts:focus-within { opacity: 1; }
.ad-msg-acts .ad-icon-btn { width: 26px; height: 26px; color: var(--text-4); }
.ad-msg-acts .ad-icon-btn svg { width: 14px; height: 14px; }
.ad-msg-acts .said { margin-left: 6px; font-size: 11.5px; color: var(--text-3); }
.ad-cmds { display: flex; flex-direction: column; gap: 2px; margin: 0 0 8px; padding: 6px; border-radius: 14px; border: 1px solid var(--line); background: var(--panel-strong); box-shadow: var(--shadow); }
.ad-cmds button { display: flex; align-items: center; gap: 10px; padding: 7px 10px; border: 0; border-radius: 9px; background: transparent; text-align: left; color: var(--text-2); font-size: 13px; }
.ad-cmds button:hover, .ad-cmds button:focus-visible { background: var(--accent-soft); color: var(--text-1); }
.ad-cmds svg { width: 14px; height: 14px; color: var(--text-4); }
.ad-cmds code { min-width: 70px; font-family: var(--mono); color: var(--accent-text); }
.ad-notice { display: flex; align-items: flex-start; gap: 8px; margin: 0 max(18px, calc((100% - 772px) / 2)) 8px; padding: 10px 8px 10px 14px; border-radius: 14px; border: 1px dashed var(--line-dash); background: var(--panel); font-size: 13px; max-height: 30vh; overflow-y: auto; }
.ad-notice .ad-md { flex: 1; min-width: 0; }
`;
