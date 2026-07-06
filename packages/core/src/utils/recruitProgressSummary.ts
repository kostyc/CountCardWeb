import type { FitnessScoreRecord, RecruitProgressEvent, ReceivingUrinalysisRecord } from '../types/models';
import type { ProgressEventType } from '../validation/lifecycleSchemas';

export type RecruitProgressSummary = Partial<Record<ProgressEventType, string>>;

const FITNESS_SCORE_EVENT_TYPES = new Set<ProgressEventType>([
  'initial_pft',
  'initial_cft',
  'initial_drill',
  'final_pft',
  'final_cft',
  'final_drill',
]);

export function isFitnessScoreEventType(type: ProgressEventType): boolean {
  return FITNESS_SCORE_EVENT_TYPES.has(type);
}

export interface FormatFitnessScoreOptions {
  /** Shorter labels for spreadsheet cells (PU, Pl, Run). */
  compact?: boolean;
  /** Join events with newlines instead of middle dots. */
  multiline?: boolean;
}

function formatPlankDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (minutes > 0) {
    return `${minutes}:${String(remainder).padStart(2, '0')}`;
  }
  return `${seconds}s`;
}

function formatRunDuration(minutes?: number, seconds?: number): string {
  return `${minutes ?? 0}:${String(seconds ?? 0).padStart(2, '0')}`;
}

function buildFitnessEventParts(record: FitnessScoreRecord, compact: boolean): string[] {
  const parts: string[] = [];
  if (record.pullUps != null) {
    parts.push(`${compact ? 'PU' : 'Pull-ups'} ${record.pullUps}`);
  }
  if (record.plankSeconds != null) {
    parts.push(`${compact ? 'Pl' : 'Plank'} ${formatPlankDuration(record.plankSeconds)}`);
  }
  if (record.crunches != null) {
    parts.push(`${compact ? 'Cr' : 'Crunches'} ${record.crunches}`);
  }
  if (record.runMinutes != null || record.runSeconds != null) {
    parts.push(`Run ${formatRunDuration(record.runMinutes, record.runSeconds)}`);
  }
  return parts;
}

function formatTotalScore(record: FitnessScoreRecord, compact: boolean): string | undefined {
  if (record.totalScore == null) return undefined;
  const score = String(record.totalScore);
  if (record.pass === false) {
    return compact ? `${score} (F)` : `${score} (fail)`;
  }
  return score;
}

export function formatReceivingUrinalysis(
  record?: ReceivingUrinalysisRecord
): string | undefined {
  if (!record) return undefined;
  const resultLabel =
    record.result === 'pass' ? 'Pass' : record.result === 'fail' ? 'Fail' : 'Pending';
  if (record.notes?.trim()) {
    return `${resultLabel} · ${record.notes.trim()}`;
  }
  return resultLabel;
}

export function formatFitnessScore(
  record?: FitnessScoreRecord,
  options?: FormatFitnessScoreOptions
): string | undefined {
  if (!record) return undefined;

  const compact = options?.compact ?? false;
  const sep = options?.multiline ? '\n' : ' · ';
  const eventParts = buildFitnessEventParts(record, compact);
  const total = formatTotalScore(record, compact);

  if (eventParts.length === 0) {
    if (total != null) return total;
    if (record.pass != null) return record.pass ? 'Pass' : 'Fail';
    return undefined;
  }

  if (total != null) {
    const totalLabel = compact ? total : `Total ${total}`;
    return [...eventParts, totalLabel].join(sep);
  }

  if (record.pass === false) {
    return [...eventParts, compact ? 'Fail' : 'Fail'].join(sep);
  }

  return eventParts.join(sep);
}

export function formatProgressEventDisplay(
  event: Pick<RecruitProgressEvent, 'type' | 'scores' | 'passFail' | 'notes'>,
  options?: FormatFitnessScoreOptions
): string | undefined {
  const scoreText = formatFitnessScore(event.scores as FitnessScoreRecord | undefined, options);
  if (scoreText) {
    if (event.notes?.trim()) {
      const sep = options?.multiline ? '\n' : ' · ';
      return `${scoreText}${sep}${event.notes.trim()}`;
    }
    return scoreText;
  }
  if (event.passFail != null) {
    const passText = event.passFail ? 'Pass' : 'Fail';
    if (event.notes?.trim()) {
      const sep = options?.multiline ? '\n' : ' · ';
      return `${passText}${sep}${event.notes.trim()}`;
    }
    return passText;
  }
  if (event.notes?.trim()) return event.notes.trim();
  return undefined;
}

function formatProgressEvent(event: RecruitProgressEvent): string {
  return formatProgressEventDisplay(event, { compact: true }) ?? 'Recorded';
}

/**
 * Latest display value per progress event type (newest recordedAt wins).
 */
export function summarizeProgressEvents(events: RecruitProgressEvent[]): RecruitProgressSummary {
  const latest = new Map<ProgressEventType, RecruitProgressEvent>();
  for (const event of events) {
    const existing = latest.get(event.type);
    if (!existing) {
      latest.set(event.type, event);
      continue;
    }
    const existingMs = toMillis(existing.recordedAt);
    const eventMs = toMillis(event.recordedAt);
    if (eventMs >= existingMs) {
      latest.set(event.type, event);
    }
  }

  const summary: RecruitProgressSummary = {};
  for (const [type, event] of latest.entries()) {
    summary[type] = formatProgressEvent(event);
  }
  return summary;
}

function toMillis(value: Date | { toMillis(): number } | undefined): number {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  return value.toMillis();
}
