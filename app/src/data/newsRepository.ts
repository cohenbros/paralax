// מקור האמת לנתוני החדשות: עותק מקומי + רענון מהרשת עם ETag.
// הקבצים הגולמיים נשמרים כמו שהם ומאומתים בכל קריאה, כך שעותק פגום לא מפיל את האפליקציה.

import type { NewsData } from "@/domain/types";
import { parseLatest, parseSources } from "@/domain/validate";
import { LATEST_URL, SOURCES_URL } from "@/config";
import { readCache, writeCache } from "./fileCache";
import { fetchText } from "./http";

export type NewsSnapshot = { data: NewsData; fetchedAt: number };

type Meta = { latestEtag: string | null; sourcesEtag: string | null; fetchedAt: number };

const FILES = { latest: "latest.json", sources: "sources.json", meta: "news-meta.json" } as const;

function parseSnapshot(latestText: string, sourcesText: string, fetchedAt: number): NewsSnapshot {
  return {
    data: { latest: parseLatest(JSON.parse(latestText)), sources: parseSources(JSON.parse(sourcesText)) },
    fetchedAt,
  };
}

async function readMeta(): Promise<Meta | null> {
  try {
    const raw = await readCache(FILES.meta);
    if (!raw) return null;
    const m = JSON.parse(raw) as Partial<Meta>;
    return {
      latestEtag: typeof m.latestEtag === "string" ? m.latestEtag : null,
      sourcesEtag: typeof m.sourcesEtag === "string" ? m.sourcesEtag : null,
      fetchedAt: typeof m.fetchedAt === "number" ? m.fetchedAt : 0,
    };
  } catch {
    return null;
  }
}

export async function loadCachedNews(): Promise<NewsSnapshot | null> {
  const [latest, sources, meta] = await Promise.all([readCache(FILES.latest), readCache(FILES.sources), readMeta()]);
  if (!latest || !sources || !meta) return null;
  try {
    return parseSnapshot(latest, sources, meta.fetchedAt);
  } catch {
    return null;
  }
}

// מוריד רק מה שהשתנה. זורק שגיאה אם אין רשת ואין עותק מקומי תקין.
export async function refreshNews(): Promise<NewsSnapshot> {
  const meta = await readMeta();
  // ETag נשלח רק אם העותק המקומי באמת קיים, אחרת 304 משאיר אותנו בלי נתונים
  const [cachedLatest, cachedSources] = await Promise.all([readCache(FILES.latest), readCache(FILES.sources)]);
  const [latestRes, sourcesRes] = await Promise.all([
    fetchText(LATEST_URL, cachedLatest ? (meta?.latestEtag ?? null) : null),
    fetchText(SOURCES_URL, cachedSources ? (meta?.sourcesEtag ?? null) : null),
  ]);
  const latestText = latestRes.status === "ok" ? latestRes.text : cachedLatest;
  const sourcesText = sourcesRes.status === "ok" ? sourcesRes.text : cachedSources;
  if (!latestText || !sourcesText) throw new Error("לא התקבלו נתונים");

  const fetchedAt = Date.now();
  const snapshot = parseSnapshot(latestText, sourcesText, fetchedAt); // זורק אם הפורמט פגום – ואז לא שומרים

  if (latestRes.status === "ok") writeCache(FILES.latest, latestText);
  if (sourcesRes.status === "ok") writeCache(FILES.sources, sourcesText);
  const newMeta: Meta = {
    latestEtag: latestRes.status === "ok" ? latestRes.etag : (meta?.latestEtag ?? null),
    sourcesEtag: sourcesRes.status === "ok" ? sourcesRes.etag : (meta?.sourcesEtag ?? null),
    fetchedAt,
  };
  writeCache(FILES.meta, JSON.stringify(newMeta));
  return snapshot;
}
