import { Share, StyleSheet, View } from "react-native";
import { geminiPrompt } from "@/domain/display";
import { Chip } from "../components/Chip";
import { Section } from "../components/Section";
import { AppText } from "../components/AppText";
import { strings } from "../strings";
import { spacing } from "../theme";

// "רוצה להבין יותר?": מכין שאלה ופותח את Share של המכשיר, כדי להמשיך ב-Gemini עם החשבון של המשתמש.
// בלי מפתח API של המפתחת (CLAUDE.md).
export function AskGeminiSection({ title, url }: { title: string; url: string }) {
  const ask = (question: string) => {
    Share.share({ message: geminiPrompt(title, url, question) }).catch(() => {});
  };
  return (
    <Section title={strings.ask.title}>
      <AppText variant="caption" tone="muted">
        {strings.ask.hint}
      </AppText>
      <View style={styles.wrap}>
        {strings.ask.questions.map((q) => (
          <Chip key={q} label={q} selected={false} onPress={() => ask(q)} />
        ))}
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
});
