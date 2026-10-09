import type { ReactNode } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { spacing, useColors } from "../theme";

// מסך עם גלילה ורקע אחיד. הפיד משתמש ב-FlatList משלו ולא ברכיב הזה.
export function Screen({ children }: { children: ReactNode }) {
  const colors = useColors();
  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg },
});
