type FlagEnv = Record<string, string | boolean | undefined>;

const DISABLED_VALUES = new Set(["0", "false", "off", "no"]);
const ENABLED_VALUES = new Set(["1", "true", "on", "yes"]);

export function isSingleUserWorkflowEnabled(env: FlagEnv = import.meta.env): boolean {
  const raw = env.VITE_FUTURE_FLAG_SINGLE_USER ?? env.FUTURE_FLAG_SINGLE_USER;
  if (raw === undefined) return true;
  if (typeof raw === "boolean") return raw;

  const normalized = raw.trim().toLowerCase();
  if (DISABLED_VALUES.has(normalized)) return false;
  if (ENABLED_VALUES.has(normalized)) return true;
  return true;
}
