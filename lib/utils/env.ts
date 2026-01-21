/**
 * Environment variable validation and access utilities
 * Validates required environment variables at application startup
 */

/**
 * Validates that all required environment variables are present
 * @throws {Error} If any required environment variable is missing
 * 
 * Note: In Next.js, NEXT_PUBLIC_* variables are embedded at build time.
 * If variables are missing, ensure .env.local exists and restart the dev server.
 */
export function validateEnv(): void {
  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    // NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID is optional - only needed if using Cloud Messaging
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ] as const;

  const missing: string[] = [];

  for (const varName of requiredVars) {
    // Access via process.env directly - Next.js embeds NEXT_PUBLIC_* vars at build time
    const value = process.env[varName];
    // Check for empty strings as well
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    const isClient = typeof window !== 'undefined';
    const errorMessage = 
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file and ensure all required variables are set.\n' +
      (isClient 
        ? 'Note: If you just added .env.local, restart the dev server and clear the .next cache: rm -rf .next'
        : 'Note: Restart the dev server after updating .env.local');
    
    throw new Error(errorMessage);
  }
}

/**
 * Parses comma-separated environment variable into an array
 * @param envVar - Environment variable value (comma-separated string)
 * @param defaultValue - Default value if envVar is not set
 * @returns Array of trimmed strings
 */
export function parseCommaSeparated(
  envVar: string | undefined,
  defaultValue: string[] = []
): string[] {
  if (!envVar) {
    return defaultValue;
  }
  return envVar.split(',').map((item) => item.trim()).filter(Boolean);
}

/**
 * Gets admin user IDs from environment variable
 * @returns Array of admin user IDs
 */
export function getAdminUserIds(): string[] {
  return parseCommaSeparated(process.env.ADMIN_USER_IDS);
}

/**
 * Gets allowed origins from environment variable
 * @returns Array of allowed origin URLs
 */
export function getAllowedOrigins(): string[] {
  return parseCommaSeparated(process.env.ALLOWED_ORIGINS, [
    'http://localhost:3000',
  ]);
}
