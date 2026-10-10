// תרגום כותרות ותקצירים לעברית, רק לידיעות חדשות. מסומן באפליקציה כ"תורגם ע"י AI" (CLAUDE.md).
import { generateJson, inBatches, isCleanHebrew } from "./gemini.ts";

const BATCH_SIZE = 40;
const MAX_PER_RUN = 400; // תקרה לריצה אחת, כדי לא לחרוג ממכסת החינם

export type ToTranslate = { id: string; title: string; summary: string; lang: string };
export type Translation = { title: string; summary: string };

const SYSTEM = [
  "You translate news headlines and short summaries into natural, concise Hebrew as used by Israeli news sites.",
  "Translate faithfully: do not add, soften, or sharpen claims, and do not add opinions.",
  "Keep names of people, places and organizations in their standard Hebrew spelling.",
  "Return JSON only, with the same ids you received.",
].join(" ");

const SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: { id: { type: "string" }, title: { type: "string" }, summary: { type: "string" } },
        required: ["id", "title", "summary"],
      },
    },
  },
  required: ["items"],
};

async function translateBatch(batch: ToTranslate[]): Promise<Map<string, Translation>> {
  const parsed = await generateJson<{ items?: { id: string; title: string; summary: string }[] }>(
    SYSTEM,
    batch.map(({ id, title, summary, lang }) => ({ id, lang, title, summary })),
    SCHEMA,
  );
  const known = new Set(batch.map((b) => b.id));
  const out = new Map<string, Translation>();
  for (const t of parsed.items ?? []) {
    const summary = typeof t.summary === "string" ? t.summary.trim() : "";
    if (known.has(t.id) && typeof t.title === "string" && isCleanHebrew(t.title) && (!summary || isCleanHebrew(summary))) {
      out.set(t.id, { title: t.title.trim(), summary });
    }
  }
  return out;
}

export function translateToHebrew(items: ToTranslate[]): Promise<Map<string, Translation>> {
  return inBatches(items.slice(0, MAX_PER_RUN), BATCH_SIZE, "תרגום", translateBatch);
}
