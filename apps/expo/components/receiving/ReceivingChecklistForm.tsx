import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  RECEIVING_CHECKLIST_ITEMS,
  RECEIVING_CHECKLIST_LABELS,
  createDefaultReceivingChecklist,
} from '@countcard/core/constants/receivingChecklist';
import { updateReceivingChecklist } from '@countcard/firebase/services/recruitProgress';
import type { RecruitProfile, ReceivingChecklistEntry } from '@countcard/core/types/models';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { cardShadow, radius, spacing, typography } from '@/constants/theme';

interface ReceivingChecklistFormProps {
  recruit: RecruitProfile;
  onUpdated?: () => void;
}

export function ReceivingChecklistForm({ recruit, onUpdated }: ReceivingChecklistFormProps) {
  const { user } = useAuth();
  const theme = useAppTheme();
  const [checklist, setChecklist] = useState<ReceivingChecklistEntry[]>(
    recruit.receivingChecklist?.length ? recruit.receivingChecklist : createDefaultReceivingChecklist()
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setMessage(null);
    try {
      await updateReceivingChecklist(recruit.recruitId, checklist, user.uid);
      setMessage('Checklist saved.');
      onUpdated?.();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed to save checklist');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Receiving Medical Checklist</Text>
      {RECEIVING_CHECKLIST_ITEMS.map((item) => {
        const entry = checklist.find((c) => c.item === item) ?? { item, completed: false };
        return (
          <Pressable
            key={item}
            style={styles.row}
            onPress={() => {
              const completed = !entry.completed;
              setChecklist((prev) => {
                const next = prev.filter((c) => c.item !== item);
                next.push({
                  item,
                  completed,
                  completedAt: completed ? new Date() : undefined,
                  completedBy: completed ? user?.uid : undefined,
                });
                return next;
              });
            }}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: entry.completed }}
          >
            <Text style={[styles.checkbox, { color: theme.colors.primary }]}>
              {entry.completed ? '☑' : '☐'}
            </Text>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              {RECEIVING_CHECKLIST_LABELS[item]}
            </Text>
          </Pressable>
        );
      })}
      {message ? (
        <Text style={{ color: message.startsWith('Checklist') ? theme.colors.success : theme.colors.error }}>
          {message}
        </Text>
      ) : null}
      <Button title="Save checklist" onPress={handleSave} loading={saving} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: 14,
    marginBottom: spacing.base,
  },
  title: { ...typography.title, fontSize: 18, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  checkbox: { fontSize: 22, width: 28, textAlign: 'center' },
  label: { ...typography.body, flex: 1 },
});
