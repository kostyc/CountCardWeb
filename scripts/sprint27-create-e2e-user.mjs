#!/usr/bin/env node
/**
 * Create Sprint 27 email/password E2E user and add to BOOTSTRAP_ADMIN_EMAILS.
 * Usage: node scripts/sprint27-create-e2e-user.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const E2E_EMAIL = 's27-e2e@countcard.test';
const E2E_PASSWORD = 'Sprint27-E2e!Test';
const E2E_DISPLAY = 'Sprint 27 E2E';

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

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
if (!apiKey) {
  console.error('NEXT_PUBLIC_FIREBASE_API_KEY required');
  process.exit(1);
}

async function authRequest(path, body) {
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/${path}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || JSON.stringify(data));
  return data;
}

let uid;
try {
  const created = await authRequest('accounts:signUp', {
    email: E2E_EMAIL,
    password: E2E_PASSWORD,
    returnSecureToken: true,
  });
  uid = created.localId;
  console.log(`Created auth user ${E2E_EMAIL} (${uid})`);
} catch (err) {
  if (String(err.message).includes('EMAIL_EXISTS')) {
    const signedIn = await authRequest('accounts:signInWithPassword', {
      email: E2E_EMAIL,
      password: E2E_PASSWORD,
      returnSecureToken: true,
    });
    uid = signedIn.localId;
    console.log(`User already exists; verified sign-in for ${E2E_EMAIL} (${uid})`);
  } else {
    throw err;
  }
}

function upsertBootstrapEmail(envPath) {
  if (!existsSync(envPath)) return false;
  let content = readFileSync(envPath, 'utf8');
  const keys = ['BOOTSTRAP_ADMIN_EMAILS', 'NEXT_PUBLIC_BOOTSTRAP_ADMIN_EMAILS'];
  for (const key of keys) {
    const lineRe = new RegExp(`^${key}=(.*)$`, 'm');
    const email = E2E_EMAIL.toLowerCase();
    if (lineRe.test(content)) {
      const match = content.match(lineRe);
      const current = (match?.[1] || '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      if (!current.includes(email)) current.push(email);
      content = content.replace(lineRe, `${key}=${current.join(',')}`);
    } else {
      content += `\n${key}=${email}\n`;
    }
  }
  writeFileSync(envPath, content, 'utf8');
  return true;
}

const updatedRoot = upsertBootstrapEmail(resolve(root, '.env.local'));
const updatedWeb = upsertBootstrapEmail(resolve(root, 'apps/web/.env.local'));

console.log('\nE2E credentials:');
console.log(`  Email:    ${E2E_EMAIL}`);
console.log(`  Password: ${E2E_PASSWORD}`);
console.log(`  UID:      ${uid}`);
console.log(
  `\nBOOTSTRAP_ADMIN_EMAILS updated: ${updatedRoot ? '.env.local' : ''}${updatedRoot && updatedWeb ? ', ' : ''}${updatedWeb ? 'apps/web/.env.local' : ''}`
);
console.log('\nRestart npm run dev:web so the server picks up BOOTSTRAP_ADMIN_EMAILS, then sign in with email/password.');
