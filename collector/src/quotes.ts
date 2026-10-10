// "נקודות מבט": ציטוטים מתוך כותרות בתבנית `דובר: "ציטוט"`, עם ייחוס וקישור לכתבה.
// רק מה שמופיע בכותרת עצמה (ציטוט קצר), וציטוט עם שפה פוגענית נפסל.

// ai: הציטוט נלקח מכותרת שתורגמה ע"י AI
export type Quote = { speaker: string; text: string; item: string; ai?: true };

const OPEN = `(?:["״“”]|'')`;
const QUOTE_RE = new RegExp(`^([^:"״“”]{2,60}?):\\s*${OPEN}(.{6,200}?)${OPEN}`, "u");

// פתיחי כותרת שאינם דובר
const NOT_SPEAKERS = /^(אחרי|לאחר|בעקבות|בישראל|בארה"ב|במשרד|למה|מה|איך|רגע|צפו|צפייה|תיעוד|וידאו|בלעדי|פרסום ראשון|דיווח|עדכון|סקר|מבזק|לייב|כך|הנה|live|watch|video|breaking|exclusive|update|report|analysis|opinion)(?!\p{L})/iu;

// רשימה בסיסית לסינון שפה פוגענית. ציטוט שנפסל לא מוצג (CLAUDE.md).
const OFFENSIVE = [
  "זונה", "זונות", "שרמוטה", "מניאק", "מניאקים", "קוקסינל", "כושי", "כושים", "ערבוש", "ערבושים", "זבל אנושי",
  "fuck", "fucking", "shit", "cunt", "bitch", "nigger", "faggot", "retard",
  "شرموطة", "عاهرة",
];
// מילה שלמה, עם ו/ה בתחילה ("והזונה"). בלי מ/ב/ל, כדי ש"מזונה" לא ייפסל
const OFFENSIVE_RE = new RegExp(
  `(^|[^\\p{L}])[וה]{0,2}(${OFFENSIVE.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})($|[^\\p{L}])`,
  "iu",
);
const CENSORED = /\*{2,}/; // "לה****"

export function isOffensive(text: string): boolean {
  return OFFENSIVE_RE.test(text) || CENSORED.test(text);
}

export function extractQuote(title: string): { speaker: string; text: string } | null {
  const m = QUOTE_RE.exec(title.trim());
  if (!m) return null;
  let speaker = m[1].trim();
  // "גולן על חיסול חמינאי: ..." → הדובר הוא "גולן"
  speaker = speaker.split(/\s+(?:על|בתגובה ל|נגד|on|about)\s+/u)[0].trim();
  const text = m[2].trim();
  const words = speaker.split(/\s+/).length;
  // דובר הוא שם או תואר קצר ("יאיר גולן", "דובר צה"ל"), לא משפט שלם
  if (words > 3 || /\d/.test(speaker) || NOT_SPEAKERS.test(speaker)) return null;
  if (isOffensive(text) || isOffensive(speaker)) return null;
  return { speaker, text };
}

const MAX_QUOTES = 6;

// ציטוט אחד לכל דובר, לפי הסדר שבו הכתבות התקבלו. "יאיר גולן" ו"גולן" נחשבים אותו דובר (לפי המילה האחרונה).
export function collectQuotes(items: { id: string; title: string; ai: boolean }[]): Quote[] {
  const seen = new Set<string>();
  const out: Quote[] = [];
  for (const it of items) {
    const q = extractQuote(it.title);
    const key = q?.speaker.split(/\s+/).pop();
    if (!q || !key || seen.has(key)) continue;
    seen.add(key);
    out.push(it.ai ? { ...q, item: it.id, ai: true } : { ...q, item: it.id });
    if (out.length >= MAX_QUOTES) break;
  }
  return out;
}
