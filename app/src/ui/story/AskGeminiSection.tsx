import { Pressable, StyleSheet, View } from "react-native";
import { geminiPrompt } from "@/domain/display";
import { askGemini } from "../askGemini";
import { AiMark } from "../components/AiMark";
import { AppText } from "../components/AppText";
import { Icon } from "../components/Icon";
import { Section } from "../components/Section";
import { strings } from "../strings";
import { radius, spacing, useColors } from "../theme";

type Props = { title: string; url: string; questions: string[] };

// שאלה כשורה ברוחב מלא: שאלות ארוכות נשברות לכמה שורות במקום לגלוש מהמסך
function QuestionRow({ question, onPress }: { question: string; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint={strings.ask.a11yHint}
      style={({ pressed }) => [styles.question, { borderColor: colors.border, backgroundColor: pressed ? colors.accentSoft : colors.surface }]}
    >
      <Icon name="chatbubble-ellipses-outline" size={18} color={colors.accent} />
      <AppText variant="label" style={styles.flex}>
        {question}
      </AppText>
    </Pressable>
  );
}

// "רוצה להבין יותר?": שאלות שנגזרו מתוך הידיעה (AI), או שאלה כללית אחת כשעוד אין.
// לחיצה פותחת את Gemini עם השאלה (askGemini.ts), בחשבון של המשתמש ובלי מפתח של המפתחת (CLAUDE.md).
export function AskGeminiSection({ title, url, questions }: Props) {
  const specific = questions.length > 0;
  const list = specific ? questions : [strings.ask.general];
  const ask = (question: string) => askGemini(geminiPrompt(title, url, question));
  return (
    <Section title={strings.ask.title}>
      <View style={styles.row}>
        <AppText variant="caption" tone="muted" style={styles.flex}>
          {strings.ask.hint}
        </AppText>
        {specific ? <AiMark label={strings.story.aiGenerated} /> : null}
      </View>
      {list.map((q) => (
        <QuestionRow key={q} question={q} onPress={() => ask(q)} />
      ))}
    </Section>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  flex: { flex: 1 },
  question: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
