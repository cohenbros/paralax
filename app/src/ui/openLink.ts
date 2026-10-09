import * as WebBrowser from "expo-web-browser";
import { isSafeHttpUrl } from "@/domain/links";

// פותח קישור בדפדפן בתוך האפליקציה (Custom Tabs). קישור שאינו http/https לא נפתח.
export function openLink(url: string): void {
  if (!isSafeHttpUrl(url)) return;
  WebBrowser.openBrowserAsync(url).catch(() => {});
}
