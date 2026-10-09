import { Stack, useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { isSponsoredStory, verificationLabel } from "@/domain/feed";
import { relativeTime } from "@/domain/time";
import type { Item, SourceProfile } from "@/domain/types";
import { useSources, useStory } from "@/state/NewsProvider";
import { AppText } from "../components/AppText";
import { Badge } from "../components/Badge";
import { ExplainedBadge } from "../components/ExplainedBadge";
import { LinkRow } from "../components/LinkRow";
import { Screen } from "../components/Screen";
import { Section } from "../components/Section";
import { openLink } from "../openLink";
import { strings } from "../strings";
import { spacing, useColors } from "../theme";

export function StoryScreen({ id }: { id: string }) {
  const story = useStory(id);
  const sources = useSources();

  if (!story) {
    return (
      <Screen>
        <AppText>{strings.story.notFound}</AppText>
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: story.category }} />
      <View style={styles.header}>
        <AppText variant="caption" tone="muted">
          {story.category} · {relativeTime(story.updated)}
        </AppText>
        <AppText variant="title" lang={story.lang}>
          {story.title}
        </AppText>
        {story.summary ? <AppText lang={story.lang}>{story.summary}</AppText> : null}
      </View>

      <Section title={strings.story.signals}>
        <ExplainedBadge
          label={verificationLabel(story)}
          explanation={strings.story.verificationHelp}
          tone={story.independent_sources > 1 ? "info" : "neutral"}
        />
        {isSponsoredStory(story) ? (
          <ExplainedBadge label={strings.story.sponsored} explanation={strings.story.sponsoredHelp} tone="notice" />
        ) : null}
      </Section>

      <Section title={strings.story.howTheyWrote}>
        {story.items.map((item) => (
          <ArticleRow key={item.id} item={item} lang={story.lang} source={sources[item.source]} />
        ))}
      </Section>

      <AppText variant="caption" tone="muted">
        {strings.story.copyrightNote}
      </AppText>
    </Screen>
  );
}

function ArticleRow({ item, lang, source }: { item: Item; lang: string; source: SourceProfile | undefined }) {
  const router = useRouter();
  const colors = useColors();
  return (
    <View style={[styles.article, { borderTopColor: colors.border }]}>
      <Pressable
        onPress={() => source && router.push({ pathname: "/source/[id]", params: { id: source.id } })}
        accessibilityRole="link"
        accessibilityHint={strings.story.sourceProfile}
        disabled={!source}
      >
        <AppText variant="label" tone="accent">
          {source?.name ?? item.source}
        </AppText>
      </Pressable>
      <AppText lang={lang}>{item.title}</AppText>
      <View style={styles.meta}>
        <AppText variant="caption" tone="muted">
          {relativeTime(item.published)}
        </AppText>
        {item.sponsored ? <Badge label={strings.story.sponsored} tone="notice" /> : null}
      </View>
      <LinkRow label={strings.story.readFull} onPress={() => openLink(item.url)} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm },
  article: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.md, gap: spacing.xs },
  meta: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
});
