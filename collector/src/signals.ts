// סימנים לכל כתבה, לפי מילים וכתובת בלבד: טור דעה, ודיווח שמבוסס על מקורות לא מאושרים

const OPINION_PATHS = ["opinion", "opinions", "commentisfree", "op-ed", "oped", "columnists", "editorial", "editorials", "דעות"];
const OPINION_LABELS = ["דעות", "דעה", "טור", "טורים", "פרשנות", "opinion", "comment", "commentary", "op-ed", "editorial", "رأي", "مقالات"];

export function isOpinion(url: string, categories: string[]): boolean {
  let segments: string[] = [];
  try {
    segments = decodeURIComponent(new URL(url).pathname).toLowerCase().split("/");
  } catch {}
  if (segments.some((s) => OPINION_PATHS.includes(s))) return true;
  return categories.some((c) => OPINION_LABELS.includes(c.toLowerCase().trim()));
}

// ניסוחים שמעידים שהידיעה נשענת על דיווח שעוד לא אושר
const HEDGES = [
  "לפי דיווח",
  "לפי דיווחים",
  "על פי דיווח",
  "על פי דיווחים",
  "דיווחים זרים",
  "דיווח:",
  "לכאורה",
  "נטען",
  "נטען כי",
  "על פי הערכות",
  "לפי הערכות",
  "לא אושר",
  "reportedly",
  "allegedly",
  "unconfirmed",
  "reports say",
  "report says",
  "sources say",
  "أنباء عن",
  "وفق تقارير",
  "مزاعم",
  "يُزعم",
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const HEDGE_RE = new RegExp(`(^|[^\\p{L}])(${HEDGES.map(escape).join("|")})`, "iu");

export function isHedged(title: string, summary: string): boolean {
  return HEDGE_RE.test(title) || HEDGE_RE.test(summary);
}
