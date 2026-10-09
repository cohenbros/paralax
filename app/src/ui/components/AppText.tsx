import { Text, type TextProps } from "react-native";
import { isRtlLanguage } from "@/domain/feed";
import { typography, useColors, type Colors } from "../theme";

type Props = TextProps & {
  variant?: keyof typeof typography;
  tone?: keyof Pick<Colors, "text" | "muted" | "accent" | "info" | "notice" | "onAccent">;
  // שפת התוכן: אנגלית מוצגת LTR גם בתוך ממשק עברי
  lang?: string;
};

// כל טקסט באפליקציה עובר כאן, כדי שהיישור והכיוון יהיו עקביים
export function AppText({ variant = "body", tone = "text", lang = "he", style, ...rest }: Props) {
  const colors = useColors();
  const rtl = isRtlLanguage(lang);
  return (
    <Text
      {...rest}
      style={[
        typography[variant],
        { color: colors[tone], textAlign: rtl ? "right" : "left", writingDirection: rtl ? "rtl" : "ltr" },
        style,
      ]}
    />
  );
}
