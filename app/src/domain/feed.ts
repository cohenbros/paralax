import type { Preferences } from "./preferences";
import type { Category, Story } from "./types";

export const ALL = "הכל";
export type CategoryFilter = Category | typeof ALL;

function matchesRegion(story: Story, regions: Preferences["regions"]): boolean {
  if (regions === "both" || story.regions.length === 0) return true;
  return story.regions.includes(regions);
}

// אירוע בשפה זרה שעוד לא תורגם מחכה לתרגום (בדרך כלל עד חצי שעה).
// אם התרגום לא פעיל בכלל (אין אף כותרת מתורגמת), מציגים הכל בשפת המקור כדי שלא ייעלם תוכן.
function readableFilter(stories: Story[]): (s: Story) => boolean {
  const translationActive = stories.some((s) => s.title_ai);
  return (s) => !translationActive || s.lang === "he";
}

// הפיד: לפי תחומי העניין והאזור שנבחרו, ואז לפי הקטגוריה בפס העליון. העדכני ביותר ראשון.
export function selectFeed(stories: Story[], prefs: Preferences, filter: CategoryFilter): Story[] {
  const interests = new Set<string>(prefs.interests);
  return stories
    .filter((s) => !s.excluded) // רק ידיעות אמיתיות: בלי כותרות פיתיון ובלי לא-חדשות
    .filter(readableFilter(stories))
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

export function isRtlLanguage(lang: string): boolean {
  return lang === "he" || lang === "ar";
}
