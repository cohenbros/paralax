import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { ALL, availableCategories, selectFeed, type CategoryFilter } from "@/domain/feed";
import { relativeTime } from "@/domain/time";
import type { Story } from "@/domain/types";
import { useNews, useSources } from "@/state/NewsProvider";
import { usePreferences } from "@/state/PreferencesProvider";
import { AppText } from "../components/AppText";
import { Button } from "../components/Button";
import { CategoryBar } from "../components/CategoryBar";
import { StoryCard } from "../components/StoryCard";
import { strings } from "../strings";
import { spacing, useColors } from "../theme";

export function FeedScreen() {
  const colors = useColors();
  const router = useRouter();
  const { snapshot, loading, refreshing, error, refresh } = useNews();
  const sources = useSources();
  const { prefs } = usePreferences();
  const [filter, setFilter] = useState<CategoryFilter>(ALL);

  const allStories = snapshot?.data.latest.stories;
  const categories = useMemo(() => (allStories ? availableCategories(allStories, prefs) : []), [allStories, prefs]);
  // קטגוריה שנבחרה ונעלמה מהנתונים (או מתחומי העניין) → חוזרים ל"הכל"
  const activeFilter = filter === ALL || categories.includes(filter) ? filter : ALL;
  const stories = useMemo(
    () => (allStories ? selectFeed(allStories, prefs, activeFilter) : []),
    [allStories, prefs, activeFilter],
  );

  const openStory = useCallback((id: string) => router.push({ pathname: "/story/[id]", params: { id } }), [router]);
  const renderItem = useCallback(
    ({ item, index }: { item: Story; index: number }) => (
      <StoryCard story={item} sources={sources} onPress={openStory} hero={index === 0 && activeFilter === ALL} />
    ),
    [sources, openStory, activeFilter],
  );

  if (loading && !snapshot) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
        <AppText tone="muted">{strings.feed.loading}</AppText>
      </View>
    );
  }

  if (!snapshot) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <AppText style={styles.centerText}>{strings.feed.loadFailed}</AppText>
        <Button label={strings.feed.retry} onPress={refresh} />
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <CategoryBar categories={categories} selected={activeFilter} onSelect={setFilter} />
      {error ? (
        <View style={[styles.banner, { backgroundColor: colors.noticeSoft }]}>
          <AppText variant="caption" tone="notice">
            {strings.feed.offline}
          </AppText>
        </View>
      ) : null}
      <FlatList
        data={stories}
        keyExtractor={(s) => s.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.accent]} />}
        initialNumToRender={8}
        windowSize={7}
        ListEmptyComponent={<AppText tone="muted">{strings.feed.empty}</AppText>}
        ListFooterComponent={
          <View style={styles.footer}>
            <AppText variant="heading" style={styles.centerText}>
              {strings.feed.endOfFeed}
            </AppText>
            <AppText variant="caption" tone="muted" style={styles.centerText}>
              {strings.feed.updatedAt(relativeTime(snapshot.data.latest.generated_at))} ·{" "}
              {strings.feed.endOfFeedHint}
            </AppText>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.lg, padding: spacing.xl },
  centerText: { textAlign: "center" },
  banner: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  list: { padding: spacing.lg, gap: spacing.md },
  footer: { paddingVertical: spacing.xl, gap: spacing.xs },
});
