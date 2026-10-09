import { StyleSheet, View } from "react-native";
import type { Coverage, LeanBucket } from "@/domain/lean";
import { LEAN_COLORS, radius } from "../theme";

type Props = { coverage: Coverage; height?: number };

// פס הקשת: מימין לשמאל כמו הממשק – ימין, מרכז, שמאל, ולא ידוע בסוף
const ORDER: LeanBucket[] = ["right", "center", "left", "unknown"];

export function SpectrumBar({ coverage, height = 6 }: Props) {
  const parts = ORDER.filter((b) => coverage[b] > 0);
  const label = `קשת: ${coverage.right} מימין, ${coverage.center} מהמרכז, ${coverage.left} משמאל, ${coverage.unknown} לא נבדקו`;
  return (
    <View
      style={[styles.bar, { height, borderRadius: radius.pill }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
    >
      {parts.map((b) => (
        <View key={b} style={{ flex: coverage[b], backgroundColor: LEAN_COLORS[b] }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", overflow: "hidden", gap: 2 },
});
