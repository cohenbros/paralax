// טיפוסי הנתונים שהאפליקציה מקבלת מ-GitHub Pages.
// חייבים להתאים ל-collector/src/types.ts. שינוי במבנה → לעדכן את שני הצדדים ואת DATA_VERSION.

export const DATA_VERSION = 1;

export const CATEGORIES = [
  "אקטואליה",
  "פוליטיקה",
  "ביטחון",
  "עולם",
  "כלכלה",
  "צרכנות",
  "מדע וטכנולוגיה",
  "בריאות",
  "תרבות",
  "ספורט",
] as const;
export type Category = (typeof CATEGORIES)[number];

export type Region = "il" | "world";

export type Item = {
  id: string;
  source: string;
  title: string;
  summary: string;
  url: string;
  published: string;
  category: string;
  sponsored: boolean;
};

export type Story = {
  id: string;
  lang: string;
  category: string;
  title: string;
  summary: string;
  updated: string;
  independent_sources: number;
  regions: Region[];
  items: Item[];
};

export type Latest = {
  version: number;
  generated_at: string;
  window_hours: number;
  failed_sources: string[];
  stories: Story[];
};

export type SourceProfile = {
  id: string;
  name: string;
  site: string;
  language: string;
  region: Region;
  owner_group: string;
  owner: string | null;
  funding: string | null;
  press_council_member: boolean | null;
  corrections_policy_url: string | null;
  ifcn_signatory: boolean | null;
  audience_lean: { range: string | null; evidence_url: string | null };
  evidence_urls: string[];
};

export type NewsData = {
  latest: Latest;
  sources: Record<string, SourceProfile>;
};
