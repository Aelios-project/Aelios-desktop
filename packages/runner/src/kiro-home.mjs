// Kiro reads global steering from <KIRO_HOME>/steering (default ~/.kiro/steering), and a custom agent inherits it.
// A job's helper must not carry the owner's personal rules, so the runner starts Kiro with its own KIRO_HOME.
// Sign-in is stored elsewhere (KIRO_DATA_DIR), so Kiro still works. Verified on kiro-cli 3.2.0 (v3 engine).
// shortcut: sessions made before this change live in ~/.kiro/sessions and are not found here; those threads start a fresh Kiro session.
import path from "node:path";
import { homeDir } from "./state.mjs";

export const kiroHomeOf = config => path.join(config.home ?? homeDir(), "kiro-home");
export const agentsDirOf = config => config.kiroAgentsDir ?? path.join(kiroHomeOf(config), "agents");
