/**
 * Firebase Admin SDK for Cloud Functions
 */

import { initializeApp, getApps, cert, applicationDefault, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let adminApp: App;
if (getApps().length === 0) {
  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.GCLOUD_PROJECT ||
    'countcard-94c5b';

  const hasServiceAccountCreds =
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (hasServiceAccountCreds) {
    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      }),
      projectId,
    });
  } else {
    adminApp = initializeApp({
      credential: applicationDefault(),
      projectId,
    });
  }
} else {
  adminApp = getApps()[0];
}

export const adminDb: Firestore = getFirestore(adminApp);
export const adminAuth: Auth = getAuth(adminApp);
export { adminApp };
