import { useColorScheme } from "react-native";

const light = {
  background: "#F7F6F2",
  surface: "#FFFFFF",
  text: "#1B1B1B",
  muted: "#5E6166",
  border: "#E2E0DA",
  accent: "#1F5FBF",
  accentSoft: "#E7EFFB",
  onAccent: "#FFFFFF",
  info: "#1E6B34",
  infoSoft: "#E5F3E9",
  notice: "#7A4B00",
  noticeSoft: "#FFF2DC",
};

const dark: typeof light = {
  background: "#121212",
  surface: "#1D1D1F",
  text: "#ECECEC",
  muted: "#A3A6AB",
  border: "#34353A",
  accent: "#8AB4F8",
  accentSoft: "#1F2B3F",
  onAccent: "#0B1A33",
  info: "#8FD3A4",
  infoSoft: "#16301E",
  notice: "#F2C27B",
  noticeSoft: "#3A2A10",
};

export type Colors = typeof light;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
export const radius = { sm: 6, md: 10, pill: 999 } as const;

export const typography = {
  title: { fontSize: 22, lineHeight: 30, fontWeight: "700" },
  heading: { fontSize: 18, lineHeight: 25, fontWeight: "700" },
  body: { fontSize: 16, lineHeight: 24, fontWeight: "400" },
  label: { fontSize: 14, lineHeight: 20, fontWeight: "600" },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "400" },
} as const;

export function useColors(): Colors {
  return useColorScheme() === "dark" ? dark : light;
}
