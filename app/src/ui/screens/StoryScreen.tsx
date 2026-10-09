import { Stack } from "expo-router";
import { useMemo } from "react";
import { storySignals } from "@/domain/signals";
import { useSources, useStory } from "@/state/NewsProvider";
import { AppText } from "../components/AppText";
import { Screen } from "../components/Screen";
import { ArticlesSection } from "../story/ArticlesSection";
import { AskGeminiSection } from "../story/AskGeminiSection";
import { PerspectivesSection } from "../story/PerspectivesSection";
import { SignalsSection } from "../story/SignalsSection";
import { StoryHeader } from "../story/StoryHeader";
import { strings } from "../strings";

export function StoryScreen({ id }: { id: string }) {
  const story = useStory(id);
  const sources = useSources();
  const signals = useMemo(() => (story ? storySignals(story, sources) : []), [story, sources]);

  if (!story) {
    return (
      <Screen>
        <AppText>{strings.story.notFound}</AppText>
      </Screen>
    );
  }

  const lead = story.items.find((i) => i.id === story.id) ?? story.items[0]!;
  return (
    <Screen>
      <Stack.Screen options={{ title: story.category }} />
      <StoryHeader story={story} />
      <SignalsSection signals={signals} />
      <ArticlesSection items={story.items} sources={sources} />
      <PerspectivesSection quotes={story.quotes} items={story.items} sources={sources} />
      <AskGeminiSection title={story.title} url={lead.url} />
      <AppText variant="caption" tone="muted">
        {strings.story.copyrightNote}
      </AppText>
    </Screen>
  );
}
