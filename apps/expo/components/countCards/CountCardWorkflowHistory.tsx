import { View, Text, StyleSheet } from 'react-native';
import type { WorkflowHistoryEntry } from '@countcard/core/types/models';
import { SectionHeader, StatusBadge } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { cardShadow, radius, spacing, typography } from '@/constants/theme';

function formatState(state: string): string {
  return state
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function entryTime(entry: WorkflowHistoryEntry): number {
  const t = entry.timestamp;
  if (t instanceof Date) return t.getTime();
  if (typeof t === 'object' && t !== null && 'seconds' in t) {
    return (t as { seconds: number }).seconds * 1000;
  }
  return 0;
}

interface Props {
  workflowHistory: WorkflowHistoryEntry[];
}

export function CountCardWorkflowHistory({ workflowHistory }: Props) {
  const theme = useAppTheme();

  if (!workflowHistory?.length) return null;

  const sorted = [...workflowHistory].sort((a, b) => entryTime(a) - entryTime(b));

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
      <SectionHeader title="Workflow history" />
      {sorted.map((entry, index) => (
        <View
          key={`${entry.timestamp}-${index}`}
          style={[styles.entry, index < sorted.length - 1 && { borderBottomColor: theme.colors.border }]}
        >
          <View style={styles.entryHeader}>
            <StatusBadge label={formatState(entry.state)} />
            <Text style={[styles.time, { color: theme.colors.textMuted }]}>
              {entry.timestamp instanceof Date
                ? entry.timestamp.toLocaleString()
                : '—'}
            </Text>
          </View>
          {entry.userId ? (
            <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
              By {entry.userId}
            </Text>
          ) : null}
          {entry.notes ? (
            <Text style={[styles.notes, { color: theme.colors.text }]}>{entry.notes}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: spacing.xl, marginBottom: spacing.base },
  entry: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  time: { ...typography.caption, flexShrink: 1 },
  meta: { ...typography.caption },
  notes: { ...typography.body, lineHeight: 20 },
});
