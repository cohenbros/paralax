// מה מוצג מכל כתבה: עברית כשיש (מקור או תרגום AI), אחרת שפת המקור
import type { Item, SourceProfile } from "./types";

export type ItemText = { title: string; summary: string; lang: string; ai: boolean; originalTitle?: string };

export function itemText(item: Item, source: SourceProfile | undefined): ItemText {
  const lang = source?.language ?? "he";
  if (lang !== "he" && item.title_he) {
    return { title: item.title_he, summary: item.summary_he ?? "", lang: "he", ai: true, originalTitle: item.title };
  }
  return { title: item.title, summary: item.summary, lang, ai: false };
}

// טקסט לשיתוף עם Gemini ("רוצה להבין יותר?"): כותרת, קישור ושאלה. בלי מפתח API, דרך Share של המכשיר.
export function geminiPrompt(title: string, url: string, question: string): string {
  return `${question}\n\nהידיעה: ${title}\n${url}\n\nענה בעברית, הפרד בין עובדות מאומתות לטענות, וציין מקורות.`;
}
