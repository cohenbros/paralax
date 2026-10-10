// לקוח משותף ל-Gemini API (Interactions API, מכסת החינם). משמש לתרגום ולתוכן לחשיבה ביקורתית.
// המפתח מגיע מ-GEMINI_API_KEY (סוד ב-GitHub Actions) ולא נכנס לאפליקציה. בלי מפתח – מדלגים.

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";
const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";
const TIMEOUT_MS = 90_000;

export function hasGeminiKey(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

type Step = { type?: string; content?: { type?: string; text?: string }[] };

// הטקסט נמצא ב-steps[].content[].text של שלב model_output
export function extractText(body: unknown): string {
  const steps = (body as { steps?: Step[] })?.steps ?? [];
  return steps
    .filter((s) => s.type === "model_output")
    .flatMap((s) => s.content ?? [])
    .filter((c) => c.type === "text" && typeof c.text === "string")
    .map((c) => c.text)
    .join("");
}

// בקשה אחת עם פלט JSON לפי סכמה. זורק שגיאה בכשל (המתקשר מחליט מה לעשות).
export async function generateJson<T>(system: string, input: unknown, schema: object, temperature = 0.2): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY חסר");
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    body: JSON.stringify({
      model: MODEL,
      store: false,
      system_instruction: system,
      input: JSON.stringify(input),
      generation_config: { temperature },
      response_format: { type: "text", mime_type: "application/json", schema },
    }),
  });
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return JSON.parse(extractText(await res.json())) as T;
}

// טקסט עברי תקין: עברית, ואולי שמות באותיות לטיניות. המודל לפעמים "מחליק" לאותיות של כתב אחר
// (למשל תאית או ערבית בתוך מילה עברית) – טקסט כזה נדחה ומנוסה שוב בריצה הבאה.
const FOREIGN_LETTER = /[^\p{Script=Hebrew}\p{Script=Latin}\p{N}\p{P}\p{S}\p{Z}\p{M}]/u;
export function isCleanHebrew(text: string): boolean {
  return /\p{Script=Hebrew}/u.test(text) && !FOREIGN_LETTER.test(text);
}

// מריץ אצוות ברצף; אצווה שנכשלה עוצרת את השאר (בדרך כלל מכסה), והאיסוף ממשיך בלעדיהן
export async function inBatches<T, R>(
  items: T[],
  size: number,
  label: string,
  run: (batch: T[]) => Promise<Map<string, R>>,
): Promise<Map<string, R>> {
  const out = new Map<string, R>();
  if (!hasGeminiKey() || !items.length) return out;
  for (let i = 0; i < items.length; i += size) {
    try {
      for (const [k, v] of await run(items.slice(i, i + size))) out.set(k, v);
    } catch (e) {
      console.warn(`${label} נכשל: ${(e as Error).message}`);
      break;
    }
  }
  return out;
}
