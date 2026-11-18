// acpx events -> what a turn collects: the text of the answer (a tool call ends a part), one step per tool call (patched in
// place by toolCallId, steps-keyed.mjs), a "thinking" step for thought text, and the last usage the helper reported.
// Thought text and usage never reach the summary.

/** @param {{current: string, finished: string[], keyed: object|null, stepLog: object|null, onStep?: Function, usage?: object}} t  @param {object} event an acpx runtime event */
export function takeEvent(t, event) {
  if (event.type === "text_delta" && event.stream === "thought") send(t, t.stepLog?.add({ kind: "think" }));
  else if (event.type === "text_delta") t.current += String(event.text ?? "");
  else if (event.type === "tool_call" && (event.tag === "tool_call" || event.tag === "tool_call_update")) {
    if (event.tag === "tool_call" && t.current.trim()) { t.finished.push(t.current); t.current = ""; }
    send(t, t.keyed?.take(event));
  } else if (event.type === "status" && event.tag === "usage_update") t.usage = { ...t.usage, ...pick(event) };
}

const send = (t, steps) => { if (steps) t.onStep(steps); };
const pick = ({ used, size, cost }) => Object.fromEntries(Object.entries({ used, size, cost }).filter(([, value]) => value !== undefined));

/**
 * One fyi line for the receipt when the helper reported a cost, else "". ACP's usage_update carries running session totals,
 * so the last one seen is the figure, not a sum.
 */
export function usageLine(usage) {
  if (usage?.cost?.amount === undefined) return "";
  const cost = `${usage.cost.amount}${usage.cost.currency ? " " + usage.cost.currency : ""}`;
  const context = usage.used !== undefined && usage.size !== undefined ? `; context ${usage.used} of ${usage.size} tokens` : "";
  return `Helper usage so far in this session: ${cost}${context}.`;
}
