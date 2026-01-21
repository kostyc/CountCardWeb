/**
 * Firebase Client SDK Configuration
 * Initializes and exports Firebase client SDK instances
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, ReCaptchaV3Provider, AppCheck } from 'firebase/app-check';
import { validateEnv } from '@/lib/utils/env';

/**
 * Firebase configuration object
 * Uses environment variables for configuration
 * 
 * Note: messagingSenderId is optional - only include if Cloud Messaging is being used.
 * If not provided, Firebase will not attempt to initialize messaging services.
 */
const firebaseConfig: {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId?: string;
  appId: string;
} = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Only include messagingSenderId if it's provided (optional - for Cloud Messaging)
// If not provided, Firebase won't try to initialize messaging services
if (process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) {
  firebaseConfig.messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
}

/**
 * Initialize Firebase app
 * Reuses existing app instance if already initialized (prevents duplicate initialization)
 * Validates environment variables before initialization
 * 
 * Note: Validation only runs on server-side to avoid client-side issues during development.
 * Client-side, NEXT_PUBLIC_* variables are embedded at build time by Next.js.
 */
let app: FirebaseApp;

if (getApps().length === 0) {
  // Validate environment variables before initializing Firebase
  // Only validate on server-side - client-side variables are embedded at build time by Next.js
  // If variables are missing on client, Firebase initialization will fail gracefully
  if (typeof window === 'undefined') {
    validateEnv();
  }
  
  // Initialize Firebase - if env vars are missing on client, this will fail but won't crash the module
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

/**
 * Firebase Authentication instance
 */
export const auth: Auth = getAuth(app);

/**
 * Firestore database instance
 */
export const db: Firestore = getFirestore(app);

/**
 * Firebase Storage instance
 */
export const storage: FirebaseStorage = getStorage(app);

/**
 * App Check instance (client-side only)
 * Initializes App Check with fallback strategy:
 * 1. Primary: reCAPTCHA v3 (free tier, longer TTL)
 * 2. Fallback: reCAPTCHA Enterprise (if v3 fails)
 * 
 * Note: App Check only works on the client-side. Server-side code should use
 * Admin SDK which doesn't require App Check tokens.
 * 
 * Debug Provider: For development, set FIREBASE_APPCHECK_DEBUG_TOKEN before initialization.
 * See: https://firebase.google.com/docs/app-check/web/debug-provider
 */
let appCheck: AppCheck | null = null;

if (typeof window !== 'undefined') {
  // Only initialize App Check on client-side
  const recaptchaV3Key = process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY;
  const recaptchaEnterpriseKey = process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY;
  const debugToken = process.env.NEXT_PUBLIC_APP_CHECK_DEBUG_TOKEN;
  const disableAppCheck = process.env.NEXT_PUBLIC_DISABLE_APP_CHECK === 'true';

  // Skip App Check if explicitly disabled (useful for development)
  if (disableAppCheck) {
    console.log('⚠️ App Check disabled via NEXT_PUBLIC_DISABLE_APP_CHECK environment variable');
  } else {
    // Set up debug provider for development (must be set BEFORE initializeAppCheck)
    // For localhost: set to true to generate token in console
    // For CI/other environments: set to specific token string
    if (process.env.NODE_ENV === 'development') {
      if (debugToken) {
        // Set debug token for CI or specific environments
        (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
      } else {
        // For localhost development, set to true to generate token in console
        // User will need to register the token shown in console
        (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      }
    }

    // Only initialize App Check if at least one key is provided
    // If no keys, App Check will be skipped (won't block authentication)
    if (recaptchaV3Key || recaptchaEnterpriseKey) {
      // Try v3 first (free tier, primary)
      if (recaptchaV3Key) {
        try {
          appCheck = initializeAppCheck(app, {
            provider: new ReCaptchaV3Provider(recaptchaV3Key),
            isTokenAutoRefreshEnabled: true,
          });
          console.log('✅ App Check initialized with reCAPTCHA v3 (primary)');
          
          // Log debug token info if in development
          if (process.env.NODE_ENV === 'development' && !debugToken) {
            console.log('ℹ️ App Check debug mode: Check browser console for debug token to register in Firebase Console');
          }
        } catch (error) {
          console.warn('⚠️ Failed to initialize App Check with v3, trying Enterprise fallback:', error);
          
          // Fallback to Enterprise if v3 fails
          if (recaptchaEnterpriseKey) {
            try {
              appCheck = initializeAppCheck(app, {
                provider: new ReCaptchaEnterpriseProvider(recaptchaEnterpriseKey),
                isTokenAutoRefreshEnabled: true,
              });
              console.log('✅ App Check initialized with reCAPTCHA Enterprise (fallback)');
              
              // Log debug token info if in development
              if (process.env.NODE_ENV === 'development' && !debugToken) {
                console.log('ℹ️ App Check debug mode: Check browser console for debug token to register in Firebase Console');
              }
            } catch (fallbackError) {
              console.warn('⚠️ Failed to initialize App Check with Enterprise fallback. App Check disabled. Error:', fallbackError);
              // Don't block app functionality if App Check fails
              appCheck = null;
            }
          }
        }
      } else if (recaptchaEnterpriseKey) {
        // If v3 key not provided, use Enterprise directly
        try {
          appCheck = initializeAppCheck(app, {
            provider: new ReCaptchaEnterpriseProvider(recaptchaEnterpriseKey),
            isTokenAutoRefreshEnabled: true,
          });
          console.log('✅ App Check initialized with reCAPTCHA Enterprise (no v3 key provided)');
          
          // Log debug token info if in development
          if (process.env.NODE_ENV === 'development' && !debugToken) {
            console.log('ℹ️ App Check debug mode: Check browser console for debug token to register in Firebase Console');
          }
        } catch (error) {
          console.warn('⚠️ Failed to initialize App Check. App Check disabled. Error:', error);
          // Don't block app functionality if App Check fails
          appCheck = null;
        }
      }
    } else {
      console.warn('⚠️ App Check not initialized: No reCAPTCHA keys provided in environment variables');
      console.warn('   Authentication will work, but App Check protection is disabled.');
      console.warn('   Add NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY or NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY to enable.');
    }
  }
}

/**
 * Firebase app instance
 */
export { app };

/**
 * App Check instance (client-side only, may be null)
 */
export { appCheck };

/**
 * Firebase project ID
 */
export const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'countcard-94c5b';
