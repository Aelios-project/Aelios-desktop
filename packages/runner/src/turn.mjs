// Picks the engine that runs one turn: the legacy ACP client (helper.mjs) or acpx (turn-acpx.mjs). Set by `engine` in the config.
import { AcpxTurn } from "./turn-acpx.mjs";
import { Turn } from "./helper.mjs";

export const ENGINES = ["legacy", "acpx"];

export function makeTurn(options, config) {
  return (config.engine ?? "legacy") === "acpx" ? new AcpxTurn({ ...options, config }) : new Turn(options);
}
