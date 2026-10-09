import { StyleSheet, View } from "react-native";
import { radius, spacing, useColors } from "../theme";
import { AppText } from "./AppText";

type Props = { label: string; tone: "info" | "notice" | "neutral" };

export function Badge({ label, tone }: Props) {
  const colors = useColors();
  const bg = tone === "info" ? colors.infoSoft : tone === "notice" ? colors.noticeSoft : colors.background;
  const fg = tone === "neutral" ? "muted" : tone;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <AppText variant="caption" tone={fg}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
});
