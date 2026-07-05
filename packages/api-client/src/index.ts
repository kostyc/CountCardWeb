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

  if (typeof input === 'string' && input.startsWith('/') && !_apiBaseUrl) {
    // Web app: same-origin relative API paths
  }

  const url =
    typeof input === 'string' && input.startsWith('/')
      ? _apiBaseUrl
        ? `${_apiBaseUrl.replace(/\/$/, '')}${input}`
        : input
      : input;

  try {
    const response = await fetch(url, { ...init, headers });

    if (response.status === 403) {
      throw new Error(
        'CountCard API access is blocked (403). Excel import works on-device; photo and PDF import need API access or use the web app.'
      );
    }

    return response;
  } catch (error) {
    if (error instanceof Error && error.message.includes('403')) {
      throw error;
    }
    if (error instanceof TypeError) {
      const localhostHint =
        typeof _apiBaseUrl === 'string' &&
        (_apiBaseUrl.includes('localhost') || _apiBaseUrl.includes('127.0.0.1'))
          ? ' On a physical device, use your computer\'s LAN IP instead of localhost.'
          : '';
      throw new Error(
        `Could not reach the CountCard API.${localhostHint} Check EXPO_PUBLIC_API_BASE_URL and your network. Excel import at http://localhost:8081 works without the API.`
      );
    }
    throw error;
  }
}

export interface RecruitTransferAssignment {
  regiment?: string;
  battalion?: string;
  company?: string;
  series?: string;
  platoon: string;
}

export async function transferRecruitViaApi(
  recruitId: string,
  assignment: RecruitTransferAssignment,
  reason?: string
): Promise<void> {
  const response = await authenticatedFetch(`/api/recruits/${encodeURIComponent(recruitId)}/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...assignment, reason }),
  });

  const data = (await response.json()) as { error?: string };
  if (!response.ok) {
    const message = data.error ?? 'Transfer request failed';
    throw new Error(`${message} (${response.status})`);
  }
}
