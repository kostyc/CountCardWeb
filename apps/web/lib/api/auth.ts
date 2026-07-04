/**
 * Authentication Utilities for API Routes
 * Shared authentication verification functions for API endpoints
 */

import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { logError } from '@/lib/utils/logger';

/**
 * Verify Firebase ID token from Authorization header
 * Returns the user ID if token is valid, null otherwise
 */
export async function verifyAuthToken(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    logError(error as Error, 'lib.api.auth.verifyAuthToken');
    return null;
  }
}
