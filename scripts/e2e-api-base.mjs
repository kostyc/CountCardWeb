/**
 * Default API base for Sprint 27 / Kilo E2E scripts.
 *
 * Prerequisite: Functions emulator — `npm run dev:functions`
 * Override: E2E_API_BASE=https://countcard-94c5b.web.app (hosting proxy)
 *           E2E_API_BASE=https://countcard-94c5b.web.app (hosted API proxy)
 */

const PROJECT_ID =
  process.env.FIREBASE_ADMIN_PROJECT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  'countcard-94c5b';

const REGION = process.env.FUNCTIONS_REGION || 'us-central1';

/** Cloud Function name exported from functions/src/index.ts */
const FUNCTION_NAME = 'api';

export const DEFAULT_E2E_API_BASE = `http://127.0.0.1:5001/${PROJECT_ID}/${REGION}/${FUNCTION_NAME}`;

export function resolveE2eApiBase() {
  return process.env.E2E_API_BASE || DEFAULT_E2E_API_BASE;
}

/** True when E2E targets legacy Next.js dev server (localhost:3000). */
export function isLegacyWebApiBase(base = resolveE2eApiBase()) {
  try {
    const url = new URL(base);
    return url.port === '3000' || base.includes('localhost:3000');
  } catch {
    return false;
  }
}
