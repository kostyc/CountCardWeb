/**
 * Firebase Admin SDK Configuration
 * Initializes and exports Firebase Admin SDK instance for server-side operations
 * 
 * Note: This should only be used in server-side code (API routes, server components)
 * Never import this in client-side code
 * 
 * This implementation supports two authentication methods:
 * 1. Service Account Key (if FIREBASE_ADMIN_PRIVATE_KEY is set)
 * 2. Application Default Credentials (ADC) - recommended for Google environments
 * 
 * For local development, use: gcloud auth application-default login
 */

import { initializeApp, getApps, cert, applicationDefault, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

/**
 * Initialize Firebase Admin app
 * Reuses existing app instance if already initialized (prevents duplicate initialization)
 * 
 * Uses Application Default Credentials (ADC) if available, otherwise falls back to
 * service account credentials from environment variables.
 */
let adminApp: App;
if (getApps().length === 0) {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'countcard-94c5b';
  
  // Check if service account credentials are provided
  const hasServiceAccountCreds =
    Boolean(process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim()) &&
    Boolean(process.env.FIREBASE_ADMIN_PRIVATE_KEY?.trim());

  if (hasServiceAccountCreds) {
    // Use service account credentials from environment variables
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n');
    
    adminApp = initializeApp({
      credential: cert({
        projectId: projectId,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
      projectId: projectId,
    });
  } else {
    // Use Application Default Credentials (ADC)
    // This works with:
    // - gcloud auth application-default login (local development)
    // - Google Cloud environments (Cloud Run, App Engine, etc.)
    // - GOOGLE_APPLICATION_CREDENTIALS environment variable
    try {
      adminApp = initializeApp({
        credential: applicationDefault(),
        projectId: projectId,
      });
    } catch (error) {
      throw new Error(
        `Failed to initialize Firebase Admin SDK.\n` +
        `Service account credentials not found and Application Default Credentials unavailable.\n` +
        `Please either:\n` +
        `1. Set FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY in .env.local, or\n` +
        `2. Run: gcloud auth application-default login\n` +
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
} else {
  adminApp = getApps()[0];
}

/**
 * Firebase Admin Firestore database instance
 */
export const adminDb: Firestore = getFirestore(adminApp);

/**
 * Firebase Admin Auth instance
 */
export const adminAuth: Auth = getAuth(adminApp);

/**
 * Firebase Admin app instance
 */
export { adminApp };

/**
 * Firebase Admin project ID
 */
export const ADMIN_PROJECT_ID = process.env.FIREBASE_ADMIN_PROJECT_ID || 'countcard-94c5b';
