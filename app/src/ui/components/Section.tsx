import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { radius, spacing, useColors } from "../theme";
import { AppText } from "./AppText";

type Props = { title?: string; children: ReactNode };

// כרטיס עם כותרת אופציונלית: הבסיס לכל אזור במסכי הידיעה, המקור וההעדפות
export function Section({ title, children }: Props) {
  const colors = useColors();
  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {title ? (
        <AppText variant="heading" accessibilityRole="header">
          {title}
        </AppText>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
});
