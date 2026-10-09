import { Redirect } from "expo-router";
import { usePreferences } from "@/state/PreferencesProvider";
import { FeedScreen } from "@/ui/screens/FeedScreen";

export default function FeedRoute() {
  const { prefs } = usePreferences();
  if (!prefs.onboarded) return <Redirect href="/onboarding" />;
  return <FeedScreen />;
}
