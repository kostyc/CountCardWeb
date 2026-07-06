#!/usr/bin/env node
/**
 * Assign Golf company SDI or CDI custom claims to an existing user (not bootstrap admin).
 * Usage: node scripts/set-golf-scope-claims.mjs <email> [sdi|cdi]
 *
 * Requires valid FIREBASE_ADMIN_CLIENT_EMAIL + FIREBASE_ADMIN_PRIVATE_KEY in .env.local.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const email = (process.argv[2] || '').trim().toLowerCase();
const roleArg = (process.argv[3] || 'sdi').trim().toLowerCase();

if (!email) {
  console.error('Usage: node scripts/set-golf-scope-claims.mjs <email> [sdi|cdi]');
  process.exit(1);
}

const role =
  roleArg === 'cdi' || roleArg === 'chief_drill_instructor'
    ? 'chief_drill_instructor'
    : 'senior_drill_instructor';

const GOLF_SCOPE = {
  regiment: 'West',
  battalion: '2nd',
  company: 'Golf',
  series: 'Lead',
  ...(role === 'senior_drill_instructor' ? { platoon: '2001' } : {}),
};

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
loadEnvFile(resolve(root, 'apps/web/.env.local'));

const projectId =
  process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'countcard-94c5b';

const hasCreds =
  Boolean(process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim()) &&
  Boolean(process.env.FIREBASE_ADMIN_PRIVATE_KEY?.trim());

if (!hasCreds) {
  console.error('FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY must be set in .env.local');
  console.error('Run: ./scripts/update-admin-sdk.sh <service-account-json>');
  process.exit(1);
}

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
    projectId,
  });
}

const auth = getAuth();
const db = getFirestore();
if (process.env.FIRESTORE_DATABASE_ID) {
  db.settings({ databaseId: process.env.FIRESTORE_DATABASE_ID });
}

const user = await auth.getUserByEmail(email);
const claims = {
  ...(user.customClaims || {}),
  admin: false,
  role,
  organizationalAssignment: GOLF_SCOPE,
};

await auth.setCustomUserClaims(user.uid, claims);

await db.collection('userProfiles').doc(user.uid).set(
  {
    email,
    role,
    organizationalAssignment: GOLF_SCOPE,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: user.uid,
  },
  { merge: true }
);

console.log(`Set ${role} claims for ${email} (${user.uid})`);
console.log('Scope:', JSON.stringify(GOLF_SCOPE));
console.log('\nUser must sign out and sign back in (or wait ~1h) for JWT claims to refresh.');
