import * as WebBrowser from "expo-web-browser";
import { REPORT_ISSUE_URL } from "@/config";
import { isSafeHttpUrl } from "@/domain/links";

// פותח קישור בדפדפן בתוך האפליקציה (Custom Tabs). קישור שאינו http/https לא נפתח.
export function openLink(url: string): void {
  if (!isSafeHttpUrl(url)) return;
  WebBrowser.openBrowserAsync(url).catch(() => {});
}

// "דווח על טעות" לטקסט שנוצר ע"י AI או לסימן שגוי
export function reportError(subject: string, details: string): void {
  const q = `title=${encodeURIComponent(`דיווח על טעות: ${subject}`.slice(0, 120))}&body=${encodeURIComponent(details)}`;
  openLink(`${REPORT_ISSUE_URL}?${q}`);
}
