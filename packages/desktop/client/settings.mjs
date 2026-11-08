// The settings the resident keeps behind its web door, made readable: /web/config answers a list of fields
// ({ key, kind: text|secret|choice, choices, value, fromWorker, saved, workerHas }), and each is written back with
// POST /web/config { key, text }. The labels here are English; a key without one is shown as words.
// Field shape from Aelios-resident, src/config.ts (AGPL-3.0, same author; main at b118dfb, 2026-11-07).

/** The few names worth spelling out; anything else is the key in words. */
const LABELS = {
  RESIDENT_NAME: "Name",
  MODEL: "Model",
  WEB_PUSH: "What to push",
  RESIDENT_TZ: "Time zone",
  HEARTBEAT: "Check-ins",
  ALARMS: "Alarms",
  STICKERS: "Stickers",
  VOICE_REPLY: "Voice replies",
  BG_TASK: "Background help",
  TASK_EXECUTION: "Where threads run",
  THINKING: "Thinking",
  TIME_ZONE: "Time zone",
  TG_BOT_TOKEN: "Telegram bot token",
  TG_ALLOWED: "Telegram: who may talk",
  WECOM_ALLOWED: "WeCom: who may talk",
  AELIOS_URL: "Aelios address",
  AELIOS_API_KEY: "Aelios key",
  CLOUD_TASKS: "Background help",
  CLOUD_TASK_GITHUB_TOKEN: "GitHub token",
  CLOUD_TASK_MODEL: "Model for threads",
  THINKING_EFFORT: "Thinking effort",
};

/**
 * The settings sheet's section for a key, by its prefix. Keys the list does not know go with the resident, so a
 * new setting is never lost. Order matters: WEB_PUSH is a channel, the other WEB_ keys are web tools.
 */
const SECTIONS = [
  ["channels", /^(TG_|WECOM_|WEB_PUSH$)/],
  ["model", /^(CLAUDE_|AI_GATEWAY)/],
  ["memory", /^AELIOS_/],
  ["time", /^(TIME_ZONE|CHECKIN_SCHEDULE|HEARTBEAT|QUIET_HOURS|ALARMS)$/],
  ["web", /^(WEB_|TAVILY_|BRAVE_|PERPLEXITY_)/],
  ["voice", /^(VOICE_|STICKERS$)/],
  ["work", /^CLOUD_TASK/],
];
export const sectionOf = (key) => SECTIONS.find(([, rule]) => rule.test(String(key || "")))?.[0] || "resident";

/** `RESIDENT_TZ` as `Resident tz` when there is no label. */
export const humanKey = (key) => String(key || "")
  .toLowerCase()
  .split("_")
  .filter(Boolean)
  .map((word, i) => (i === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
  .join(" ");

export const labelOf = (key) => LABELS[key] || humanKey(key);

/** What a field shows: its saved value, else the Worker's, and for a secret only whether one exists. */
export function shownValue(field) {
  if (!field) return "";
  if (field.kind === "secret") return field.saved ? "saved" : field.workerHas ? "from the Worker" : "";
  return field.value || field.fromWorker || "";
}

/** The fields worth a row: everything the resident offers, in the order it gave them. */
export function settingRows(config) {
  const fields = Array.isArray(config?.fields) ? config.fields : [];
  return fields.map((field) => ({
    key: field.key,
    label: labelOf(field.key),
    kind: field.kind,
    choices: field.choices || [],
    value: shownValue(field),
    secret: field.kind === "secret",
  }));
}

/** A model as the picker shows it: its id and, when it has one, the name it goes by. */
export function modelRows(models = []) {
  return models
    .filter((m) => m && (m.id || m.name))
    .map((m) => ({ id: String(m.id || m.name), name: String(m.name || m.id), note: m.group || m.provider || "" }));
}
