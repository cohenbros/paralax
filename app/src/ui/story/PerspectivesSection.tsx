import { Pressable, StyleSheet, View } from "react-native";
import { leanBucket, sortByLean } from "@/domain/lean";
import type { Item, Quote, SourceProfile } from "@/domain/types";
import { AiMark } from "../components/AiMark";
import { AppText } from "../components/AppText";
import { Section } from "../components/Section";
import { openLink } from "../openLink";
import { strings } from "../strings";
import { LEAN_COLORS, radius, spacing, useColors } from "../theme";

type Props = { quotes: Quote[]; items: Item[]; sources: Record<string, SourceProfile> };

// "נקודות מבט": ציטוטים של דמויות ציבוריות מתוך הכותרות, ממוינים לפי נטיית המקור שפרסם אותם.
// אין תגובות גולשים באפליקציה (CLAUDE.md); תגובות הגולשים נמצאות בכתבה עצמה באתר המקור.
export function PerspectivesSection({ quotes, items, sources }: Props) {
  const colors = useColors();
  const byId = new Map(items.map((i) => [i.id, i]));
  const sourceOf = (q: Quote) => sources[byId.get(q.item)?.source ?? ""];
  const sorted = sortByLean(quotes, sourceOf);
  const sides = new Set(sorted.map((q) => leanBucket(sourceOf(q))).filter((b) => b !== "unknown"));

  return (
    <Section title={strings.story.perspectives}>
      {sorted.length === 0 ? (
        <AppText tone="muted">{strings.story.noPerspectives}</AppText>
      ) : (
        sorted.map((q) => {
          const item = byId.get(q.item);
          const source = sourceOf(q);
          return (
            <Pressable
              key={q.item + q.speaker}
              onPress={() => item && openLink(item.url)}
              accessibilityRole="link"
              style={[styles.quote, { backgroundColor: colors.background, borderRightColor: LEAN_COLORS[leanBucket(source)] }]}
            >
              <AppText variant="body" style={styles.quoteText}>
                ”{q.text}“
              </AppText>
              <View style={styles.row}>
                <AppText variant="label">{q.speaker}</AppText>
                <AppText variant="caption" tone="muted">
                  {strings.story.via(source?.name ?? "")}
                </AppText>
                {q.ai ? <AiMark /> : null}
              </View>
            </Pressable>
          );
        })
      )}
      {sorted.length > 0 && sides.size < 2 ? (
        <AppText variant="caption" tone="muted">
          {strings.story.oneSidedPerspectives}
        </AppText>
      ) : null}
      <View style={[styles.question, { backgroundColor: colors.accentSoft }]}>
        <AppText variant="label" tone="accent">
          {strings.story.reflection}
        </AppText>
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  quote: { padding: spacing.md, borderRadius: radius.sm, borderRightWidth: 4, gap: spacing.xs },
  quoteText: { fontStyle: "italic" },
  row: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing.sm },
  question: { padding: spacing.md, borderRadius: radius.sm },
});
