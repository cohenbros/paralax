// נטיית קהל של מקור (מתוך sources.json, מבוסס סקרים) ופיזור הכיסוי של אירוע על פני הקשת
import type { SourceProfile, Story } from "./types";

export const LEAN_SCALE = ["left", "center-left", "center", "center-right", "right"] as const;
export type LeanPoint = (typeof LEAN_SCALE)[number];
export type LeanBucket = "left" | "center" | "right" | "unknown";

// "center-left" → 1, "center-left..center" → 1.5 (אמצע הטווח), לא מוכר → null
export function leanPosition(range: string | null | undefined): number | null {
  if (!range) return null;
  const parts = range.split("..").map((p) => LEAN_SCALE.indexOf(p.trim() as LeanPoint));
  if (!parts.length || parts.length > 2 || parts.some((i) => i < 0)) return null;
  return parts.reduce((a, b) => a + b, 0) / parts.length;
}

export function leanBucket(source: SourceProfile | undefined): LeanBucket {
  const pos = leanPosition(source?.audience_lean.range);
  if (pos === null) return "unknown";
  return pos < 1.5 ? "left" : pos > 2.5 ? "right" : "center";
}

export type Coverage = Record<LeanBucket, number> & { total: number; known: number };

// לפי בעלים (owner_group): שני אתרים של אותה קבוצה נספרים פעם אחת, כמו בסימן האימות
export function coverage(story: Story, sources: Record<string, SourceProfile>): Coverage {
  const byOwner = new Map<string, LeanBucket>();
  for (const item of story.items) {
    const src = sources[item.source];
    const owner = src?.owner_group ?? item.source;
    const bucket = leanBucket(src);
    if (!byOwner.has(owner) || byOwner.get(owner) === "unknown") byOwner.set(owner, bucket);
  }
  const c: Coverage = { left: 0, center: 0, right: 0, unknown: 0, total: byOwner.size, known: 0 };
  for (const b of byOwner.values()) c[b]++;
  c.known = c.total - c.unknown;
  return c;
}

// ממוין מימין לשמאל, כמו כיוון הקריאה ופס הקשת; מקורות שהנטייה שלהם לא נבדקה בסוף
export function sortByLean<T>(list: T[], sourceOf: (x: T) => SourceProfile | undefined): T[] {
  const pos = (x: T) => leanPosition(sourceOf(x)?.audience_lean.range) ?? Number.NEGATIVE_INFINITY;
  return [...list].sort((a, b) => pos(b) - pos(a));
}
