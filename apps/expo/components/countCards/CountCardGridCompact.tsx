import { View, StyleSheet, Platform, type ViewStyle } from 'react-native';
import type { CountCardGridRow, CountCardBackgroundColor, RecruitProfile } from '@countcard/core/types/models';
import { CountCardGridHeader } from './CountCardGridHeader';
import { CountCardGridExpanded } from './CountCardGridExpanded';
import { CountCardGridComments } from './CountCardGridComments';
import { getCountCardSurfaceColor } from './CountCardGridTheme';
import { spacing } from '@/constants/theme';

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
  rows: CountCardGridRow[];
  userPlatoon?: string;
  canEditAllRows?: boolean;
  seriesOptions?: SeriesOption[];
  onSeriesChange?: (value: string) => void;
  comments?: string;
  onCommentsChange?: (value: string) => void;
  commentsEditable?: boolean;
  rosterByPlatoon?: Record<string, RecruitProfile[]>;
  rosterLoading?: boolean;
  rosterError?: string | null;
  onRowChange: (index: number, row: CountCardGridRow) => void;
  containerStyle?: ViewStyle;
}

export function CountCardGridCompact({
  trainingDayCode,
  series,
  countDateLabel,
  event,
  onEventChange,
  backgroundColor,
  rows,
  userPlatoon,
  canEditAllRows,
  seriesOptions,
  onSeriesChange,
  comments,
  onCommentsChange,
  commentsEditable = true,
  rosterByPlatoon,
  rosterLoading,
  rosterError,
  onRowChange,
  containerStyle,
}: Props) {
  const surface = getCountCardSurfaceColor(backgroundColor);

  const editableSet = canEditAllRows
    ? undefined
    : userPlatoon
      ? new Set([userPlatoon])
      : undefined;

  return (
    <View style={[styles.wrap, { backgroundColor: surface }, containerStyle]}>
      <CountCardGridHeader
        trainingDayCode={trainingDayCode}
        series={series}
        countDateLabel={countDateLabel}
        event={event}
        onEventChange={onEventChange}
        backgroundColor={backgroundColor}
        seriesOptions={seriesOptions}
        onSeriesChange={onSeriesChange}
      />

      <CountCardGridExpanded
        rows={rows}
        backgroundColor={backgroundColor}
        editablePlatoons={editableSet}
        canEditAllRows={canEditAllRows}
        profilePlatoon={userPlatoon}
        rosterByPlatoon={rosterByPlatoon}
        rosterLoading={rosterLoading}
        rosterError={rosterError}
        onRowChange={onRowChange}
        embedded
      />

      <CountCardGridComments
        backgroundColor={backgroundColor}
        value={comments}
        onChange={onCommentsChange}
        editable={commentsEditable}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...Platform.select({
      web: { maxWidth: '100%' as const },
      default: {},
    }),
  },
});
