// זיהוי תוכן ממומן. ידיעה ממומנת מסומנת, לא מוסתרת.

// ביטויים חד-משמעיים: נבדקים בכל שדה
const STRONG_PHRASES = [
  "תוכן שיווקי",
  "כתבה שיווקית",
  "תוכן מקודם",
  "תוכן ממומן",
  "sponsored",
  "paid content",
  "paid post",
  "in partnership with",
  "partner content",
  "محتوى ممول",
  "محتوى إعلاني",
];

// מילים דו-משמעיות ("מקודם" = גם "קודם לכן", "בשיתוף פעולה"): רק בתגיות/כותב, או כתווית בכותרת
const WEAK_WORDS = ["מקודם", "בשיתוף", "promoted"];
const WEAK_TITLE_LABEL = new RegExp(`(^|[(|\\[–-]\\s*)(${WEAK_WORDS.join("|")})(?!\\s+(פעולה|הציבור))`, "iu");

const SPONSORED_PATHS = [
  "/sponsored",
  "/promoted",
  "/partners/",
  "/partner-content",
  "/paid-content",
  "/paidpost",
  "/brandstudio",
  "/brand-studio",
  "/commercial/",
  "/marketing/",
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// גבולות מילה ידניים כי \b לא עובד על עברית/ערבית
function hasWord(text: string, words: string[]): boolean {
  const t = text.toLowerCase();
  return words.some((w) => new RegExp(`(^|[^\\p{L}])${escape(w)}($|[^\\p{L}])`, "u").test(t));
}

export function isSponsored(fields: { title: string; summary: string; categories: string[]; author: string; url: string }): boolean {
  let path = "";
  try {
    path = new URL(fields.url).pathname.toLowerCase();
  } catch {}
  if (SPONSORED_PATHS.some((p) => path.includes(p))) return true;
  const labels = [fields.author, ...fields.categories];
  if ([fields.title, fields.summary, ...labels].some((f) => hasWord(f, STRONG_PHRASES))) return true;
  if (labels.some((f) => hasWord(f, WEAK_WORDS))) return true;
  return WEAK_TITLE_LABEL.test(fields.title);
}
