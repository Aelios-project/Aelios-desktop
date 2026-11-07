// Copied from Aelios-resident, public/app.css (AGPL-3.0, same author; main at b118dfb, 2026-11-07): the wide
// screen header (.top .ident), the stream (.stream), the bubbles (.row, .bubble, .meta) and the composer
// (.compose .bar, .field, .round). Changed: ad- prefix, scoped to .ad-root; the pages are columns of one window,
// so the header is a pill in the middle of its column and the composer is one rounded box under it.
export const CHAT = `
.ad-main { flex: 1; min-width: 0; display: flex; flex-direction: column; min-height: 0; }
.ad-top, .ad-stream, .ad-compose { width: 100%; }
.ad-stream { padding-inline: max(18px, calc((100% - 768px) / 2)); }
.ad-compose { padding-inline: max(18px, calc((100% - 780px) / 2)); }
.ad-top { position: relative; display: flex; align-items: center; justify-content: center; min-height: 64px; padding: 8px 56px 4px 16px; }
.ad-ident { display: flex; align-items: center; gap: 8px; min-width: 0; max-width: min(460px, 100%); padding: 4px 14px 4px 4px; border: 1px solid var(--line); border-radius: 999px; background: var(--panel-strong); box-shadow: var(--shadow); }
.ad-ident .ad-avatar { width: 30px; height: 30px; font-size: 13px; }
.ad-who { min-width: 0; display: flex; flex-direction: column; }
.ad-name { font-size: 15px; font-weight: 600; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-status { font-size: 11px; line-height: 1.4; color: var(--text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-top .ad-act { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); display: flex; align-items: center; gap: 2px; }
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
.ad-typing { display: inline-flex; gap: 4px; padding: 3px 2px; }
.ad-typing span { width: 6px; height: 6px; border-radius: 50%; background: var(--text-3); animation: ad-bounce 1.2s infinite ease-in-out; }
.ad-typing span:nth-child(2) { animation-delay: .15s; } .ad-typing span:nth-child(3) { animation-delay: .3s; }
@keyframes ad-bounce { 0%, 60%, 100% { opacity: .35; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-2px); } }
`;