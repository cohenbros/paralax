import { ScrollView, StyleSheet } from "react-native";
import { ALL, type CategoryFilter } from "@/domain/feed";
import type { Category } from "@/domain/types";
import { strings } from "../strings";
import { categoryColor, spacing } from "../theme";
import { Chip } from "./Chip";

type Props = { categories: Category[]; selected: CategoryFilter; onSelect: (c: CategoryFilter) => void };

export function CategoryBar({ categories, selected, onSelect }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll} contentContainerStyle={styles.bar}>
      <Chip label={strings.allCategories} selected={selected === ALL} onPress={() => onSelect(ALL)} />
      {categories.map((c) => (
        <Chip key={c} label={c} selected={selected === c} onPress={() => onSelect(c)} color={categoryColor(c)} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // בלי flexShrink: 0 הרשימה שמתחת "מועכת" את הפס (נראה בתצוגה בדפדפן)
  scroll: { flexGrow: 0, flexShrink: 0 },
  bar: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm },
});
