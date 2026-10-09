import { StyleSheet, View } from "react-native";
import type { SignalView } from "../signalText";
import { radius, spacing, useColors } from "../theme";
import { AppText } from "./AppText";
import { Icon } from "./Icon";

// תגית קטנה: אייקון + מילה או שתיים. משמשת בכרטיס בפיד.
export function SignalTag({ view }: { view: SignalView }) {
  const colors = useColors();
  const fg = view.tone === "info" ? colors.info : view.tone === "notice" ? colors.notice : colors.muted;
  const bg = view.tone === "info" ? colors.infoSoft : view.tone === "notice" ? colors.noticeSoft : colors.background;
  return (
    <View style={[styles.tag, { backgroundColor: bg }]} accessible accessibilityLabel={view.label}>
      <Icon name={view.icon} size={13} color={fg} />
      <AppText variant="tiny" style={{ color: fg }}>
        {view.short}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
});
