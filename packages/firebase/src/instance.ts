/**
 * Injectable Firestore / Auth instances for cross-platform use.
 */

import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

let _db: Firestore | null = null;
let _auth: Auth | null = null;

export function setFirestore(db: Firestore): void {
  _db = db;
}

export function setAuth(auth: Auth): void {
  _auth = auth;
}

export function getDb(): Firestore {
  if (!_db) {
    throw new Error('Firestore not initialized. Call setFirestore() from app bootstrap.');
  }
  return _db;
}

export function getAuth(): Auth {
  if (!_auth) {
    throw new Error('Auth not initialized. Call setAuth() from app bootstrap.');
  }
  return _auth;
}
