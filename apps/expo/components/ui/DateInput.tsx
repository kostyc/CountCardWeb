import { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  Platform,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useAppTheme } from '@/hooks/useAppTheme';
import { radius, spacing, typography } from '@/constants/theme';

interface DateInputProps {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  keyboardType?: TextInputProps['keyboardType'];
}

function parseIsoDate(iso: string): Date | undefined {
  const parts = iso.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return undefined;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function DateInput({
  label,
  value,
  onChangeText,
  placeholder = 'YYYY-MM-DD',
  error,
  minimumDate,
  maximumDate,
  keyboardType,
}: DateInputProps) {
  const theme = useAppTheme();
  const webInputRef = useRef<HTMLInputElement>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [iosDraft, setIosDraft] = useState<Date>(() => parseIsoDate(value) ?? new Date());

  const pickerDate = parseIsoDate(value) ?? new Date();

  function openPicker() {
    setIosDraft(parseIsoDate(value) ?? new Date());
    setShowPicker(true);
  }

  function commitDate(d: Date) {
    onChangeText(toIsoDate(d));
  }

  function handlePickerChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'set' && selected) {
        commitDate(selected);
      }
      return;
    }
    if (selected) {
      setIosDraft(selected);
    }
  }

  function openWebPicker() {
    const el = webInputRef.current;
    if (!el) return;
    if (typeof el.showPicker === 'function') {
      el.showPicker();
    } else {
      el.click();
    }
  }

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text>
      ) : null}
      <View style={styles.row}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          keyboardType={keyboardType}
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              borderColor: error ? theme.colors.error : theme.colors.border,
              color: theme.colors.text,
            },
          ]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open calendar"
          onPress={Platform.OS === 'web' ? openWebPicker : openPicker}
          style={({ pressed }) => [
            styles.calendarBtn,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text style={[styles.calendarIcon, { color: theme.colors.primary }]}>📅</Text>
        </Pressable>
      </View>
      {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}

      {Platform.OS === 'web' ? (
        <input
          ref={webInputRef}
          type="date"
          value={value}
          min={minimumDate ? toIsoDate(minimumDate) : undefined}
          max={maximumDate ? toIsoDate(maximumDate) : undefined}
          onChange={(e) => onChangeText(e.target.value)}
          style={styles.webPicker}
          tabIndex={-1}
          aria-hidden
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={showPicker} animationType="slide" transparent onRequestClose={() => setShowPicker(false)}>
          <Pressable style={styles.backdrop} onPress={() => setShowPicker(false)}>
            <Pressable
              style={[styles.sheet, { backgroundColor: theme.colors.surface }]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.sheetHeader}>
                <Pressable
                  onPress={() => setShowPicker(false)}
                  hitSlop={8}
                  style={styles.sheetAction}
                >
                  <Text style={[styles.sheetActionText, { color: theme.colors.textMuted }]}>Cancel</Text>
                </Pressable>
                <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>{label ?? 'Pick date'}</Text>
                <Pressable
                  onPress={() => {
                    commitDate(iosDraft);
                    setShowPicker(false);
                  }}
                  hitSlop={8}
                  style={styles.sheetAction}
                >
                  <Text style={[styles.sheetActionText, { color: theme.colors.primary, fontWeight: '700' }]}>
                    Done
                  </Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={iosDraft}
                mode="date"
                display="spinner"
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                onChange={handlePickerChange}
                themeVariant={theme.scheme}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}

      {Platform.OS === 'android' && showPicker ? (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display="default"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={handlePickerChange}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { ...typography.caption, fontWeight: '600', marginBottom: 6, marginLeft: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 52,
  },
  calendarBtn: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    minWidth: 52,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarIcon: {
    fontSize: 22,
  },
  error: { ...typography.caption, marginTop: 6, marginLeft: 2 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: spacing.xl,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  sheetTitle: {
    ...typography.body,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  sheetAction: {
    minWidth: 64,
    minHeight: 44,
    justifyContent: 'center',
  },
  sheetActionText: {
    ...typography.body,
    fontSize: 16,
  },
  webPicker: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
    pointerEvents: 'none',
  },
});
