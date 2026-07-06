#!/usr/bin/env node
/**
 * Sprint 27 client-sdk E2E — bypasses Admin SDK (uses Auth REST + Firestore client).
 * Prerequisite: node scripts/sprint27-create-e2e-user.mjs
 * Usage: node scripts/sprint27-client-e2e.mjs [recruitId]
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
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const E2E_EMAIL = 's27-e2e@countcard.test';
const E2E_PASSWORD = 'Sprint27-E2e!Test';
const RECRUIT_ID = process.argv[2] || 'edipi-9991234567';
const DEST = { regiment: 'West', battalion: '2nd', company: 'Golf', series: 'Lead', platoon: '2001' };

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

console.log(`\nSprint 27 client E2E — recruit ${RECRUIT_ID}\n`);

try {
  await signInWithEmailAndPassword(auth, E2E_EMAIL, E2E_PASSWORD);
  pass('Signed in as E2E user');

  const recruitRef = doc(db, 'recruits', RECRUIT_ID);
  let recruitSnap = await getDoc(recruitRef);
  if (!recruitSnap.exists()) {
    fail('Recruit exists', 'not found — run browser intake first');
    process.exit(1);
  }
  let recruit = recruitSnap.data();
  pass(`Recruit loaded (${recruit.custodyPhase ?? 'unset'})`);

  if (recruit.custodyPhase !== 'receiving_ready') {
    const checklist = [
      'immunizations', 'vision', 'dental', 'drug_test', 'other',
    ].map((item) => ({ item, completed: true, completedAt: new Date() }));
    await updateDoc(recruitRef, {
      receivingChecklist: checklist,
      custodyPhase: 'receiving_ready',
      updatedAt: serverTimestamp(),
    });
    recruitSnap = await getDoc(recruitRef);
    recruit = recruitSnap.data();
    pass('Marked recruit receiving_ready');
  } else {
    pass('Recruit already receiving_ready');
  }

  const batchId = `tb-e2e-${Date.now()}`;
  await setDoc(doc(db, 'transferBatches', batchId), {
    transferBatchId: batchId,
    pickupWeek: '2026-W28',
    regiment: 'West',
    status: 'draft',
    sourceAssignment: { battalion: 'Support', company: 'Receiving', platoon: '001' },
    destinationAssignment: DEST,
    recruitIds: [RECRUIT_ID],
    workflowHistory: [{ action: 'created', timestamp: new Date(), userId: auth.currentUser.uid }],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: auth.currentUser.uid,
  });
  pass('Created draft transfer batch');

  await updateDoc(doc(db, 'transferBatches', batchId), {
    status: 'published',
    publishedAt: serverTimestamp(),
    publishedBy: auth.currentUser.uid,
    workflowHistory: arrayUnion({ action: 'published', timestamp: new Date(), userId: auth.currentUser.uid }),
    updatedAt: serverTimestamp(),
  });
  await updateDoc(recruitRef, {
    custodyPhase: 'transfer_pending',
    intendedAssignment: DEST,
    activeTransferBatchId: batchId,
    updatedAt: serverTimestamp(),
  });
  pass('Published batch');

  await updateDoc(doc(db, 'transferBatches', batchId), {
    status: 'first_sgt_review',
    initiatedAt: serverTimestamp(),
    initiatedBy: auth.currentUser.uid,
    workflowHistory: arrayUnion({ action: 'initiated', timestamp: new Date(), userId: auth.currentUser.uid }),
    updatedAt: serverTimestamp(),
  });
  await updateDoc(recruitRef, { custodyPhase: 'in_transit', updatedAt: serverTimestamp() });
  pass('Initiated batch (first_sgt_review)');

  await updateDoc(doc(db, 'transferBatches', batchId), {
    status: 'cdi_review',
    workflowHistory: arrayUnion({ action: 'first_sgt_review', timestamp: new Date(), userId: auth.currentUser.uid }),
    updatedAt: serverTimestamp(),
  });
  pass('1st Sgt review (cdi_review)');

  await updateDoc(doc(db, 'transferBatches', batchId), {
    status: 'sdi_accept',
    workflowHistory: arrayUnion({ action: 'cdi_review', timestamp: new Date(), userId: auth.currentUser.uid }),
    updatedAt: serverTimestamp(),
  });
  pass('CDI review (sdi_accept)');

  const transferEntry = {
    fromAssignment: Object.fromEntries(
      Object.entries({
        regiment: recruit.regiment,
        battalion: recruit.battalion,
        company: recruit.company,
        series: recruit.series,
        platoon: recruit.platoon,
      }).filter(([, v]) => v !== undefined)
    ),
    toAssignment: DEST,
    timestamp: new Date(),
    transferredBy: auth.currentUser.uid,
    reason: `Custody accepted from transfer batch ${batchId}`,
  };
  await updateDoc(doc(db, 'transferBatches', batchId), {
    status: 'completed',
    completedAt: serverTimestamp(),
    completedBy: auth.currentUser.uid,
    workflowHistory: arrayUnion({ action: 'sdi_accept', timestamp: new Date(), userId: auth.currentUser.uid }),
    updatedAt: serverTimestamp(),
  });
  await updateDoc(recruitRef, {
    regiment: DEST.regiment,
    battalion: DEST.battalion,
    company: DEST.company,
    series: DEST.series,
    platoon: DEST.platoon,
    custodyPhase: 'training',
    status: 'active',
    intendedAssignment: null,
    activeTransferBatchId: null,
    transferHistory: arrayUnion(transferEntry),
    updatedAt: serverTimestamp(),
  });
  pass('Accepted custody → training');

  recruitSnap = await getDoc(recruitRef);
  recruit = recruitSnap.data();
  if (recruit.custodyPhase === 'training' && recruit.company === 'Golf' && recruit.transferHistory?.length) {
    pass('Recruit at destination with transfer history');
  } else {
    fail('Post-accept state', JSON.stringify({ phase: recruit.custodyPhase, company: recruit.company }));
  }

  await addDoc(collection(db, 'recruits', RECRUIT_ID, 'progressEvents'), {
    type: 'pft',
    scores: { pullUps: 15, plankSeconds: 120 },
    passFail: true,
    notes: 'E2E PFT',
    recordedBy: auth.currentUser.uid,
    recordedAt: serverTimestamp(),
  });
  pass('Added progress event');

  await addDoc(collection(db, 'recruits', RECRUIT_ID, 'comments'), {
    body: 'E2E comment one',
    category: 'general',
    authorId: auth.currentUser.uid,
    createdAt: serverTimestamp(),
  });
  await addDoc(collection(db, 'recruits', RECRUIT_ID, 'comments'), {
    body: 'E2E comment two',
    category: 'general',
    authorId: auth.currentUser.uid,
    createdAt: serverTimestamp(),
  });
  pass('Appended comments');

  const cardId = `dic-e2e-${Date.now()}`;
  await setDoc(doc(db, 'diLeadershipCards', cardId), {
    cardId,
    subjectUserId: auth.currentUser.uid,
    authorRole: 'sdi',
    cardType: 'digital_form',
    summary: 'E2E DI card',
    workflowState: 'draft',
    recommendations: [{ text: 'Rec one', authorId: auth.currentUser.uid, createdAt: new Date() }],
    organizationalAssignment: DEST,
    createdBy: auth.currentUser.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'diLeadershipCards', cardId), {
    recommendations: arrayUnion({ text: 'Rec two', authorId: auth.currentUser.uid, createdAt: new Date() }),
  });
  pass('DI leadership card + recommendations');

  const convId = `conv-e2e-${Date.now()}`;
  await setDoc(doc(db, 'conversations', convId), {
    conversationType: 'company_channel',
    organizationalScope: { regiment: 'West', battalion: '2nd', company: 'Golf' },
    participants: [auth.currentUser.uid],
    createdBy: auth.currentUser.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  pass('Created company channel conversation');

  console.log(`\nBatch ID: ${batchId}`);
  console.log(`Recruit: http://localhost:8081/recruits/${RECRUIT_ID}`);
} catch (err) {
  fail('Unexpected', err.message);
}

const failed = results.filter((r) => !r[0]);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) process.exit(1);
console.log('\nClient E2E complete.\n');
