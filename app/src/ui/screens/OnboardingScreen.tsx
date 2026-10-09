import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { usePreferences } from "@/state/PreferencesProvider";
import { AppText } from "../components/AppText";
import { Button } from "../components/Button";
import { InterestsPicker, NotificationToggles, RegionPicker } from "../components/PreferencePickers";
import { Screen } from "../components/Screen";
import { Section } from "../components/Section";
import { strings } from "../strings";
import { spacing } from "../theme";

const o = strings.onboarding;
const STEPS = 3;

// היכרות חד-פעמית: תחומי עניין → מקורות → התראות
export function OnboardingScreen() {
  const router = useRouter();
  const { prefs, update } = usePreferences();
  const [step, setStep] = useState(0);

  const finish = () => {
    update({ onboarded: true });
    router.replace("/");
  };

  return (
    <Screen>
      <View style={styles.intro}>
        <AppText variant="title">{o.welcome}</AppText>
        <AppText tone="muted">{o.intro}</AppText>
      </View>

      {step === 0 ? (
        <Section title={o.interestsTitle}>
          <InterestsPicker value={prefs.interests} onChange={(interests) => update({ interests })} />
          <AppText variant="caption" tone="muted">
            {o.pickOne}
          </AppText>
        </Section>
      ) : null}

      {step === 1 ? (
        <Section title={o.regionsTitle}>
          <RegionPicker value={prefs.regions} onChange={(regions) => update({ regions })} />
        </Section>
      ) : null}

      {step === 2 ? (
        <Section title={o.notificationsTitle}>
          <AppText tone="muted">{o.notificationsBody}</AppText>
          <NotificationToggles value={prefs.notifications} onChange={(notifications) => update({ notifications })} />
        </Section>
      ) : null}

      <View style={styles.actions}>
        {step < STEPS - 1 ? (
          <Button label={o.next} onPress={() => setStep(step + 1)} />
        ) : (
          <Button label={o.done} onPress={finish} />
        )}
        {step > 0 ? <Button label={o.back} variant="secondary" onPress={() => setStep(step - 1)} /> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: spacing.sm },
  actions: { gap: spacing.sm },
});
