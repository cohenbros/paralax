import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { isSponsoredStory, verificationLabel } from "@/domain/feed";
import { relativeTime } from "@/domain/time";
import type { SourceProfile, Story } from "@/domain/types";
import { strings } from "../strings";
import { radius, spacing, useColors } from "../theme";
import { AppText } from "./AppText";
import { Badge } from "./Badge";

type Props = { story: Story; sources: Record<string, SourceProfile>; onPress: (id: string) => void };

const MAX_SOURCE_NAMES = 3;

function sourceNames(story: Story, sources: Record<string, SourceProfile>): string {
  const names = [...new Set(story.items.map((i) => sources[i.source]?.name ?? i.source))];
  const shown = names.slice(0, MAX_SOURCE_NAMES).join(" · ");
  return names.length > MAX_SOURCE_NAMES ? `${shown} +${names.length - MAX_SOURCE_NAMES}` : shown;
}

// כרטיס לכל אירוע (לא לכל כתבה), עם סימני האמינות
export const StoryCard = memo(function StoryCard({ story, sources, onPress }: Props) {
  const colors = useColors();
  const multi = story.independent_sources > 1;
  return (
    <Pressable
      onPress={() => onPress(story.id)}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <AppText variant="caption" tone="muted">
        {story.category} · {relativeTime(story.updated)} · {strings.feed.articlesCount(story.items.length)}
      </AppText>
      <AppText variant="heading" lang={story.lang}>
        {story.title}
      </AppText>
      {story.summary ? (
        <AppText tone="muted" lang={story.lang} numberOfLines={3}>
          {story.summary}
        </AppText>
      ) : null}
      <AppText variant="caption" tone="muted">
        {sourceNames(story, sources)}
      </AppText>
      <View style={styles.badges}>
        <Badge label={verificationLabel(story)} tone={multi ? "info" : "neutral"} />
        {isSponsoredStory(story) ? <Badge label={strings.story.sponsored} tone="notice" /> : null}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
});
