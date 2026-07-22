import { View, Text, StyleSheet } from 'react-native';
import type { LegalDocumentContent } from '@/constants/legalDocuments';
import { Screen } from './Screen';
import { useAppTheme } from '@/hooks/useAppTheme';
import { cardShadow, radius, spacing, typography } from '@/constants/theme';

interface LegalDocumentProps {
  document: LegalDocumentContent;
}

export function LegalDocument({ document }: LegalDocumentProps) {
  const theme = useAppTheme();

  return (
    <Screen scroll>
      <View style={[styles.headerCard, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{document.title}</Text>
        <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
          Effective {document.effectiveDate} · Version {document.version}
        </Text>
        <Text style={[styles.intro, { color: theme.colors.text }]}>{document.intro}</Text>
      </View>

      {document.sections.map((section) => (
        <View
          key={section.title}
          style={[styles.sectionCard, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{section.title}</Text>
          {section.paragraphs.map((paragraph) => (
            <Text key={paragraph} style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
              {paragraph}
            </Text>
          ))}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.base,
    gap: spacing.sm,
  },
  title: { ...typography.title },
  meta: { ...typography.caption },
  intro: { ...typography.body, lineHeight: 22, marginTop: spacing.sm },
  sectionCard: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.base,
    gap: spacing.sm,
  },
  sectionTitle: { ...typography.headline, marginBottom: spacing.xs },
  paragraph: { ...typography.body, lineHeight: 22 },
});
