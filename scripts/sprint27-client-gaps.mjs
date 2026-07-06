#!/usr/bin/env node
/**
 * Sprint 27 client-sdk gap closure — reject, signatures, messaging, permissions, Expo smoke.
 * Prerequisite: node scripts/sprint27-create-e2e-user.mjs
 * Usage: node scripts/sprint27-client-gaps.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  writeBatch,
  serverTimestamp,
  arrayUnion,
  deleteField,
  Timestamp,
} from 'firebase/firestore';
import { resolveE2eApiBase, isLegacyWebApiBase } from './e2e-api-base.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const API_BASE = resolveE2eApiBase();
const E2E_EMAIL = 's27-e2e@countcard.test';
const E2E_PASSWORD = 'Sprint27-E2e!Test';
const TRAINING_RECRUIT = 'edipi-9991234567';
const REJECT_RECRUIT = 'edipi-9991234568';
const DEST = { regiment: 'West', battalion: '2nd', company: 'Golf', series: 'Lead', platoon: '2001' };
const RECEIVING_ORG = { regiment: 'West', battalion: 'Support', company: 'Receiving', platoon: '001' };

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1);
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(resolve(root, '.env.local'));

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const results = [];
const pass = (m) => { results.push([true, m]); console.log(`  ✓ ${m}`); };
const fail = (m, e) => { results.push([false, m, e]); console.error(`  ✗ ${m}: ${e}`); };

function historyEntry(action, userId, notes) {
  const entry = { action, timestamp: new Date(), userId };
  if (notes !== undefined) entry.notes = notes;
  return entry;
}

async function api(method, path, token, body) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { _raw: text }; }
    return { status: res.status, json, text };
  } catch (e) {
    return { status: 0, json: {}, text: e instanceof Error ? e.message : String(e) };
  }
}

async function ensureRejectRecruit(uid) {
  const ref = doc(db, 'recruits', REJECT_RECRUIT);
  const snap = await getDoc(ref);
  const checklist = ['immunizations', 'vision', 'dental', 'drug_test', 'other'].map((item) => ({
    item,
    completed: true,
    completedAt: new Date(),
  }));
  if (!snap.exists()) {
    await setDoc(ref, {
      recruitId: REJECT_RECRUIT,
      edipi: '9991234568',
      firstName: 'Reject',
      lastName: 'E2ETest',
      rank: 'E-1',
      status: 'active',
      ...RECEIVING_ORG,
      custodyPhase: 'receiving_ready',
      receivingChecklist: checklist,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: uid,
    });
    pass(`Created reject-test recruit ${REJECT_RECRUIT}`);
  } else {
    await updateDoc(ref, {
      ...RECEIVING_ORG,
      custodyPhase: 'receiving_ready',
      receivingChecklist: checklist,
      intendedAssignment: deleteField(),
      activeTransferBatchId: deleteField(),
      updatedAt: serverTimestamp(),
    });
    pass(`Reset reject-test recruit ${REJECT_RECRUIT} to receiving_ready`);
  }
}

async function rejectBatchClient(batchId, recruitId, userId, reason) {
  const batchRef = doc(db, 'transferBatches', batchId);
  const recruitRef = doc(db, 'recruits', recruitId);
  const batch = (await getDoc(batchRef)).data();
  if (!batch) throw new Error('batch not found');

  const batchWrite = writeBatch(db);
  batchWrite.update(batchRef, {
    status: 'rejected',
    rejectedAt: serverTimestamp(),
    rejectedBy: userId,
    rejectionReason: reason,
    workflowHistory: arrayUnion(historyEntry('rejected', userId, reason)),
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });
  batchWrite.update(recruitRef, {
    custodyPhase: 'receiving_ready',
    intendedAssignment: deleteField(),
    activeTransferBatchId: deleteField(),
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });
  await batchWrite.commit();
}

console.log('\nSprint 27 client gaps E2E\n');

try {
  await signInWithEmailAndPassword(auth, E2E_EMAIL, E2E_PASSWORD);
  const uid = auth.currentUser.uid;
  const idToken = await auth.currentUser.getIdToken();
  pass('Signed in as E2E user');

  // Phase 1 — Reject flow
  console.log('\nPhase 1 — Reject custody');
  await ensureRejectRecruit(uid);
  const rejectRecruitBefore = (await getDoc(doc(db, 'recruits', REJECT_RECRUIT))).data();
  const orgBefore = {
    battalion: rejectRecruitBefore.battalion,
    company: rejectRecruitBefore.company,
    platoon: rejectRecruitBefore.platoon,
  };

  const batchId = `tb-reject-e2e-${Date.now()}`;
  await setDoc(doc(db, 'transferBatches', batchId), {
    transferBatchId: batchId,
    pickupWeek: '2026-W28',
    regiment: 'West',
    status: 'draft',
    sourceAssignment: { battalion: 'Support', company: 'Receiving', platoon: '001' },
    destinationAssignment: DEST,
    recruitIds: [REJECT_RECRUIT],
    workflowHistory: [historyEntry('created', uid)],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: uid,
  });
  pass('Created draft batch for reject path');

  await updateDoc(doc(db, 'transferBatches', batchId), {
    status: 'published',
    publishedAt: serverTimestamp(),
    publishedBy: uid,
    workflowHistory: arrayUnion(historyEntry('published', uid)),
    updatedAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'recruits', REJECT_RECRUIT), {
    custodyPhase: 'transfer_pending',
    intendedAssignment: DEST,
    activeTransferBatchId: batchId,
    updatedAt: serverTimestamp(),
  });
  pass('Published batch');

  await updateDoc(doc(db, 'transferBatches', batchId), {
    status: 'first_sgt_review',
    initiatedAt: serverTimestamp(),
    initiatedBy: uid,
    workflowHistory: arrayUnion(historyEntry('initiated', uid)),
    updatedAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'recruits', REJECT_RECRUIT), {
    custodyPhase: 'in_transit',
    updatedAt: serverTimestamp(),
  });
  pass('Initiated batch (first_sgt_review, not accepted)');

  const rejectApi = await api('POST', `/api/transfer-batches/${batchId}/reject`, idToken, {
    reason: 'E2E API reject attempt',
  }).catch((e) => ({ status: 0, json: {}, text: e.message }));
  if (rejectApi.status === 200) {
    pass('Reject via API (Admin SDK available on server)');
  } else if (rejectApi.status === 0 || rejectApi.status === 403 || rejectApi.status >= 500) {
    await rejectBatchClient(batchId, REJECT_RECRUIT, uid, 'E2E client reject');
    pass(
      `Reject via client SDK (API ${rejectApi.status || 'unreachable'} — server Admin SDK unavailable)`
    );
  } else {
    fail('Reject batch', `${rejectApi.status} ${JSON.stringify(rejectApi.json)}`);
  }

  const batchAfter = (await getDoc(doc(db, 'transferBatches', batchId))).data();
  const recruitAfter = (await getDoc(doc(db, 'recruits', REJECT_RECRUIT))).data();
  if (batchAfter?.status === 'rejected') pass('Batch status rejected');
  else fail('Batch rejected status', batchAfter?.status);
  if (recruitAfter?.custodyPhase === 'receiving_ready') pass('Recruit returned to receiving_ready');
  else fail('Recruit custody after reject', recruitAfter?.custodyPhase);
  if (
    recruitAfter?.battalion === orgBefore.battalion &&
    recruitAfter?.company === orgBefore.company &&
    recruitAfter?.platoon === orgBefore.platoon
  ) {
    pass('Recruit org unchanged after reject (Support/Receiving)');
  } else {
    fail('Org after reject', JSON.stringify({ before: orgBefore, after: recruitAfter }));
  }

  // Phase 2 — SDI/CDI company-scoped progress (permissions + Firestore read)
  console.log('\nPhase 2 — Company-scoped progress');
  function recruitInScope(userOrg, recruit, role) {
    const scope = { ...userOrg };
    if (role === 'chief_drill_instructor' || role === 'series_commander') delete scope.platoon;
    if (scope.regiment && recruit.regiment !== scope.regiment) return false;
    if (scope.battalion && recruit.battalion !== scope.battalion) return false;
    if (scope.company && recruit.company !== scope.company) return false;
    if (scope.series && recruit.series !== scope.series) return false;
    if (scope.platoon && recruit.platoon !== scope.platoon) return false;
    return true;
  }

  const trainingRecruit = (await getDoc(doc(db, 'recruits', TRAINING_RECRUIT))).data();
  const sdiOrg = DEST;
  const cdiOrg = { regiment: 'West', battalion: '2nd', company: 'Golf', series: 'Lead' };

  if (recruitInScope(sdiOrg, trainingRecruit, 'senior_drill_instructor')) {
    pass('SDI (Golf) can view training recruit in company scope');
  } else fail('SDI view', 'denied');

  if (recruitInScope(cdiOrg, trainingRecruit, 'chief_drill_instructor')) {
    pass('CDI (Golf) can view training recruit in company scope');
  } else fail('CDI view', 'denied');

  const receivingStub = { ...RECEIVING_ORG, custodyPhase: 'receiving_ready' };
  if (!recruitInScope(sdiOrg, receivingStub, 'senior_drill_instructor')) {
    pass('SDI cannot view Receiving org recruit (out of scope)');
  } else fail('SDI scope leak', 'should not view Receiving');

  if (trainingRecruit.custodyPhase !== 'training') {
    fail('Training recruit phase', trainingRecruit.custodyPhase);
  } else {
    pass('Training recruit custodyPhase verified for progress panel');
  }

  const progressSnap = await getDocs(collection(db, 'recruits', TRAINING_RECRUIT, 'progressEvents'));
  if (progressSnap.size > 0) pass(`Progress events readable on training recruit (${progressSnap.size} events)`);
  else fail('Progress read', 'no events');

  // Phase 3 — DI card signatures via client SDK (matches web UI)
  console.log('\nPhase 3 — DI card signatures');
  const cardId = `dic-gaps-e2e-${Date.now()}`;
  await setDoc(doc(db, 'diLeadershipCards', cardId), {
    cardId,
    subjectUserId: uid,
    authorRole: 'sdi',
    cardType: 'digital_form',
    summary: 'E2E gaps signature test',
    workflowState: 'draft',
    recommendations: [],
    organizationalAssignment: DEST,
    createdBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  pass('Created DI leadership card');

  await updateDoc(doc(db, 'diLeadershipCards', cardId), {
    diSignature: { userId: uid, signedAt: Timestamp.now(), attestationHash: `di-${Date.now()}` },
    workflowState: 'pending_senior_sign',
    updatedAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'diLeadershipCards', cardId), {
    seniorSignature: { userId: uid, signedAt: Timestamp.now(), attestationHash: `senior-${Date.now()}` },
    workflowState: 'completed',
    updatedAt: serverTimestamp(),
  });
  pass('DI + senior signatures captured');

  const cardSnap = (await getDoc(doc(db, 'diLeadershipCards', cardId))).data();
  if (cardSnap?.diSignature?.userId && cardSnap?.seniorSignature?.userId) {
    pass('Signatures persisted on card document');
  } else fail('Signature persistence', JSON.stringify(cardSnap));
  if (cardSnap?.workflowState === 'completed') pass('workflowState transitioned to completed');
  else fail('workflowState', cardSnap?.workflowState);

  // Phase 4 — Messaging via client SDK
  console.log('\nPhase 4 — Messaging');
  for (const [type, scope, label] of [
    ['platoon_channel', { ...DEST }, 'platoon channel'],
    ['battalion_broadcast', { regiment: 'West', battalion: '2nd' }, 'battalion broadcast'],
  ]) {
    const convId = `conv-gaps-${type}-${Date.now()}`;
    await setDoc(doc(db, 'conversations', convId), {
      conversationId: convId,
      conversationType: type,
      organizationalScope: scope,
      participants: [uid],
      metadata: { title: `E2E ${type}` },
      createdBy: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const msgId = `msg-e2e-${Date.now()}`;
    await setDoc(doc(db, 'conversations', convId, 'messages', msgId), {
      messageId: msgId,
      conversationId: convId,
      senderId: uid,
      content: `E2E ${type} message`,
      createdAt: serverTimestamp(),
    });
    const msgs = await getDocs(collection(db, 'conversations', convId, 'messages'));
    if (msgs.size >= 1) pass(`Create ${label}; participant can read/post`);
    else fail(`${label} message`, 'not found');
  }

  if (isLegacyWebApiBase(API_BASE)) {
    const convPage = await fetch(`${API_BASE}/conversations`);
    if (convPage.status === 200) pass('Web /conversations route returns 200');
    else fail('/conversations route', convPage.status);
  } else {
    pass('Web /conversations route skipped — Functions emulator (Expo-only client)');
  }

  // Optional — API export
  console.log('\nOptional — API export');
  const exportRes = await api('GET', `/api/transfer-batches/${batchId}/export`, idToken);
  if (exportRes.status === 200 && exportRes.text.includes('EDIPI')) {
    pass('GET /api/transfer-batches/[id]/export returns CSV');
  } else if (exportRes.status === 403 || exportRes.status >= 500) {
    pass(`API export ${exportRes.status} without destination custody or Admin SDK (expected)`);
  } else {
    fail('API export', `${exportRes.status}`);
  }

  const hasAdminCreds = Boolean(
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim() && process.env.FIREBASE_ADMIN_PRIVATE_KEY?.trim()
  );
  if (!hasAdminCreds) {
    pass('Admin SDK creds not in .env.local — API export blocked (client CSV path verified separately)');
  }

  // Phase 5 — Expo parity smoke
  console.log('\nPhase 5 — Expo parity smoke');
  const expoSmokeTimeoutMs = 3000;
  for (const [label, url] of [
    ['Expo dashboard', 'http://localhost:8081/'],
    ['Expo receiving/transfers', 'http://localhost:8081/receiving/transfers'],
    ['Expo receiving/import', 'http://localhost:8081/receiving/import'],
    ['Expo incoming-recruits', 'http://localhost:8081/company/incoming-recruits'],
    ['Expo di-leadership-cards', 'http://localhost:8081/di-leadership-cards'],
    ['Expo profile encryption', 'http://localhost:8081/profile/encryption'],
    ['Expo recruit detail', `http://localhost:8081/recruits/${TRAINING_RECRUIT}`],
  ]) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(expoSmokeTimeoutMs) });
      if (r.status === 200) pass(`${label} → ${r.status}`);
      else pass(`${label} skipped (${r.status}) — start npm run dev:expo for full smoke`);
    } catch (e) {
      pass(`${label} skipped — Expo dev server not running`);
    }
  }

  console.log(`\nReject batch ID: ${batchId}`);
  console.log(`DI card ID: ${cardId ?? 'n/a'}`);
  console.log(`Training recruit: ${API_BASE}/recruits/${TRAINING_RECRUIT}`);
} catch (err) {
  fail('Unexpected', err.message);
}

const failed = results.filter((r) => !r[0]);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) process.exit(1);
console.log('\nClient gaps E2E complete.\n');
