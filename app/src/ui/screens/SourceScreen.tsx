import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useSources } from "@/state/NewsProvider";
import { AppText } from "../components/AppText";
import { LinkRow } from "../components/LinkRow";
import { Screen } from "../components/Screen";
import { Section } from "../components/Section";
import { openLink } from "../openLink";
import { strings } from "../strings";
import { spacing } from "../theme";

const s = strings.source;

function yesNo(v: boolean | null): string {
  return v === null ? s.unknown : v ? s.yes : s.no;
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      <AppText tone={value ? "text" : "muted"}>{value ?? s.unknown}</AppText>
    </View>
  );
}

// כרטיס המקור: עובדות בלבד, כל אחת עם קישור לראיה (CLAUDE.md)
export function SourceScreen({ id }: { id: string }) {
  const source = useSources()[id];
  if (!source) {
    return (
      <Screen>
        <AppText>{s.notFound}</AppText>
      </Screen>
    );
  }
  const lean = source.audience_lean;
  return (
    <Screen>
      <Stack.Screen options={{ title: source.name }} />
      <Section>
        <AppText variant="title">{source.name}</AppText>
        <LinkRow label={s.site} onPress={() => openLink(source.site)} />
        <Field label={s.owner} value={source.owner} />
        <Field label={s.funding} value={source.funding} />
        <Field label={s.pressCouncil} value={yesNo(source.press_council_member)} />
        <Field label={s.ifcn} value={yesNo(source.ifcn_signatory)} />
        <View style={styles.field}>
          <AppText variant="label">{s.corrections}</AppText>
          {source.corrections_policy_url ? (
            <LinkRow label={s.corrections} onPress={() => openLink(source.corrections_policy_url!)} />
          ) : (
            <AppText tone="muted">{s.unknown}</AppText>
          )}
        </View>
        <View style={styles.field}>
          <AppText variant="label">{s.audienceLean}</AppText>
          <AppText tone={lean.range ? "text" : "muted"}>{lean.range ?? s.unknown}</AppText>
          {lean.evidence_url ? <LinkRow label={s.evidence} onPress={() => openLink(lean.evidence_url!)} /> : null}
        </View>
      </Section>

      {source.evidence_urls.length ? (
        <Section title={s.evidence}>
          {source.evidence_urls.map((url) => (
            <LinkRow key={url} label={url} onPress={() => openLink(url)} />
          ))}
        </Section>
      ) : null}

      <AppText variant="caption" tone="muted">
        {s.note}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: { gap: 2, paddingVertical: spacing.xs },
});
