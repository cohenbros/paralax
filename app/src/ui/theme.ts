import { useColorScheme } from "react-native";
import type { LeanBucket } from "@/domain/lean";

const light = {
  background: "#F1F0F7",
  surface: "#FFFFFF",
  text: "#16151F",
  muted: "#62606F",
  border: "#E4E2EE",
  accent: "#4338CA", // צבע המותג
  accentSoft: "#E9E7FB",
  onAccent: "#FFFFFF",
  header: "#4338CA",
  onHeader: "#FFFFFF",
  info: "#15803D",
  infoSoft: "#DCFCE7",
  notice: "#9A5B00",
  noticeSoft: "#FEF3C7",
};

const dark: typeof light = {
  background: "#0F0E17",
  surface: "#1B1A27",
  text: "#EEEDF5",
  muted: "#A6A4B5",
  border: "#2E2C3D",
  accent: "#A5B4FC",
  accentSoft: "#252349",
  onAccent: "#14123A",
  header: "#1B1A27",
  onHeader: "#EEEDF5",
  info: "#86EFAC",
  infoSoft: "#14321F",
  notice: "#FCD34D",
  noticeSoft: "#3A2C0C",
};

export type Colors = typeof light;

// צבע לכל קטגוריה: עוזר לזהות נושא במבט, בלי לקרוא
const CATEGORY_COLORS: Record<string, string> = {
  "אקטואליה": "#2563EB",
  "פוליטיקה": "#C026D3",
  "ביטחון": "#475569",
  "עולם": "#0284C7",
  "כלכלה": "#0D9488",
  "צרכנות": "#D97706",
  "מדע וטכנולוגיה": "#6366F1",
  "בריאות": "#E11D48",
  "תרבות": "#EA580C",
  "ספורט": "#16A34A",
};

export function categoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? "#64748B";
}

// צבעים ניטרליים לקשת (לא אדום/כחול, שיש להם משמעות מפלגתית)
export const LEAN_COLORS: Record<LeanBucket, string> = {
  left: "#14B8A6",
  center: "#94A3B8",
  right: "#F59E0B",
  unknown: "#D9D7E3",
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
export const radius = { sm: 6, md: 14, pill: 999 } as const;

export const typography = {
  hero: { fontSize: 24, lineHeight: 32, fontWeight: "800" },
  title: { fontSize: 22, lineHeight: 30, fontWeight: "700" },
  heading: { fontSize: 17, lineHeight: 24, fontWeight: "700" },
  body: { fontSize: 16, lineHeight: 24, fontWeight: "400" },
  label: { fontSize: 14, lineHeight: 20, fontWeight: "600" },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "400" },
  tiny: { fontSize: 11, lineHeight: 14, fontWeight: "600" },
} as const;

export function useColors(): Colors {
  return useColorScheme() === "dark" ? dark : light;
}
