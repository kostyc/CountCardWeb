import type { CountCardBackgroundColor } from '@countcard/core/types/models';
import { TrainingCompanyColor } from '@countcard/core/constants/rtrPlatoonNumbering';

export const COUNT_CARD_GRID_COLUMN_WIDTHS = {
  PLT: 56,
  'T/S': 44,
  'T/P': 44,
  WPN: 44,
  BR: 40,
  LD: 40,
  SB: 40,
  DENT: 48,
  GG: 40,
  OTH: 44,
  TOTAL: 52,
} as const;

export const GRID_COLUMNS = [
  { key: 'platoon', header: 'PLT', width: COUNT_CARD_GRID_COLUMN_WIDTHS.PLT },
  { key: 'totalStrength', header: 'T/S', width: COUNT_CARD_GRID_COLUMN_WIDTHS['T/S'] },
  { key: 'totalPresent', header: 'T/P', width: COUNT_CARD_GRID_COLUMN_WIDTHS['T/P'] },
  { key: 'weapons', header: 'WPN', width: COUNT_CARD_GRID_COLUMN_WIDTHS.WPN },
  { key: 'bedRest', header: 'BR', width: COUNT_CARD_GRID_COLUMN_WIDTHS.BR },
  { key: 'lightDuty', header: 'LD', width: COUNT_CARD_GRID_COLUMN_WIDTHS.LD },
  { key: 'sickBay', header: 'SB', width: COUNT_CARD_GRID_COLUMN_WIDTHS.SB },
  { key: 'dental', header: 'DENT', width: COUNT_CARD_GRID_COLUMN_WIDTHS.DENT },
  { key: 'gearGuard', header: 'GG', width: COUNT_CARD_GRID_COLUMN_WIDTHS.GG },
  { key: 'other', header: 'OTH', width: COUNT_CARD_GRID_COLUMN_WIDTHS.OTH },
  { key: 'total', header: 'TOTAL', width: COUNT_CARD_GRID_COLUMN_WIDTHS.TOTAL },
] as const;

const BACKGROUND_MAP: Record<CountCardBackgroundColor, string> = {
  Yellow: '#FFE600',
  Red: '#FF4444',
  Blue: '#4488FF',
  White: '#FFFFFF',
};

export function backgroundColorForBattalion(battalion?: string): CountCardBackgroundColor {
  if (!battalion) return 'Yellow';
  if (battalion.includes('1st')) return 'Red';
  if (battalion.includes('3rd')) return 'Blue';
  if (battalion.includes('Support')) return 'Yellow';
  return 'Yellow';
}

export function guidonColorToBackground(
  color?: TrainingCompanyColor | string
): CountCardBackgroundColor {
  switch (color) {
    case TrainingCompanyColor.Red:
    case 'Red':
      return 'Red';
    case TrainingCompanyColor.Blue:
    case 'Blue':
      return 'Blue';
    case TrainingCompanyColor.Green:
    case 'Green':
      return 'White';
    case TrainingCompanyColor.Yellow:
    case 'Yellow':
    default:
      return 'Yellow';
  }
}

export function getCountCardSurfaceColor(bg: CountCardBackgroundColor): string {
  return BACKGROUND_MAP[bg];
}

export const countCardGridStyles = {
  borderColor: '#000000',
  textColor: '#000000',
  headerFontSize: 11,
  cellFontSize: 13,
  titleFontSize: 16,
  minCellHeight: 44,
};
