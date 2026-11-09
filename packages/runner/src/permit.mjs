// The permission callback for one acpx turn. It answers exactly as permission.mjs does for the legacy engine: tier `full`
// allows once, anything else is held for the owner (Allow / Deny). Only one-time options are ever chosen, never `*_always`.
// If this function throws, acpx falls through to its `deny-all` mode, so the runner fails closed.
import { answer } from "./permission.mjs";

const decisionOf = response => (response.outcome?.outcome === "selected" ? { outcome: "selected", optionId: response.outcome.optionId } : { outcome: "reject_once" });

/** @param {{tier: string, redact: (text: string) => string, denied: string[], hold?: Function, stopped?: () => boolean}} o */
export function makePermit({ tier, redact, denied, hold, stopped = () => false }) {
  return async request => {
    const params = request.raw;
    let { response, denied: refused, hold: held } = answer(tier, params);
    if (held?.detail) held.detail = redact(held.detail); // the folder and the pairing token stay off the owner's screen too
    if (held && hold && await hold(held, stopped)) ({ response, denied: refused } = answer("full", params)); // the owner allowed this one request
    if (refused) denied.push(refused);
    return decisionOf(response);
  };
}
