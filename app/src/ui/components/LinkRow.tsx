import { Pressable, StyleSheet } from "react-native";
import { spacing } from "../theme";
import { AppText } from "./AppText";

type Props = { label: string; onPress: () => void; hint?: string };

export function LinkRow({ label, onPress, hint }: Props) {
  return (
    <Pressable onPress={onPress} accessibilityRole="link" accessibilityHint={hint} style={styles.row}>
      <AppText tone="accent">{label} ‹</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: spacing.sm },
});
