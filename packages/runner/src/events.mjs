// acpx events -> what a turn collects: the text of the answer (a tool call ends a part), and one step per tool call.
// shortcut: thinking and usage events are dropped and a later update of a tool call is ignored (plain append, as the legacy
// engine does); keyed patching, thinking steps and the usage notice come in the "steps by tool call id" PR.

/** @param {{current: string, finished: string[], stepLog: object|null, onStep?: Function}} t  @param {object} event an acpx runtime event */
export function takeEvent(t, event) {
  if (event.type === "text_delta" && event.stream !== "thought") t.current += String(event.text ?? "");
  else if (event.type === "tool_call" && event.tag === "tool_call") {
    if (t.current.trim()) { t.finished.push(t.current); t.current = ""; }
    const steps = t.stepLog?.add(event);
    if (steps) t.onStep(steps);
  }
}
