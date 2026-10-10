import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { I18nManager, Platform, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NewsProvider } from "@/state/NewsProvider";
import { PreferencesProvider, usePreferences } from "@/state/PreferencesProvider";
import { Icon } from "@/ui/components/Icon";
import { strings } from "@/ui/strings";
import { useColors } from "@/ui/theme";

// בגרסה בנויה RTL נכפה ע"י expo-localization (app.json). ב-Expo Go (SDK 57) לא, ולכן הכיוון נקבע גם בשורש.
// left/right בסגנונות לא מתהפכים: textAlign: "right" תמיד ימין.
// (בדפדפן הפונקציה לא קיימת; שם אין היפוך אוטומטי ממילא)
if (Platform.OS !== "web") I18nManager.swapLeftAndRightInRTL(false);
// בדפדפן (תצוגה מקדימה) הכיוון נקבע על הדף עצמו
if (Platform.OS === "web" && typeof document !== "undefined") {
  document.documentElement.dir = "rtl";
  document.documentElement.lang = "he";
}

function SettingsButton() {
  const router = useRouter();
  const colors = useColors();
  return (
    <Pressable
      onPress={() => router.push("/settings")}
      accessibilityRole="button"
      accessibilityLabel={strings.settingsTitle}
      hitSlop={12}
    >
      <Icon name="options-outline" size={22} color={colors.onHeader} />
    </Pressable>
  );
}

function AppStack() {
  const colors = useColors();
  const { ready } = usePreferences();
  // עד שההעדפות נטענו לא מציגים כלום (מונע הבהוב של מסך ההיכרות)
  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.header },
        headerTintColor: colors.onHeader,
        headerTitleStyle: { fontWeight: "800" },
        headerShadowVisible: false,
        headerTitleAlign: "center",
        contentStyle: { backgroundColor: colors.background },
        // העדפות נגישות מכל מסך (CLAUDE.md)
        headerRight: () => <SettingsButton />,
      }}
    >
      <Stack.Screen name="index" options={{ title: strings.appName }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="story/[id]" options={{ title: "" }} />
      <Stack.Screen name="source/[id]" options={{ title: "" }} />
      <Stack.Screen name="settings/index" options={{ title: strings.settingsTitle, headerRight: () => null }} />
      <Stack.Screen name="settings/methodology" options={{ title: "", headerRight: () => null }} />
      <Stack.Screen name="settings/privacy" options={{ title: "", headerRight: () => null }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <PreferencesProvider>
          <NewsProvider>
            <StatusBar style="light" />
            <AppStack />
          </NewsProvider>
        </PreferencesProvider>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  // "direction" לא נתמך בדפדפן; שם הכיוון מגיע מ-<html dir="rtl">
  root: Platform.OS === "web" ? { flex: 1 } : { flex: 1, direction: "rtl" },
});
