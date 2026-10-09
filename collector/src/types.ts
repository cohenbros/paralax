import type { Quote } from "./quotes.ts";

// מבנה sources.json (ראו CLAUDE.md)
export type Source = {
  id: string;
  name: string;
  site: string;
  feed: string;
  feed_checked: string | null;
  feed_terms_ok: boolean | null;
  language: string;
  region: "il" | "world";
  categories: string[];
  owner_group: string;
  owner: string | null;
  funding: string | null;
  press_council_member: boolean | null;
  corrections_policy_url: string | null;
  ifcn_signatory: boolean | null;
  audience_lean: { range: string | null; evidence_url: string | null };
  evidence_urls: string[];
};

// ידיעה כפי שנקראה מהפיד, לפני נרמול
export type RawItem = {
  title: string;
  link: string;
  description: string;
  date: string | null;
  categories: string[];
  author: string;
};

// ידיעה מנורמלת, כפי שנשמרת ב-latest.json
export type Item = {
  id: string;
  source: string;
  title: string;
  summary: string;
  url: string;
  published: string; // ISO
  category: string;
  sponsored: boolean;
  // תרגום AI לעברית, רק לידיעות שאינן בעברית
  title_he?: string;
  summary_he?: string;
  opinion?: true; // טור דעה
  hedged?: true; // נשען על דיווח לא מאושר ("לפי דיווח", "reportedly")
};

export type Story = {
  id: string;
  lang: string; // שפת הכותרת המוצגת
  title_ai?: true; // הכותרת והתקציר תורגמו ע"י AI
  category: string;
  title: string;
  summary: string;
  updated: string; // הידיעה האחרונה בקבוצה
  independent_sources: number; // מספר בעלים שונים
  regions: ("il" | "world")[];
  quotes?: Quote[];
  items: Item[];
};

export type Latest = {
  version: 1;
  generated_at: string;
  window_hours: number;
  failed_sources: string[];
  stories: Story[];
};

// קטגוריות האפליקציה (מסך ההיכרות)
export const CATEGORIES = [
  "ספורט",
  "פוליטיקה",
  "אקטואליה",
  "ביטחון",
  "צרכנות",
  "כלכלה",
  "מדע וטכנולוגיה",
  "בריאות",
  "תרבות",
  "עולם",
] as const;
