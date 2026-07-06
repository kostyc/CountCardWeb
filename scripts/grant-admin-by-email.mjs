#!/usr/bin/env node
/**
 * Grant admin access by email: custom claims + ADMIN_USER_IDS in .env.local
 * Usage: node scripts/grant-admin-by-email.mjs info@warriorwaypoint.com
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const email = (process.argv[2] || '').trim().toLowerCase();

if (!email) {
  console.error('Usage: node scripts/grant-admin-by-email.mjs <email>');
  process.exit(1);
}

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const content = readFileSync(path, 'utf8');
  for (const line of content.split('\n')) {
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

if (getApps().length === 0) {
  const hasCreds =
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (hasCreds) {
    try {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
        projectId,
      });
    } catch (err) {
      console.warn('Service account creds failed, trying Application Default Credentials…');
      const { applicationDefault } = await import('firebase-admin/app');
      initializeApp({ credential: applicationDefault(), projectId });
    }
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

const user = await auth.getUserByEmail(email);
const uid = user.uid;

const existingClaims = user.customClaims || {};
const newClaims = {
  ...existingClaims,
  admin: true,
  role: existingClaims.role || 'battalion_commander',
};

await auth.setCustomUserClaims(uid, newClaims);

const profileRef = db.collection('userProfiles').doc(uid);
const profileSnap = await profileRef.get();
if (profileSnap.exists) {
  await profileRef.update({
    role: newClaims.role,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: uid,
  });
}

function upsertAdminUserIds(envPath) {
  if (!existsSync(envPath)) return false;
  let content = readFileSync(envPath, 'utf8');
  const lineRe = /^ADMIN_USER_IDS=(.*)$/m;
  if (lineRe.test(content)) {
    const match = content.match(lineRe);
    const current = (match?.[1] || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    if (!current.includes(uid)) current.push(uid);
    content = content.replace(lineRe, `ADMIN_USER_IDS=${current.join(',')}`);
  } else {
    content += `\nADMIN_USER_IDS=${uid}\n`;
  }
  writeFileSync(envPath, content, 'utf8');
  return true;
}

const updatedRoot = upsertAdminUserIds(resolve(root, '.env.local'));

console.log(`Granted admin to ${email}`);
console.log(`UID: ${uid}`);
console.log(`Custom claims: admin=true, role=${newClaims.role}`);
console.log(
  `ADMIN_USER_IDS updated: ${updatedRoot ? '.env.local' : '(not found)'}`
);
console.log('Sign out and sign back in so the new token picks up custom claims.');
