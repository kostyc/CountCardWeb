import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  SafeAreaView,
} from 'react-native';
import type { CountCardDispositionAssignments, RecruitProfile } from '@countcard/core/types/models';
import {
  DISPOSITION_LABELS,
  type DispositionField,
  getRecruitDispositionField,
} from '@countcard/core/utils/countCardGrid';
import { formatRecruitListName } from '@countcard/core/utils/recruitDisplay';
import { Button } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { userAlert } from '@/lib/userAlert';
import { spacing, typography } from '@/constants/theme';

interface Props {
  visible: boolean;
  disposition: DispositionField;
  platoon: string;
  roster: RecruitProfile[];
  selectedIds: string[];
  existingAssignments?: CountCardDispositionAssignments;
  onClose: () => void;
  onSave: (recruitIds: string[]) => void;
}

export function CountCardDispositionPicker({
  visible,
  disposition,
  platoon,
  roster,
  selectedIds,
  existingAssignments,
  onClose,
  onSave,
}: Props) {
  const theme = useAppTheme();
  const [draft, setDraft] = useState<string[]>(selectedIds);

  useEffect(() => {
    if (visible) setDraft(selectedIds);
  }, [visible, selectedIds.join('|')]);

  const sortedRoster = useMemo(
    () =>
      [...roster].sort((a, b) => {
        const last = a.lastName.localeCompare(b.lastName);
        return last !== 0 ? last : a.firstName.localeCompare(b.firstName);
      }),
    [roster]
  );

  function toggle(recruitId: string) {
    setDraft((prev) =>
      prev.includes(recruitId) ? prev.filter((id) => id !== recruitId) : [...prev, recruitId]
    );
  }

  function otherDispositionLabel(recruitId: string): string | null {
    const field = getRecruitDispositionField(existingAssignments, recruitId);
    if (!field || field === disposition) return null;
    if (draft.includes(recruitId)) return null;
    return DISPOSITION_LABELS[field];
  }

  function handleDone() {
    if (!roster.length) {
      void userAlert(
        'Roster unavailable',
        `No recruits were found for platoon ${platoon}. Enter counts only, or verify platoon and company assignment.`
      );
      return;
    }
    onSave(draft);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {DISPOSITION_LABELS[disposition]} — PLT {platoon}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            Select recruits from your roster. Present (T/P) updates for everyone not selected.
          </Text>
        </View>

        <FlatList
          data={sortedRoster}
          keyExtractor={(item) => item.recruitId}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const checked = draft.includes(item.recruitId);
            const otherLabel = otherDispositionLabel(item.recruitId);

            return (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                onPress={() => toggle(item.recruitId)}
                style={[
                  styles.row,
                  { borderBottomColor: theme.colors.borderSubtle, minHeight: 44 },
                ]}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: checked ? theme.colors.primary : 'transparent',
                    },
                  ]}
                >
                  {checked ? <Text style={styles.checkmark}>✓</Text> : null}
                </View>
                <View style={styles.rowBody}>
                  <Text style={[styles.name, { color: theme.colors.text }]}>
                    {formatRecruitListName(item)}
                  </Text>
                  {otherLabel ? (
                    <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
                      Currently {otherLabel} — will move here if selected
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: theme.colors.textMuted }]}>
              No recruits found for this platoon.
            </Text>
          }
        />

        <View style={[styles.footer, { borderTopColor: theme.colors.borderSubtle }]}>
          <Text style={[styles.count, { color: theme.colors.text }]}>
            Selected: {draft.length}
          </Text>
          <View style={styles.actions}>
            <Button title="Cancel" variant="secondary" onPress={onClose} />
            <Button title="Done" onPress={handleDone} />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  title: {
    ...typography.headline,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.body,
    fontSize: 14,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  rowBody: { flex: 1, gap: 2 },
  name: {
    ...typography.body,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
  },
  empty: {
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  footer: {
    padding: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  count: {
    fontWeight: '700',
  },
  actions: {
    gap: spacing.sm,
  },
});
