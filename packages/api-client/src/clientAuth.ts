/**
 * Client-side authenticated fetch helper.
 * Attaches the current Firebase ID token to API requests.
 */

import { auth } from '../instance';

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers);
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers });
}
