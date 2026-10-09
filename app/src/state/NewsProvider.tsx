import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState } from "react-native";
import { MIN_REFRESH_INTERVAL_MS } from "@/config";
import { loadCachedNews, refreshNews, type NewsSnapshot } from "@/data/newsRepository";
import type { SourceProfile, Story } from "@/domain/types";

type NewsState = {
  snapshot: NewsSnapshot | null;
  loading: boolean; // טעינה ראשונה, עוד אין מה להציג
  refreshing: boolean;
  error: boolean; // הרענון האחרון נכשל (ייתכן שמוצג עותק מקומי)
};

type NewsContextValue = NewsState & { refresh: () => Promise<void> };

const NewsContext = createContext<NewsContextValue | null>(null);

// מוריד בפתיחה ובחזרה לחזית (CLAUDE.md), בלי polling ברקע
export function NewsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NewsState>({ snapshot: null, loading: true, refreshing: false, error: false });
  const inFlight = useRef<Promise<void> | null>(null);
  const lastAttempt = useRef(0);

  const refresh = useCallback(() => {
    if (inFlight.current) return inFlight.current;
    lastAttempt.current = Date.now();
    setState((s) => ({ ...s, refreshing: true }));
    inFlight.current = refreshNews()
      .then((snapshot) => setState({ snapshot, loading: false, refreshing: false, error: false }))
      .catch(() => setState((s) => ({ ...s, loading: false, refreshing: false, error: true })))
      .finally(() => {
        inFlight.current = null;
      });
    return inFlight.current;
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCachedNews().then((cached) => {
      if (!cancelled && cached) setState((s) => (s.snapshot ? s : { ...s, snapshot: cached, loading: false }));
    });
    refresh();
    const sub = AppState.addEventListener("change", (status) => {
      if (status === "active" && Date.now() - lastAttempt.current > MIN_REFRESH_INTERVAL_MS) refresh();
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, [refresh]);

  const value = useMemo(() => ({ ...state, refresh }), [state, refresh]);
  return <NewsContext.Provider value={value}>{children}</NewsContext.Provider>;
}

export function useNews(): NewsContextValue {
  const ctx = useContext(NewsContext);
  if (!ctx) throw new Error("useNews must be used inside NewsProvider");
  return ctx;
}

export function useStory(id: string | undefined): Story | undefined {
  const { snapshot } = useNews();
  return useMemo(() => snapshot?.data.latest.stories.find((s) => s.id === id), [snapshot, id]);
}

export function useSources(): Record<string, SourceProfile> {
  const { snapshot } = useNews();
  return snapshot?.data.sources ?? EMPTY;
}
const EMPTY: Record<string, SourceProfile> = {};
