import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { CONTACT_URL } from "@/config";
import type { TranslationMode } from "@/domain/preferences";
import { usePreferences } from "@/state/PreferencesProvider";
import { AppText } from "../components/AppText";
import { Chip } from "../components/Chip";
import { LinkRow } from "../components/LinkRow";
import { InterestsPicker, NotificationToggles, RegionPicker } from "../components/PreferencePickers";
import { Screen } from "../components/Screen";
import { Section } from "../components/Section";
import { openLink } from "../openLink";
import { strings } from "../strings";
import { spacing } from "../theme";

const s = strings.settings;
const TRANSLATION: { mode: TranslationMode; label: string }[] = [
  { mode: "original", label: s.translationOriginal },
  { mode: "auto", label: s.translationAuto },
];

export function SettingsScreen() {
  const router = useRouter();
  const { prefs, update } = usePreferences();

  return (
    <Screen>
      <Section title={s.interests}>
        <InterestsPicker value={prefs.interests} onChange={(interests) => update({ interests })} />
      </Section>

      <Section title={s.regions}>
        <RegionPicker value={prefs.regions} onChange={(regions) => update({ regions })} />
      </Section>

      <Section title={s.translation}>
        <View style={styles.row}>
          {TRANSLATION.map(({ mode, label }) => (
            <Chip key={mode} label={label} selected={prefs.translation === mode} onPress={() => update({ translation: mode })} />
          ))}
        </View>
        <AppText variant="caption" tone="muted">
          {s.translationSoon}
        </AppText>
      </Section>

      <Section title={s.notifications}>
        <NotificationToggles value={prefs.notifications} onChange={(notifications) => update({ notifications })} />
        <AppText variant="caption" tone="muted">
          {s.notificationsSoon}
        </AppText>
      </Section>

      <Section title={s.about}>
        <LinkRow label={s.methodology} onPress={() => router.push("/settings/methodology")} />
        <LinkRow label={s.privacy} onPress={() => router.push("/settings/privacy")} />
        <LinkRow label={s.contact} onPress={() => openLink(CONTACT_URL)} />
        <AppText variant="caption" tone="muted">
          {s.version(Constants.expoConfig?.version ?? "")}
        </AppText>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
});
