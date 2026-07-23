/**
 * Incident alerts service (Sprint 28 — Emergency SOP)
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  Timestamp,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { getDb } from '../instance';
import {
  createDocument,
  getDocumentById,
  updateDocument,
  handleFirestoreError,
  addBaseEntityFields,
  updateBaseEntityFields,
  stripUndefined,
  timestampToDate,
} from './base';
import { getUserProfileById, getUsersByOrganization } from './userProfiles';
import { getIncidentSopTemplate } from '@countcard/core/constants/incidentSopTemplates';
import {
  isBattalionLeadershipRecipient,
  isCompanyChainRecipient,
} from '@countcard/core/permissions/incidentAlerts';
import type {
  IncidentAlert,
  IncidentEscalationLevel,
  IncidentSubjectType,
  IncidentTask,
  IncidentType,
  OrganizationalAssignment,
} from '@countcard/core/types/models';

const COLLECTION = 'incidentAlerts';
const TASKS_SUB = 'tasks';

export interface CreateIncidentAlertParams {
  incidentType: IncidentType;
  description: string;
  location?: string;
  subjectType: IncidentSubjectType;
  relatedRecruitIds?: string[];
  severity?: number;
  organizationalScope: OrganizationalAssignment;
  createdBy: string;
}

function generateAlertId(): string {
  return `IA-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function escalationRank(level: IncidentEscalationLevel): number {
  if (level === 'platoon') return 1;
  if (level === 'company') return 2;
  return 3;
}

/** Company CoC is the initial level; only CO may escalate to battalion. */
function nextEscalation(level: IncidentEscalationLevel): IncidentEscalationLevel | null {
  if (level === 'platoon' || level === 'company') return 'battalion';
  return null;
}

/** Platoon staff + both CDIs + series CDR + company triad. */
async function resolveCompanyChainRecipients(
  org: OrganizationalAssignment
): Promise<string[]> {
  if (!org.regiment || !org.battalion || !org.company) {
    throw new Error('Company assignment required to resolve chain of command');
  }
  const result = await getUsersByOrganization(
    {
      regiment: org.regiment,
      battalion: org.battalion,
      company: org.company,
    },
    { pageSize: 200 }
  );
  return result.items
    .filter((u) =>
      isCompanyChainRecipient(org, {
        role: u.role,
        organizationalAssignment: u.organizationalAssignment,
      })
    )
    .map((u) => u.id)
    .filter(Boolean);
}

/** Bn CO / XO / SgtMaj only (same regiment + battalion). */
async function resolveBattalionLeadershipRecipients(
  org: OrganizationalAssignment
): Promise<string[]> {
  if (!org.regiment || !org.battalion) {
    throw new Error('Battalion assignment required to notify battalion leadership');
  }
  const result = await getUsersByOrganization(
    {
      regiment: org.regiment,
      battalion: org.battalion,
    },
    { pageSize: 200 }
  );
  return result.items
    .filter((u) =>
      isBattalionLeadershipRecipient(org, {
        role: u.role,
        organizationalAssignment: u.organizationalAssignment,
      })
    )
    .map((u) => u.id)
    .filter(Boolean);
}

function mapAlert(id: string, data: Record<string, unknown>): IncidentAlert {
  return {
    id,
    ...(data as Omit<IncidentAlert, 'id'>),
    createdAt: timestampToDate(data.createdAt as Date | Timestamp | undefined),
    updatedAt: timestampToDate(data.updatedAt as Date | Timestamp | undefined),
    activeAt: data.activeAt
      ? timestampToDate(data.activeAt as Date | Timestamp)
      : undefined,
    resolvedAt: data.resolvedAt
      ? timestampToDate(data.resolvedAt as Date | Timestamp)
      : undefined,
    cancelledAt: data.cancelledAt
      ? timestampToDate(data.cancelledAt as Date | Timestamp)
      : undefined,
    acknowledgedBy: Array.isArray(data.acknowledgedBy)
      ? (data.acknowledgedBy as IncidentAlert['acknowledgedBy']).map((a) => ({
          userId: a.userId,
          at: timestampToDate(a.at as Date | Timestamp),
        }))
      : [],
  };
}

function mapTask(id: string, data: Record<string, unknown>): IncidentTask {
  return {
    id,
    ...(data as Omit<IncidentTask, 'id'>),
    createdAt: timestampToDate(data.createdAt as Date | Timestamp | undefined),
    updatedAt: timestampToDate(data.updatedAt as Date | Timestamp | undefined),
    claimedAt: data.claimedAt
      ? timestampToDate(data.claimedAt as Date | Timestamp)
      : undefined,
    completedAt: data.completedAt
      ? timestampToDate(data.completedAt as Date | Timestamp)
      : undefined,
  };
}

async function spawnTasks(
  alertId: string,
  type: IncidentType,
  createdBy: string
): Promise<void> {
  const template = getIncidentSopTemplate(type);
  const db = getDb();
  await Promise.all(
    template.tasks.map(async (t) => {
      const taskRef = doc(db, COLLECTION, alertId, TASKS_SUB, t.taskKey);
      const payload = addBaseEntityFields(
        stripUndefined({
          taskId: t.taskKey,
          alertId,
          taskKey: t.taskKey,
          label: t.label,
          instructions: t.instructions,
          sortOrder: t.sortOrder,
          status: 'open' as const,
          sopSource: template.sopSource,
          sopVersion: template.sopVersion,
        }),
        createdBy
      );
      await setDoc(taskRef, payload);
    })
  );
}

export async function createIncidentAlert(
  params: CreateIncidentAlertParams
): Promise<string> {
  try {
    const template = getIncidentSopTemplate(params.incidentType);
    const alertId = generateAlertId();
    const severity = params.severity ?? 5;
    // All incident types fan out to company CoC; type does not change recipients.
    const escalationLevel: IncidentEscalationLevel = 'company';
    const workflowState = 'active' as const;

    const notifiedUserIds = await resolveCompanyChainRecipients(
      params.organizationalScope
    );
    if (!notifiedUserIds.includes(params.createdBy)) {
      notifiedUserIds.push(params.createdBy);
    }

    const title = `${template.titlePrefix}${
      params.location ? ` — ${params.location}` : ''
    }`;

    await createDocument(
      COLLECTION,
      alertId,
      {
        alertId,
        title,
        description: params.description,
        incidentType: params.incidentType,
        severity,
        location: params.location,
        subjectType: params.subjectType,
        relatedRecruitIds: params.relatedRecruitIds,
        escalationLevel,
        workflowState,
        organizationalScope: params.organizationalScope,
        priority: severity,
        acknowledgedBy: [],
        notifiedUserIds,
        sopSource: template.sopSource,
        sopVersion: template.sopVersion,
        activeAt: Timestamp.now(),
      },
      params.createdBy
    );

    await spawnTasks(alertId, params.incidentType, params.createdBy);
    return alertId;
  } catch (error) {
    throw handleFirestoreError(error, 'Failed to create incident alert');
  }
}

export async function getIncidentAlertById(
  alertId: string
): Promise<IncidentAlert | null> {
  try {
    return await getDocumentById<IncidentAlert>(COLLECTION, alertId);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to get incident alert ${alertId}`);
  }
}

export async function listActiveIncidentAlertsForBattalion(
  battalion: string
): Promise<IncidentAlert[]> {
  try {
    const q = query(
      collection(getDb(), COLLECTION),
      where('organizationalScope.battalion', '==', battalion),
      where('workflowState', 'in', ['active', 'escalated']),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => mapAlert(d.id, d.data() as Record<string, unknown>));
  } catch (error) {
    throw handleFirestoreError(error, 'Failed to list active incident alerts');
  }
}

export async function listIncidentAlertsForBattalion(
  battalion: string,
  limitCount = 40
): Promise<IncidentAlert[]> {
  try {
    const q = query(
      collection(getDb(), COLLECTION),
      where('organizationalScope.battalion', '==', battalion),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs
      .slice(0, limitCount)
      .map((d) => mapAlert(d.id, d.data() as Record<string, unknown>));
  } catch (error) {
    throw handleFirestoreError(error, 'Failed to list incident alerts');
  }
}

export function subscribeActiveIncidentAlertsForBattalion(
  battalion: string,
  onData: (alerts: IncidentAlert[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(getDb(), COLLECTION),
    where('organizationalScope.battalion', '==', battalion),
    where('workflowState', 'in', ['active', 'escalated']),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => mapAlert(d.id, d.data() as Record<string, unknown>)));
    },
    (err) => {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  );
}

export function subscribeIncidentAlert(
  alertId: string,
  onData: (alert: IncidentAlert | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const ref = doc(getDb(), COLLECTION, alertId);
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      onData(mapAlert(snap.id, snap.data() as Record<string, unknown>));
    },
    (err) => {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  );
}

export function subscribeIncidentTasks(
  alertId: string,
  onData: (tasks: IncidentTask[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(getDb(), COLLECTION, alertId, TASKS_SUB),
    orderBy('sortOrder', 'asc')
  );
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => mapTask(d.id, d.data() as Record<string, unknown>)));
    },
    (err) => {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  );
}

export async function listIncidentTasks(alertId: string): Promise<IncidentTask[]> {
  try {
    const q = query(
      collection(getDb(), COLLECTION, alertId, TASKS_SUB),
      orderBy('sortOrder', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => mapTask(d.id, d.data() as Record<string, unknown>));
  } catch (error) {
    throw handleFirestoreError(error, `Failed to list tasks for ${alertId}`);
  }
}

export async function acknowledgeIncidentAlert(
  alertId: string,
  userId: string
): Promise<void> {
  try {
    const alert = await getIncidentAlertById(alertId);
    if (!alert) throw new Error('Alert not found');
    if (alert.acknowledgedBy.some((a) => a.userId === userId)) return;
    await updateDocument(
      COLLECTION,
      alertId,
      {
        acknowledgedBy: [
          ...alert.acknowledgedBy.map((a) => ({
            userId: a.userId,
            at: a.at instanceof Date ? Timestamp.fromDate(a.at) : a.at,
          })),
          { userId, at: Timestamp.now() },
        ],
      },
      userId
    );
  } catch (error) {
    throw handleFirestoreError(error, `Failed to acknowledge alert ${alertId}`);
  }
}

async function getTaskDoc(
  alertId: string,
  taskId: string
): Promise<IncidentTask | null> {
  const ref = doc(getDb(), COLLECTION, alertId, TASKS_SUB, taskId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return mapTask(snap.id, snap.data() as Record<string, unknown>);
}

async function updateTaskDoc(
  alertId: string,
  taskId: string,
  data: Record<string, unknown>,
  userId: string
): Promise<void> {
  const ref = doc(getDb(), COLLECTION, alertId, TASKS_SUB, taskId);
  await updateDoc(ref, updateBaseEntityFields(stripUndefined(data), userId));
}

export async function claimIncidentTask(
  alertId: string,
  taskId: string,
  userId: string
): Promise<void> {
  try {
    const task = await getTaskDoc(alertId, taskId);
    if (!task) throw new Error('Task not found');
    if (task.status !== 'open') throw new Error('Task is not open');
    await updateTaskDoc(
      alertId,
      taskId,
      {
        status: 'claimed',
        claimedBy: userId,
        claimedAt: Timestamp.now(),
      },
      userId
    );
  } catch (error) {
    throw handleFirestoreError(error, `Failed to claim task ${taskId}`);
  }
}

export async function completeIncidentTask(
  alertId: string,
  taskId: string,
  userId: string
): Promise<void> {
  try {
    const task = await getTaskDoc(alertId, taskId);
    if (!task) throw new Error('Task not found');
    if (task.status === 'done') return;
    await updateTaskDoc(
      alertId,
      taskId,
      {
        status: 'done',
        claimedBy: task.claimedBy ?? userId,
        claimedAt: task.claimedAt
          ? task.claimedAt instanceof Date
            ? Timestamp.fromDate(task.claimedAt)
            : task.claimedAt
          : Timestamp.now(),
        completedBy: userId,
        completedAt: Timestamp.now(),
      },
      userId
    );
  } catch (error) {
    throw handleFirestoreError(error, `Failed to complete task ${taskId}`);
  }
}

export async function reassignIncidentTask(
  alertId: string,
  taskId: string,
  assigneeUserId: string,
  updatedBy: string
): Promise<void> {
  try {
    await updateTaskDoc(
      alertId,
      taskId,
      {
        status: 'claimed',
        claimedBy: assigneeUserId,
        claimedAt: Timestamp.now(),
        completedBy: null,
        completedAt: null,
      },
      updatedBy
    );
  } catch (error) {
    throw handleFirestoreError(error, `Failed to reassign task ${taskId}`);
  }
}

/**
 * Company Commander only — adds Bn CO / XO / SgtMaj to notifiedUserIds.
 * Role is verified by fetching the escalator's user profile.
 */
export async function escalateIncidentAlert(
  alertId: string,
  userId: string
): Promise<IncidentEscalationLevel> {
  try {
    const alert = await getIncidentAlertById(alertId);
    if (!alert) throw new Error('Alert not found');
    if (alert.workflowState === 'resolved' || alert.workflowState === 'cancelled') {
      throw new Error('Alert is closed');
    }
    const next = nextEscalation(alert.escalationLevel);
    if (!next) return alert.escalationLevel;
    if (next !== 'battalion') {
      throw new Error('Only battalion escalation is supported');
    }

    const profile = await getUserProfileById(userId);
    if (profile?.role !== 'company_commander') {
      throw new Error('Only the Company Commander can notify battalion leadership');
    }

    const additional = await resolveBattalionLeadershipRecipients(
      alert.organizationalScope
    );
    const notifiedUserIds = Array.from(
      new Set([...(alert.notifiedUserIds ?? []), ...additional])
    );

    await updateDocument(
      COLLECTION,
      alertId,
      {
        escalationLevel: next,
        workflowState: 'escalated',
        notifiedUserIds,
      },
      userId
    );
    return next;
  } catch (error) {
    throw handleFirestoreError(error, `Failed to escalate alert ${alertId}`);
  }
}

export async function resolveIncidentAlert(
  alertId: string,
  userId: string
): Promise<void> {
  try {
    await updateDocument(
      COLLECTION,
      alertId,
      {
        workflowState: 'resolved',
        resolvedAt: Timestamp.now(),
        resolvedBy: userId,
      },
      userId
    );
  } catch (error) {
    throw handleFirestoreError(error, `Failed to resolve alert ${alertId}`);
  }
}

export async function cancelIncidentAlert(
  alertId: string,
  userId: string
): Promise<void> {
  try {
    await updateDocument(
      COLLECTION,
      alertId,
      {
        workflowState: 'cancelled',
        cancelledAt: Timestamp.now(),
      },
      userId
    );
  } catch (error) {
    throw handleFirestoreError(error, `Failed to cancel alert ${alertId}`);
  }
}

export { escalationRank, nextEscalation };
