/**
 * Client-side authenticated fetch helper.
 * Works on web and native via injected auth getter.
 */

import type { Auth } from 'firebase/auth';

let _auth: Auth | null = null;
let _apiBaseUrl = '';

export function configureApiClient(options: { auth: Auth; apiBaseUrl?: string }): void {
  _auth = options.auth;
  _apiBaseUrl = options.apiBaseUrl ?? '';
}

export function getApiBaseUrl(): string {
  return _apiBaseUrl;
}

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers);
  const user = _auth?.currentUser;
  if (user) {
    const token = await user.getIdToken();
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url =
    typeof input === 'string' && input.startsWith('/') && _apiBaseUrl
      ? `${_apiBaseUrl.replace(/\/$/, '')}${input}`
      : input;

  try {
    return await fetch(url, { ...init, headers });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Could not reach the CountCard API. Check your network or try again later.');
    }
    throw error;
  }
}
