import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { FEATURES } from "@/config";
import { itemText } from "@/domain/display";
import { leanBucket, sortByLean } from "@/domain/lean";
import { relativeTime } from "@/domain/time";
import type { Item, SourceProfile } from "@/domain/types";
import { AiMark } from "../components/AiMark";
import { AppText } from "../components/AppText";
import { Icon } from "../components/Icon";
import { Section } from "../components/Section";
import { SignalTag } from "../components/SignalTag";
import { openLink } from "../openLink";
import { flagView } from "../signalText";
import { strings } from "../strings";
import { LEAN_COLORS, spacing, useColors } from "../theme";

function ArticleRow({ item, source }: { item: Item; source: SourceProfile | undefined }) {
  const router = useRouter();
  const colors = useColors();
  const text = itemText(item, source);
  return (
    <View style={[styles.article, { borderTopColor: colors.border }]}>
      <View style={styles.row}>
        {FEATURES.politicalLean ? <View style={[styles.dot, { backgroundColor: LEAN_COLORS[leanBucket(source)] }]} /> : null}
        <Pressable
          onPress={() => source && router.push({ pathname: "/source/[id]", params: { id: source.id } })}
          accessibilityRole="link"
          accessibilityHint={strings.story.sourceProfile}
          disabled={!source}
          hitSlop={6}
        >
          <AppText variant="label" tone="accent">
            {source?.name ?? item.source}
          </AppText>
        </Pressable>
        <AppText variant="caption" tone="muted">
          {relativeTime(item.published)}
        </AppText>
      </View>

      <AppText lang={text.lang}>{text.title}</AppText>
      {text.originalTitle ? (
        <AppText variant="caption" tone="muted" lang={source?.language}>
          {text.originalTitle}
        </AppText>
      ) : null}

      <View style={styles.tags}>
        {text.ai ? <AiMark /> : null}
        {item.sponsored ? <SignalTag view={{ icon: "pricetag-outline", short: "ממומן", label: "תוכן ממומן", explanation: "", tone: "notice" }} /> : null}
        {item.flags.map((f) => (
          <SignalTag key={f} view={flagView(f)} />
        ))}
      </View>

      <Pressable onPress={() => openLink(item.url)} accessibilityRole="link" style={styles.row} hitSlop={6}>
        <Icon name="open-outline" size={16} color={colors.accent} />
        <AppText variant="label" tone="accent">
          {strings.story.readFull}
        </AppText>
      </Pressable>
    </View>
  );
}

// "איך כתבו על זה": כל הכתבות על האירוע, העדכנית ראשונה (או לפי נטיית הקהל, כשהתכונה פעילה)
export function ArticlesSection({ items, sources }: { items: Item[]; sources: Record<string, SourceProfile> }) {
  const sorted = FEATURES.politicalLean ? sortByLean(items, (i) => sources[i.source]) : items;
  return (
    <Section title={strings.story.howTheyWrote}>
      <AppText variant="caption" tone="muted">
        {FEATURES.politicalLean ? strings.story.howTheyWroteLeanHint : strings.story.howTheyWroteHint}
      </AppText>
      {sorted.map((item) => (
        <ArticleRow key={item.id} item={item} source={sources[item.source]} />
      ))}
    </Section>
  );
}

const styles = StyleSheet.create({
  article: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.md, gap: spacing.xs },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
