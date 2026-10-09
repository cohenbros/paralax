// תרגום כותרות ותקצירים לעברית עם Gemini API (מכסת החינם), רק לידיעות חדשות.
// המפתח מגיע מ-GEMINI_API_KEY (סוד ב-GitHub Actions) ולא נכנס לאפליקציה. בלי מפתח – מדלגים.
// התרגום מסומן באפליקציה כ"תורגם ע"י AI" (CLAUDE.md).

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";
const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";
const BATCH_SIZE = 40;
const MAX_PER_RUN = 400; // תקרה לריצה אחת, כדי לא לחרוג ממכסת החינם
const TIMEOUT_MS = 60_000;

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

type Step = { type?: string; content?: { type?: string; text?: string }[] };

// הטקסט נמצא ב-steps[].content[].text של שלב model_output (Interactions API)
export function extractText(body: unknown): string {
  const steps = (body as { steps?: Step[] })?.steps ?? [];
  return steps
    .filter((s) => s.type === "model_output")
    .flatMap((s) => s.content ?? [])
    .filter((c) => c.type === "text" && typeof c.text === "string")
    .map((c) => c.text)
    .join("");
}

async function translateBatch(batch: ToTranslate[], apiKey: string): Promise<Map<string, Translation>> {
  const input = JSON.stringify(batch.map(({ id, title, summary, lang }) => ({ id, lang, title, summary })));
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    body: JSON.stringify({
      model: MODEL,
      store: false,
      system_instruction: SYSTEM,
      input,
      generation_config: { temperature: 0.2 },
      response_format: { type: "text", mime_type: "application/json", schema: SCHEMA },
    }),
  });
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const parsed = JSON.parse(extractText(await res.json())) as { items?: { id: string; title: string; summary: string }[] };
  const known = new Set(batch.map((b) => b.id));
  const out = new Map<string, Translation>();
  for (const t of parsed.items ?? []) {
    if (known.has(t.id) && typeof t.title === "string" && t.title.trim()) {
      out.set(t.id, { title: t.title.trim(), summary: typeof t.summary === "string" ? t.summary.trim() : "" });
    }
  }
  return out;
}

export async function translateToHebrew(items: ToTranslate[]): Promise<Map<string, Translation>> {
  const apiKey = process.env.GEMINI_API_KEY;
  const out = new Map<string, Translation>();
  if (!apiKey || !items.length) return out;
  const todo = items.slice(0, MAX_PER_RUN);
  for (let i = 0; i < todo.length; i += BATCH_SIZE) {
    try {
      for (const [id, t] of await translateBatch(todo.slice(i, i + BATCH_SIZE), apiKey)) out.set(id, t);
    } catch (e) {
      // תרגום שנכשל לא מפיל את האיסוף; הידיעות יוצגו בשפת המקור וינוסו שוב בריצה הבאה
      console.warn(`תרגום נכשל: ${(e as Error).message}`);
      break;
    }
  }
  return out;
}
