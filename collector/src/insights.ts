// תוכן לחשיבה ביקורתית לכל אירוע, נוצר ע"י AI ומסומן ככזה באפליקציה:
//   questions  – שאלות להרחבה שנגזרות מתוכן הידיעה ("מתי נמדד שיא החום בישראל?")
//   viewpoints – עמדות שעולות בדיון הציבורי (כולל עמדה ספקנית), ולכל אחת "מה כדאי לבדוק"
// לא תגובות של אנשים אמיתיים (CLAUDE.md, "תגובות ונקודות מבט").
import { generateJson, inBatches, isCleanHebrew } from "./gemini.ts";
import { isOffensive } from "./quotes.ts";
import type { Insights, Story } from "./types.ts";

const BATCH_SIZE = 10;
const MAX_PER_RUN = 60;
const MAX_QUESTION = 120;
const MAX_VIEWPOINT = 220;

const SYSTEM = `You help readers of an Israeli news app think critically about a news story.
For each story you get a Hebrew headline, a short summary, and sometimes headlines from other outlets about the same event.
Write everything in natural Hebrew.

1. "questions": exactly 3 short questions (up to 12 words each) that a curious reader could ask to understand THIS story better:
   background, history, definitions, the numbers involved, what is still unknown, how it is measured.
   They must be specific to the story's content. Example for an extreme-weather story:
   "מתי התחילו להימדד אירועי מזג אוויר קיצוניים בישראל?", "מה ההבדל בין מזג אוויר לאקלים?", "איפה נמדדו הטמפרטורות הגבוהות ביותר?".
   Never generic questions like "מה דעתך?" or "איך זה משפיע עליי?". Do not presuppose facts that are not in the text.

2. "viewpoints": exactly 3 different positions that people commonly voice in public discussion about this kind of story,
   including at least one skeptical or contrarian position. Write each "stance" the way an ordinary person would say it (up to 25 words).
   For each, "check": one sentence on what evidence or data would help decide whether the stance holds (up to 25 words).
   Do not say which stance is right. Do not attribute stances to real people, parties, or ethnic or religious groups.
   No insults, no hate, no medical or legal advice.
   Return an EMPTY viewpoints array if the story is a personal tragedy (deaths, victims, sexual crimes), a sports result, or celebrity gossip.

Never invent facts, numbers, names, or quotes. Return JSON only, with the same ids you received.`;

const SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          questions: { type: "array", items: { type: "string" } },
          viewpoints: {
            type: "array",
            items: {
              type: "object",
              properties: { stance: { type: "string" }, check: { type: "string" } },
              required: ["stance", "check"],
            },
          },
        },
        required: ["id", "questions", "viewpoints"],
      },
    },
  },
  required: ["items"],
};

type Raw = { id?: unknown; questions?: unknown; viewpoints?: unknown };

const ok = (s: unknown, max: number): s is string =>
  typeof s === "string" && s.trim().length > 3 && s.length <= max && isCleanHebrew(s) && !isOffensive(s);

// טקסט שלא עובר בדיקה נזרק; פחות משתי שאלות או משתי עמדות תקינות – לא מציגים את החלק הזה
export function validateInsights(raw: Raw): Insights | null {
  const questions = Array.isArray(raw.questions) ? raw.questions.filter((q) => ok(q, MAX_QUESTION)).map((q) => q.trim()) : [];
  const viewpoints = Array.isArray(raw.viewpoints)
    ? raw.viewpoints
        .filter((v): v is { stance: string; check: string } => ok(v?.stance, MAX_VIEWPOINT) && ok(v?.check, MAX_VIEWPOINT))
        .map((v) => ({ stance: v.stance.trim(), check: v.check.trim() }))
    : [];
  const result: Insights = {
    questions: questions.length >= 2 ? questions.slice(0, 4) : [],
    viewpoints: viewpoints.length >= 2 ? viewpoints.slice(0, 3) : [],
  };
  return result.questions.length || result.viewpoints.length ? result : null;
}

async function insightsBatch(batch: Story[]): Promise<Map<string, Insights>> {
  const input = batch.map((s) => ({
    id: s.id,
    title: s.title,
    summary: s.summary,
    other_headlines: s.items
      .map((i) => i.title_he ?? i.title)
      .filter((t) => t !== s.title)
      .slice(0, 4),
  }));
  const parsed = await generateJson<{ items?: Raw[] }>(SYSTEM, input, SCHEMA, 0.4);
  const known = new Set(batch.map((s) => s.id));
  const out = new Map<string, Insights>();
  for (const raw of parsed.items ?? []) {
    if (typeof raw.id !== "string" || !known.has(raw.id)) continue;
    const insights = validateInsights(raw);
    if (insights) out.set(raw.id, insights);
  }
  return out;
}

// רק לאירועים שמוצגים בעברית ושעוד אין להם תוכן; קודם אירועים עם יותר מקורות, ואז החדשים
export function generateInsights(stories: Story[]): Promise<Map<string, Insights>> {
  const todo = stories
    .filter((s) => s.lang === "he" && !s.insights && !s.items.every((i) => i.sponsored))
    .sort((a, b) => b.independent_sources - a.independent_sources || Date.parse(b.updated) - Date.parse(a.updated))
    .slice(0, MAX_PER_RUN);
  return inBatches(todo, BATCH_SIZE, "שאלות ועמדות", insightsBatch);
}
