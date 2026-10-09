import { Pressable, StyleSheet, View } from "react-native";
import { relativeTime } from "@/domain/time";
import type { Story } from "@/domain/types";
import { AiMark } from "../components/AiMark";
import { AppText } from "../components/AppText";
import { CategoryPill } from "../components/CategoryPill";
import { reportError } from "../openLink";
import { strings } from "../strings";
import { spacing } from "../theme";

export function StoryHeader({ story }: { story: Story }) {
  return (
    <View style={styles.header}>
      <View style={styles.row}>
        <CategoryPill category={story.category} />
        <AppText variant="caption" tone="muted">
          {relativeTime(story.updated)}
        </AppText>
      </View>
      <AppText variant="title" lang={story.lang}>
        {story.title}
      </AppText>
      {story.summary ? (
        <AppText tone="muted" lang={story.lang}>
          {story.summary}
        </AppText>
      ) : null}
      {story.title_ai ? (
        <View style={styles.row}>
          <AiMark />
          <Pressable
            accessibilityRole="link"
            hitSlop={8}
            onPress={() => reportError(story.title, `תרגום AI בידיעה ${story.id}:\n${story.title}\n\nמה שגוי:`)}
          >
            <AppText variant="caption" tone="accent">
              {strings.story.reportError}
            </AppText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
});
