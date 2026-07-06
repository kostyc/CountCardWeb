#!/usr/bin/env node
/**
 * Import Kilo fixture via API (same rows as /receiving/import xlsx upload).
 * Prerequisite: ./scripts/verify-countcard-auth.sh && npm run dev:functions
 *
 * Usage: node scripts/kilo-fixture-manual-flow.mjs [--keep]
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import * as XLSX from 'xlsx';
import { parseRecruitImportSheet, normalizeImportRowForCommit } from '../packages/core/src/import/recruitExcelImport.ts';
import { resolveE2eApiBase } from './e2e-api-base.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const fixture = resolve(root, 'sprints/Sprint-27-Recruit-Lifecycle/fixtures/kilo-receiving-import-5.xlsx');
const keep = process.argv.includes('--keep');
const API_BASE = resolveE2eApiBase();
const runId = `fixture-${Date.now().toString(36)}`;

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
const E2E_EMAIL = 's27-e2e@countcard.test';
const E2E_PASSWORD = 'Sprint27-E2e!Test';

if (!apiKey) {
  console.error('NEXT_PUBLIC_FIREBASE_API_KEY required');
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

const db = getFirestore();
const auth = getAuth();

const KILO_LEAD = { regiment: 'West', battalion: '3rd', company: 'Kilo', series: 'Lead', platoon: '3001' };
const KILO_FOLLOW = { regiment: 'West', battalion: '3rd', company: 'Kilo', series: 'Follow', platoon: '3003' };

const DEST_BY_RECRUIT_ID = {
  'edipi-8870100001': KILO_LEAD,
  'edipi-8870100002': KILO_LEAD,
  'edipi-8870100003': KILO_LEAD,
  'edipi-8870100004': KILO_FOLLOW,
  'edipi-8870100005': KILO_FOLLOW,
};

async function idToken() {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: E2E_EMAIL, password: E2E_PASSWORD, returnSecureToken: true }),
    }
  );
  const data = await res.json();
  if (!data.idToken) throw new Error(data.error?.message || 'sign-in failed');
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
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

function parseFixtureRows() {
  const wb = XLSX.read(readFileSync(fixture));
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const parsed = parseRecruitImportSheet(aoa, {
    regiment: 'West',
    battalion: 'Support',
    company: 'Receiving',
    platoon: '0000',
  });
  if (parsed.errors.length) throw new Error(JSON.stringify(parsed.errors));
  return parsed.rows.map((r) => normalizeImportRowForCommit(r));
}

function defaultChecklist() {
  return ['immunizations', 'vision', 'dental', 'drug_test', 'other'].map((item) => ({
    item,
    completed: true,
    completedAt: new Date(),
  }));
}

const recruitIds = [];
const batchIds = [];

console.log(`\nKilo fixture manual flow (${runId})\n`);

try {
  const token = await idToken();
  const rows = parseFixtureRows();
  console.log(`Parsed ${rows.length} rows from fixture`);

  const importRes = await api('POST', '/api/recruits/import', token, {
    receivingMode: true,
    dryRun: false,
    rows,
  });
  if (importRes.status !== 200 || importRes.json.summary?.created !== rows.length) {
    throw new Error(`import: ${importRes.status} ${JSON.stringify(importRes.json)}`);
  }
  console.log('✓ Imported 5 recruits (receivingMode)');

  for (const row of rows) {
    recruitIds.push(row.recruitId);
    const snap = (await db.collection('recruits').doc(row.recruitId).get()).data();
    if (snap?.custodyPhase !== 'receiving') throw new Error(`${row.recruitId} not receiving`);
  }
  console.log('✓ custodyPhase: receiving + checklist');

  for (const recruitId of recruitIds) {
    await db.collection('recruits').doc(recruitId).update({
      receivingChecklist: defaultChecklist(),
      custodyPhase: 'receiving_ready',
      updatedAt: Timestamp.now(),
    });
  }
  console.log('✓ All receiving_ready (use /receiving/intake checklist UI to verify manually)');

  const leadIds = recruitIds.filter((id) => DEST_BY_RECRUIT_ID[id].platoon === '3001');
  const followIds = recruitIds.filter((id) => DEST_BY_RECRUIT_ID[id].platoon === '3003');

  for (const [label, ids, dest] of [
    ['Lead-3001', leadIds, KILO_LEAD],
    ['Follow-3003', followIds, KILO_FOLLOW],
  ]) {
    const createRes = await api('POST', '/api/transfer-batches', token, {
      pickupWeek: `2026-Kilo-${label}`,
      regiment: 'West',
      destinationAssignment: dest,
      recruitIds: ids,
      notes: `Fixture flow ${runId} ${label}`,
    });
    const batchId = createRes.json.transferBatchId;
    batchIds.push(batchId);
    for (const step of ['publish', 'initiate', 'first-sgt-review', 'cdi-review', 'accept']) {
      const res = await api('POST', `/api/transfer-batches/${batchId}/${step}`, token);
      if (res.status !== 200) throw new Error(`${label} ${step}: ${res.status}`);
    }
    console.log(`✓ Batch ${label} → training at ${dest.platoon}`);
  }

  console.log('\nRecruit IDs:', recruitIds.join(', '));
  console.log('Batch IDs:', batchIds.join(', '));
  console.log('\nBrowser checks:');
  console.log('  /recruits/edipi-8870100001 — Kilo 3001, training');
  console.log('  /recruits/edipi-8870100004 — Kilo 3003, training');
  console.log('  /receiving/transfers — no ready recruits left');
} catch (err) {
  console.error('Fatal:', err);
  process.exitCode = 1;
} finally {
  if (!keep && process.exitCode) {
    for (const id of recruitIds) await db.collection('recruits').doc(id).delete().catch(() => {});
    for (const id of batchIds) await db.collection('transferBatches').doc(id).delete().catch(() => {});
  }
}
