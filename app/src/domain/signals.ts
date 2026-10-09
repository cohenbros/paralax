// סימני אמינות ורלוונטיות לאירוע. רק עובדות שנגזרות מהנתונים; הניסוח לתצוגה ב-ui.
import { coverage, type Coverage } from "./lean";
import type { SourceProfile, Story } from "./types";

export const DEVELOPING_WINDOW_MS = 3 * 3600_000;

export type Signal =
  | { kind: "sources"; count: number }
  | { kind: "spectrum"; coverage: Coverage; spread: "wide" | "one-sided" | "partial" }
  | { kind: "unconfirmed" }
  | { kind: "opinion"; all: boolean }
  | { kind: "developing"; newSources: number }
  | { kind: "international" }
  | { kind: "sponsored" };

export type SignalKind = Signal["kind"];

function spectrum(c: Coverage): Signal | null {
  // צריך לפחות שני מקורות שהנטייה שלהם ידועה כדי לומר משהו על פיזור
  if (c.known < 2) return null;
  const sides = [c.left, c.center, c.right].filter((n) => n > 0).length;
  const spread = c.left > 0 && c.right > 0 ? "wide" : sides === 1 ? "one-sided" : "partial";
  return { kind: "spectrum", coverage: c, spread };
}

export function storySignals(story: Story, sources: Record<string, SourceProfile>, now: number = Date.now()): Signal[] {
  const out: Signal[] = [{ kind: "sources", count: story.independent_sources }];
  const spec = spectrum(coverage(story, sources));
  if (spec) out.push(spec);

  const hedged = story.items.filter((i) => i.hedged).length;
  if (hedged > 0 && hedged * 2 >= story.items.length) out.push({ kind: "unconfirmed" });

  const opinions = story.items.filter((i) => i.opinion).length;
  if (opinions > 0) out.push({ kind: "opinion", all: opinions === story.items.length });

  // מקורות שהצטרפו בשעות האחרונות, כשהאירוע עצמו התחיל קודם
  const first = Math.min(...story.items.map((i) => Date.parse(i.published)));
  const recent = new Set(
    story.items.filter((i) => now - Date.parse(i.published) < DEVELOPING_WINDOW_MS).map((i) => sources[i.source]?.owner_group ?? i.source),
  );
  if (recent.size >= 2 && now - first >= DEVELOPING_WINDOW_MS) out.push({ kind: "developing", newSources: recent.size });

  if (story.regions.includes("il") && story.regions.includes("world")) out.push({ kind: "international" });
  if (story.items.some((i) => i.sponsored)) out.push({ kind: "sponsored" });
  return out;
}
