import { Pressable, StyleSheet } from "react-native";
import { radius, spacing, useColors } from "../theme";
import { AppText } from "./AppText";

type Props = { label: string; onPress: () => void; variant?: "primary" | "secondary"; disabled?: boolean };

export function Button({ label, onPress, variant = "primary", disabled = false }: Props) {
  const colors = useColors();
  const primary = variant === "primary";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={[
        styles.button,
        {
          backgroundColor: primary ? colors.accent : "transparent",
          borderColor: colors.accent,
          opacity: disabled ? 0.4 : 1,
        },
      ]}
    >
      <AppText variant="label" tone={primary ? "onAccent" : "accent"} style={styles.text}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  text: { textAlign: "center" },
});
