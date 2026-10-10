// ניסוח הסימנים לתצוגה. עובדתי בלבד: אף פעם לא "אמין" / "לא אמין" (CLAUDE.md).
import type { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import type { LeanBucket } from "@/domain/lean";
import type { Signal } from "@/domain/signals";
import type { ItemFlag } from "@/domain/types";

export type IconName = ComponentProps<typeof Ionicons>["name"];
export type SignalTone = "info" | "notice" | "neutral";
export type SignalView = { icon: IconName; short: string; label: string; explanation: string; tone: SignalTone };

const SIDE: Record<Exclude<LeanBucket, "unknown">, string> = { left: "משמאל", center: "מהמרכז", right: "מימין" };

function onlySide(s: Extract<Signal, { kind: "spectrum" }>): string {
  const c = s.coverage;
  const side = c.left ? "left" : c.right ? "right" : "center";
  return SIDE[side];
}

export function signalView(s: Signal): SignalView {
  switch (s.kind) {
    case "anonymous":
      return {
        icon: "eye-off-outline",
        short: "מקורות אנונימיים",
        label: "נשען על מקורות אנונימיים",
        explanation:
          'רוב הכתבות מצטטות "גורם בכיר" או "מקורות" בלי שם. לפעמים זה הכרחי, אבל אי אפשר לבדוק מי אמר ומה האינטרס שלו. האם מישהו אישר את זה בשמו?',
        tone: "notice",
      };
    case "sensational":
      return {
        icon: "flame-outline",
        short: "כותרת מתלהמת",
        label: "כותרת בניסוח מתלהם",
        explanation:
          'מילים כמו "דרמה", "סערה" או "לא תאמינו" נועדו למשוך קליקים. כדאי לקרוא את הכתבה עצמה: האם התוכן תואם את הכותרת?',
        tone: "notice",
      };
    case "social":
      return {
        icon: "videocam-outline",
        short: "תיעוד מהרשת",
        label: "מבוסס על תיעוד או סרטון",
        explanation:
          "סרטונים ותמונות יכולים להיות ישנים, ערוכים או מהקשר אחר. האם מצוין מי צילם, מתי ואיפה, והאם התיעוד אומת?",
        tone: "neutral",
      };
    case "study":
      return {
        icon: "flask-outline",
        short: "מחקר או סקר",
        label: "מבוסס על מחקר או סקר",
        explanation:
          "שווה לבדוק: מי ערך ומי מימן? כמה אנשים השתתפו? האם המחקר פורסם בכתב עת? האם הכותרת אומרת יותר ממה שהמחקר מצא?",
        tone: "neutral",
      };
    case "sources":
      return {
        icon: "newspaper-outline",
        short: s.count > 1 ? `${s.count} מקורות` : "מקור אחד",
        label: s.count > 1 ? `דווח ע"י ${s.count} מקורות בלתי תלויים` : "עד עכשיו דיווח רק מקור אחד",
        explanation:
          "כמה גופי תקשורת נפרדים דיווחו על האירוע. כלי תקשורת של אותם בעלים נספרים כמקור אחד. זה לא אומר שהדיווח נכון או שגוי.",
        tone: s.count > 1 ? "info" : "neutral",
      };
    case "spectrum": {
      const label =
        s.spread === "wide" ? "דווח בכל הקשת" : s.spread === "one-sided" ? `דווח רק במקורות שקהלם ${onlySide(s)}` : "דווח בחלק מהקשת";
      return {
        icon: "git-compare-outline",
        short: s.spread === "wide" ? "כל הקשת" : s.spread === "one-sided" ? "צד אחד" : "חלק מהקשת",
        label,
        explanation:
          "לפי נטיית הקהל של כלי התקשורת שדיווחו, כפי שעולה מסקרים (הקישור לסקר בפרופיל כל מקור). מקורות שעוד לא נבדקו לא נספרים.",
        tone: s.spread === "wide" ? "info" : "notice",
      };
    }
    case "unconfirmed":
      return {
        icon: "help-circle-outline",
        short: "לא מאושר",
        label: "מבוסס על דיווח שעוד לא אושר",
        explanation: 'רוב הכתבות מנוסחות כ"לפי דיווח", "נטען" או "reportedly". שווה לחכות לאישור רשמי או למקורות נוספים.',
        tone: "notice",
      };
    case "opinion":
      return {
        icon: "chatbubble-ellipses-outline",
        short: s.all ? "דעה" : "כולל דעות",
        label: s.all ? "טור דעה" : "כולל טורי דעה",
        explanation: "טור דעה מבטא את עמדת הכותב ואינו דיווח חדשותי. כך מסמן אותו האתר עצמו.",
        tone: "neutral",
      };
    case "developing":
      return {
        icon: "trending-up-outline",
        short: "מתפתח",
        label: `אירוע מתפתח: ${s.newSources} מקורות דיווחו בשעות האחרונות`,
        explanation: "עוד ועוד כלי תקשורת מדווחים על האירוע. פרטים עשויים להשתנות.",
        tone: "info",
      };
    case "international":
      return {
        icon: "globe-outline",
        short: "בארץ ובעולם",
        label: "דווח גם בארץ וגם בעולם",
        explanation: "כלי תקשורת ישראליים ובינלאומיים דיווחו על האירוע. אפשר להשוות ב\"איך כתבו על זה\".",
        tone: "info",
      };
    case "sponsored":
      return {
        icon: "pricetag-outline",
        short: "ממומן",
        label: "כולל תוכן ממומן",
        explanation: 'לפחות כתבה אחת מסומנת ע"י האתר כתוכן שיווקי ("בשיתוף", "Sponsored"). היא מוצגת ומסומנת, לא מוסתרת.',
        tone: "notice",
      };
  }
}

export const LEAN_LABELS: Record<string, string> = {
  left: "שמאל",
  "center-left": "מרכז-שמאל",
  center: "מרכז",
  "center-right": "מרכז-ימין",
  right: "ימין",
};

export function leanLabel(range: string): string {
  return range
    .split("..")
    .map((p) => LEAN_LABELS[p.trim()] ?? p)
    .join(" עד ");
}

// תגית קטנה לכתבה בודדת ב"איך כתבו על זה"
const FLAG_VIEWS: Record<ItemFlag, Pick<SignalView, "icon" | "short" | "tone">> = {
  opinion: { icon: "chatbubble-ellipses-outline", short: "דעה", tone: "neutral" },
  hedged: { icon: "help-circle-outline", short: "לא מאושר", tone: "notice" },
  anonymous: { icon: "eye-off-outline", short: "מקור אנונימי", tone: "notice" },
  sensational: { icon: "flame-outline", short: "כותרת מתלהמת", tone: "notice" },
  social: { icon: "videocam-outline", short: "תיעוד מהרשת", tone: "neutral" },
  study: { icon: "flask-outline", short: "מחקר/סקר", tone: "neutral" },
};

export function flagView(flag: ItemFlag): SignalView {
  const v = FLAG_VIEWS[flag];
  return { ...v, label: v.short, explanation: "" };
}
