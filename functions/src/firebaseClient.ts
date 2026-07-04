/**
 * Initialize Firebase client SDK for shared Firestore services in Cloud Functions.
 */

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { setFirestore, setAuth } from '@countcard/firebase/instance';

export function initFirebaseClient(): void {
  const apiKey =
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) return;

  const config = {
    apiKey,
    authDomain:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
      process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };

  const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
  setFirestore(getFirestore(app));
  setAuth(getAuth(app));
}
