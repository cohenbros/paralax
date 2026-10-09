import { Pressable, StyleSheet } from "react-native";
import { radius, spacing, useColors } from "../theme";
import { AppText } from "./AppText";

type Props = { label: string; selected: boolean; onPress: () => void };

export function Chip({ label, selected, onPress }: Props) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        { borderColor: selected ? colors.accent : colors.border, backgroundColor: selected ? colors.accent : colors.surface },
      ]}
    >
      <AppText variant="label" tone={selected ? "onAccent" : "text"}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
