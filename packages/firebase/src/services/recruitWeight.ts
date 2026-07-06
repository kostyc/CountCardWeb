/**
 * Append-only recruit weight measurements
 */

import { collection, addDoc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { getDb } from '../instance';
import { handleFirestoreError, stripUndefined } from './base';
import type { RecruitWeightEntry } from '@countcard/core/types/models';
import { updateRecruitProfile } from './recruits';

export async function addRecruitWeightEntry(
  recruitId: string,
  input: {
    weightPounds: number;
    recordedBy: string;
    notes?: string;
    recordedAt?: Date;
  }
): Promise<string> {
  try {
    const db = getDb();
    const ref = collection(db, 'recruits', recruitId, 'weightEntries');
    const entryId = `wt-${Date.now()}`;
    const recordedAt = input.recordedAt ? Timestamp.fromDate(input.recordedAt) : Timestamp.now();
    const payload: Omit<RecruitWeightEntry, 'id'> = {
      entryId,
      recruitId,
      weightPounds: input.weightPounds,
      recordedAt,
      recordedBy: input.recordedBy,
      notes: input.notes,
      createdAt: recordedAt,
      updatedAt: recordedAt,
      createdBy: input.recordedBy,
    };
    const docRef = await addDoc(ref, stripUndefined(payload));

    await updateRecruitProfile(
      recruitId,
      {
        recruitId,
        weightPounds: input.weightPounds,
        updatedBy: input.recordedBy,
      },
      input.recordedBy
    );

    return docRef.id;
  } catch (error) {
    throw handleFirestoreError(error, `Failed to add weight entry for ${recruitId}`);
  }
}

export async function listRecruitWeightEntries(recruitId: string): Promise<RecruitWeightEntry[]> {
  try {
    const db = getDb();
    const ref = collection(db, 'recruits', recruitId, 'weightEntries');
    const q = query(ref, orderBy('recordedAt', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as RecruitWeightEntry));
  } catch (error) {
    throw handleFirestoreError(error, `Failed to list weight entries for ${recruitId}`);
  }
}
