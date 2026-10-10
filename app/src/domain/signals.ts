// סימני אמינות וחשיבה ביקורתית לאירוע. רק עובדות שנגזרות מהנתונים; הניסוח לתצוגה ב-ui/signalText.ts.
// הסדר = סדר החשיבות לקורא: קודם מה שמחייב זהירות, אחר כך הקשר.
import { coverage, type Coverage } from "./lean";
import type { ItemFlag, SourceProfile, Story } from "./types";

export const DEVELOPING_WINDOW_MS = 3 * 3600_000;

export type Signal =
  | { kind: "sponsored" }
  | { kind: "unconfirmed" }
  | { kind: "anonymous" }
  | { kind: "sensational" }
  | { kind: "social" }
  | { kind: "study" }
  | { kind: "opinion"; all: boolean }
  | { kind: "sources"; count: number }
  | { kind: "developing"; newSources: number }
  | { kind: "international" }
  | { kind: "spectrum"; coverage: Coverage; spread: "wide" | "one-sided" | "partial" };

export type SignalKind = Signal["kind"];
export type SignalOptions = { politicalLean: boolean };

function spectrum(c: Coverage): Signal | null {
  // צריך לפחות שני מקורות שהנטייה שלהם ידועה כדי לומר משהו על פיזור
  if (c.known < 2) return null;
  const sides = [c.left, c.center, c.right].filter((n) => n > 0).length;
  const spread = c.left > 0 && c.right > 0 ? "wide" : sides === 1 ? "one-sided" : "partial";
  return { kind: "spectrum", coverage: c, spread };
}

export function storySignals(
  story: Story,
  sources: Record<string, SourceProfile>,
  options: SignalOptions,
  now: number = Date.now(),
): Signal[] {
  const n = story.items.length;
  const count = (f: ItemFlag) => story.items.filter((i) => i.flags.includes(f)).length;
  const lead = story.items.find((i) => i.id === story.id);
  // "רוב הכתבות" לסימנים שמעידים על האירוע עצמו; "לפחות אחת" לסימנים שכדאי לדעת עליהם בכל מקרה
  const most = (f: ItemFlag) => count(f) > 0 && count(f) * 2 >= n;
  const out: Signal[] = [];

  if (story.items.some((i) => i.sponsored)) out.push({ kind: "sponsored" });
  if (most("hedged")) out.push({ kind: "unconfirmed" });
  if (most("anonymous")) out.push({ kind: "anonymous" });
  if (lead?.flags.includes("sensational") || most("sensational")) out.push({ kind: "sensational" });
  if (count("social") > 0) out.push({ kind: "social" });
  if (count("study") > 0) out.push({ kind: "study" });
  if (count("opinion") > 0) out.push({ kind: "opinion", all: count("opinion") === n });

  out.push({ kind: "sources", count: story.independent_sources });

  // מקורות שהצטרפו בשעות האחרונות, כשהאירוע עצמו התחיל קודם
  const first = Math.min(...story.items.map((i) => Date.parse(i.published)));
  const recent = new Set(
    story.items.filter((i) => now - Date.parse(i.published) < DEVELOPING_WINDOW_MS).map((i) => sources[i.source]?.owner_group ?? i.source),
  );
  if (recent.size >= 2 && now - first >= DEVELOPING_WINDOW_MS) out.push({ kind: "developing", newSources: recent.size });

  if (story.regions.includes("il") && story.regions.includes("world")) out.push({ kind: "international" });

  if (options.politicalLean) {
    const spec = spectrum(coverage(story, sources));
    if (spec) out.push(spec);
  }
  return out;
}
