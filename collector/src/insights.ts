// תוכן לחשיבה ביקורתית לכל אירוע, נוצר ע"י AI ומסומן ככזה באפליקציה:
//   kind       – ידיעה אמיתית, כותרת פיתיון ("לא תאמינו מה קרה"), או לא-חדשות (פרסומת, הורוסקופ, חידון)
//   questions  – שאלות רקע כלליות על הנושא, שאפשר לשאול את Gemini ("מהי התחממות גלובלית?")
//   viewpoints – עמדות שעולות בדיון הציבורי (כולל עמדה ספקנית), ולכל אחת "מה כדאי לבדוק"
// לא תגובות של אנשים אמיתיים (CLAUDE.md, "תגובות ונקודות מבט").
import { generateJson, inBatches, isCleanHebrew } from "./gemini.ts";
import { isOffensive } from "./quotes.ts";
import type { Insights, StoryKind, Story } from "./types.ts";

// גרסת ההנחיה. תוכן מגרסה קודמת נוצר מחדש בהדרגה (MAX_PER_RUN לריצה).
export const INSIGHTS_VERSION = 2;
const BATCH_SIZE = 15;
// ריצה ראשונה משלימה את כל האירועים הקיימים; אחר כך רק אירועים חדשים (עשרות בודדות לריצה)
const MAX_PER_RUN = 150;
const MAX_QUESTION = 120;
const MAX_VIEWPOINT = 220;
const KINDS: StoryKind[] = ["news", "clickbait", "not_news"];

const SYSTEM = `You help readers of an Israeli news app think critically about the news.
For each story you get a Hebrew headline, a short summary, and sometimes headlines from other outlets about the same event.
Write all text in natural Hebrew.

0. "kind" – classify the story:
   "clickbait": the headline deliberately hides the key information to make people click
     (e.g. "הוא פתח את הדלת ולא תאמינו מה ראה", "זו הסיבה ש...", "הטריק ש...", "כך תעשו..."), or it is a teaser with no real news.
   "not_news": advertising or sponsored promotion, shopping deals, horoscopes, quizzes, recipes, lifestyle tips,
     or celebrity gossip without public significance.
   "news": everything else, i.e. a report about something that happened or was said, that matters to the public.
   If kind is not "news", return empty questions and viewpoints.

1. "questions": exactly 3 short questions (up to 12 words each) about the BACKGROUND and CONCEPTS behind the story,
   that a general assistant like Gemini can answer from general knowledge: what a term means, how something works,
   the history of the issue, how it is measured, what usually happens in such cases.
   Example for an extreme-weather story: "מה ההבדל בין מזג אוויר לאקלים?", "מהי התחממות גלובלית ואיך מודדים אותה?",
   "האם אירועי מזג אוויר קיצוניים נעשים תכופים יותר?".
   Do NOT ask about small details of this specific incident that only the article can answer (exact names, dates, quotes, numbers).
   Never generic questions like "מה דעתך?" or "איך זה משפיע עליי?".

2. "viewpoints": exactly 3 different positions that people commonly voice in public discussion about this kind of story,
   including at least one skeptical or contrarian position. Write each "stance" the way an ordinary person would say it (up to 25 words).
   For each, "check": one sentence on what evidence or data would help decide whether the stance holds (up to 25 words).
   Do not say which stance is right. Do not attribute stances to real people, parties, or ethnic or religious groups.
   No insults, no hate, no medical or legal advice.
   Return an EMPTY viewpoints array if the story is a personal tragedy (deaths, victims, sexual crimes) or a sports result.

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
          kind: { type: "string", enum: KINDS },
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
        required: ["id", "kind", "questions", "viewpoints"],
      },
    },
  },
  required: ["items"],
};

type Raw = { id?: unknown; kind?: unknown; questions?: unknown; viewpoints?: unknown };

const ok = (s: unknown, max: number): s is string =>
  typeof s === "string" && s.trim().length > 3 && s.length <= max && isCleanHebrew(s) && !isOffensive(s);

// טקסט שלא עובר בדיקה נזרק; פחות משתי שאלות או משתי עמדות תקינות – לא מציגים את החלק הזה.
// סיווג חסר או לא מוכר נחשב "news", כדי שידיעה אמיתית לא תיעלם בגלל תקלה.
export function validateInsights(raw: Raw): Insights | null {
  const kind: StoryKind = KINDS.includes(raw.kind as StoryKind) ? (raw.kind as StoryKind) : "news";
  if (kind !== "news") return { v: INSIGHTS_VERSION, kind, questions: [], viewpoints: [] };
  const questions = Array.isArray(raw.questions) ? raw.questions.filter((q) => ok(q, MAX_QUESTION)).map((q) => q.trim()) : [];
  const viewpoints = Array.isArray(raw.viewpoints)
    ? raw.viewpoints
        .filter((v): v is { stance: string; check: string } => ok(v?.stance, MAX_VIEWPOINT) && ok(v?.check, MAX_VIEWPOINT))
        .map((v) => ({ stance: v.stance.trim(), check: v.check.trim() }))
    : [];
  return {
    v: INSIGHTS_VERSION,
    kind,
    questions: questions.length >= 2 ? questions.slice(0, 4) : [],
    viewpoints: viewpoints.length >= 2 ? viewpoints.slice(0, 3) : [],
  };
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

export const isCurrent = (i: Insights | undefined): i is Insights => i?.v === INSIGHTS_VERSION;

// רק לאירועים שמוצגים בעברית ושאין להם תוכן בגרסה הנוכחית; החדשים קודם, כי הפיד ממוין לפי זמן
export function generateInsights(stories: Story[]): Promise<Map<string, Insights>> {
  const todo = stories
    .filter((s) => s.lang === "he" && !isCurrent(s.insights) && !s.excluded && !s.items.every((i) => i.sponsored))
    .sort((a, b) => Date.parse(b.updated) - Date.parse(a.updated))
    .slice(0, MAX_PER_RUN);
  return inBatches(todo, BATCH_SIZE, "שאלות ועמדות", insightsBatch);
}
