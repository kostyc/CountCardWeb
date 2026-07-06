#!/usr/bin/env node
/**
 * Kilo Company (3rd Bn) receiving ingestion E2E — 5 recruits, staged custody review.
 *
 * Prerequisite: ./scripts/verify-countcard-auth.sh && npm run dev:functions
 * Usage: node scripts/kilo-receiving-e2e.mjs [--keep]
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { resolveE2eApiBase } from './e2e-api-base.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const keep = process.argv.includes('--keep');
const API_BASE = resolveE2eApiBase();
const runId = Date.now().toString(36);

const results = [];
function pass(label) {
  results.push({ label, ok: true });
  console.log(`  ✓ ${label}`);
}
function fail(label, err) {
  results.push({ label, ok: false, err: String(err) });
  console.error(`  ✗ ${label}: ${err}`);
}

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

const projectId =
  process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'countcard-94c5b';
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (!apiKey) {
  console.error('NEXT_PUBLIC_FIREBASE_API_KEY required in .env.local');
  process.exit(1);
}

if (getApps().length === 0) {
  const hasCreds =
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (hasCreds) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
      projectId,
    });
  } else {
    const { applicationDefault } = await import('firebase-admin/app');
    initializeApp({ credential: applicationDefault(), projectId });
  }
}

const auth = getAuth();
const db = getFirestore();
if (process.env.FIRESTORE_DATABASE_ID) {
  db.settings({ databaseId: process.env.FIRESTORE_DATABASE_ID });
}

const RECEIVING_ORG = {
  regiment: 'West',
  battalion: 'Support',
  company: 'Receiving',
  platoon: '0000',
};

const KILO_LEAD = {
  regiment: 'West',
  battalion: '3rd',
  company: 'Kilo',
  series: 'Lead',
  platoon: '3001',
};

const KILO_FOLLOW = {
  regiment: 'West',
  battalion: '3rd',
  company: 'Kilo',
  series: 'Follow',
  platoon: '3003',
};

const RECRUIT_SPECS = [
  { suffix: '01', lastName: 'KiloAlpha', dest: KILO_LEAD },
  { suffix: '02', lastName: 'KiloBravo', dest: KILO_LEAD },
  { suffix: '03', lastName: 'KiloCharlie', dest: KILO_LEAD },
  { suffix: '04', lastName: 'KiloDelta', dest: KILO_FOLLOW },
  { suffix: '05', lastName: 'KiloEcho', dest: KILO_FOLLOW },
];

const testUsers = {
  receiving: {
    email: `kilo-receiving-${runId}@e2e.countcard.test`,
    claims: { role: 'drill_instructor', organizationalAssignment: RECEIVING_ORG },
  },
  firstSgt: {
    email: `kilo-1stsgt-${runId}@e2e.countcard.test`,
    claims: {
      role: 'company_first_sgt',
      organizationalAssignment: { regiment: 'West', battalion: '3rd', company: 'Kilo' },
    },
  },
  cdi: {
    email: `kilo-cdi-${runId}@e2e.countcard.test`,
    claims: {
      role: 'chief_drill_instructor',
      organizationalAssignment: { regiment: 'West', battalion: '3rd', company: 'Kilo' },
    },
  },
  sdiLead: {
    email: `kilo-sdi-lead-${runId}@e2e.countcard.test`,
    claims: {
      role: 'senior_drill_instructor',
      organizationalAssignment: KILO_LEAD,
    },
  },
  sdiFollow: {
    email: `kilo-sdi-follow-${runId}@e2e.countcard.test`,
    claims: {
      role: 'senior_drill_instructor',
      organizationalAssignment: KILO_FOLLOW,
    },
  },
};

const uids = {};
const recruitIds = [];
const batchIds = [];
const e2ePassword = `Kilo-${runId}!`;

async function ensureUser(key) {
  const spec = testUsers[key];
  let user;
  try {
    user = await auth.getUserByEmail(spec.email);
    await auth.updateUser(user.uid, { password: e2ePassword, emailVerified: true });
  } catch {
    user = await auth.createUser({ email: spec.email, password: e2ePassword, emailVerified: true });
  }
  await auth.setCustomUserClaims(user.uid, spec.claims);
  await db.collection('userProfiles').doc(user.uid).set(
    {
      email: spec.email,
      role: spec.claims.role,
      organizationalAssignment: spec.claims.organizationalAssignment,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  uids[key] = user.uid;
  return user.uid;
}

async function idTokenFor(key) {
  const spec = testUsers[key];
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: spec.email,
        password: e2ePassword,
        returnSecureToken: true,
      }),
    }
  );
  const data = await res.json();
  if (!data.idToken) throw new Error(data.error?.message || 'password sign-in failed');
  return data.idToken;
}

async function api(method, path, token, body) {
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
  try {
    json = JSON.parse(text);
  } catch {
    json = { _raw: text };
  }
  return { status: res.status, json, text };
}

function defaultChecklist(complete = true) {
  return ['immunizations', 'vision', 'dental', 'drug_test', 'other'].map((item) =>
    complete ? { item, completed: true, completedAt: new Date() } : { item, completed: false }
  );
}

async function seedRecruitsForReceiving() {
  const rows = RECRUIT_SPECS.map((spec, i) => {
    const edipi = `888${runId.slice(-5)}${spec.suffix}`.replace(/\D/g, '').slice(0, 10).padStart(10, '0');
    const recruitId = `kilo-e2e-${runId}-${spec.suffix}`;
    return {
      rowNumber: i + 1,
      recruitId,
      edipi,
      firstName: 'Test',
      lastName: spec.lastName,
      rank: 'E-1',
      status: 'active',
      regiment: 'West',
      battalion: 'Support',
      company: 'Receiving',
      platoon: '0000',
    };
  });

  const checklist = defaultChecklist(false);
  const now = Timestamp.now();
  for (const row of rows) {
    await db.collection('recruits').doc(row.recruitId).set({
      recruitId: row.recruitId,
      edipi: row.edipi,
      firstName: row.firstName,
      lastName: row.lastName,
      rank: row.rank,
      status: row.status,
      regiment: row.regiment,
      battalion: row.battalion,
      company: row.company,
      platoon: row.platoon,
      custodyPhase: 'receiving',
      receivingChecklist: checklist,
      createdAt: now,
      updatedAt: now,
      createdBy: uids.receiving,
    });
    const snap = (await db.collection('recruits').doc(row.recruitId).get()).data();
    if (snap?.custodyPhase !== 'receiving' || snap?.company !== 'Receiving') {
      throw new Error(`receiving seed state for ${row.recruitId}: ${JSON.stringify(snap)}`);
    }
    if (!Array.isArray(snap?.receivingChecklist) || snap.receivingChecklist.length < 5) {
      throw new Error(`missing default receiving checklist for ${row.recruitId}`);
    }
    recruitIds.push(row.recruitId);
  }
}

async function markReceivingReady(recruitId) {
  await db.collection('recruits').doc(recruitId).update({
    receivingChecklist: defaultChecklist(true),
    custodyPhase: 'receiving_ready',
    updatedAt: Timestamp.now(),
  });
}

async function runStagedBatchFlow({
  tokenReceiving,
  tokenFirstSgt,
  tokenCdi,
  tokenSdi,
  recruitIdsForBatch,
  destination,
  label,
}) {
  const createRes = await api('POST', '/api/transfer-batches', tokenReceiving, {
    pickupWeek: `2026-Kilo-${label}`,
    regiment: 'West',
    destinationAssignment: destination,
    recruitIds: recruitIdsForBatch,
    notes: `Kilo E2E ${runId} ${label}`,
  });
  if (createRes.status !== 200 || !createRes.json.transferBatchId) {
    throw new Error(`create batch ${label}: ${createRes.status} ${JSON.stringify(createRes.json)}`);
  }
  const batchId = createRes.json.transferBatchId;
  batchIds.push(batchId);
  pass(`Create transfer batch (${label})`);

  const pubRes = await api('POST', `/api/transfer-batches/${batchId}/publish`, tokenReceiving);
  if (pubRes.status !== 200) throw new Error(`publish ${label}: ${pubRes.status}`);
  pass(`Publish batch (${label})`);

  const initRes = await api('POST', `/api/transfer-batches/${batchId}/initiate`, tokenReceiving);
  if (initRes.status !== 200) throw new Error(`initiate ${label}: ${initRes.status}`);
  pass(`Initiate batch → first_sgt_review (${label})`);

  const batchAfterInit = (await db.collection('transferBatches').doc(batchId).get()).data();
  if (batchAfterInit?.status !== 'first_sgt_review') {
    throw new Error(`expected first_sgt_review, got ${batchAfterInit?.status}`);
  }
  for (const rid of recruitIdsForBatch) {
    const r = (await db.collection('recruits').doc(rid).get()).data();
    if (r?.custodyPhase !== 'in_transit') throw new Error(`recruit ${rid} not in_transit`);
  }
  pass(`Recruits in_transit after initiate (${label})`);

  const sgtRes = await api('POST', `/api/transfer-batches/${batchId}/first-sgt-review`, tokenFirstSgt);
  if (sgtRes.status !== 200) throw new Error(`1stSgt review ${label}: ${sgtRes.status}`);
  pass(`1st Sgt review → cdi_review (${label})`);

  const cdiRes = await api('POST', `/api/transfer-batches/${batchId}/cdi-review`, tokenCdi);
  if (cdiRes.status !== 200) throw new Error(`CDI review ${label}: ${cdiRes.status}`);
  pass(`CDI review → sdi_accept (${label})`);

  const acceptRes = await api('POST', `/api/transfer-batches/${batchId}/accept`, tokenSdi);
  if (acceptRes.status !== 200) throw new Error(`SDI accept ${label}: ${acceptRes.status}`);
  pass(`SDI accept → training (${label})`);

  const batchDone = (await db.collection('transferBatches').doc(batchId).get()).data();
  const history = batchDone?.workflowHistory?.map((h) => h.action) ?? [];
  const expected = ['created', 'published', 'initiated', 'first_sgt_review', 'cdi_review', 'sdi_accept'];
  if (!expected.every((a) => history.includes(a))) {
    throw new Error(`workflowHistory missing steps: ${history.join(', ')}`);
  }
  pass(`workflowHistory staged review chain (${label})`);

  for (const rid of recruitIdsForBatch) {
    const r = (await db.collection('recruits').doc(rid).get()).data();
    if (r?.custodyPhase !== 'training' || r?.company !== 'Kilo' || r?.platoon !== destination.platoon) {
      throw new Error(`post-accept ${rid}: ${JSON.stringify({ phase: r?.custodyPhase, platoon: r?.platoon })}`);
    }
  }
  pass(`Recruits at Kilo ${destination.platoon} training (${label})`);
}

async function cleanup() {
  if (keep) {
    console.log('\n--keep: test data retained');
    console.log('  recruitIds:', recruitIds.join(', '));
    console.log('  batchIds:', batchIds.join(', '));
    return;
  }
  for (const recruitId of recruitIds) {
    const progress = await db.collection('recruits').doc(recruitId).collection('progressEvents').get();
    for (const d of progress.docs) await d.ref.delete();
    await db.collection('recruits').doc(recruitId).delete().catch(() => {});
  }
  for (const batchId of batchIds) {
    await db.collection('transferBatches').doc(batchId).delete().catch(() => {});
  }
  for (const key of Object.keys(testUsers)) {
    if (uids[key]) await auth.deleteUser(uids[key]).catch(() => {});
  }
}

console.log(`\nKilo receiving E2E (${runId}) → ${API_BASE}\n`);

try {
  console.log('Setup');
  for (const key of Object.keys(testUsers)) await ensureUser(key);
  pass('Ephemeral Kilo + Receiving test users');

  const receivingToken = await idTokenFor('receiving');
  const firstSgtToken = await idTokenFor('firstSgt');
  const cdiToken = await idTokenFor('cdi');
  const sdiLeadToken = await idTokenFor('sdiLead');
  const sdiFollowToken = await idTokenFor('sdiFollow');
  pass('ID tokens exchanged');

  console.log('\nPhase 1 — Receiving recruits (Admin seed; mirrors receiving-mode import)');
  await seedRecruitsForReceiving();
  pass('5 recruits seeded with custodyPhase receiving + checklist');

  console.log('\nPhase 2 — Checklist → receiving_ready');
  for (const recruitId of recruitIds) {
    await markReceivingReady(recruitId);
  }
  pass('All 5 recruits marked receiving_ready');

  console.log('\nPhase 3 — Staged transfer to Kilo (Lead 3001 + Follow 3003)');
  const leadIds = recruitIds.filter((_, i) => RECRUIT_SPECS[i].dest.platoon === '3001');
  const followIds = recruitIds.filter((_, i) => RECRUIT_SPECS[i].dest.platoon === '3003');

  await runStagedBatchFlow({
    tokenReceiving: receivingToken,
    tokenFirstSgt: firstSgtToken,
    tokenCdi: cdiToken,
    tokenSdi: sdiLeadToken,
    recruitIdsForBatch: leadIds,
    destination: KILO_LEAD,
    label: 'Lead-3001',
  });

  await runStagedBatchFlow({
    tokenReceiving: receivingToken,
    tokenFirstSgt: firstSgtToken,
    tokenCdi: cdiToken,
    tokenSdi: sdiFollowToken,
    recruitIdsForBatch: followIds,
    destination: KILO_FOLLOW,
    label: 'Follow-3003',
  });
} catch (err) {
  console.error('\nFatal:', err);
  fail('Unexpected error', err.message);
} finally {
  await cleanup();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  console.error('\nFailed:');
  for (const f of failed) console.error(`  - ${f.label}: ${f.err}`);
  process.exit(1);
}
console.log('\nKilo receiving E2E complete.\n');
