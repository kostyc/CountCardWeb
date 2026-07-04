import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { cardShadow, radius, spacing, typography } from '@/constants/theme';

interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface SelectProps<T extends string> {
  label?: string;
  value: T | '';
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select…',
}: SelectProps<T>) {
  const theme = useAppTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text>
      ) : null}
      <Pressable
        onPress={() => setOpen(true)}
        style={[
          styles.trigger,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <Text style={{ color: selected ? theme.colors.text : theme.colors.textMuted, fontSize: 16 }}>
          {selected?.label ?? placeholder}
        </Text>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View
            style={[
              styles.sheet,
              { backgroundColor: theme.colors.surface },
              cardShadow(theme.scheme),
            ]}
          >
            <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>{label ?? 'Choose'}</Text>
            <ScrollView style={styles.list}>
              {options.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    {
                      backgroundColor: pressed ? theme.colors.background : 'transparent',
                      borderBottomColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: opt.value === value ? theme.colors.primary : theme.colors.text,
                        fontWeight: opt.value === value ? '700' : '400',
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { ...typography.caption, fontWeight: '600', marginBottom: 6, marginLeft: 2 },
  trigger: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '70%',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.lg,
  },
  sheetTitle: {
    ...typography.headline,
    textAlign: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  list: { paddingHorizontal: spacing.base },
  option: {
    paddingVertical: 14,
    paddingHorizontal: spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: { ...typography.body },
});
