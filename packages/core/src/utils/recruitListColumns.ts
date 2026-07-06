import { formatEdipiForDisplay } from './recruitEdipi';
import type { RecruitProfile } from '../types/models';
import type { RecruitProgressSummary } from './recruitProgressSummary';
import { formatFitnessScore } from './recruitProgressSummary';

export type RecruitListColumnId =
  | 'lastName'
  | 'firstName'
  | 'middleInitial'
  | 'edipi'
  | 'rank'
  | 'status'
  | 'company'
  | 'series'
  | 'platoon'
  | 'weaponsSerialNumber'
  | 'rcoSerialNumber'
  | 'heightInches'
  | 'weightPounds'
  | 'initialPft'
  | 'initialCft'
  | 'finalPft'
  | 'finalCft'
  | 'finalDrill'
  | 'finalInspection'
  | 'custodyPhase'
  | 'comments';

export interface RecruitListColumnDef {
  id: RecruitListColumnId;
  label: string;
  editable: boolean;
  defaultVisible: boolean;
  /** When true, cell text may wrap to multiple lines (comments only). */
  wrap?: boolean;
}

export const RECRUIT_LIST_COLUMNS: RecruitListColumnDef[] = [
  { id: 'lastName', label: 'Last Name', editable: true, defaultVisible: true },
  { id: 'firstName', label: 'First Name', editable: true, defaultVisible: true },
  { id: 'middleInitial', label: 'Middle Initial', editable: true, defaultVisible: true },
  { id: 'edipi', label: 'EDIPI', editable: true, defaultVisible: true },
  { id: 'platoon', label: 'Platoon', editable: true, defaultVisible: true },
  { id: 'rank', label: 'Rank', editable: true, defaultVisible: true },
  { id: 'status', label: 'Status', editable: true, defaultVisible: true },
  { id: 'company', label: 'Company', editable: true, defaultVisible: false },
  { id: 'series', label: 'Series', editable: true, defaultVisible: false },
  { id: 'weaponsSerialNumber', label: 'Weapon SN', editable: true, defaultVisible: false },
  { id: 'rcoSerialNumber', label: 'RCO SN', editable: true, defaultVisible: false },
  { id: 'heightInches', label: 'Height', editable: true, defaultVisible: false },
  { id: 'weightPounds', label: 'Weight (latest)', editable: true, defaultVisible: false },
  { id: 'initialPft', label: 'Initial PFT', editable: false, defaultVisible: false },
  { id: 'initialCft', label: 'Initial CFT', editable: false, defaultVisible: false },
  { id: 'finalPft', label: 'Final PFT', editable: false, defaultVisible: false },
  { id: 'finalCft', label: 'Final CFT', editable: false, defaultVisible: false },
  { id: 'finalDrill', label: 'Final Drill', editable: false, defaultVisible: false },
  { id: 'finalInspection', label: 'Final Inspection', editable: false, defaultVisible: false },
  { id: 'custodyPhase', label: 'Custody', editable: false, defaultVisible: false },
  { id: 'comments', label: 'Comments', editable: true, defaultVisible: false, wrap: true },
];

export const DEFAULT_RECRUIT_LIST_COLUMN_IDS: RecruitListColumnId[] = RECRUIT_LIST_COLUMNS.filter(
  (column) => column.defaultVisible
).map((column) => column.id);

/** Must match RecruitListGrid headerCell/dataCell paddingHorizontal (spacing.xs). */
export const GRID_CELL_PADDING_X = 4;
const MIN_COLUMN_WIDTH = 36;
const COMPACT_SELECT_CHROME_X = 14;
const COMMENTS_MIN_WIDTH = 120;
const COMMENTS_MAX_WIDTH = 240;

/** Approximate rendered width for 12px body text (single line). */
export function estimateRecruitCellTextWidth(text: string, fontSize = 12): number {
  if (!text) return 0;
  return Math.ceil(text.length * fontSize * 0.58);
}

export function getRecruitListColumnDef(id: RecruitListColumnId): RecruitListColumnDef {
  const column = RECRUIT_LIST_COLUMNS.find((entry) => entry.id === id);
  if (!column) throw new Error(`Unknown recruit list column: ${id}`);
  return column;
}

export function getRecruitColumnValue(
  recruit: RecruitProfile,
  columnId: RecruitListColumnId,
  progressSummary?: RecruitProgressSummary
): string {
  switch (columnId) {
    case 'lastName':
      return recruit.lastName ?? '';
    case 'firstName':
      return recruit.firstName ?? '';
    case 'middleInitial':
      return recruit.middleInitial ?? '';
    case 'edipi':
      return formatEdipiForDisplay(recruit);
    case 'rank':
      return recruit.rank ?? '';
    case 'status':
      return recruit.status ?? '';
    case 'company':
      return recruit.company ?? '';
    case 'series':
      return recruit.series ?? '';
    case 'platoon':
      return recruit.platoon ?? '';
    case 'weaponsSerialNumber':
      return recruit.weaponsSerialNumber ?? '';
    case 'rcoSerialNumber':
      return recruit.rcoSerialNumber ?? '';
    case 'heightInches':
      return recruit.heightInches != null ? String(recruit.heightInches) : '';
    case 'weightPounds':
      return recruit.weightPounds != null ? String(recruit.weightPounds) : '';
    case 'initialPft':
      return formatFitnessScore(recruit.initialPft, { compact: true }) ?? '';
    case 'initialCft':
      return formatFitnessScore(recruit.initialCft, { compact: true }) ?? '';
    case 'finalPft':
      return progressSummary?.final_pft ?? '';
    case 'finalCft':
      return progressSummary?.final_cft ?? '';
    case 'finalDrill':
      return progressSummary?.final_drill ?? '';
    case 'finalInspection':
      return progressSummary?.final_inspection ?? '';
    case 'custodyPhase':
      return recruit.custodyPhase ?? '';
    case 'comments':
      return recruit.extendedNotes ?? progressSummary?.general_comment ?? '';
    default:
      return '';
  }
}

/**
 * Column widths sized to the longest value in each column (header + rows).
 * Non-wrapping columns stay single-line; comments uses a capped width and wraps inside the cell.
 */
export function computeRecruitColumnWidths(
  visibleColumnIds: RecruitListColumnId[],
  cellTextsByColumn: Record<RecruitListColumnId, string[]>
): Record<RecruitListColumnId, number> {
  const widths = {} as Record<RecruitListColumnId, number>;

  for (const columnId of visibleColumnIds) {
    const def = getRecruitListColumnDef(columnId);
    const texts = cellTextsByColumn[columnId] ?? [def.label];
    const longest = texts.reduce((current, text) => (text.length >= current.length ? text : current), '');

    if (def.wrap) {
      const contentWidth = estimateRecruitCellTextWidth(longest) + GRID_CELL_PADDING_X * 2;
      widths[columnId] = Math.min(
        Math.max(COMMENTS_MIN_WIDTH, contentWidth),
        COMMENTS_MAX_WIDTH
      );
      continue;
    }

    const isSelectColumn = columnId === 'rank' || columnId === 'status';
    const cellFontSize = isSelectColumn ? 13 : 12;
    const headerWidth = estimateRecruitCellTextWidth(def.label, 12) + GRID_CELL_PADDING_X * 2;
    const valueWidth = (
      estimateRecruitCellTextWidth(longest, cellFontSize)
      + GRID_CELL_PADDING_X * 2
      + (isSelectColumn ? COMPACT_SELECT_CHROME_X : 0)
    );
    widths[columnId] = Math.max(MIN_COLUMN_WIDTH, headerWidth, valueWidth);
  }

  return widths;
}

export function buildRecruitColumnPatch(
  columnId: RecruitListColumnId,
  value: string
): Partial<RecruitProfile> {
  switch (columnId) {
    case 'lastName':
      return { lastName: value };
    case 'firstName':
      return { firstName: value };
    case 'middleInitial':
      return { middleInitial: value.trim().toUpperCase() || undefined };
    case 'edipi':
      return { edipi: value };
    case 'rank':
      return { rank: value as RecruitProfile['rank'] };
    case 'status':
      return { status: value as RecruitProfile['status'] };
    case 'company':
      return { company: value };
    case 'series':
      return { series: value };
    case 'platoon':
      return { platoon: value };
    case 'weaponsSerialNumber':
      return { weaponsSerialNumber: value };
    case 'rcoSerialNumber':
      return { rcoSerialNumber: value };
    case 'heightInches':
      return { heightInches: value ? Number(value) : undefined };
    case 'comments':
      return { extendedNotes: value || undefined };
    default:
      return {};
  }
}
