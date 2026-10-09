import { useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { spacing } from "../theme";
import { AppText } from "./AppText";
import { Badge } from "./Badge";

type Props = { label: string; explanation: string; tone: "info" | "notice" | "neutral" };

// סימן אמינות עם הסבר שנפתח בלחיצה
export function ExplainedBadge({ label, explanation, tone }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable
      onPress={() => setOpen((o) => !o)}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      accessibilityHint="מציג הסבר"
      style={styles.wrap}
    >
      <Badge label={`${label} ⓘ`} tone={tone} />
      {open ? (
        <AppText variant="caption" tone="muted">
          {explanation}
        </AppText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
});
