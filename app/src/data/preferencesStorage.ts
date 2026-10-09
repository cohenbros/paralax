import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_PREFERENCES, parsePreferences, type Preferences } from "@/domain/preferences";

const KEY = "preferences.v1";

// ההעדפות נשמרות רק על המכשיר (CLAUDE.md: בלי חשבון משתמש)
export async function loadPreferences(): Promise<Preferences> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? parsePreferences(JSON.parse(raw)) : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function savePreferences(prefs: Preferences): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(prefs));
}
