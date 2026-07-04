import { refreshAuthToken } from '@/hooks/useAppUser';

const CLAIMS_SYNC_DELAY_MS = 1500;

/**
 * Wait for syncUserClaimsOnProfileWrite (Firestore trigger) then refresh ID token.
 * No HTTP API required — workaround while Cloud Run public invoker is blocked.
 */
export async function trySyncCustomClaims(): Promise<boolean> {
  try {
    await new Promise((r) => setTimeout(r, CLAIMS_SYNC_DELAY_MS));
    await refreshAuthToken();
    return true;
  } catch {
    return false;
  }
}
