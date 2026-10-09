import { StyleSheet, View } from "react-native";
import { radius, useColors } from "../theme";
import { AppText } from "./AppText";
import { Icon } from "./Icon";

// סימון חובה לכל טקסט שתורגם ע"י AI (מדיניות Google Play, CLAUDE.md)
export function AiMark({ label = "תורגם ע\"י AI" }: { label?: string }) {
  const colors = useColors();
  return (
    <View style={[styles.mark, { borderColor: colors.border }]} accessible accessibilityLabel={label}>
      <Icon name="sparkles-outline" size={11} color={colors.muted} />
      <AppText variant="tiny" tone="muted">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
