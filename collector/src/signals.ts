// סימנים לכל כתבה לפי מילים וכתובת בלבד (בלי AI, דטרמיניסטי וזול).
// כל סימן הוא רמז לחשיבה ביקורתית ("כדאי לבדוק"), לא קביעה שהכתבה נכונה או שגויה.

export const ITEM_FLAGS = ["opinion", "hedged", "anonymous", "study", "social", "sensational"] as const;
export type ItemFlag = (typeof ITEM_FLAGS)[number];

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

// ביטויים לכל סימן טקסטואלי
const PHRASES: Record<Exclude<ItemFlag, "opinion">, string[]> = {
  // נשען על דיווח שעוד לא אושר
  hedged: [
    "לפי דיווח", "לפי דיווחים", "על פי דיווח", "על פי דיווחים", "דיווחים זרים", "דיווח:", "לכאורה", "נטען",
    "על פי הערכות", "לפי הערכות", "לא אושר", "reportedly", "allegedly", "unconfirmed", "reports say", "report says",
    "أنباء عن", "وفق تقارير", "مزاعم", "يُزعم",
  ],
  // מקורות אנונימיים
  anonymous: [
    "גורם בכיר", "גורמים בכירים", "גורם במערכת", "גורמים במערכת", "גורם המעורה", "גורמים המעורים", "גורם ביטחוני",
    "גורמים ביטחוניים", "גורם מדיני", "גורמים מדיניים", "גורם בממשלה", "גורם בכנסת", "מקור בכיר", "מקורות בכירים",
    "לפי מקורות", "על פי מקורות", "גורם אמריקני", "גורם ישראלי", "senior official", "officials said", "sources say",
    "sources said", "people familiar", "familiar with the matter", "speaking on condition of anonymity", "مصدر مطلع", "مصادر",
  ],
  // מבוסס על מחקר או סקר
  study: [
    "מחקר", "מחקר חדש", "סקר", "לפי סקר", "סקר חדש", "מדענים", "study", "new study", "survey", "poll",
    "researchers", "scientists", "دراسة", "استطلاع",
  ],
  // תיעוד מהרשתות
  social: [
    "תיעוד", "תועד", "תועדה", "תועדו", "ויראלי", "ויראלית", "ברשתות", "ברשת החברתית", "צפו", "סרטון", "viral",
    "video shows", "footage", "on social media", "فيديو", "متداول",
  ],
  // כותרת מתלהמת
  sensational: [
    "דרמה", "דרמטי", "דרמטית", "סערה", "סערת", "בהלם", "המום", "המומים", "מטורף", "הזוי", "זעזוע",
    "you won't believe", "shocking", "stunning", "slams", "destroys", "chaos",
  ],
};

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// גבולות מילה ידניים (\b לא עובד בעברית); אות שימוש אחת מותרת בתחילה ("בסקר", "והמחקר")
const MATCHERS = Object.fromEntries(
  Object.entries(PHRASES).map(([flag, phrases]) => [
    flag,
    new RegExp(`(^|[^\\p{L}])[והבלמשכ]?(${phrases.map(escape).join("|")})($|[^\\p{L}])`, "iu"),
  ]),
) as Record<Exclude<ItemFlag, "opinion">, RegExp>;

export function isHedged(title: string, summary: string): boolean {
  return MATCHERS.hedged.test(title) || MATCHERS.hedged.test(summary);
}

// סימני הכתבה. כותרת מתלהמת נבדקת רק בכותרת; השאר גם בתקציר.
export function itemFlags(url: string, categories: string[], title: string, summary: string): ItemFlag[] {
  const flags: ItemFlag[] = [];
  if (isOpinion(url, categories)) flags.push("opinion");
  for (const flag of ["hedged", "anonymous", "study", "social"] as const) {
    if (MATCHERS[flag].test(title) || MATCHERS[flag].test(summary)) flags.push(flag);
  }
  if (MATCHERS.sensational.test(title) || /!{2,}|\?!/.test(title)) flags.push("sensational");
  return flags;
}

// כותרת פיתיון מובהקת: מסתירה את העיקר כדי שילחצו. אירוע כזה לא מוצג בפיד (גם בלי סיווג AI).
const CLICKBAIT = [
  "לא תאמינו", "לא תאמין", "לא תאמיני", "תתפלאו", "הסיבה תפתיע", "הסיבה תפתיע אתכם", "מה שקרה אחר כך",
  "מה שקרה אז", "זה מה שקרה", "זו הסיבה ש", "זאת הסיבה ש", "הטריק ש", "הטריק הפשוט", "כך תעשו", "כל מה שצריך לדעת על",
  "you won't believe", "what happened next", "here's why", "this is why", "the reason will", "this one trick",
];
const CLICKBAIT_RE = new RegExp(`(^|[^\\p{L}])[והבלמשכ]?(${CLICKBAIT.map(escape).join("|")})`, "iu");

export function isClickbaitHeadline(title: string): boolean {
  return CLICKBAIT_RE.test(title);
}
