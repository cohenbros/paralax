import { Pressable, StyleSheet, View } from "react-native";
import { FEATURES } from "@/config";
import { leanBucket, sortByLean } from "@/domain/lean";
import type { Insights, Item, Quote, SourceProfile } from "@/domain/types";
import { AiMark } from "../components/AiMark";
import { AppText } from "../components/AppText";
import { Icon } from "../components/Icon";
import { Section } from "../components/Section";
import { openLink, reportError } from "../openLink";
import { strings } from "../strings";
import { LEAN_COLORS, radius, spacing, useColors } from "../theme";

type Props = {
  storyId: string;
  viewpoints: Insights["viewpoints"];
  quotes: Quote[];
  items: Item[];
  sources: Record<string, SourceProfile>;
};

// עמדות שעולות בדיון הציבורי (AI), כל אחת עם "מה כדאי לבדוק". לא ציטוטים של אנשים אמיתיים.
function Viewpoints({ storyId, viewpoints }: { storyId: string; viewpoints: Insights["viewpoints"] }) {
  const colors = useColors();
  return (
    <View style={styles.block}>
      <View style={styles.row}>
        <AppText variant="label" style={styles.flex}>
          {strings.story.viewpointsTitle}
        </AppText>
        <AiMark label={strings.story.aiGenerated} />
      </View>
      <AppText variant="caption" tone="muted">
        {strings.story.viewpointsHint}
      </AppText>
      {viewpoints.map((v) => (
        <View key={v.stance} style={[styles.card, { backgroundColor: colors.background }]}>
          <AppText>”{v.stance}“</AppText>
          <View style={styles.row}>
            <Icon name="search-outline" size={15} color={colors.accent} />
            <AppText variant="caption" tone="accent" style={styles.flex}>
              {strings.story.checkPrefix} {v.check}
            </AppText>
          </View>
        </View>
      ))}
      <Pressable
        accessibilityRole="link"
        hitSlop={8}
        onPress={() => reportError("עמדות בדיון", `עמדות שנוצרו ע"י AI בידיעה ${storyId}\n\nמה שגוי:`)}
      >
        <AppText variant="caption" tone="muted">
          {strings.story.reportError}
        </AppText>
      </Pressable>
    </View>
  );
}

// ציטוטים של דמויות ציבוריות מתוך הכותרות, כל אחד עם קישור לכתבה שבה פורסם
function HeadlineQuotes({ quotes, items, sources }: Omit<Props, "storyId" | "viewpoints">) {
  const colors = useColors();
  const byId = new Map(items.map((i) => [i.id, i]));
  const sourceOf = (q: Quote) => sources[byId.get(q.item)?.source ?? ""];
  const sorted = FEATURES.politicalLean ? sortByLean(quotes, sourceOf) : quotes;
  return (
    <View style={styles.block}>
      <AppText variant="label">{strings.story.quotesTitle}</AppText>
      {sorted.map((q) => {
        const item = byId.get(q.item);
        const source = sourceOf(q);
        const edge = FEATURES.politicalLean ? LEAN_COLORS[leanBucket(source)] : colors.border;
        return (
          <Pressable
            key={q.item + q.speaker}
            onPress={() => item && openLink(item.url)}
            accessibilityRole="link"
            style={[styles.card, { backgroundColor: colors.background, borderRightWidth: 4, borderRightColor: edge }]}
          >
            <AppText style={styles.quoteText}>”{q.text}“</AppText>
            <View style={styles.row}>
              <AppText variant="label">{q.speaker}</AppText>
              <AppText variant="caption" tone="muted">
                {strings.story.via(source?.name ?? "")}
              </AppText>
              {q.ai ? <AiMark /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export function PerspectivesSection({ storyId, viewpoints, quotes, items, sources }: Props) {
  const colors = useColors();
  if (!viewpoints.length && !quotes.length) return null;
  return (
    <Section title={strings.story.perspectives}>
      {viewpoints.length ? <Viewpoints storyId={storyId} viewpoints={viewpoints} /> : null}
      {quotes.length ? <HeadlineQuotes quotes={quotes} items={items} sources={sources} /> : null}
      <View style={[styles.question, { backgroundColor: colors.accentSoft }]}>
        <AppText variant="label" tone="accent">
          {strings.story.reflection}
        </AppText>
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.sm },
  card: { padding: spacing.md, borderRadius: radius.sm, gap: spacing.xs },
  quoteText: { fontStyle: "italic" },
  row: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing.sm },
  flex: { flex: 1 },
  question: { padding: spacing.md, borderRadius: radius.sm },
});
