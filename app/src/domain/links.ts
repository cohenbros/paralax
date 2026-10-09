// רק קישורי http/https נפתחים מהאפליקציה (לא javascript:, intent:, file: וכו').
// regex ולא new URL(): המימוש של URL ב-React Native לא תמיד שלם.
const HTTP_URL = /^https?:\/\/[^\s/?#@]+(?:[/?#][^\s]*)?$/i;

export function isSafeHttpUrl(v: unknown): v is string {
  return typeof v === "string" && v.length <= 2048 && HTTP_URL.test(v);
}
