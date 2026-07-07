/**
 * MCRD San Diego recruit training day matrix (RTR West).
 * F-1 always falls on Pickup Friday. Sequence: RECEIVING → F1–F4 → T1–T59 → S1–S11 → M1–M11.
 */

export type TrainingDayPhase = 1 | 2 | 3 | 4;

export interface TrainingDayResult {
  code: string;
  label: string;
  phase: TrainingDayPhase;
  weekLabel: string;
  dayOffset: number;
}

export const TRAINING_DAY_SEQUENCE: readonly string[] = buildTrainingDaySequence();

export const TRAINING_DAY_CODES: readonly string[] = [
  'RECEIVING',
  ...Array.from({ length: 4 }, (_, i) => `F${i + 1}`),
  ...Array.from({ length: 59 }, (_, i) => `T${i + 1}`),
  ...Array.from({ length: 11 }, (_, i) => `S${i + 1}`),
  ...Array.from({ length: 11 }, (_, i) => `M${i + 1}`),
];

function buildTrainingDaySequence(): string[] {
  const seq: string[] = ['RECEIVING', 'RECEIVING', 'RECEIVING', 'RECEIVING', 'F1', 'F2', 'F3', 'F4'];

  let t = 1;
  let s = 1;

  for (let week = 1; week <= 10; week++) {
    const startDow = week === 1 ? 1 : 0;
    for (let dow = startDow; dow <= 5; dow++) {
      if (t <= 59) {
        seq.push(`T${t++}`);
      }
    }
    if (s <= 11) {
      seq.push(`S${s++}`);
    }
  }

  let m = 1;
  for (let week = 11; week <= 12 && m <= 11; week++) {
    const startDow = 0;
    const endDow = week === 12 ? 4 : 5;
    for (let dow = startDow; dow <= endDow && m <= 11; dow++) {
      seq.push(`M${m++}`);
    }
    if (week === 11 && s <= 11) {
      seq.push(`S${s++}`);
    }
  }

  return seq;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return startOfDay(out);
}

function diffDays(from: Date, to: Date): number {
  const ms = startOfDay(to).getTime() - startOfDay(from).getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

/** F-1 anchor must be a Friday (0 = Sun, 5 = Fri). */
export function assertF1Friday(date: Date): void {
  if (date.getDay() !== 5) {
    throw new Error('F-1 must fall on a Friday');
  }
}

export function isFriday(date: Date): boolean {
  return date.getDay() === 5;
}

export function phaseForCode(code: string): TrainingDayPhase {
  if (code === 'RECEIVING' || code.startsWith('F')) return 1;
  if (code.startsWith('T')) {
    const n = parseInt(code.slice(1), 10);
    if (n <= 18) return 1;
    if (n <= 36) return 2;
    return 3;
  }
  if (code.startsWith('S')) {
    const n = parseInt(code.slice(1), 10);
    if (n <= 3) return 1;
    if (n <= 6) return 2;
    if (n <= 10) return 3;
    return 4;
  }
  if (code.startsWith('M')) return 4;
  return 1;
}

function weekLabelForCode(code: string): string {
  if (code === 'RECEIVING') return 'Receiving Week';
  if (code.startsWith('F')) return 'Forming';
  if (code.startsWith('T')) {
    const n = parseInt(code.slice(1), 10);
    if (n <= 5) return 'Week 1';
    if (n <= 11) return 'Week 2';
    if (n <= 17) return 'Week 3';
    if (n <= 23) return 'Week 4 — Swim Week';
    if (n <= 29) return 'Week 5 — Team Week';
    if (n <= 35) return 'Week 6';
    if (n <= 41) return 'Week 7 — Grass Week';
    if (n <= 47) return 'Week 8 — Table 1';
    if (n <= 53) return 'Week 9 — Table 2 / BWT';
    return 'Week 10 — Crucible';
  }
  if (code.startsWith('S')) return `Sunday S-${code.slice(1)}`;
  if (code.startsWith('M')) return 'Week 11–12 — Marine Week';
  return '';
}

function labelForCode(code: string): string {
  if (code === 'RECEIVING') return 'Receiving Week';
  if (code.startsWith('F')) return `Forming Day ${code.slice(1)}`;
  if (code.startsWith('T')) return `Training Day ${code.slice(1)}`;
  if (code.startsWith('S')) return `Sunday ${code.slice(1)}`;
  if (code.startsWith('M')) return `Marine Day ${code.slice(1)}`;
  return code;
}

export function formatTrainingDayDisplay(code: string): string {
  if (code === 'RECEIVING') return 'RECEIVING';
  if (code.startsWith('F')) return `F-${code.slice(1)}`;
  if (code.startsWith('T')) return code.slice(1);
  if (code.startsWith('S')) return `S-${code.slice(1)}`;
  if (code.startsWith('M')) return `M-${code.slice(1)}`;
  return code;
}

export function resolveMcrdTrainingDay(f1Friday: Date, targetDate: Date): TrainingDayResult {
  assertF1Friday(f1Friday);
  const receivingMonday = addDays(f1Friday, -4);
  const offset = diffDays(receivingMonday, targetDate);

  if (offset < 0) {
    return {
      code: 'PRE_CYCLE',
      label: 'Before Receiving',
      phase: 1,
      weekLabel: 'Pre-Receiving',
      dayOffset: offset,
    };
  }

  if (offset >= TRAINING_DAY_SEQUENCE.length) {
    return {
      code: 'POST_CYCLE',
      label: 'After Training Cycle',
      phase: 4,
      weekLabel: 'Post-Cycle',
      dayOffset: offset,
    };
  }

  const code = TRAINING_DAY_SEQUENCE[offset];
  return {
    code,
    label: labelForCode(code),
    phase: phaseForCode(code),
    weekLabel: weekLabelForCode(code),
    dayOffset: offset,
  };
}

export function getNextTrainingDayCode(currentCode: string): string | null {
  const idx = TRAINING_DAY_SEQUENCE.indexOf(currentCode);
  if (idx === -1 || idx >= TRAINING_DAY_SEQUENCE.length - 1) return null;
  return TRAINING_DAY_SEQUENCE[idx + 1];
}

export function getPreviousTrainingDayCode(currentCode: string): string | null {
  const idx = TRAINING_DAY_SEQUENCE.indexOf(currentCode);
  if (idx <= 0) return null;
  return TRAINING_DAY_SEQUENCE[idx - 1];
}

export function buildCompanyTrainingDayKey(
  regiment: string,
  battalion: string,
  company: string
): string {
  return `${regiment}_${battalion}_${company}`.replace(/\s+/g, '');
}
