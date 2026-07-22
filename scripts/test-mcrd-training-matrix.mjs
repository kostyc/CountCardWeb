#!/usr/bin/env node
/**
 * Smoke tests for mcrdTrainingMatrix (run: node scripts/test-mcrd-training-matrix.mjs)
 */
import {
  resolveMcrdTrainingDay,
  getNextTrainingDayCode,
  formatTrainingDayDisplay,
  assertF1Friday,
  TRAINING_DAY_SEQUENCE,
} from '../packages/core/src/constants/mcrdTrainingMatrix.ts';

function friday(y, m, d) {
  return new Date(y, m - 1, d);
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const f1 = friday(2026, 3, 6);
assertF1Friday(f1);

const receivingMon = resolveMcrdTrainingDay(f1, friday(2026, 3, 2));
assert(receivingMon.code === 'RECEIVING', `expected RECEIVING got ${receivingMon.code}`);

const f1Day = resolveMcrdTrainingDay(f1, f1);
assert(f1Day.code === 'F1', `expected F1 got ${f1Day.code}`);

const t1 = resolveMcrdTrainingDay(f1, friday(2026, 3, 10));
assert(t1.code === 'T1', `expected T1 got ${t1.code}`);

assert(formatTrainingDayDisplay('T14') === '14', 'T14 display');
assert(getNextTrainingDayCode('F1') === 'F2', 'F1 next F2');
assert(TRAINING_DAY_SEQUENCE.includes('T59'), 'has T59');
assert(TRAINING_DAY_SEQUENCE.includes('M11'), 'has M11');
assert(TRAINING_DAY_SEQUENCE.includes('S11'), 'has S11');

console.log('mcrdTrainingMatrix: all checks passed');
console.log(`Sequence length: ${TRAINING_DAY_SEQUENCE.length}`);
