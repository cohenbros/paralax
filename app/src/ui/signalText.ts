// ניסוח הסימנים לתצוגה. עובדתי בלבד: אף פעם לא "אמין" / "לא אמין" (CLAUDE.md).
import type { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import type { LeanBucket } from "@/domain/lean";
import type { Signal } from "@/domain/signals";

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
