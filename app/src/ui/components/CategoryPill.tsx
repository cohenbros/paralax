import { StyleSheet, View } from "react-native";
import { categoryColor, radius, spacing } from "../theme";
import { AppText } from "./AppText";

export function CategoryPill({ category }: { category: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: categoryColor(category) }]}>
      <AppText variant="tiny" style={styles.text}>
        {category}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { alignSelf: "flex-start", paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
  text: { color: "#FFFFFF" },
});
