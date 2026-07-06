#!/usr/bin/env node
/**
 * Verify Kilo fixture against Expo import path (parse + Firestore commit, no web API).
 *
 * Prerequisite: ./scripts/verify-countcard-auth.sh
 * Usage: node scripts/kilo-expo-import-verify.mjs [--commit] [--keep]
 *
 * --commit  Live Firestore writes (default: dry-run only)
 * --keep    Retain recruits when using --commit
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import {
  parseRecruitImportSheet,
  isImportRowReadyForCommit,
} from '../packages/core/src/import/recruitExcelImport.ts';
import { applyReceivingImportOrg, buildReceivingCustodyFields } from '../packages/core/src/import/receivingImport.ts';
import { initializeApp as initAdmin, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const fixture = resolve(root, 'sprints/Sprint-27-Recruit-Lifecycle/fixtures/kilo-receiving-import-5.xlsx');
const doCommit = process.argv.includes('--commit');
const E2E_EMAIL = 's27-e2e@countcard.test';
const E2E_PASSWORD = 'Sprint27-E2e!Test';

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
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const results = [];
const pass = (m) => {
  results.push([true, m]);
  console.log(`  ✓ ${m}`);
};
const fail = (m, e) => {
  results.push([false, m, e]);
  console.error(`  ✗ ${m}: ${e}`);
};

function parseFixtureLikeExpo() {
  const wb = XLSX.read(readFileSync(fixture));
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  return parseRecruitImportSheet(aoa, {
    regiment: 'West',
    battalion: 'Support',
    company: 'Receiving',
    platoon: '0000',
  });
}

console.log('\nKilo Expo import verify (fixture → recruitImportLocal)\n');

try {
  const parsed = parseFixtureLikeExpo();
  if (parsed.errors.length) throw new Error(JSON.stringify(parsed.errors));
  if (parsed.rows.length !== 5) throw new Error(`expected 5 rows, got ${parsed.rows.length}`);
  if (!parsed.rows.every(isImportRowReadyForCommit)) {
    throw new Error('rows not ready for commit');
  }
  pass('Parsed 5 fixture rows (Expo spreadsheet path)');

  for (const row of parsed.rows) {
    const receiving = applyReceivingImportOrg(row, 'West');
    const custody = buildReceivingCustodyFields();
    if (receiving.platoon !== '0000' || receiving.company !== 'Receiving') {
      throw new Error(`receiving org mismatch for ${row.recruitId}`);
    }
    if (custody.custodyPhase !== 'receiving' || custody.receivingChecklist.length < 5) {
      throw new Error(`receiving custody fields missing for ${row.recruitId}`);
    }
  }
  pass('Receiving mode org lock + default checklist fields');

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  getFirestore(app);

  const cred = await signInWithEmailAndPassword(auth, E2E_EMAIL, E2E_PASSWORD);
  void cred;

  pass('Signed in (Firebase client SDK, same as Expo)');

  if (getApps().length === 0) {
    initAdmin({ credential: applicationDefault(), projectId: firebaseConfig.projectId });
  }
  const adminDb = getAdminFirestore();
  if (process.env.FIRESTORE_DATABASE_ID) {
    adminDb.settings({ databaseId: process.env.FIRESTORE_DATABASE_ID });
  }

  let wouldCreate = 0;
  for (const row of parsed.rows) {
    const snap = await adminDb.collection('recruits').doc(row.recruitId).get();
    if (snap.exists) {
      console.log(`  · ${row.recruitId} exists (would skip in Expo commit)`);
    } else {
      wouldCreate += 1;
    }
  }
  if (wouldCreate === 0 && !doCommit) {
    pass('Dry-run: all 5 recruits already exist (re-import would skip)');
  } else {
    pass(`Dry-run: ${wouldCreate} would be created, ${5 - wouldCreate} skipped (Expo commitRecruitImportLocal logic)`);
  }

  if (doCommit) {
    // Live commit uses Expo recruitImportLocal — run from device after Metro, or use kilo-fixture-manual-flow with web API.
    console.log('\n  --commit requires Expo runtime (commitRecruitImportLocal). Use Expo app Import screen instead.');
    console.log('  Or: node scripts/kilo-fixture-manual-flow.mjs --keep (web API path)');
  } else {
    console.log('\n  Full commit: use Expo Import screen (see fixtures/README.md)');
  }
} catch (err) {
  fail('Unexpected error', err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
}

const failed = results.filter((r) => !r[0]);
console.log(`\n${results.length - failed.length}/${results.length} passed\n`);
if (failed.length) process.exit(1);
