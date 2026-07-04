import 'react-native-get-random-values';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import Constants from 'expo-constants';
import { setFirestore, setAuth } from '@countcard/firebase';
import { configureApiClient } from '@countcard/api-client';

function readFirebaseConfig() {
  const extra = Constants.expoConfig?.extra ?? {};
  return {
    apiKey:
      process.env.EXPO_PUBLIC_FIREBASE_API_KEY ??
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY ??
      (extra.firebaseApiKey as string | undefined) ??
      '',
    authDomain:
      process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ??
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ??
      (extra.firebaseAuthDomain as string | undefined) ??
      '',
    projectId:
      process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ??
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
      (extra.firebaseProjectId as string | undefined) ??
      '',
    storageBucket:
      process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ??
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
      (extra.firebaseStorageBucket as string | undefined) ??
      '',
    appId:
      process.env.EXPO_PUBLIC_FIREBASE_APP_ID ??
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID ??
      (extra.firebaseAppId as string | undefined) ??
      '',
  };
}

function initFirebaseClient(): { app: FirebaseApp; auth: Auth; db: Firestore } {
  const config = readFirebaseConfig();
  if (!config.apiKey) {
    throw new Error(
      'Firebase API key missing. Set EXPO_PUBLIC_FIREBASE_API_KEY in the repo root .env.local and restart Expo.'
    );
  }

  const app = getApps().length === 0 ? initializeApp(config) : getApps()[0]!;
  const auth = getAuth(app);
  const db = getFirestore(app);

  setFirestore(db);
  setAuth(auth);
  configureApiClient({
    auth,
    apiBaseUrl:
      process.env.EXPO_PUBLIC_API_BASE_URL ??
      (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
      '',
  });

  return { app, auth, db };
}

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

// Firebase Auth cannot run during Expo Router web SSR — init on client only.
if (typeof window !== 'undefined') {
  ({ app, auth, db } = initFirebaseClient());
}

export function requireAuth(): Auth {
  if (!auth) {
    throw new Error('Firebase Auth is not available (client-only).');
  }
  return auth;
}

export function requireApp(): FirebaseApp {
  if (!app) {
    throw new Error('Firebase App is not available (client-only).');
  }
  return app;
}

export { app, auth, db };
