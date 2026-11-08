// The thread detail in the right panel: its head, the timeline of ACP-shaped items (thread-items.mjs), the helper
// icon cards carry, and the handle that widens the panel. Follows the resident's look (tokens in theme.mjs).
export const THREAD = `
.ad-right { position: relative; }
.ad-grip { position: absolute; top: 0; bottom: 0; left: -4px; z-index: 2; width: 8px; cursor: col-resize; }
.ad-grip::after { content: ""; position: absolute; top: 50%; left: 3px; width: 2px; height: 36px; margin-top: -18px; border-radius: 2px; background: var(--line); opacity: 0; transition: opacity .15s; }
.ad-right:hover .ad-grip::after, .ad-grip:focus-visible::after { opacity: 1; }
.ad-helper { flex: none; width: 26px; height: 26px; border-radius: 8px; display: grid; place-items: center; background: var(--line-soft); color: var(--text-2); }
.ad-helper svg { width: 15px; height: 15px; }
.ad-card .ad-helper { width: 22px; height: 22px; border-radius: 7px; }
.ad-card .ad-helper svg { width: 13px; height: 13px; }

.ad-thread { gap: 10px; }
.ad-tv-head { display: flex; align-items: center; gap: 8px; padding-top: 2px; }
.ad-tv-head h3 { flex: 1; min-width: 0; margin: 0; font-size: 14.5px; font-weight: 600; line-height: 1.35; overflow-wrap: anywhere; }
.ad-tv-meta { display: flex; align-items: center; gap: 10px; padding: 0 2px 4px; border-bottom: 1px solid var(--line-soft); }
.ad-tv-meta .sp { flex: 1; }
.ad-timeline { display: flex; flex-direction: column; gap: 8px; }
.ad-tl-brief { align-self: flex-end; max-width: 92%; padding: 8px 12px; border-radius: 14px 14px 4px 14px; background: var(--mine); border: 1px solid var(--mine-line); font-size: 13.5px; white-space: pre-wrap; overflow-wrap: anywhere; }
.ad-tl-brief .who { display: block; margin-bottom: 2px; font-size: 10.5px; letter-spacing: .06em; text-transform: uppercase; color: var(--text-3); }
.ad-tl-say { padding: 2px 2px; font-size: 13.5px; line-height: 1.6; color: var(--text-1); }
.ad-thought > button { display: inline-flex; align-items: center; gap: 6px; padding: 2px 6px; border: 0; border-radius: 8px; background: transparent; color: var(--violet-text); font-size: 12px; }
.ad-thought > button svg { width: 13px; height: 13px; }
.ad-thought > button svg:last-child { color: var(--text-4); transition: transform .15s; }
.ad-thought > button[aria-expanded="true"] svg:last-child { transform: rotate(90deg); }
.ad-thought p { margin: 4px 0 0 8px; padding-left: 10px; border-left: 2px solid color-mix(in srgb, var(--violet) 40%, transparent); font-size: 12.5px; color: var(--text-3); white-space: pre-wrap; }

.ad-tool { border: 1px solid var(--line); border-radius: 11px; background: var(--panel); overflow: hidden; }
.ad-tool.open { border-color: var(--line-dash); }
.ad-tool-row { display: flex; align-items: center; gap: 8px; width: 100%; min-height: 34px; padding: 6px 10px; border: 0; background: transparent; text-align: left; color: var(--text-2); font-size: 12.5px; }
.ad-tool-row:hover { background: var(--line-soft); }
.ad-tool-row .k { flex: none; width: 22px; height: 22px; border-radius: 7px; display: grid; place-items: center; background: var(--line-soft); color: var(--text-3); }
.ad-tool-row .k svg { width: 13px; height: 13px; }
.ad-tool-row .n { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-tool-row code { font-family: var(--mono); font-size: 12px; color: var(--text-1); }
.ad-tool-row code::before { content: "$ "; color: var(--text-4); }
.ad-tool-body { display: flex; flex-direction: column; gap: 8px; padding: 4px 10px 10px; border-top: 1px solid var(--line-soft); }
.ad-tool-body .ad-label { margin: 4px 0; }
.ad-tool-body pre { margin: 0; max-height: 280px; overflow: auto; padding: 8px 10px; border-radius: 9px; background: var(--input-bg); white-space: pre-wrap; overflow-wrap: anywhere; font: 11.5px/1.55 var(--mono); color: var(--text-2); }
.ad-tool-files { display: flex; flex-direction: column; gap: 2px; }
.ad-pathbtn { display: flex; align-items: center; gap: 6px; padding: 4px 6px; border: 0; border-radius: 7px; background: transparent; color: var(--text-2); font: 11.5px/1.4 var(--mono); text-align: left; }
.ad-pathbtn:hover { background: var(--line-soft); color: var(--accent-text); }
.ad-pathbtn svg { width: 12px; height: 12px; color: var(--text-4); }
.ad-pathbtn > span:nth-child(2) { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ad-diffn { flex: none; display: inline-flex; gap: 4px; font: 600 11px/1 var(--mono); }
.ad-diffn b { color: var(--ok-text); font-weight: 600; } .ad-diffn i { color: var(--err-text); font-style: normal; }

.ad-plan { padding: 8px 12px; border-radius: 12px; border: 1px solid var(--line); background: var(--panel); }
.ad-plan .ad-label { gap: 8px; margin-bottom: 4px; }
.ad-plan ul { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 3px; }
.ad-plan li { display: flex; align-items: flex-start; gap: 8px; font-size: 12.5px; line-height: 1.5; color: var(--text-2); }
.ad-plan li .box { flex: none; width: 15px; height: 15px; margin-top: 2px; border-radius: 5px; border: 1.5px solid var(--line-dash); display: grid; place-items: center; }
.ad-plan li.completed { color: var(--text-4); text-decoration: line-through; text-decoration-color: var(--line-dash); }
.ad-plan li.completed .box { border-color: var(--ok); background: var(--ok); color: var(--bg); }
.ad-plan li.in_progress { color: var(--text-1); font-weight: 500; }
.ad-plan li.in_progress .box { border-color: var(--warn); }
.ad-plan li .box svg { width: 10px; height: 10px; stroke-width: 3; }
.ad-plan li .box .ad-dot { width: 6px; height: 6px; }

.ad-perm { display: flex; flex-direction: column; gap: 6px; padding: 10px 12px; border-radius: 12px; border: 1px solid var(--line); background: var(--panel); }
.ad-perm.waiting { border-color: color-mix(in srgb, var(--accent) 55%, transparent); background: var(--accent-soft); }
.ad-perm .top { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; }
.ad-perm .top svg { width: 16px; height: 16px; color: var(--accent-text); }
.ad-perm .top .n { flex: 1; min-width: 0; overflow-wrap: anywhere; }
.ad-perm .paths { margin: 0; font: 11.5px/1.5 var(--mono); color: var(--text-3); overflow-wrap: anywhere; }
.ad-perm .detail { margin: 0; padding: 6px 8px; border-radius: 8px; background: rgba(127,127,127,.12); font: 11.5px/1.5 var(--mono); white-space: pre-wrap; overflow-wrap: anywhere; max-height: 7.5em; overflow: auto; }
.ad-perm .said { margin: 0; font-size: 12px; color: var(--text-3); }
.ad-perm .said.allowed { color: var(--ok-text); } .ad-perm .said.denied { color: var(--err-text); }
.ad-tl-result { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; padding: 10px 12px; border-radius: 12px; border: 1px dashed var(--line-dash); }
.ad-tl-result .text { font-size: 13.5px; line-height: 1.6; }
`;
