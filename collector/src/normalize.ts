import { createHash } from "node:crypto";
import type { RawItem, Source } from "./types.ts";

export const SUMMARY_MAX = 200;
const FUTURE_TOLERANCE_MS = 15 * 60_000;

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", hellip: "…",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", laquo: "«", raquo: "»", bull: "•", middot: "·",
  shy: "", lrm: "", rlm: "", zwnj: "", zwj: "",
};

function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : Number(e.slice(1));
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : "";
    }
    return NAMED_ENTITIES[e.toLowerCase()] ?? m;
  });
}

// HTML/CDATA → טקסט נקי בשורה אחת. מפענחים פעמיים כי חלק מהפידים מקודדים HTML בתוך entities.
export function cleanText(s: string): string {
  let t = s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  for (let i = 0; i < 2; i++) {
    t = t.replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ");
    t = decodeEntities(t);
  }
  return t.replace(/<[^>]+>/g, " ").replace(/[‎‏‪-‮]/g, "").replace(/\s+/g, " ").trim();
}

export function truncate(s: string, max = SUMMARY_MAX): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return (space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,;:–-]+$/, "") + "…";
}

// היסט אזור הזמן של ירושלים (במילישניות) ברגע נתון
function jerusalemOffsetMs(utcMs: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jerusalem",
    hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - utcMs;
}

export function jerusalemLocalToUtc(y: number, mo: number, d: number, h: number, mi: number): Date {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  return new Date(guess - jerusalemOffsetMs(guess - jerusalemOffsetMs(guess)));
}

// תאריכי RFC 822 / ISO, וגם "09/10/2026 - 19:12" (ערב 48, שעון ישראל, יום/חודש/שנה)
export function parseDate(raw: string | null): Date | null {
  if (!raw) return null;
  const s = cleanText(raw);
  const local = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s*-?\s*(\d{1,2}):(\d{2})/.exec(s);
  if (local) {
    const [, d, mo, y, h, mi] = local.map(Number);
    return jerusalemLocalToUtc(y, mo, d, h, mi);
  }
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : new Date(t);
}

// תיקון קישורים שבורים, למשל "http://www.arab48.comأخبار/..." (חסר "/" אחרי הדומיין)
export function fixLink(link: string, site: string): string | null {
  let l = link.trim();
  if (!l) return null;
  const siteUrl = new URL(site);
  if (l.startsWith("/")) l = siteUrl.origin + l;
  const m = /^(https?:\/\/)([^/?#]+)(.*)$/i.exec(l);
  if (m) {
    const [, scheme, hostPart, rest] = m;
    const host = siteUrl.hostname;
    if (hostPart.toLowerCase() !== host && hostPart.toLowerCase().startsWith(host)) {
      l = scheme + host + "/" + hostPart.slice(host.length) + rest;
    }
  }
  try {
    const u = new URL(l);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.href;
  } catch {
    return null;
  }
}

export function itemId(url: string): string {
  return createHash("sha1").update(url).digest("hex").slice(0, 12);
}

// מיפוי קטגוריה: לפי תגיות הפיד וקטעי ה-URL, ואם אין התאמה – קטגוריית ברירת המחדל של המקור
const CATEGORY_KEYWORDS: [string, string[]][] = [
  ["ספורט", ["ספורט", "כדורגל", "כדורסל", "sport", "sports", "football", "soccer", "رياضة", "رياضية"]],
  ["ביטחון", ["ביטחון", "צבא", "בטחון", "military", "defense", "defence", "security", "idf"]],
  ["פוליטיקה", ["פוליטיקה", "פוליטי", "politics", "political", "elections", "election", "בחירות", "كنيست"]],
  ["כלכלה", ["כלכלה", "שוק ההון", "נדל\"ן", "economy", "business", "markets", "finance", "money", "اقتصاد"]],
  ["צרכנות", ["צרכנות", "צרכן", "consumer", "shopping"]],
  ["מדע וטכנולוגיה", ["מדע", "טכנולוגיה", "היי-טק", "הייטק", "science", "technology", "tech", "digital", "علوم", "تكنولوجيا"]],
  ["בריאות", ["בריאות", "רפואה", "health", "medicine", "wellness", "صحة"]],
  ["תרבות", ["תרבות", "בידור", "מוזיקה", "קולנוע", "ספרות", "culture", "arts", "entertainment", "music", "movies", "film", "books", "ثقافة", "فن"]],
  ["עולם", ["חדשות בעולם", "בעולם", "חוץ", "world", "international", "middle east", "دولية", "عربية ودولية"]],
];

function tokensForCategory(raw: RawItem, url: string): string[] {
  let path: string[] = [];
  try {
    path = decodeURIComponent(new URL(url).pathname).toLowerCase().split(/[/_.-]+/);
  } catch {}
  return [...raw.categories.map((c) => c.toLowerCase().trim()), ...path].filter(Boolean);
}

export function detectCategory(raw: RawItem, url: string, source: Source): string {
  const tokens = tokensForCategory(raw, url);
  for (const [cat, words] of CATEGORY_KEYWORDS) {
    // מילים לטיניות: התאמה מדויקת ("arts" לא בתוך "startups"); עברית/ערבית: גם בתוך ביטוי ("צבא וביטחון")
    const hit = (t: string, w: string) => t === w || (!/^[a-z ]+$/.test(w) && w.length >= 3 && t.includes(w));
    if (tokens.some((t) => words.some((w) => hit(t, w)))) return cat;
  }
  if (source.region === "world") return "עולם";
  return source.categories[0] ?? "אקטואליה";
}

// תאריך פרסום: אם חסר או בעתיד, משתמשים בזמן שבו ראינו את הידיעה לראשונה
export function resolvePublished(parsed: Date | null, now: Date, previous?: string): string {
  if (previous) return previous;
  if (!parsed || parsed.getTime() > now.getTime() + FUTURE_TOLERANCE_MS) return now.toISOString();
  return parsed.toISOString();
}
