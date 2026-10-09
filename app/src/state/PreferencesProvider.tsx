import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { loadPreferences, savePreferences } from "@/data/preferencesStorage";
import { DEFAULT_PREFERENCES, type Preferences } from "@/domain/preferences";

type PreferencesContextValue = {
  prefs: Preferences;
  ready: boolean; // ההעדפות נטענו מהמכשיר
  update: (change: Partial<Preferences>) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [ready, setReady] = useState(false);
  const current = useRef(prefs);

  useEffect(() => {
    loadPreferences().then((p) => {
      current.current = p;
      setPrefs(p);
      setReady(true);
    });
  }, []);

  const update = useCallback((change: Partial<Preferences>) => {
    const next = { ...current.current, ...change };
    current.current = next;
    setPrefs(next);
    // שמירה נכשלה (אחסון מלא וכו'): ההעדפה תקפה עד סגירת האפליקציה, אין מה לעשות מעבר לזה
    savePreferences(next).catch(() => {});
  }, []);

  const value = useMemo(() => ({ prefs, ready, update }), [prefs, ready, update]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used inside PreferencesProvider");
  return ctx;
}
