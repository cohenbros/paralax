import { MAX_RESPONSE_BYTES, REQUEST_TIMEOUT_MS } from "@/config";

export type FetchTextResult = { status: "not-modified" } | { status: "ok"; text: string; etag: string | null };

export class HttpError extends Error {
  constructor(readonly status: number) {
    super(`HTTP ${status}`);
  }
}

// GET עם ETag: אם הקובץ לא השתנה מאז ההורדה הקודמת, השרת מחזיר 304 ולא מורידים שוב
export async function fetchText(url: string, etag: string | null): Promise<FetchTextResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: etag ? { "If-None-Match": etag } : {},
      signal: controller.signal,
    });
    if (res.status === 304) return { status: "not-modified" };
    if (!res.ok) throw new HttpError(res.status);
    const length = Number(res.headers.get("content-length") ?? 0);
    if (length > MAX_RESPONSE_BYTES) throw new Error("התגובה גדולה מדי");
    const text = await res.text();
    if (text.length > MAX_RESPONSE_BYTES) throw new Error("התגובה גדולה מדי");
    return { status: "ok", text, etag: res.headers.get("etag") };
  } finally {
    clearTimeout(timer);
  }
}
