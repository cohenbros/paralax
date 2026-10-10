// פתיחת אפליקציית Gemini עם השאלה מוכנה (Android intent, CLAUDE.md "רוצה להבין יותר?").
// המשתמש ממשיך בחשבון שלו; אין מפתח API של המפתחת. בלי Gemini מותקן, או בלי Android – חלון השיתוף הרגיל.
import * as IntentLauncher from "expo-intent-launcher";
import { Platform, Share } from "react-native";

const GEMINI_PACKAGE = "com.google.android.apps.bard"; // "Google Gemini" ב-Play
const ACTION_SEND = "android.intent.action.SEND";

function shareFallback(text: string): void {
  Share.share({ message: text }).catch(() => {});
}

export async function askGemini(text: string): Promise<void> {
  if (Platform.OS !== "android") return shareFallback(text);
  try {
    await IntentLauncher.startActivityAsync(ACTION_SEND, {
      packageName: GEMINI_PACKAGE,
      type: "text/plain",
      extra: { "android.intent.extra.TEXT": text },
    });
  } catch {
    shareFallback(text);
  }
}
