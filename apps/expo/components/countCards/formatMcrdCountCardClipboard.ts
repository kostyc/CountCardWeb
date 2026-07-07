import type { CountCardGridRow, McrdCountCard } from '@countcard/core/types/models';
import { formatTrainingDayDisplay } from '@countcard/core/constants/mcrdTrainingMatrix';
import { computeFooterTotals } from '@countcard/core/utils/countCardGrid';

function cell(v: unknown): string {
  if (v == null || v === '') return '___';
  return String(v);
}

export function formatMcrdCountCardForClipboard(card: Pick<
  McrdCountCard,
  'company' | 'series' | 'event' | 'trainingDayCode' | 'countDate' | 'rows' | 'notes'
>): string {
  const date =
    card.countDate instanceof Date
      ? card.countDate.toLocaleDateString()
      : typeof card.countDate === 'object' && 'toDate' in card.countDate
        ? card.countDate.toDate().toLocaleDateString()
        : String(card.countDate);

  const header = [
    '═══════════════════════════════════════════════════',
    '  MCRD SAN DIEGO — COUNT CARD',
    '  Depot Order 1513.6 | MCO 1510.32F',
    '═══════════════════════════════════════════════════',
    `T-DAY: ${formatTrainingDayDisplay(card.trainingDayCode)}    DATE: ${date}`,
    `SERIES: ${card.series}`,
    ...(card.event?.trim() ? [`EVENT: ${card.event.trim()}`] : []),
    '',
    'PLT   T/S  T/P  WPN  BR  LD  SB  DENT GG  OTH  TOTAL',
    '─────────────────────────────────────────────────────',
  ];

  const rowLines = card.rows.map(formatRowLine);
  const footer = computeFooterTotals(card.rows);
  rowLines.push(formatRowLine({ ...footer, platoon: 'TOTAL' }));
  header.push(...rowLines);
  header.push('─────────────────────────────────────────────────────');
  if (card.notes?.trim()) {
    header.push(`COMMENTS: ${card.notes.trim()}`);
    header.push('─────────────────────────────────────────────────────');
  }
  header.push('═══════════════════════════════════════════════════');
  return header.join('\n');
}

function formatRowLine(row: CountCardGridRow): string {
  return [
    cell(row.platoon).padEnd(5),
    cell(row.totalStrength).padStart(3),
    cell(row.totalPresent).padStart(4),
    cell(row.weapons).padStart(4),
    cell(row.bedRest).padStart(3),
    cell(row.lightDuty).padStart(3),
    cell(row.sickBay).padStart(3),
    cell(row.dental).padStart(5),
    cell(row.gearGuard).padStart(3),
    cell(row.other).padStart(4),
    cell(row.total).padStart(6),
  ].join(' ');
}
