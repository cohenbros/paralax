import { CATEGORIES, type Category } from "./types";

export type RegionPreference = "il" | "world" | "both";
export type TranslationMode = "auto" | "original";
export type NotificationSlot = "morning" | "noon" | "evening";

export type Preferences = {
  version: 1;
  onboarded: boolean;
  interests: Category[];
  regions: RegionPreference;
  translation: TranslationMode;
  notifications: Record<NotificationSlot, boolean>;
};

export const DEFAULT_PREFERENCES: Preferences = {
  version: 1,
  onboarded: false,
  interests: [...CATEGORIES],
  regions: "both",
  translation: "original",
  notifications: { morning: true, noon: true, evening: true },
};

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

// העדפות שנשמרו בגרסה קודמת או נפגמו: כל שדה לא תקין חוזר לברירת המחדל
export function parsePreferences(raw: unknown): Preferences {
  if (!isObject(raw)) return DEFAULT_PREFERENCES;
  const d = DEFAULT_PREFERENCES;
  const interests = Array.isArray(raw.interests)
    ? raw.interests.filter((c): c is Category => (CATEGORIES as readonly unknown[]).includes(c))
    : d.interests;
  const n = isObject(raw.notifications) ? raw.notifications : {};
  const bool = (v: unknown, fallback: boolean) => (typeof v === "boolean" ? v : fallback);
  return {
    version: 1,
    onboarded: bool(raw.onboarded, d.onboarded),
    interests: interests.length ? interests : d.interests,
    regions: raw.regions === "il" || raw.regions === "world" || raw.regions === "both" ? raw.regions : d.regions,
    translation: raw.translation === "auto" || raw.translation === "original" ? raw.translation : d.translation,
    notifications: {
      morning: bool(n.morning, d.notifications.morning),
      noon: bool(n.noon, d.notifications.noon),
      evening: bool(n.evening, d.notifications.evening),
    },
  };
}
