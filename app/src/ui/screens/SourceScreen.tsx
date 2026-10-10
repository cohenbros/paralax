import { Stack } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { FEATURES } from "@/config";
import { leanBucket } from "@/domain/lean";
import { useSources } from "@/state/NewsProvider";
import { AppText } from "../components/AppText";
import { LinkRow } from "../components/LinkRow";
import { Screen } from "../components/Screen";
import { Section } from "../components/Section";
import { openLink } from "../openLink";
import { leanLabel } from "../signalText";
import { strings } from "../strings";
import { LEAN_COLORS, spacing } from "../theme";

const s = strings.source;

const yesNo = (v: boolean | null): string | null => (v === null ? null : v ? s.yes : s.no);

// שדה בפרופיל: הערך, ולידו "מקור" שפותח את הראיה
function Field({ label, value, evidence }: { label: string; value: string | null; evidence?: string }) {
  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      <View style={styles.row}>
        <AppText tone={value ? "text" : "muted"} style={styles.flex}>
          {value ?? s.unknown}
        </AppText>
        {evidence && value !== null ? <EvidenceLink url={evidence} /> : null}
      </View>
    </View>
  );
}

function EvidenceLink({ url }: { url: string }) {
  return (
    <Pressable onPress={() => openLink(url)} accessibilityRole="link" accessibilityLabel={s.evidenceLink} hitSlop={8}>
      <AppText variant="caption" tone="accent">
        {s.evidenceLink}
      </AppText>
    </Pressable>
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
        <Field label={s.owner} value={source.owner} evidence={source.evidence.owner} />
        <Field label={s.funding} value={source.funding} evidence={source.evidence.funding} />
        <Field
          label={s.pressCouncil}
          value={yesNo(source.press_council_member)}
          evidence={source.evidence.press_council_member}
        />
        <Field
          label={s.ifcn}
          value={yesNo(source.ifcn_signatory)}
          evidence={source.evidence.ifcn_signatory}
        />
        <View style={styles.field}>
          <AppText variant="label">{s.corrections}</AppText>
          {source.corrections_policy_url ? (
            <LinkRow label={s.corrections} onPress={() => openLink(source.corrections_policy_url!)} />
          ) : (
            <AppText tone="muted">{s.unknown}</AppText>
          )}
        </View>
        {FEATURES.politicalLean ? (
        <View style={styles.field}>
          <AppText variant="label">{s.audienceLean}</AppText>
          <View style={styles.row}>
            <View style={[styles.dot, { backgroundColor: LEAN_COLORS[leanBucket(source)] }]} />
            <AppText tone={lean.range ? "text" : "muted"} style={styles.flex}>
              {lean.range ? leanLabel(lean.range) : s.unknown}
            </AppText>
            {lean.range && lean.evidence_url ? <EvidenceLink url={lean.evidence_url} /> : null}
          </View>
          <AppText variant="caption" tone="muted">
            {s.leanNote}
          </AppText>
        </View>
        ) : null}
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
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  flex: { flex: 1 },
  dot: { width: 12, height: 12, borderRadius: 6 },
});
