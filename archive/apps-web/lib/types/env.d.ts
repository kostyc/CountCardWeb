/**
 * Environment variable type definitions
 * These types ensure type safety for environment variables throughout the application
 */

declare namespace NodeJS {
  interface ProcessEnv {
    // Firebase Client SDK Configuration
    NEXT_PUBLIC_FIREBASE_API_KEY: string;
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: string;
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?: string; // Optional - only needed if using Cloud Messaging
    NEXT_PUBLIC_FIREBASE_APP_ID: string;

    // Firebase Admin SDK Configuration
    FIREBASE_ADMIN_PROJECT_ID: string;
    FIREBASE_ADMIN_CLIENT_EMAIL: string;
    FIREBASE_ADMIN_PRIVATE_KEY: string;

    // Application Configuration
    ADMIN_USER_IDS?: string; // Comma-separated list
    ALLOWED_ORIGINS?: string; // Comma-separated list

    // Document image extraction — Gemini primary, xAI fallback (optional, server-side)
    GEMINI_API_KEY?: string;
    XAI_API_KEY?: string;
  }
}
