/**
 * Company Training Day Firestore service
 */

import { Timestamp } from 'firebase/firestore';
import {
  getDocumentById,
  createDocument,
  updateDocument,
  handleFirestoreError,
} from './base';
import type { CompanyTrainingDay, CompanyTrainingDayInput } from '@countcard/core/types/models';
import type { UserRole } from '@countcard/core/types/auth';
import {
  buildCompanyTrainingDayKey,
  resolveMcrdTrainingDay,
  getNextTrainingDayCode,
  assertF1Friday,
  phaseForCode,
} from '@countcard/core/constants/mcrdTrainingMatrix';

const COLLECTION = 'companyTrainingDays';

export async function getCompanyTrainingDay(
  regiment: string,
  battalion: string,
  company: string
): Promise<CompanyTrainingDay | null> {
  const key = buildCompanyTrainingDayKey(regiment, battalion, company);
  try {
    return await getDocumentById<CompanyTrainingDay>(COLLECTION, key);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to get company training day ${key}`);
  }
}

export async function setF1Friday(
  regiment: string,
  battalion: string,
  company: string,
  f1Friday: Date,
  effectiveDate: Date,
  userId: string,
  setByRole?: UserRole,
  manualOverride = false
): Promise<string> {
  assertF1Friday(f1Friday);
  const key = buildCompanyTrainingDayKey(regiment, battalion, company);
  const resolved = resolveMcrdTrainingDay(f1Friday, effectiveDate);
  const now = Timestamp.now();

  const payload: CompanyTrainingDayInput = {
    companyKey: key,
    regiment: regiment as CompanyTrainingDay['regiment'],
    battalion,
    company,
    f1Friday,
    currentTrainingDayCode: resolved.code,
    currentTrainingDayPhase: resolved.phase,
    effectiveDate,
    setBy: userId,
    setByRole,
    setAt: now,
    manualOverride,
    createdBy: userId,
  };

  try {
    const existing = await getCompanyTrainingDay(regiment, battalion, company);
    if (existing) {
      await updateDocument(COLLECTION, key, payload, userId);
    } else {
      await createDocument(COLLECTION, key, payload, userId);
    }
    return key;
  } catch (error) {
    throw handleFirestoreError(error, `Failed to set F-1 Friday for ${key}`);
  }
}

export async function setCurrentTrainingDay(
  regiment: string,
  battalion: string,
  company: string,
  code: string,
  effectiveDate: Date,
  userId: string,
  setByRole?: UserRole
): Promise<void> {
  const key = buildCompanyTrainingDayKey(regiment, battalion, company);
  const existing = await getCompanyTrainingDay(regiment, battalion, company);
  if (!existing) {
    throw new Error('Set F-1 Friday before setting training day');
  }

  const f1Friday =
    existing.f1Friday instanceof Date ? existing.f1Friday : existing.f1Friday.toDate();
  const resolved = resolveMcrdTrainingDay(f1Friday, effectiveDate);

  await updateDocument(
    COLLECTION,
    key,
    {
      currentTrainingDayCode: code,
      currentTrainingDayPhase: phaseForCode(code),
      effectiveDate,
      setBy: userId,
      setByRole,
      setAt: Timestamp.now(),
      manualOverride: code !== resolved.code,
      updatedBy: userId,
    },
    userId
  );
}

export async function advanceTrainingDay(
  regiment: string,
  battalion: string,
  company: string,
  userId: string,
  setByRole?: UserRole
): Promise<string | null> {
  const existing = await getCompanyTrainingDay(regiment, battalion, company);
  if (!existing) {
    throw new Error('Set F-1 Friday before advancing training day');
  }

  const next = getNextTrainingDayCode(existing.currentTrainingDayCode);
  if (!next) return null;

  const effectiveDate = new Date();
  await setCurrentTrainingDay(
    regiment,
    battalion,
    company,
    next,
    effectiveDate,
    userId,
    setByRole
  );
  return next;
}

/** Resolve T-DAY for today from company doc (auto-advance if effectiveDate is stale). */
export async function resolveCompanyTrainingDayForDate(
  regiment: string,
  battalion: string,
  company: string,
  targetDate: Date = new Date()
): Promise<{ code: string; phase: 1 | 2 | 3 | 4; f1Friday: Date } | null> {
  const doc = await getCompanyTrainingDay(regiment, battalion, company);
  if (!doc) return null;

  const f1 =
    doc.f1Friday instanceof Date ? doc.f1Friday : doc.f1Friday.toDate();

  if (doc.manualOverride) {
    return {
      code: doc.currentTrainingDayCode,
      phase: doc.currentTrainingDayPhase,
      f1Friday: f1,
    };
  }

  const resolved = resolveMcrdTrainingDay(f1, targetDate);
  return { code: resolved.code, phase: resolved.phase, f1Friday: f1 };
}
