import { View, Text, StyleSheet, Platform, Pressable, Alert, TextInput } from 'react-native';
import { formatTrainingDayDisplay } from '@countcard/core/constants/mcrdTrainingMatrix';
import type { CountCardBackgroundColor } from '@countcard/core/types/models';
import {
  countCardGridStyles,
  getCountCardSurfaceColor,
} from './CountCardGridTheme';

interface SeriesOption {
  value: string;
  label: string;
}

interface Props {
  trainingDayCode: string;
  series: string;
  countDateLabel: string;
  event?: string;
  onEventChange?: (value: string) => void;
  backgroundColor: CountCardBackgroundColor;
  seriesOptions?: SeriesOption[];
  onSeriesChange?: (value: string) => void;
}

export function CountCardGridHeader({
  trainingDayCode,
  series,
  countDateLabel,
  event,
  onEventChange,
  backgroundColor,
  seriesOptions,
  onSeriesChange,
}: Props) {
  const surface = getCountCardSurfaceColor(backgroundColor);
  const tDay = formatTrainingDayDisplay(trainingDayCode);

  function handleSeriesPress() {
    if (!onSeriesChange || !seriesOptions?.length) return;
    Alert.alert(
      'SERIES',
      'Select series for this count card.',
      [
        ...seriesOptions.map((opt) => ({
          text: opt.label,
          onPress: () => onSeriesChange(opt.value),
        })),
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  }

  const seriesEditable = Boolean(onSeriesChange && seriesOptions?.length);

  return (
    <View style={[styles.wrap, { backgroundColor: surface }]}>
      <Text style={styles.title}>COUNT CARD</Text>

      <View style={styles.metaRow}>
        <View style={styles.metaField}>
          <Text style={styles.label}>T-DAY: </Text>
          <Text style={styles.underline}>{tDay}</Text>
        </View>

        <View style={styles.metaField}>
          {seriesEditable ? (
            <Pressable
              onPress={handleSeriesPress}
              accessibilityRole="button"
              accessibilityLabel="Select series"
              style={styles.seriesPressable}
            >
              <Text style={styles.label}>SERIES </Text>
              <Text style={[styles.underline, styles.seriesValue]}>{series || '—'}</Text>
            </Pressable>
          ) : (
            <>
              <Text style={styles.label}>SERIES </Text>
              <Text style={styles.underline}>{series || '—'}</Text>
            </>
          )}
        </View>

        <View style={styles.metaField}>
          <Text style={styles.label}>DATE: </Text>
          <Text style={styles.underline}>{countDateLabel}</Text>
        </View>
      </View>

      <View style={styles.eventRow}>
        <Text style={styles.label}>EVENT: </Text>
        {onEventChange ? (
          <TextInput
            style={styles.eventInput}
            value={event ?? ''}
            onChangeText={onEventChange}
            placeholder="—"
            placeholderTextColor="#666666"
            maxLength={200}
            accessibilityLabel="Event"
          />
        ) : (
          <Text style={[styles.underline, styles.eventValue]}>{event?.trim() || '—'}</Text>
        )}
      </View>
    </View>
  );
}

const mono = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 8,
  },
  title: {
    fontFamily: mono,
    fontSize: countCardGridStyles.titleFontSize,
    fontWeight: '800',
    color: countCardGridStyles.textColor,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 6,
    flexWrap: 'wrap',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 6,
    minHeight: 44,
  },
  eventInput: {
    flex: 1,
    fontFamily: mono,
    fontSize: countCardGridStyles.headerFontSize,
    color: countCardGridStyles.textColor,
    borderBottomWidth: 1,
    borderColor: countCardGridStyles.borderColor,
    paddingBottom: 1,
    paddingVertical: Platform.OS === 'web' ? 4 : 8,
    minWidth: 0,
  },
  eventValue: {
    flex: 1,
    minWidth: 48,
  },
  metaField: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexShrink: 1,
    flex: 1,
  },
  seriesPressable: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexShrink: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  label: {
    fontFamily: mono,
    fontSize: countCardGridStyles.headerFontSize,
    fontWeight: '700',
    color: countCardGridStyles.textColor,
  },
  underline: {
    fontFamily: mono,
    fontSize: countCardGridStyles.headerFontSize,
    color: countCardGridStyles.textColor,
    borderBottomWidth: 1,
    borderColor: countCardGridStyles.borderColor,
    minWidth: 48,
    paddingBottom: 1,
    flexShrink: 1,
  },
  seriesValue: {
    fontWeight: '700',
  },
});
