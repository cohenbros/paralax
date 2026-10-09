// דפי מידע סטטיים: "איך אנחנו מדרגים" ומדיניות פרטיות
import { AppText } from "../components/AppText";
import { Screen } from "../components/Screen";
import { Section } from "../components/Section";
import { methodology, privacy, type InfoPage } from "../infoContent";

function InfoScreen({ page }: { page: InfoPage }) {
  return (
    <Screen>
      <AppText variant="title">{page.title}</AppText>
      {page.sections.map((section) => (
        <Section key={section.heading} title={section.heading}>
          {section.paragraphs.map((p) => (
            <AppText key={p}>{p}</AppText>
          ))}
        </Section>
      ))}
    </Screen>
  );
}

export const MethodologyScreen = () => <InfoScreen page={methodology} />;
export const PrivacyScreen = () => <InfoScreen page={privacy} />;
