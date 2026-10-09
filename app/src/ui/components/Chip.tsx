import { Pressable, StyleSheet } from "react-native";
import { radius, spacing, useColors } from "../theme";
import { AppText } from "./AppText";

type Props = { label: string; selected: boolean; onPress: () => void; color?: string };

export function Chip({ label, selected, onPress, color }: Props) {
  const colors = useColors();
  const active = color ?? colors.accent;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        { borderColor: selected ? active : colors.border, backgroundColor: selected ? active : colors.surface },
      ]}
    >
      <AppText variant="label" tone="text" style={selected ? { color: color ? "#FFFFFF" : colors.onAccent } : undefined}>
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
