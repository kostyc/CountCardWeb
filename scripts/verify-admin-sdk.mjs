#!/usr/bin/env node
/**
 * Quick Admin SDK credential check (no data writes).
 * Usage: node scripts/verify-admin-sdk.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

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

const hasServiceAccount =
  Boolean(process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim()) &&
  Boolean(process.env.FIREBASE_ADMIN_PRIVATE_KEY?.trim());

if (getApps().length === 0) {
  if (hasServiceAccount) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
      projectId,
    });
    console.log('Using service account:', process.env.FIREBASE_ADMIN_CLIENT_EMAIL);
  } else {
    const { applicationDefault } = await import('firebase-admin/app');
    initializeApp({ credential: applicationDefault(), projectId });
    console.log('Using Application Default Credentials (no FIREBASE_ADMIN_* in .env.local)');
  }
}

try {
  await getAuth().listUsers(1);
  console.log('OK — Admin SDK authenticated for project', projectId);
  process.exit(0);
} catch (err) {
  console.error('FAIL — Admin SDK auth error:', err.message || err);
  console.error('\nFix: Firebase Console → Project Settings → Service Accounts → Generate new private key');
  console.error('Then: ./scripts/update-admin-sdk.sh ~/Downloads/countcard-94c5b-firebase-adminsdk-*.json');
  process.exit(1);
}
