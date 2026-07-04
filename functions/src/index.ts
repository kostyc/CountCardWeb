import { onRequest } from 'firebase-functions/v2/https';
import { createApiApp } from './app';
export { syncUserClaimsOnProfileWrite } from './triggers/userProfileClaims';

/**
 * HTTPS Cloud Function — mirrors Next.js /api/* routes for mobile clients.
 * Base URL: https://<region>-countcard-94c5b.cloudfunctions.net/api
 */
export const api = onRequest(
  {
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 60,
    cors: false,
  },
  (req, res) => createApiApp()(req, res)
);
