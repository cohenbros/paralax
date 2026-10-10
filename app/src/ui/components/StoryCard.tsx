import { memo, useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { FEATURES } from "@/config";
import { storySignals } from "@/domain/signals";
import { relativeTime } from "@/domain/time";
import type { SourceProfile, Story } from "@/domain/types";
import { signalView } from "../signalText";
import { categoryColor, radius, spacing, useColors } from "../theme";
import { AiMark } from "./AiMark";
import { AppText } from "./AppText";
import { CategoryPill } from "./CategoryPill";
import { SignalTag } from "./SignalTag";
import { SpectrumBar } from "./SpectrumBar";

type Props = {
  story: Story;
  sources: Record<string, SourceProfile>;
  onPress: (id: string) => void;
  hero?: boolean; // הכרטיס הראשון בפיד: גדול יותר, עם תקציר קצר
};

const MAX_CARD_TAGS = 3;

// כרטיס לכל אירוע (לא לכל כתבה): כותרת, פס קשת וסימנים קטנים. בלי תקציר, כדי שיהיה קל לסרוק.
export const StoryCard = memo(function StoryCard({ story, sources, onPress, hero = false }: Props) {
  const colors = useColors();
  const signals = useMemo(() => storySignals(story, sources, FEATURES), [story, sources]);
  // בכרטיס רק הסימנים החשובים ביותר (הרשימה כבר ממוינת לפי חשיבות) ומספר המקורות; כל השאר במסך הידיעה
  const tags = [
    ...signals.filter((s) => s.kind !== "spectrum" && s.kind !== "sources").slice(0, MAX_CARD_TAGS - 1),
    ...signals.filter((s) => s.kind === "sources"),
  ];
  const spectrum = signals.find((s) => s.kind === "spectrum");

  return (
    <Pressable
      onPress={() => onPress(story.id)}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.card,
        hero && { borderTopWidth: 5, borderTopColor: categoryColor(story.category) },
        { backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={styles.row}>
        <CategoryPill category={story.category} />
        <AppText variant="caption" tone="muted">
          {relativeTime(story.updated)}
        </AppText>
        {story.title_ai ? <AiMark /> : null}
      </View>

      <AppText variant={hero ? "hero" : "heading"} lang={story.lang}>
        {story.title}
      </AppText>
      {hero && story.summary ? (
        <AppText tone="muted" lang={story.lang} numberOfLines={2}>
          {story.summary}
        </AppText>
      ) : null}

      {spectrum?.kind === "spectrum" ? <SpectrumBar coverage={spectrum.coverage} /> : null}

      <View style={styles.tags}>
        {tags.map((s) => (
          <SignalTag key={s.kind} view={signalView(s)} />
        ))}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderRadius: radius.md,
    gap: spacing.sm,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
});
