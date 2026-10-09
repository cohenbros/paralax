const CONTACT = process.env.COLLECTOR_CONTACT_URL ?? "https://github.com/";
export const USER_AGENT = `Paralax/0.1 (+${CONTACT}; news aggregator, headlines and links only)`;
const TIMEOUT_MS = 15_000;

export type FetchResult = { status: number; finalUrl: string; xml: string };

export class FeedHttpError extends Error {
  readonly status: number;
  constructor(status: number) {
    super(`HTTP ${status}`);
    this.status = status;
  }
}

// פיד ישראלי יכול להיות ב-windows-1255; מפענחים לפי הצהרת ה-XML או Content-Type
function decodeBody(buf: ArrayBuffer, contentType: string | null): string {
  const head = new TextDecoder("latin1").decode(buf.slice(0, 200));
  const declared =
    /encoding=["']([\w-]+)["']/i.exec(head)?.[1] ?? /charset=([\w-]+)/i.exec(contentType ?? "")?.[1] ?? "utf-8";
  try {
    return new TextDecoder(declared).decode(buf);
  } catch {
    return new TextDecoder("utf-8").decode(buf);
  }
}

export async function fetchFeed(url: string): Promise<FetchResult> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    redirect: "follow",
  });
  if (!res.ok) throw new FeedHttpError(res.status);
  const xml = decodeBody(await res.arrayBuffer(), res.headers.get("content-type"));
  return { status: res.status, finalUrl: res.url, xml };
}

export function describeError(e: unknown): string {
  const err = e as Error & { cause?: { code?: string } };
  if (err.name === "TimeoutError") return "timeout";
  return `${err.message}${err.cause?.code ? ` (${err.cause.code})` : ""}`;
}
