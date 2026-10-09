import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import type { Coverage } from "@/domain/lean";
import type { Signal } from "@/domain/signals";
import { AppText } from "../components/AppText";
import { Icon } from "../components/Icon";
import { Section } from "../components/Section";
import { SpectrumBar } from "../components/SpectrumBar";
import { signalView, type SignalView } from "../signalText";
import { strings } from "../strings";
import { LEAN_COLORS, spacing, useColors } from "../theme";

function SignalRow({ view }: { view: SignalView }) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const color = view.tone === "info" ? colors.info : view.tone === "notice" ? colors.notice : colors.muted;
  return (
    <Pressable
      onPress={() => setOpen((o) => !o)}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      accessibilityHint="מציג הסבר"
      style={styles.signal}
    >
      <View style={styles.row}>
        <Icon name={view.icon} size={20} color={color} />
        <AppText variant="label" style={styles.flex}>
          {view.label}
        </AppText>
        <Icon name={open ? "chevron-up" : "information-circle-outline"} size={18} color={colors.muted} />
      </View>
      {open ? (
        <AppText variant="caption" tone="muted">
          {view.explanation}
        </AppText>
      ) : null}
    </Pressable>
  );
}

function Legend({ coverage }: { coverage: Coverage }) {
  const items = [
    { key: "right", label: strings.lean.right, n: coverage.right },
    { key: "center", label: strings.lean.center, n: coverage.center },
    { key: "left", label: strings.lean.left, n: coverage.left },
    { key: "unknown", label: strings.lean.unknown, n: coverage.unknown },
  ] as const;
  return (
    <View style={styles.legend}>
      {items
        .filter((i) => i.n > 0)
        .map((i) => (
          <View key={i.key} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: LEAN_COLORS[i.key] }]} />
            <AppText variant="caption" tone="muted">
              {i.label} {i.n}
            </AppText>
          </View>
        ))}
    </View>
  );
}

// סימני האמינות של האירוע, כל אחד עם הסבר בלחיצה, ופס הקשת המלא
export function SignalsSection({ signals }: { signals: Signal[] }) {
  const spectrum = signals.find((s) => s.kind === "spectrum");
  return (
    <Section title={strings.story.signals}>
      {spectrum?.kind === "spectrum" ? (
        <View style={styles.spectrum}>
          <SpectrumBar coverage={spectrum.coverage} height={12} />
          <Legend coverage={spectrum.coverage} />
        </View>
      ) : (
        <AppText variant="caption" tone="muted">
          {strings.story.leanPending}
        </AppText>
      )}
      {signals.map((s) => (
        <SignalRow key={s.kind} view={signalView(s)} />
      ))}
    </Section>
  );
}

const styles = StyleSheet.create({
  signal: { gap: spacing.xs },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  flex: { flex: 1 },
  spectrum: { gap: spacing.sm },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
