import type { Preferences } from "./preferences";
import type { Category, Story } from "./types";

export const ALL = "הכל";
export type CategoryFilter = Category | typeof ALL;

function matchesRegion(story: Story, regions: Preferences["regions"]): boolean {
  if (regions === "both" || story.regions.length === 0) return true;
  return story.regions.includes(regions);
}

// הפיד: לפי תחומי העניין והאזור שנבחרו, ואז לפי הקטגוריה בפס העליון. העדכני ביותר ראשון.
export function selectFeed(stories: Story[], prefs: Preferences, filter: CategoryFilter): Story[] {
  const interests = new Set<string>(prefs.interests);
  return stories
    .filter((s) => interests.has(s.category))
    .filter((s) => matchesRegion(s, prefs.regions))
    .filter((s) => filter === ALL || s.category === filter)
    .sort((a, b) => Date.parse(b.updated) - Date.parse(a.updated));
}

// קטגוריות שיש בהן לפחות ידיעה אחת, בסדר של תחומי העניין
export function availableCategories(stories: Story[], prefs: Preferences): Category[] {
  const present = new Set(selectFeed(stories, prefs, ALL).map((s) => s.category));
  return prefs.interests.filter((c) => present.has(c));
}

export function isSponsoredStory(story: Story): boolean {
  return story.items.some((i) => i.sponsored);
}

// ניסוח עובדתי בלבד (CLAUDE.md, "סימני אמינות")
export function verificationLabel(story: Story): string {
  const n = story.independent_sources;
  return n > 1 ? `דווח ע"י ${n} מקורות בלתי תלויים` : "עד עכשיו דיווח רק מקור אחד";
}

export function isRtlLanguage(lang: string): boolean {
  return lang === "he" || lang === "ar";
}
